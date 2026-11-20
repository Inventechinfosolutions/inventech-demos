import {
  GIG_ACTIVITY,
  GIG_FINANCIAL_YEARS,
  GIG_QUARTERS,
  GIG_STATUS_GROUPS,
  activeGigKeys,
} from "@/lib/gigQuery"
import {
  AGG_SECTOR,
  D,
  FILTER_LABEL,
  MONTHS,
  MONTH_ISO,
  NA,
  NM,
  RETURN_LABEL,
  STAGE_LABELS,
  addDays,
  asOfText,
  computeFor,
  count,
  filterValueName,
  fmtDate,
  fmtStamp,
  getFund,
  hashOf,
  latestReturn,
  money,
  monthShort,
  periodText,
  sectorName,
  sumWin,
} from "@/services/gigEngine"
import type { Ctx } from "@/services/gigEngine"
import { GIG_METRICS } from "@/services/gigMetrics"
import type {
  GigAggregatorRow,
  GigComparison,
  GigException,
  GigFilterKey,
  GigFilterOptions,
  GigFilters,
  GigKpi,
  GigMapDistrict,
  GigOverview,
  GigSourceStatus,
  GigStat,
} from "@/types/gig"

// ---- Which filters each part of the page responds to ----------------------------------------
const CORE: GigFilterKey[] = ["districtId", "cityId", "aggregatorId", "sectorId", "activity", "gender", "ageGroup"]
const WITH_STATUS: GigFilterKey[] = [...CORE, "status"]
const PEOPLE: GigFilterKey[] = ["districtId", "cityId", "aggregatorId", "sectorId", "gender", "ageGroup"]
export const APPLIES = {
  records: WITH_STATUS,
  unique: CORE,
  aggregators: WITH_STATUS,
  active: CORE,
  payout: WITH_STATUS,
  fee: WITH_STATUS,
  fund: [] as GigFilterKey[],
  benefits: [...PEOPLE, "schemeId"] as GigFilterKey[],
  grievances: [...PEOPLE, "grievanceCategory"] as GigFilterKey[],
  safety: PEOPLE,
  training: ["districtId", "cityId"] as GigFilterKey[],
  map: CORE,
}

export function unaffectedBy(filters: GigFilters, applies: GigFilterKey[]): string[] {
  return activeGigKeys(filters).filter((key) => !applies.includes(key)).map((key) => FILTER_LABEL[key])
}

const definitionOf = (code: string) => GIG_METRICS.find((metric) => metric.code === code)?.tooltip ?? ""

// ---- Filter options --------------------------------------------------------------------------
export function gigFilterOptions(): GigFilterOptions {
  return {
    financialYears: GIG_FINANCIAL_YEARS,
    quarters: GIG_QUARTERS,
    districts: D.districts.map(({ id, name }) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name)),
    cities: D.cities,
    aggregators: D.aggregators.map(({ id, name, sectorId }) => ({ id, name, sectorId })),
    sectors: D.sectors,
    activities: GIG_ACTIVITY,
    genders: D.genders,
    ageGroups: D.ageGroups,
    schemes: D.schemes.map(({ id, name, operational }) => ({ id, name, operational })),
    grievanceCategories: D.grievanceCategories,
    statusGroups: GIG_STATUS_GROUPS,
  }
}

// ---- Source freshness ------------------------------------------------------------------------
export function gigSourceStatuses(): GigSourceStatus[] {
  const reference = Date.parse(`${D.meta.reportingDate}T09:30:00Z`)
  return D.sources.map((source) => {
    const ageDays = Math.max(0, (reference - Date.parse(`${source.updated}:00Z`)) / 86400000)
    const status = ageDays <= source.cadenceDays ? "current" : ageDays <= source.cadenceDays * 2 ? "delayed" : "stale"
    return { id: source.id, name: source.name, updated: fmtStamp(source.updated), ageDays: Math.round(ageDays * 10) / 10, cadenceDays: source.cadenceDays, status }
  })
}

// ---- Comparison ------------------------------------------------------------------------------
function compare(current: number, previous: number | null, label: string | null): GigComparison {
  if (previous === null || label === null) return { label: "", change: null, note: "No earlier period of the same length in the extract." }
  if (previous === 0) return { label, change: null, note: `The figure for ${label} is zero, so no change is shown.` }
  return { label, change: ((current - previous) / previous) * 100, note: `Compared with ${label}.` }
}

// ---- Overview --------------------------------------------------------------------------------
export function buildGigOverview(filters: GigFilters): GigOverview {
  const ctx = computeFor(filters)
  const { f, win, prev, R, Rp, E, Ep, scope } = ctx
  const period = periodText(win)
  const asOf = `As of ${asOfText(win)}`
  const prevFlow = prev ? (prev.first === prev.last ? MONTHS[prev.first].label : `${monthShort(prev.first)} to ${monthShort(prev.last)}`) : null
  const prevStock = prev ? fmtDate(MONTH_ISO[prev.last].end) : null
  const series = (values: ArrayLike<number>) => win.months.map((t) => values[t])
  const fund = getFund()
  const sources = gigSourceStatuses()
  const registeredInScope = scope.platFilter ? scope.platOk.reduce((sum, value) => sum + value, 0) : NA
  const reportingNow = R.agg.filter((stats) => stats.records > 0 || stats.payout > 0).length
  const reportingPrev = Rp ? Rp.agg.filter((stats) => stats.records > 0 || stats.payout > 0).length : null

  const kpi = (
    id: string,
    label: string,
    unit: "count" | "inr",
    value: number,
    previous: number | null,
    previousLabel: string | null,
    spark: number[],
    periodLabel: string,
    code: string,
    basis: string,
    sourceIds: string[],
    applies: GigFilterKey[],
  ): GigKpi => ({
    id,
    label,
    unit,
    value,
    displayValue: unit === "count" ? count(value) : money(value),
    comparison: compare(value, previous, previousLabel),
    spark,
    period: periodLabel,
    definition: definitionOf(code),
    basis,
    sourceIds,
    notAffectedBy: unaffectedBy(f, applies),
  })

  const recordsNow = sumWin(R.records, win)
  const payoutNow = sumWin(R.payout, win)
  const depositedNow = sumWin(R.deposited, win)
  const benefitsNow = E.apps.disbursedAmount
  const kpis: GigKpi[] = [
    kpi("records", "Gig Worker Records Received", "count", recordsNow, Rp && prev ? sumWin(Rp.records, prev) : null, prevFlow, series(R.records), period, "GW-REC-01", "Records, not unique workers", ["aggregator-submissions"], APPLIES.records),
    kpi("unique", "Unique Board-Registered Workers", "count", R.unique, Rp ? Rp.unique : null, prevStock, series(R.stock), asOf, "GW-UNQ-01", "Distinct Board worker IDs", ["worker-registry"], APPLIES.unique),
    kpi("aggregators", "Reporting Aggregators", "count", reportingNow, reportingPrev, prevFlow, series(R.aggCountMonth), period, "AG-REP-01", `of ${registeredInScope} registered`, ["aggregator-registry", "aggregator-submissions"], APPLIES.aggregators),
    kpi("active", "Active Workers", "count", R.active, Rp ? Rp.active : null, prevFlow, series(R.activeMonth), period, "GW-ACT-01", "Distinct workers, placeholder rule", ["worker-registry", "pwfvs"], APPLIES.active),
    kpi("payouts", "Total Worker Payouts", "inr", payoutNow, Rp && prev ? sumWin(Rp.payout, prev) : null, prevFlow, series(R.payout), period, "PAY-TOT-01", "Final payouts reported", ["pwfvs"], APPLIES.payout),
    kpi("deposited", "Welfare Fee Deposited", "inr", depositedNow, Rp && prev ? sumWin(Rp.deposited, prev) : null, prevFlow, series(R.deposited), period, "FEE-DEP-01", "Verified deposits only", ["fee-ledger", "bank-reconciliation"], APPLIES.fee),
    kpi("fund", "Welfare Fund Balance", "inr", fund.closing[win.last], prev ? fund.closing[prev.last] : null, prevStock, series(fund.closing), asOf, "FUND-BAL-01", "Closing ledger balance", ["fund-ledger"], APPLIES.fund),
    kpi("benefits", "Welfare Benefits Disbursed", "inr", benefitsNow, Ep && prev ? Ep.apps.disbursedAmount : null, prevFlow, series(E.apps.monthAmount), period, "BEN-DIS-01", "Successful payments only", ["scheme-applications", "payment-gateway"], APPLIES.benefits),
  ]

  const strip: GigStat[] = [
    { id: "added", label: "Workers added", displayValue: count(sumWin(R.newBoard, win)), hint: "New Board registrations in the period", sourceIds: ["worker-registry"] },
    { id: "separated", label: "Workers separated", displayValue: count(sumWin(R.separated, win)), hint: "Workers separated or deactivated in the period", sourceIds: ["worker-registry"] },
    { id: "multi", label: "On more than one platform", displayValue: count(R.multi), hint: "Registered workers who work with two or more platforms", sourceIds: ["worker-registry", "aggregator-submissions"] },
    { id: "payable", label: "Welfare fee payable", displayValue: money(sumWin(R.payable, win)), hint: "Fee due on payouts at the configured rates", sourceIds: ["pwfvs"] },
    { id: "declared", label: "Welfare fee declared", displayValue: money(sumWin(R.declared, win)), hint: "Amount aggregators declared in returns", sourceIds: ["fee-ledger"] },
    { id: "reconciled", label: "Welfare fee reconciled", displayValue: money(sumWin(R.reconciled, win)), hint: "Deposits matched through reconciliation", sourceIds: ["bank-reconciliation"] },
    { id: "applications", label: "Applications pending", displayValue: count(E.apps.scrutiny), hint: "Received in the period and still under scrutiny", sourceIds: ["scheme-applications"] },
    { id: "grievances", label: "Grievances pending", displayValue: count(E.grv.pending + E.grv.escalated), hint: "Received in the period and not yet resolved", sourceIds: ["grievances"] },
    { id: "accidents", label: "Accidents reported", displayValue: count(E.acc.accidents), hint: "Accidents reported in the period", sourceIds: ["safety"] },
  ]

  // Charts
  const months = win.months.map(monthShort)
  const registration = {
    months,
    records: series(R.records),
    newlyRegistered: series(R.newBoard),
    separated: series(R.separated),
    notAffectedBy: unaffectedBy(f, WITH_STATUS),
  }
  const sector = {
    rows: D.sectors.map((item, index) => ({ id: item.id, name: item.name, workers: R.sectorUnique[index] })).sort((left, right) => right.workers - left.workers),
    total: R.unique,
    notAffectedBy: unaffectedBy(f, CORE),
  }
  const aggregatorRowsForChart = D.aggregators
    .map((item, p) => {
      const latest = item.reporting ? latestReturn(p, win) : { quarter: 0, state: 4 }
      return {
        id: item.id,
        name: item.name,
        sector: sectorName(AGG_SECTOR[p]),
        workers: R.agg[p].unique,
        engagements: R.agg[p].engagements,
        returnStatus: item.reporting ? RETURN_LABEL[latest.state] : "Registered, not yet reporting",
        reporting: item.reporting,
      }
    })
    .filter((row) => (!scope.platFilter ? true : scope.platOk[D.aggregators.findIndex((item) => item.id === row.id)] === 1))
    .sort((left, right) => Number(right.reporting) - Number(left.reporting) || right.workers - left.workers)
  const aggregators = {
    rows: aggregatorRowsForChart,
    uniqueTotal: R.unique,
    engagementTotal: R.engagements,
    notAffectedBy: unaffectedBy(f, CORE),
  }
  const activeSum = (() => {
    let total = 0
    for (const t of win.months) total += R.activeMonth[t]
    return total
  })()
  const payout = {
    months,
    payout: series(R.payout),
    transactions: series(R.txns),
    activeWorkers: series(R.activeMonth),
    total: payoutNow,
    avgPerActive: activeSum > 0 ? payoutNow / activeSum : null,
    notAffectedBy: unaffectedBy(f, WITH_STATUS),
  }
  const fee = {
    months,
    payable: series(R.payable),
    declared: series(R.declared),
    deposited: series(R.deposited),
    reconciled: series(R.reconciled),
    totals: { payable: sumWin(R.payable, win), declared: sumWin(R.declared, win), deposited: depositedNow, reconciled: sumWin(R.reconciled, win) },
    shortfall: sumWin(R.shortfall, win),
    excess: sumWin(R.excess, win),
    notAffectedBy: unaffectedBy(f, WITH_STATUS),
  }
  const sumFund = (values: number[]) => win.months.reduce((total, t) => total + values[t], 0)
  const receiptsByMonth = (t: number) => fund.fee[t] + fund.stateGrant[t] + fund.centralGrant[t] + fund.donations[t] + fund.otherReceipts[t]
  const expenditureByMonth = (t: number) => fund.scheme[t] + fund.admin[t] + fund.programme[t] + fund.otherExpenditure[t]
  const fundChart = {
    months,
    receipts: win.months.map(receiptsByMonth),
    expenditure: win.months.map(expenditureByMonth),
    closing: win.months.map((t) => fund.closing[t]),
    summary: {
      opening: fund.opening[win.first],
      receipts: [
        { label: "Welfare fee (verified deposits)", value: sumFund(fund.fee) },
        { label: "State Government grants", value: sumFund(fund.stateGrant) },
        { label: "Central Government grants", value: sumFund(fund.centralGrant) },
        { label: "Donations, gifts and transfers", value: sumFund(fund.donations) },
        { label: "Other permitted receipts", value: sumFund(fund.otherReceipts) },
      ],
      receiptsTotal: win.months.reduce((total, t) => total + receiptsByMonth(t), 0),
      expenditure: [
        { label: "Scheme and benefit disbursement", value: sumFund(fund.scheme) },
        { label: "Administrative expenditure", value: sumFund(fund.admin) },
        { label: "Programme and implementation", value: sumFund(fund.programme) },
        { label: "Other approved expenditure", value: sumFund(fund.otherExpenditure) },
      ],
      expenditureTotal: win.months.reduce((total, t) => total + expenditureByMonth(t), 0),
      adjustments: sumFund(fund.adjustments),
      closing: fund.closing[win.last],
      asOf: asOfText(win),
    },
    notAffectedBy: unaffectedBy(f, APPLIES.fund),
  }
  const schemes = {
    stageLabels: STAGE_LABELS,
    pipeline: [
      { label: "Applications received", value: E.apps.received, hint: "All applications in the period" },
      { label: "Under scrutiny", value: E.apps.scrutiny, hint: "Not yet decided" },
      { label: "Approved", value: E.apps.approved, hint: "Includes approved payments that are not yet disbursed" },
      { label: "Rejected", value: E.apps.rejected, hint: "Decided and not approved" },
      { label: "Payments initiated", value: E.apps.initiated, hint: "Approved applications with a payment started" },
      { label: "Successfully disbursed", value: E.apps.disbursed, hint: "Payments that reached the beneficiary" },
      { label: "Failed or returned", value: E.apps.failed, hint: "Not counted as disbursed" },
    ],
    rows: D.schemes.map((scheme, index) => ({
      id: scheme.id,
      name: scheme.name,
      operational: scheme.operational,
      applications: E.apps.stages[index].reduce((sum, value) => sum + value, 0),
      beneficiaries: E.apps.beneficiaries[index],
      amount: E.apps.amount[index],
      stages: E.apps.stages[index],
    })),
    notAffectedBy: unaffectedBy(f, APPLIES.benefits),
  }
  const grievances = {
    categories: D.grievanceCategories.map((item, index) => ({ id: item.id, name: item.name, resolved: E.grv.cat[index][0], pending: E.grv.cat[index][1], escalated: E.grv.cat[index][2] })),
    months,
    received: series(E.grv.monthReceived),
    resolved: series(E.grv.monthResolved),
    totals: {
      received: E.grv.received,
      resolved: E.grv.resolved,
      pending: E.grv.pending,
      escalated: E.grv.escalated,
      appealsReceived: E.grv.appealsReceived,
      appealsDisposed: E.grv.appealsDisposed,
      beyondTarget: E.grv.beyond,
    },
    targetDays: D.config.grievanceTargetDays,
    notAffectedBy: unaffectedBy(f, APPLIES.grievances),
  }
  const safety = {
    months,
    fatal: series(E.acc.fatal),
    nonFatal: series(E.acc.nonFatal),
    claimsInitiated: series(E.acc.claimsInitiated),
    claimsSettled: series(E.acc.claimsSettled),
    types: D.accidentTypes.map((item, index) => ({ id: item.id, name: item.name, fatal: E.acc.typeFatal[index], nonFatal: E.acc.typeNon[index] })),
    totals: {
      accidents: E.acc.accidents,
      fatal: E.acc.fatalTotal,
      nonFatal: E.acc.accidents - E.acc.fatalTotal,
      claimsInitiated: E.acc.claimsInitiatedTotal,
      claimsSettled: E.acc.claimsSettledTotal,
      trainees: E.trainees,
    },
    notAffectedBy: unaffectedBy(f, APPLIES.safety),
  }

  const districts: GigMapDistrict[] = D.districts.map((district, d) => ({
    id: district.id,
    name: district.name,
    drawn: district.drawn,
    unique: R.distUnique[d],
    active: R.distActive[d],
    payout: R.distPayout[d],
    benefits: E.apps.distAmount[d],
    grievances: E.grv.dist[d],
  }))

  const activeFilters = activeGigKeys(f).map((key) => ({ key, label: FILTER_LABEL[key], value: filterValueName(key, f[key]) }))
  const geo = f.cityId !== "all" ? filterValueName("cityId", f.cityId) : f.districtId !== "all" ? filterValueName("districtId", f.districtId) : "All Karnataka"
  const platform = f.aggregatorId !== "all" ? filterValueName("aggregatorId", f.aggregatorId) : f.sectorId !== "all" ? filterValueName("sectorId", f.sectorId) : "All platforms"
  const extras = activeFilters.filter((item) => !["districtId", "cityId", "aggregatorId", "sectorId"].includes(item.key)).map((item) => `${item.label}: ${item.value}`)
  const scopeLabel = [geo, platform, ...extras].join(" · ")

  const exceptionsAll = buildExceptions(ctx)

  return {
    title: D.meta.title,
    illustrativeNote: D.meta.illustrativeNote,
    source: D.meta.source,
    lastRefreshed: D.meta.lastRefreshed,
    reportingDate: fmtDate(D.meta.reportingDate),
    periodLabel: period,
    asOfLabel: asOfText(win),
    scopeLabel,
    locationNote: D.meta.locationNote,
    boundaryNote: D.meta.boundaryNote,
    activityRuleNote: D.meta.activityRuleNote,
    feeNote: D.meta.feeNote,
    schemeNote: D.meta.schemeNote,
    filters: f,
    activeFilters,
    empty: R.unique === 0 && recordsNow === 0,
    months: win.months.map((t) => ({ index: t, short: MONTHS[t].short, label: MONTHS[t].label })),
    kpis,
    strip,
    registration,
    sector,
    aggregators,
    payout,
    fee,
    fund: fundChart,
    schemes,
    grievances,
    safety,
    districts,
    aggregatorTable: buildAggregatorTable(ctx),
    exceptions: exceptionsAll.slice(0, 12),
    exceptionCount: exceptionsAll.length,
    sources,
    benchmark: D.meta.benchmark,
    definitions: GIG_METRICS,
  }
}

// ---- Aggregator summary table ----------------------------------------------------------------
function buildAggregatorTable(ctx: Ctx): GigAggregatorRow[] {
  const { win, R, scope } = ctx
  const period = periodText(win)
  const rowsOut: GigAggregatorRow[] = []
  for (let p = 0; p < NA; p += 1) {
    if (scope.platFilter && !scope.platOk[p]) continue
    const aggregator = D.aggregators[p]
    const stats = R.agg[p]
    const latest = aggregator.reporting ? latestReturn(p, win) : null
    let lastSubmission = ""
    for (let q = MONTHS[win.first].quarter; q <= MONTHS[win.last].quarter; q += 1) {
      const date = D.returns[p].submitted[q]
      if (date && date > lastSubmission) lastSubmission = date
    }
    rowsOut.push({
      id: aggregator.id,
      name: aggregator.name,
      sector: sectorName(AGG_SECTOR[p]),
      period,
      records: stats.records,
      unique: aggregator.reporting && stats.records + stats.payout > 0 ? stats.unique : null,
      payout: stats.payout,
      payable: stats.payable,
      deposited: stats.deposited,
      returnStatus: latest ? `${D.quarters[latest.quarter].short}: ${RETURN_LABEL[latest.state]}` : "Registered, not yet reporting",
      lastSubmission: lastSubmission ? fmtDate(lastSubmission) : aggregator.reporting ? "No return filed in the period" : "No submission",
      reporting: aggregator.reporting,
      outstanding: stats.shortfall,
    })
  }
  return rowsOut.sort((left, right) => Number(right.reporting) - Number(left.reporting) || right.records - left.records)
}

// ---- Priority exceptions ---------------------------------------------------------------------
const UNIT = {
  compliance: "Registration and Compliance Unit",
  finance: "Finance and Reconciliation Unit",
  data: "Data Quality Cell",
  welfare: "Welfare Delivery Unit",
  grievance: "Grievance Redressal Unit",
  safety: "Safety and Claims Unit",
}
const STATUS_CHOICES = ["Open", "In progress", "Awaiting aggregator"]

function priorityByAmount(amount: number, high: number): "high" | "medium" | "low" {
  if (amount >= high) return "high"
  if (amount >= high / 3) return "medium"
  return "low"
}

export function buildExceptions(ctx: Ctx): GigException[] {
  const { win, R, E, scope } = ctx
  const rules = D.config.exceptionRules
  const list: GigException[] = []
  const statusOf = (id: string) => STATUS_CHOICES[hashOf(id) % STATUS_CHOICES.length]
  const dueOf = (id: string) => fmtDate(addDays(D.meta.reportingDate, 5 + (hashOf(id) % 24)))
  const make = (item: Omit<GigException, "status" | "due">): GigException => ({ ...item, status: statusOf(item.id), due: dueOf(item.id) })
  const firstQuarter = MONTHS[win.first].quarter
  const lastQuarter = MONTHS[win.last].quarter
  const monthsOfQuarter = (q: number) => win.months.filter((t) => MONTHS[t].quarter === q)
  const cell = (p: number, t: number) => p * NM + t

  for (let p = 0; p < NA; p += 1) {
    const aggregator = D.aggregators[p]
    if (!aggregator.reporting) continue
    if (scope.platFilter && !scope.platOk[p]) continue
    const letter = aggregator.name.replace("Platform ", "")
    const scopeText = `${aggregator.name} · ${sectorName(AGG_SECTOR[p])}`

    for (let q = firstQuarter; q <= lastQuarter; q += 1) {
      const state = aggregator.returns[q]
      const inQuarter = monthsOfQuarter(q)
      const payableQ = inQuarter.reduce((sum, t) => sum + R.aggMonth.payable[cell(p, t)], 0)
      if (state === 2 && payableQ > 0) {
        list.push(make({
          id: `EX-RET-${letter}-${D.quarters[q].short.replace(" ", "")}`,
          kind: "return",
          key: aggregator.id,
          category: "Quarterly return not submitted",
          scope: scopeText,
          description: `The ${D.quarters[q].label} return was due ${fmtDate(D.quarters[q].due)} and has not been filed. Fee payable for the quarter has not been declared or deposited.`,
          measure: `${money(payableQ)} payable`,
          priority: priorityByAmount(payableQ, rules.highShortfallRupees),
          unit: UNIT.compliance,
          aggregatorId: aggregator.id,
          amount: payableQ,
        }))
      }
      if ((state === 0 || state === 1) && payableQ > 0) {
        const shortQ = inQuarter.reduce((sum, t) => sum + R.aggMonth.shortfall[cell(p, t)], 0)
        if (shortQ / payableQ > rules.shortfallShare) {
          list.push(make({
            id: `EX-FEE-${letter}-${D.quarters[q].short.replace(" ", "")}`,
            kind: "shortfall",
            key: aggregator.id,
            category: "Welfare fee shortfall",
            scope: scopeText,
            description: `Deposits for ${D.quarters[q].label} are ${((shortQ / payableQ) * 100).toFixed(1)}% below the fee payable.`,
            measure: `${money(shortQ)} short`,
            priority: priorityByAmount(shortQ, rules.highShortfallRupees),
            unit: UNIT.finance,
            aggregatorId: aggregator.id,
            amount: shortQ,
          }))
        }
      }
    }

    let payableAll = 0
    let excessAll = 0
    let unreconciled = 0
    let depositedAll = 0
    for (const t of win.months) {
      payableAll += R.aggMonth.payable[cell(p, t)]
      excessAll += R.aggMonth.excess[cell(p, t)]
      if (t <= NM - 3 && (D.returns[p].recStatus[t] === 0 || D.returns[p].recStatus[t] === 1)) {
        unreconciled += R.aggMonth.deposited[cell(p, t)] - R.aggMonth.reconciled[cell(p, t)]
        depositedAll += R.aggMonth.deposited[cell(p, t)]
      }
    }
    if (payableAll > 0 && excessAll / payableAll > 0.02) {
      list.push(make({
        id: `EX-MIS-${letter}`,
        kind: "mismatch",
        key: aggregator.id,
        category: "Payout and welfare fee transaction mismatch",
        scope: scopeText,
        description: "Deposits are higher than the fee payable on reported payouts. The difference needs an adjustment or refund decision.",
        measure: `${money(excessAll)} above payable`,
        priority: priorityByAmount(excessAll, rules.highShortfallRupees),
        unit: UNIT.finance,
        aggregatorId: aggregator.id,
        amount: excessAll,
      }))
    }
    if (depositedAll > 0 && unreconciled / depositedAll > 0.02) {
      list.push(make({
        id: `EX-REC-${letter}`,
        kind: "reconciliation",
        key: aggregator.id,
        category: "Reconciliation pending",
        scope: scopeText,
        description: "Deposits from earlier months are still not fully matched to bank and treasury records.",
        measure: `${money(unreconciled)} unmatched`,
        priority: priorityByAmount(unreconciled, rules.highShortfallRupees),
        unit: UNIT.finance,
        aggregatorId: aggregator.id,
        amount: unreconciled,
      }))
    }
    const flagged = Math.round(R.agg[p].records * aggregator.validationRate)
    if (aggregator.validationRate >= rules.validationShare && flagged > 0) {
      list.push(make({
        id: `EX-VAL-${letter}`,
        kind: "validation",
        key: aggregator.id,
        category: "Worker record validation issue",
        scope: scopeText,
        description: `${(aggregator.validationRate * 100).toFixed(1)}% of submitted records failed validation checks such as missing identity details or duplicates.`,
        measure: `${count(flagged)} records`,
        priority: flagged >= rules.highRecordCount ? "high" : flagged >= rules.highRecordCount / 3 ? "medium" : "low",
        unit: UNIT.data,
        aggregatorId: aggregator.id,
        amount: flagged,
      }))
    }
  }

  D.schemes.forEach((scheme, index) => {
    const failed = E.apps.stages[index][5]
    if (!scheme.operational || failed === 0) return
    list.push(make({
      id: `EX-PAY-${scheme.id.toUpperCase()}`,
      kind: "payment",
      key: scheme.id,
      category: "Benefit payment failure",
      scope: `${scheme.name} · all districts in scope`,
      description: "Payments failed or were returned. The beneficiary has not received the benefit and the payment needs to be retried.",
      measure: `${count(failed)} payments`,
      priority: failed >= 25 ? "high" : failed >= 10 ? "medium" : "low",
      unit: UNIT.welfare,
      aggregatorId: null,
      amount: failed,
    }))
  })
  D.grievanceCategories.forEach((category, index) => {
    const beyond = E.grv.beyondByCat[index]
    if (beyond === 0) return
    list.push(make({
      id: `EX-GRV-${category.id.toUpperCase()}`,
      kind: "grievance",
      key: category.id,
      category: "Grievance pending beyond target timeline",
      scope: `${category.name} · all districts in scope`,
      description: `Grievances open for more than ${D.config.grievanceTargetDays} days at the end of the period. The target is a POC placeholder.`,
      measure: `${count(beyond)} grievances`,
      priority: beyond >= 40 ? "high" : beyond >= 15 ? "medium" : "low",
      unit: UNIT.grievance,
      aggregatorId: null,
      amount: beyond,
    }))
  })
  if (E.acc.claimsBeyond > 0) {
    list.push(make({
      id: "EX-CLM-ACC",
      kind: "claim",
      key: "claims",
      category: "Accident claim pending action",
      scope: "All districts in scope",
      description: `Accident claims started but not settled more than ${D.config.claimTargetDays} days ago.`,
      measure: `${count(E.acc.claimsBeyond)} claims`,
      priority: E.acc.claimsBeyond >= 25 ? "high" : E.acc.claimsBeyond >= 10 ? "medium" : "low",
      unit: UNIT.safety,
      aggregatorId: null,
      amount: E.acc.claimsBeyond,
    }))
  }

  const rank = { high: 0, medium: 1, low: 2 }
  return list.sort((left, right) => rank[left.priority] - rank[right.priority] || right.amount - left.amount)
}