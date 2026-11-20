import {
  AGG_SECTOR,
  D,
  DISTRICT_INDEX,
  MONTHS,
  NA,
  NM,
  RETURN_LABEL,
  STAGE_LABELS,
  aggIndexOf,
  aggName,
  computeFor,
  count,
  dayIso,
  dayMonth,
  entityInScope,
  fmtDate,
  fmtStamp,
  getFund,
  money,
  monthLabel,
  periodText,
  rateFor,
  sectorName,
  workerView,
  type Ctx,
} from "@/services/gigEngine"
import { buildExceptions } from "@/services/gigOverview"
import type { DetailColumn } from "@/types/dashboard"
import type { GigDetail, GigDrill, GigFilters } from "@/types/gig"

type Row = Record<string, string>

const col = (key: string, label: string, right = false): DetailColumn => ({ key, label, ...(right ? { align: "right" as const } : {}) })
const sum = (values: ArrayLike<number>, months: number[]) => months.reduce((total, t) => total + values[t], 0)
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "n/a")
const letterOf = (p: number) => D.aggregators[p].name.replace("Platform ", "")

function sourceNames(ids: string[]) {
  return ids.map((id) => D.sources.find((source) => source.id === id)?.name ?? id).join(", ")
}
function latestUpdate(ids: string[]) {
  const stamps = ids.map((id) => D.sources.find((source) => source.id === id)?.updated ?? "").filter(Boolean).sort()
  return stamps.length ? fmtStamp(stamps[stamps.length - 1]) : "Not available"
}

function makeDetail(
  ctx: Ctx,
  parts: { code: string; title: string; summary: string; note?: string; sourceIds: string[]; columns: DetailColumn[]; rows: Row[]; validation?: string; apply?: GigDetail["apply"] },
): GigDetail {
  const { win, f } = ctx
  return {
    title: parts.title,
    summary: parts.summary,
    note: parts.note ?? "Illustrative POC Data. Figures are generated for demonstration and are not official Board statistics.",
    meta: {
      reference: `GIG/${parts.code}/${f.financialYear}/${MONTHS[win.first].short.replace(" ", "")}-${MONTHS[win.last].short.replace(" ", "")}`,
      source: sourceNames(parts.sourceIds),
      period: periodText(win),
      received: latestUpdate(parts.sourceIds),
      validation: parts.validation ?? "Totals reconcile to the dashboard figures for the same filters.",
      access: "Aggregated view for the executive role. Worker identity is masked.",
    },
    columns: parts.columns,
    rows: parts.rows,
    apply: parts.apply,
  }
}

const received = (p: number, t: number) => {
  const stamp = D.returns[p].received[t]
  return stamp ? fmtStamp(stamp) : "Not received"
}
const validationText = (p: number) => (D.aggregators[p].validationRate >= D.config.exceptionRules.validationShare ? "Records flagged for correction" : "Passed validation checks")
const reconText = (p: number, t: number, deposited: number) => {
  if (deposited === 0) return "Nothing deposited"
  return ["Pending", "Partly reconciled", "Reconciled", "Not applicable"][D.returns[p].recStatus[t]]
}

// ---- Tables by aggregator, district, month and scheme -----------------------------------------
function aggregatorRows(ctx: Ctx, cells: (p: number, ctx: Ctx) => Row, include = (p: number) => ctx.R.agg[p].records + ctx.R.agg[p].payout > 0): Row[] {
  const rows: Row[] = []
  for (let p = 0; p < NA; p += 1) {
    if (ctx.scope.platFilter && !ctx.scope.platOk[p]) continue
    if (!include(p)) continue
    rows.push({ Reference: `AGG-${letterOf(p)}`, Aggregator: aggName(p), ...cells(p, ctx) })
  }
  return rows
}

function districtRows(ctx: Ctx, cells: (d: number) => Row): Row[] {
  const rows: Row[] = []
  D.districts.forEach((district, d) => {
    if (!ctx.scope.districtOk[d]) return
    rows.push({ Reference: `DST-${district.id.toUpperCase()}`, District: district.name, ...cells(d) })
  })
  return rows
}

function monthRows(ctx: Ctx, cells: (t: number) => Row): Row[] {
  return ctx.win.months.map((t) => ({ Reference: `MON-${MONTHS[t].short.replace(" ", "")}`, Month: monthLabel(t), ...cells(t) }))
}

function feeColumns(): DetailColumn[] {
  return [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("payable", "Payable", true), col("declared", "Declared", true), col("deposited", "Deposited", true), col("reconciled", "Reconciled", true), col("shortfall", "Shortfall", true), col("excess", "Above payable", true), col("received", "Data received"), col("validation", "Validation")]
}
function feeByAggregator(ctx: Ctx, months?: number[]): Row[] {
  const list = months ?? ctx.win.months
  const last = list[list.length - 1]
  return aggregatorRows(ctx, (p, c) => {
    const cell = (series: Float64Array) => list.reduce((total, t) => total + series[p * NM + t], 0)
    return {
      payable: money(cell(c.R.aggMonth.payable)),
      declared: money(cell(c.R.aggMonth.declared)),
      deposited: money(cell(c.R.aggMonth.deposited)),
      reconciled: money(cell(c.R.aggMonth.reconciled)),
      shortfall: money(cell(c.R.aggMonth.shortfall)),
      excess: money(cell(c.R.aggMonth.excess)),
      received: received(p, last),
      validation: validationText(p),
    }
  }, (p) => ctx.R.agg[p].payout > 0 || list.some((t) => ctx.R.aggMonth.payout[p * NM + t] > 0))
}

function districtColumns(): DetailColumn[] {
  return [col("Reference", "Reference"), col("District", "District"), col("unique", "Registered workers", true), col("active", "Active workers", true), col("payout", "Payouts", true), col("received", "Data received"), col("validation", "Validation")]
}
function districtTable(ctx: Ctx): Row[] {
  return districtRows(ctx, (d) => ({
    unique: count(ctx.R.distUnique[d]),
    active: count(ctx.R.distActive[d]),
    payout: money(ctx.R.distPayout[d]),
    received: latestUpdate(["worker-registry"]),
    validation: D.districts[d].drawn ? "Validated against the worker registry" : "Validated, not drawn on the map",
  }))
}

function schemeColumns(): DetailColumn[] {
  return [col("Reference", "Reference"), col("Scheme", "Scheme"), col("state", "Status"), col("applications", "Applications", true), col("beneficiaries", "Beneficiaries", true), col("amount", "Amount disbursed", true), col("failed", "Failed or returned", true), col("received", "Data received")]
}
function schemeTable(ctx: Ctx): Row[] {
  return D.schemes.map((scheme, index) => ({
    Reference: `SCH-${scheme.id.toUpperCase()}`,
    Scheme: scheme.name,
    state: scheme.operational ? "Operational" : "Not yet notified",
    applications: count(ctx.E.apps.stages[index].reduce((total, value) => total + value, 0)),
    beneficiaries: count(ctx.E.apps.beneficiaries[index]),
    amount: money(ctx.E.apps.amount[index]),
    failed: count(ctx.E.apps.stages[index][5]),
    received: latestUpdate(["scheme-applications"]),
  }))
}

function ledgerColumns(): DetailColumn[] {
  return [col("Reference", "Reference"), col("Month", "Month"), col("opening", "Opening", true), col("receipts", "Receipts", true), col("expenditure", "Expenditure", true), col("adjustments", "Adjustments", true), col("closing", "Closing", true)]
}
function ledgerRows(ctx: Ctx, months = ctx.win.months): Row[] {
  const fund = getFund()
  return months.map((t) => {
    const receipts = fund.fee[t] + fund.stateGrant[t] + fund.centralGrant[t] + fund.donations[t] + fund.otherReceipts[t]
    const expenditure = fund.scheme[t] + fund.admin[t] + fund.programme[t] + fund.otherExpenditure[t]
    return {
      Reference: `LED-${MONTHS[t].short.replace(" ", "")}`,
      Month: monthLabel(t),
      opening: money(fund.opening[t]),
      receipts: money(receipts),
      expenditure: money(expenditure),
      adjustments: money(fund.adjustments[t]),
      closing: money(fund.closing[t]),
    }
  })
}

// ---- Masked registers -------------------------------------------------------------------------
const MAX_REGISTER = 25
const maskWorker = (e: number) => `GW-••••${String((e * 7919 + 13) % 10000).padStart(4, "0")}`

function grievanceRegister(ctx: Ctx, pick: (row: number[], month: number) => boolean, title: string, summary: string, code: string, apply?: GigDetail["apply"]): GigDetail {
  const { scope, win } = ctx
  const matches: { row: number[]; index: number }[] = []
  D.grievances.rows.forEach((row, index) => {
    const [e, p, category, day] = row
    const month = dayMonth[day]
    if (month < win.first || month > win.last) return
    if (scope.category >= 0 && category !== scope.category) return
    if (scope.platFilter && !scope.platOk[p]) return
    if (!entityInScope(scope, e)) return
    if (!pick(row, month)) return
    matches.push({ row, index })
  })
  matches.sort((left, right) => right.row[3] - left.row[3])
  const rows: Row[] = matches.slice(0, MAX_REGISTER).map(({ row, index }) => {
    const [e, p, category, day, resolvedDays, state, appeal] = row
    const open = win.endDay - day
    return {
      Reference: `GRV-${dayIso(day).slice(0, 4)}-${String(index + 1).padStart(5, "0")}`,
      Worker: maskWorker(e),
      Category: D.grievanceCategories[category].name,
      Aggregator: aggName(p),
      District: D.districts[workerView.dist[e]].name,
      Received: fmtDate(dayIso(day)),
      Status: state === 0 ? `Resolved in ${resolvedDays} days` : state === 1 ? `Pending, ${open} days open` : `Escalated to the Board, ${open} days open`,
      Appeal: appeal === 0 ? "None" : appeal === 1 ? "Appeal received" : "Appeal disposed",
    }
  })
  const shown = rows.length < matches.length ? ` Showing the latest ${rows.length} of ${count(matches.length)}.` : ""
  return makeDetail(ctx, {
    code,
    title,
    summary: `${summary}${shown}`,
    sourceIds: ["grievances"],
    columns: [col("Reference", "Reference"), col("Worker", "Worker"), col("Category", "Category"), col("Aggregator", "Aggregator"), col("District", "District"), col("Received", "Received"), col("Status", "Status"), col("Appeal", "Appeal")],
    rows,
    note: `Worker identity is masked. The resolution target of ${D.config.grievanceTargetDays} days is a POC placeholder. Illustrative POC Data.`,
    validation: "Counts reconcile to the grievance totals on the dashboard.",
    apply,
  })
}

function accidentRegister(ctx: Ctx, pick: (row: number[], month: number) => boolean, title: string, summary: string, code: string): GigDetail {
  const { scope, win } = ctx
  const matches: { row: number[]; index: number }[] = []
  D.accidents.rows.forEach((row, index) => {
    const [e, p, day] = row
    const month = dayMonth[day]
    if (month < win.first || month > win.last) return
    if (scope.platFilter && !scope.platOk[p]) return
    if (!entityInScope(scope, e)) return
    if (!pick(row, month)) return
    matches.push({ row, index })
  })
  matches.sort((left, right) => right.row[2] - left.row[2])
  const rows: Row[] = matches.slice(0, MAX_REGISTER).map(({ row, index }) => {
    const [e, p, day, fatal, type, claim] = row
    return {
      Reference: `ACC-${dayIso(day).slice(0, 4)}-${String(index + 1).padStart(4, "0")}`,
      Worker: maskWorker(e),
      Type: D.accidentTypes[type].name,
      Severity: fatal ? "Fatal" : "Non-fatal",
      Aggregator: aggName(p),
      District: D.districts[workerView.dist[e]].name,
      Date: fmtDate(dayIso(day)),
      Claim: claim === 0 ? "No claim started" : claim === 1 ? `Claim initiated, ${win.endDay - day} days since the accident` : "Claim settled",
    }
  })
  const shown = rows.length < matches.length ? ` Showing the latest ${rows.length} of ${count(matches.length)}.` : ""
  return makeDetail(ctx, {
    code,
    title,
    summary: `${summary}${shown}`,
    sourceIds: ["safety"],
    columns: [col("Reference", "Reference"), col("Worker", "Worker"), col("Type", "Type"), col("Severity", "Severity"), col("Aggregator", "Aggregator"), col("District", "District"), col("Date", "Date"), col("Claim", "Claim")],
    rows,
    note: `Worker identity is masked. The claim target of ${D.config.claimTargetDays} days is a POC placeholder. Illustrative POC Data.`,
    validation: "Counts reconcile to the safety totals on the dashboard.",
  })
}

// ---- Aggregator profile, history and outstanding items ----------------------------------------
function aggregatorDetail(f: GigFilters, id: string, view: "profile" | "history" | "outstanding"): GigDetail {
  const p = aggIndexOf(id)
  if (p < 0) return makeDetail(computeFor(f), { code: "AGG", title: "Aggregator", summary: "The aggregator was not found.", sourceIds: [], columns: [col("Reference", "Reference")], rows: [] })
  const ctx = computeFor({ ...f, aggregatorId: id, sectorId: "all", status: "all" })
  const { win, R } = ctx
  const aggregator = D.aggregators[p]
  const stats = R.agg[p]
  const letter = letterOf(p)
  const apply = { label: `Show only ${aggregator.name}`, patch: { aggregatorId: id, sectorId: "all" } }
  const sources = ["aggregator-submissions", "fee-ledger", "bank-reconciliation"]

  if (view === "history") {
    const rows: Row[] = D.quarters.map((quarter, q) => {
      const state = aggregator.returns[q]
      const months = MONTHS.filter((month) => month.quarter === q).map((month) => month.index)
      const lastMonth = months[months.length - 1]
      return {
        Reference: `RET-${letter}-${quarter.short.replace(" ", "")}`,
        Quarter: quarter.label,
        Status: aggregator.reporting ? RETURN_LABEL[state] : "Registered, not yet reporting",
        Due: fmtDate(quarter.due),
        Filed: D.returns[p].submitted[q] ? fmtDate(D.returns[p].submitted[q] as string) : state === 3 ? "Not yet due" : "Not filed",
        Received: received(p, lastMonth),
        Validation: validationText(p),
      }
    })
    return makeDetail(ctx, {
      code: `HIST-${letter}`,
      title: `${aggregator.name}: return history`,
      summary: `Quarterly returns for ${aggregator.name} across the months held in the extract.`,
      sourceIds: sources.slice(0, 1),
      columns: [col("Reference", "Reference"), col("Quarter", "Quarter"), col("Status", "Status"), col("Due", "Due date"), col("Filed", "Filed on"), col("Received", "Data received"), col("Validation", "Validation")],
      rows,
      apply,
    })
  }

  if (view === "outstanding") {
    const rows: Row[] = []
    for (const t of win.months) {
      const cell = p * NM + t
      const short = R.aggMonth.shortfall[cell]
      const over = R.aggMonth.excess[cell]
      const unmatched = R.aggMonth.deposited[cell] - R.aggMonth.reconciled[cell]
      if (short <= 0 && over <= 0 && unmatched <= 0) continue
      rows.push({
        Reference: `OUT-${letter}-${MONTHS[t].short.replace(" ", "")}`,
        Month: monthLabel(t),
        Payable: money(R.aggMonth.payable[cell]),
        Deposited: money(R.aggMonth.deposited[cell]),
        Shortfall: money(short),
        Above: money(over),
        Unmatched: money(Math.max(0, unmatched)),
        Reconciliation: reconText(p, t, R.aggMonth.deposited[cell]),
      })
    }
    const quarterNotes = [...new Set(win.months.map((t) => MONTHS[t].quarter))].filter((q) => aggregator.returns[q] === 2).map((q) => D.quarters[q].label)
    return makeDetail(ctx, {
      code: `OUT-${letter}`,
      title: `${aggregator.name}: outstanding items`,
      summary: `Months with a fee shortfall, a deposit above the fee payable, or deposits not yet matched to bank records.${quarterNotes.length ? ` Overdue returns: ${quarterNotes.join(", ")}.` : ""}`,
      sourceIds: sources,
      columns: [col("Reference", "Reference"), col("Month", "Month"), col("Payable", "Payable", true), col("Deposited", "Deposited", true), col("Shortfall", "Shortfall", true), col("Above", "Above payable", true), col("Unmatched", "Unmatched", true), col("Reconciliation", "Reconciliation")],
      rows,
      apply,
    })
  }

  const latest = aggregator.reporting ? [...win.months].reverse().map((t) => MONTHS[t].quarter).find((q) => aggregator.returns[q] !== 4) : undefined
  const rate = rateFor(AGG_SECTOR[p], win.last)
  const profile: [string, string][] = [
    ["Sector", sectorName(AGG_SECTOR[p])],
    ["Registration", aggregator.reporting ? `Registered, reporting from ${MONTHS[aggregator.start].label}` : "Registered with the Board, not yet reporting"],
    ["Latest return", latest === undefined ? "No return in the period" : `${D.quarters[latest].label}: ${RETURN_LABEL[aggregator.returns[latest]]}`],
    ["Records received", count(stats.records)],
    ["Unique Board-registered workers", aggregator.reporting ? count(stats.unique) : "No records yet"],
    ["Worker payouts", money(stats.payout)],
    ["Welfare fee rate (placeholder)", `${(rate * 100).toFixed(2)}% of payouts`],
    ["Welfare fee payable", money(stats.payable)],
    ["Welfare fee declared", money(stats.declared)],
    ["Welfare fee deposited", money(stats.deposited)],
    ["Welfare fee reconciled", money(stats.reconciled)],
    ["Records flagged for validation", aggregator.reporting ? `${count(Math.round(stats.records * aggregator.validationRate))} of ${count(stats.records)}` : "Not applicable"],
    ["Duplicate records removed", count(stats.dup)],
    ["Latest data received", aggregator.reporting ? received(p, Math.min(win.last, NM - 1)) : "No submission"],
  ]
  return makeDetail(ctx, {
    code: `AGG-${letter}`,
    title: `${aggregator.name}: profile`,
    summary: `Reporting and fee position for ${aggregator.name} in the selected period.`,
    sourceIds: sources,
    columns: [col("Reference", "Reference"), col("Item", "Item"), col("Value", "Value")],
    rows: profile.map(([item, value], index) => ({ Reference: `PRF-${letter}-${String(index + 1).padStart(2, "0")}`, Item: item, Value: value })),
    apply,
  })
}

// ---- KPI and strip details --------------------------------------------------------------------
function kpiDetail(ctx: Ctx, id: string): GigDetail {
  const { win, R, E } = ctx
  const months = win.months
  switch (id) {
    case "records":
      return makeDetail(ctx, {
        code: "REC",
        title: "Gig worker records received",
        summary: "Records submitted by aggregators in the period. A worker who appears in several submissions is counted once for each record, so this figure is larger than the number of unique workers.",
        sourceIds: ["aggregator-submissions"],
        columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("sector", "Sector"), col("records", "Records", true), col("dup", "Duplicates removed", true), col("share", "Share of all records", true), col("received", "Data received"), col("validation", "Validation")],
        rows: aggregatorRows(ctx, (p, c) => ({ sector: sectorName(AGG_SECTOR[p]), records: count(c.R.agg[p].records), dup: count(c.R.agg[p].dup), share: pct(c.R.agg[p].records, sum(c.R.records, months)), received: received(p, win.last), validation: validationText(p) })),
      })
    case "unique":
    case "active":
      return makeDetail(ctx, {
        code: id === "unique" ? "UNQ" : "ACT",
        title: id === "unique" ? "Unique Board-registered workers" : "Active workers",
        summary: id === "unique"
          ? "Distinct Board worker IDs registered at the end of the period, by district. A worker on several platforms is counted once."
          : "Workers with at least one payout in the period, by district.",
        sourceIds: ["worker-registry", "aggregator-submissions"],
        columns: districtColumns(),
        rows: districtTable(ctx),
        note: `${D.meta.activityRuleNote} Illustrative POC Data.`,
      })
    case "aggregators":
      return makeDetail(ctx, {
        code: "AGR",
        title: "Reporting aggregators",
        summary: `Aggregators registered with the Board and whether they reported in the period. Aggregators registered but not yet reporting are listed for follow-up.`,
        sourceIds: ["aggregator-submissions"],
        columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("sector", "Sector"), col("state", "Reporting"), col("ret", "Return status"), col("records", "Records", true), col("received", "Data received")],
        rows: aggregatorRows(ctx, (p, c) => {
          const aggregator = D.aggregators[p]
          const reporting = c.R.agg[p].records + c.R.agg[p].payout > 0
          const quarter = [...months].reverse().map((t) => MONTHS[t].quarter).find((q) => aggregator.returns[q] !== 4)
          return {
            sector: sectorName(AGG_SECTOR[p]),
            state: reporting ? "Reporting" : "Not yet reporting",
            ret: quarter === undefined ? "No return in the period" : RETURN_LABEL[aggregator.returns[quarter]],
            records: count(c.R.agg[p].records),
            received: aggregator.reporting ? received(p, win.last) : "No submission",
          }
        }, () => true),
      })
    case "payouts":
      return makeDetail(ctx, {
        code: "PAY",
        title: "Total worker payouts",
        summary: "Payouts reported by aggregators in the period.",
        sourceIds: ["aggregator-submissions", "pwfvs"],
        columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("payout", "Payouts", true), col("txns", "Transactions", true), col("avg", "Average per transaction", true), col("received", "Data received"), col("validation", "Validation")],
        rows: aggregatorRows(ctx, (p, c) => ({ payout: money(c.R.agg[p].payout), txns: count(c.R.agg[p].txns), avg: c.R.agg[p].txns > 0 ? money(c.R.agg[p].payout / c.R.agg[p].txns) : "n/a", received: received(p, win.last), validation: validationText(p) }), (p) => ctx.R.agg[p].payout > 0),
      })
    case "deposited":
    case "payable":
    case "declared":
    case "reconciled":
      return makeDetail(ctx, {
        code: "FEE",
        title: id === "deposited" ? "Welfare fee deposited" : id === "payable" ? "Welfare fee payable" : id === "declared" ? "Welfare fee declared" : "Welfare fee reconciled",
        summary: "Fee payable, declared, deposited and reconciled by aggregator. The fee is calculated on payouts at the configured sector rate.",
        sourceIds: ["pwfvs", "fee-ledger", "bank-reconciliation"],
        columns: feeColumns(),
        rows: feeByAggregator(ctx),
        note: `${D.meta.feeNote} Illustrative POC Data.`,
      })
    case "fund":
      return makeDetail(ctx, {
        code: "FND",
        title: "Welfare fund balance",
        summary: "Month-by-month ledger of the welfare fund. The ledger covers the whole Board and does not change with the filters.",
        sourceIds: ["fund-ledger", "fee-ledger"],
        columns: ledgerColumns(),
        rows: ledgerRows(ctx),
      })
    case "benefits":
    case "applications":
      return makeDetail(ctx, {
        code: "SCH",
        title: id === "benefits" ? "Welfare benefits disbursed" : "Applications pending",
        summary: id === "benefits" ? "Benefits disbursed in the period by scheme." : `${count(E.apps.scrutiny)} applications received in the period are still under scrutiny. Schemes not yet notified show no applications.`,
        sourceIds: ["scheme-applications"],
        columns: schemeColumns(),
        rows: schemeTable(ctx),
        note: `${D.meta.schemeNote} Illustrative POC Data.`,
      })
    case "added":
    case "separated":
      return makeDetail(ctx, {
        code: id === "added" ? "ADD" : "SEP",
        title: id === "added" ? "Workers added" : "Workers separated",
        summary: id === "added" ? "New Board registrations by month." : "Workers separated or deactivated by month.",
        sourceIds: ["worker-registry"],
        columns: [col("Reference", "Reference"), col("Month", "Month"), col("added", "New registrations", true), col("separated", "Separated", true), col("stock", "Registered at month end", true), col("records", "Records received", true)],
        rows: monthRows(ctx, (t) => ({ added: count(R.newBoard[t]), separated: count(R.separated[t]), stock: count(R.stock[t]), records: count(R.records[t]) })),
      })
    case "multi": {
      const total = R.platformCounts.reduce((a, b) => a + b, 0)
      return makeDetail(ctx, {
        code: "MLT",
        title: "Workers on more than one platform",
        summary: "Registered workers by the number of platforms they work with. Each worker is counted once.",
        sourceIds: ["worker-registry", "aggregator-submissions"],
        columns: [col("Reference", "Reference"), col("Platforms", "Platforms per worker"), col("workers", "Registered workers", true), col("share", "Share", true)],
        rows: R.platformCounts.map((value, index) => ({ Reference: `MLT-${index + 1}`, Platforms: index === 0 ? "One platform" : index === 1 ? "Two platforms" : "Three platforms", workers: count(value), share: pct(value, total) })),
      })
    }
    case "grievances":
      return grievanceRegister(ctx, (row) => row[5] !== 0, "Grievances pending", "Grievances received in the period and not yet resolved.", "GRV-PEND")
    case "accidents":
      return accidentRegister(ctx, () => true, "Accidents reported", "Accidents reported in the period, with the state of any claim.", "ACC")
    default:
      return makeDetail(ctx, { code: "NA", title: "Detail", summary: "No detail is available for this item.", sourceIds: [], columns: [col("Reference", "Reference")], rows: [] })
  }
}

// ---- Chart details ----------------------------------------------------------------------------
function chartDetail(ctx: Ctx, drill: Extract<GigDrill, { type: "chart" }>): GigDetail {
  const { win, R, E } = ctx
  const month = drill.month
  const label = drill.category
  switch (drill.chartId) {
    case "registration": {
      if (month === undefined) return kpiDetail(ctx, "added")
      return makeDetail(ctx, {
        code: `REG-${MONTHS[month].short.replace(" ", "")}`,
        title: `Records received in ${monthLabel(month)}`,
        summary: `Records submitted by each aggregator for ${monthLabel(month)}. ${count(R.newBoard[month])} workers were newly registered and ${count(R.separated[month])} separated in the month.`,
        sourceIds: ["aggregator-submissions", "worker-registry"],
        columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("records", "Records", true), col("received", "Data received"), col("validation", "Validation")],
        rows: aggregatorRows(ctx, (p, c) => ({ records: count(c.R.aggMonth.records[p * NM + month]), received: received(p, month), validation: validationText(p) }), (p) => ctx.R.aggMonth.records[p * NM + month] > 0),
      })
    }
    case "sector": {
      const s = D.sectors.findIndex((sector) => sector.name === label)
      return makeDetail(ctx, {
        code: "SEC",
        title: label ? `${label}: workers by platform` : "Workers by sector",
        summary: label ? `Aggregators in the ${label} sector and the workers registered with each. A worker on several platforms appears under each platform.` : "Workers by sector.",
        sourceIds: ["worker-registry", "aggregator-submissions"],
        columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("workers", "Registered workers", true), col("payout", "Payouts", true), col("received", "Data received"), col("validation", "Validation")],
        rows: aggregatorRows(ctx, (p, c) => ({ workers: count(c.R.agg[p].unique), payout: money(c.R.agg[p].payout), received: received(p, win.last), validation: validationText(p) }), (p) => (s < 0 || AGG_SECTOR[p] === s) && ctx.R.agg[p].unique > 0),
        apply: s >= 0 ? { label: `Show only ${label}`, patch: { sectorId: D.sectors[s].id, aggregatorId: "all" } } : undefined,
      })
    }
    case "aggregators": {
      const aggregator = D.aggregators.find((item) => item.name === label)
      return aggregator ? aggregatorDetail(ctx.f, aggregator.id, "profile") : kpiDetail(ctx, "aggregators")
    }
    case "payout": {
      if (month === undefined) return kpiDetail(ctx, "payouts")
      return makeDetail(ctx, {
        code: `PAY-${MONTHS[month].short.replace(" ", "")}`,
        title: `Payouts in ${monthLabel(month)}`,
        summary: `Payouts reported by each aggregator for ${monthLabel(month)}.`,
        sourceIds: ["aggregator-submissions", "pwfvs"],
        columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("payout", "Payouts", true), col("txns", "Transactions", true), col("received", "Data received"), col("validation", "Validation")],
        rows: aggregatorRows(ctx, (p, c) => ({ payout: money(c.R.aggMonth.payout[p * NM + month]), txns: count(c.R.aggMonth.txns[p * NM + month]), received: received(p, month), validation: validationText(p) }), (p) => ctx.R.aggMonth.payout[p * NM + month] > 0),
      })
    }
    case "fee": {
      if (month === undefined) return kpiDetail(ctx, "deposited")
      return makeDetail(ctx, {
        code: `FEE-${MONTHS[month].short.replace(" ", "")}`,
        title: `Welfare fee in ${monthLabel(month)}`,
        summary: `Fee payable, declared, deposited and reconciled by aggregator for ${monthLabel(month)}.`,
        sourceIds: ["pwfvs", "fee-ledger", "bank-reconciliation"],
        columns: feeColumns(),
        rows: feeByAggregator(ctx, [month]),
        note: `${D.meta.feeNote} Illustrative POC Data.`,
      })
    }
    case "fund": {
      if (month === undefined) return kpiDetail(ctx, "fund")
      const fund = getFund()
      const items: [string, number][] = [
        ["Opening balance", fund.opening[month]],
        ["Welfare fee deposited", fund.fee[month]],
        ["State government grant", fund.stateGrant[month]],
        ["Central government grant", fund.centralGrant[month]],
        ["Donations", fund.donations[month]],
        ["Other receipts", fund.otherReceipts[month]],
        ["Scheme disbursements", -fund.scheme[month]],
        ["Administrative expenditure", -fund.admin[month]],
        ["Programme expenditure", -fund.programme[month]],
        ["Other expenditure", -fund.otherExpenditure[month]],
        ["Adjustments and refunds", fund.adjustments[month]],
        ["Closing balance", fund.closing[month]],
      ]
      return makeDetail(ctx, {
        code: `FND-${MONTHS[month].short.replace(" ", "")}`,
        title: `Welfare fund in ${monthLabel(month)}`,
        summary: `Receipts, expenditure and adjustments for ${monthLabel(month)}. The ledger covers the whole Board and does not change with the filters.`,
        sourceIds: ["fund-ledger", "fee-ledger"],
        columns: [col("Reference", "Reference"), col("Item", "Item"), col("Amount", "Amount", true)],
        rows: items.map(([item, value], index) => ({ Reference: `LED-${MONTHS[month].short.replace(" ", "")}-${String(index + 1).padStart(2, "0")}`, Item: item, Amount: money(value) })),
      })
    }
    case "schemes": {
      const index = D.schemes.findIndex((scheme) => scheme.name === label)
      if (index < 0) return kpiDetail(ctx, "benefits")
      const scheme = D.schemes[index]
      const stages = E.apps.stages[index]
      return makeDetail(ctx, {
        code: `SCH-${scheme.id.toUpperCase()}`,
        title: `${scheme.name}: applications`,
        summary: scheme.operational ? `Where applications for ${scheme.name} stand at the end of the period.` : `${scheme.name} is not yet notified, so no applications are held.`,
        sourceIds: ["scheme-applications"],
        columns: [col("Reference", "Reference"), col("Stage", "Stage"), col("applications", "Applications", true), col("share", "Share", true)],
        rows: STAGE_LABELS.map((stage, stageIndex) => ({ Reference: `${scheme.id.toUpperCase()}-S${stageIndex + 1}`, Stage: stage, applications: count(stages[stageIndex]), share: pct(stages[stageIndex], stages.reduce((a, b) => a + b, 0)) })),
        apply: { label: `Show only ${scheme.name}`, patch: { schemeId: scheme.id } },
      })
    }
    case "grievances": {
      const index = D.grievanceCategories.findIndex((category) => category.name === label)
      const category = D.grievanceCategories[index]
      const pickState = drill.series === "Pending" ? (row: number[]) => row[5] === 1 : drill.series === "Escalated" ? (row: number[]) => row[5] === 2 : drill.series === "Resolved" ? (row: number[]) => row[5] === 0 : () => true
      return grievanceRegister(
        ctx,
        (row) => (index < 0 || row[2] === index) && pickState(row),
        category ? `${category.name}: grievances` : "Grievances",
        category ? `Grievances in the ${category.name} category${drill.series ? ` that are ${drill.series.toLowerCase()}` : ""}.` : "Grievances received in the period.",
        `GRV-${category ? category.id.toUpperCase() : "ALL"}`,
        category ? { label: `Show only ${category.name}`, patch: { grievanceCategory: category.id } } : undefined,
      )
    }
    case "grievanceTrend": {
      if (month === undefined) return grievanceRegister(ctx, () => true, "Grievances", "Grievances received in the period.", "GRV-ALL")
      return grievanceRegister(ctx, (_row, m) => m === month, `Grievances in ${monthLabel(month)}`, `Grievances received in ${monthLabel(month)}.`, `GRV-${MONTHS[month].short.replace(" ", "")}`)
    }
    case "safety": {
      if (month === undefined) return accidentRegister(ctx, () => true, "Accidents reported", "Accidents reported in the period.", "ACC")
      return accidentRegister(ctx, (_row, m) => m === month, `Accidents in ${monthLabel(month)}`, `Accidents reported in ${monthLabel(month)}, with the state of any claim.`, `ACC-${MONTHS[month].short.replace(" ", "")}`)
    }
    case "safetyTypes": {
      const index = D.accidentTypes.findIndex((type) => type.name === label)
      return accidentRegister(ctx, (row) => index < 0 || row[4] === index, label ? `${label}: accidents` : "Accidents by type", label ? `Accidents of type "${label}" reported in the period.` : "Accidents reported in the period.", `ACC-T${Math.max(index, 0) + 1}`)
    }
  }
}

// ---- Districts and exceptions -----------------------------------------------------------------
function districtDetail(f: GigFilters, id: string): GigDetail {
  const d = DISTRICT_INDEX.get(id)
  if (d === undefined) return makeDetail(computeFor(f), { code: "DST", title: "District", summary: "The district was not found.", sourceIds: [], columns: [col("Reference", "Reference")], rows: [] })
  const ctx = computeFor({ ...f, districtId: id, cityId: "all" })
  const district = D.districts[d]
  const { R, E } = ctx
  return makeDetail(ctx, {
    code: `DST-${id.toUpperCase()}`,
    title: `${district.name}: platform activity`,
    summary: `${count(R.unique)} Board-registered workers, ${count(R.active)} active in the period, with payouts of ${money(sum(R.payout, ctx.win.months))}. ${E.grv.received} grievances and ${E.acc.accidents} accidents were reported.${district.drawn ? "" : " This district is held in the records but is not drawn on the map."}`,
    sourceIds: ["worker-registry", "aggregator-submissions"],
    columns: [col("Reference", "Reference"), col("Aggregator", "Aggregator"), col("workers", "Registered workers", true), col("records", "Records", true), col("payout", "Payouts", true), col("received", "Data received"), col("validation", "Validation")],
    rows: aggregatorRows(ctx, (p, c) => ({ workers: count(c.R.agg[p].unique), records: count(c.R.agg[p].records), payout: money(c.R.agg[p].payout), received: received(p, ctx.win.last), validation: validationText(p) }), (p) => ctx.R.agg[p].records + ctx.R.agg[p].payout > 0),
    apply: { label: `Show only ${district.name}`, patch: { districtId: id, cityId: "all" } },
  })
}

function exceptionDetail(f: GigFilters, id: string): GigDetail {
  const ctx = computeFor(f)
  const item = buildExceptions(ctx).find((entry) => entry.id === id)
  if (!item) return makeDetail(ctx, { code: "EXC", title: "Exception", summary: "This exception is no longer present for the current filters.", sourceIds: [], columns: [col("Reference", "Reference")], rows: [] })
  const header = (detail: GigDetail): GigDetail => ({ ...detail, title: `${item.category}: ${item.scope}`, summary: `${item.description} ${detail.summary}`.trim() })

  switch (item.kind) {
    case "return":
    case "shortfall":
    case "mismatch":
    case "reconciliation":
      return header(aggregatorDetail(f, item.aggregatorId as string, "outstanding"))
    case "validation": {
      const p = aggIndexOf(item.aggregatorId as string)
      const rate = D.aggregators[p].validationRate
      return header(makeDetail(ctx, {
        code: `VAL-${letterOf(p)}`,
        title: item.category,
        summary: "Records received and the number flagged each month.",
        sourceIds: ["aggregator-submissions"],
        columns: [col("Reference", "Reference"), col("Month", "Month"), col("records", "Records", true), col("flagged", "Flagged for correction", true), col("received", "Data received")],
        rows: monthRows(ctx, (t) => ({ records: count(ctx.R.aggMonth.records[p * NM + t]), flagged: count(Math.round(ctx.R.aggMonth.records[p * NM + t] * rate)), received: received(p, t) })),
        apply: { label: `Show only ${aggName(p)}`, patch: { aggregatorId: D.aggregators[p].id, sectorId: "all" } },
      }))
    }
    case "payment": {
      const index = D.schemes.findIndex((scheme) => scheme.id === item.key)
      const scheme = D.schemes[index]
      const stages = ctx.E.apps.stages[index]
      return header(makeDetail(ctx, {
        code: `PAYX-${scheme.id.toUpperCase()}`,
        title: item.category,
        summary: "Where applications for the scheme stand.",
        sourceIds: ["scheme-applications"],
        columns: [col("Reference", "Reference"), col("Stage", "Stage"), col("applications", "Applications", true)],
        rows: STAGE_LABELS.map((stage, stageIndex) => ({ Reference: `${scheme.id.toUpperCase()}-S${stageIndex + 1}`, Stage: stage, applications: count(stages[stageIndex]) })),
        apply: { label: `Show only ${scheme.name}`, patch: { schemeId: scheme.id } },
      }))
    }
    case "grievance": {
      const index = D.grievanceCategories.findIndex((category) => category.id === item.key)
      return header(grievanceRegister(ctx, (row) => row[2] === index && row[5] !== 0 && ctx.win.endDay - row[3] > D.config.grievanceTargetDays, item.category, "Open grievances beyond the target timeline.", `EXG-${item.key.toUpperCase()}`, { label: `Show only ${D.grievanceCategories[index].name}`, patch: { grievanceCategory: item.key } }))
    }
    case "claim":
      return header(accidentRegister(ctx, (row) => row[5] === 1 && ctx.win.endDay - row[2] > D.config.claimTargetDays, item.category, "Claims started and not settled within the target.", "EXC-CLM"))
  }
}

// ---- Entry point ------------------------------------------------------------------------------
export function buildGigDetail(drill: GigDrill, filters: GigFilters): GigDetail {
  if (drill.type === "aggregator") return aggregatorDetail(filters, drill.id, drill.view)
  if (drill.type === "district") return districtDetail(filters, drill.id)
  if (drill.type === "exception") return exceptionDetail(filters, drill.id)
  const ctx = computeFor(filters)
  if (drill.type === "chart") return chartDetail(ctx, drill)
  return kpiDetail(ctx, drill.id)
}