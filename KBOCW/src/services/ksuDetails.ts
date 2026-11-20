import { moneyShort } from "@/components/gig/gigChartOptions"
import {
  KSU_AGE_GROUPS,
  KSU_BENEFITS,
  KSU_CLAIM_STAGES,
  KSU_DISTRICTS,
  KSU_GENDERS,
  KSU_MONTHS,
  KSU_OCCUPATIONS,
  KSU_PENDING_BUCKETS,
  KSU_REASONS,
  KSU_REG_STATUSES,
  KSU_SCHEMES,
  KSU_SOURCES,
  benefitLabel,
  bucketOf,
  isoOfDay,
} from "@/data/ksuMasters"
import { formatCount, formatLongDate } from "@/lib/format"
import { computeKsu, eachClaim, mean, median, type Computed, type Scope } from "@/services/ksuEngine"
import { claimRef, maskedWorker } from "@/services/ksuData"
import { financeFor } from "@/services/ksuOverview"
import type { DetailColumn } from "@/types/dashboard"
import type { KsuDetail, KsuDrill, KsuFilters } from "@/types/ksu"

type Row = Record<string, string>

const col = (key: string, label: string, right = false): DetailColumn => ({ key, label, ...(right ? { align: "right" as const } : {}) })
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "n/a")
const fmtDate = (day: number) => formatLongDate(isoOfDay(day))
const days = (value: number | null) => (value === null ? "n/a" : `${Math.round(value * 10) / 10}`)
const periodText = (x: Computed) => (x.win.first === x.win.last ? KSU_MONTHS[x.win.first].label : `${KSU_MONTHS[x.win.first].label} to ${KSU_MONTHS[x.win.last].label}`)
const sourceNames = (ids: string[]) => ids.map((id) => KSU_SOURCES.find((source) => source.id === id)?.name ?? id).join(", ")
const latestUpdate = (ids: string[]) => {
  const stamps = ids.map((id) => KSU_SOURCES.find((source) => source.id === id)?.updated ?? "").filter(Boolean).sort()
  return stamps.length ? `${formatLongDate(stamps[stamps.length - 1].slice(0, 10))}, ${stamps[stamps.length - 1].slice(11, 16)} IST` : "Not available"
}

const MAX_REGISTER_ROWS = 150

function make(
  x: Computed,
  f: KsuFilters,
  parts: { code: string; title: string; summary: string; note?: string; sourceIds: string[]; columns: DetailColumn[]; rows: Row[]; apply?: KsuDetail["apply"] },
): KsuDetail {
  return {
    title: parts.title,
    summary: parts.summary,
    note: parts.note ?? "Illustrative POC Data. Figures are synthetic, generated for demonstration, and are not official Board statistics.",
    meta: {
      reference: `KSU/${parts.code}/${f.financialYear}/${KSU_MONTHS[x.win.first].short.replace(" ", "")}-${KSU_MONTHS[x.win.last].short.replace(" ", "")}`,
      source: sourceNames(parts.sourceIds),
      period: periodText(x),
      received: latestUpdate(parts.sourceIds),
      validation: "Reconciled to the dashboard totals. Synthetic data, not validated against Board records.",
      access: "Aggregated view. Worker identity is not shown.",
    },
    columns: parts.columns,
    rows: parts.rows,
    apply: parts.apply,
  }
}

// ---------------------------------------------------------------- tables

function districtTable(x: Computed, f: KsuFilters, code: string, title: string, summary: string, sort: "registered" | "coverage" | "received" | "pending" | "disbursed" | "enrolments"): KsuDetail {
  const { reg, clm, D } = x
  const rows = KSU_DISTRICTS.map((district, d) => ({
    d,
    name: district.name,
    registered: reg.distValid[d],
    baseline: D.baseline[d],
    enrolments: reg.distEnrol[d],
    received: clm.receivedByDist[d],
    pending: clm.pendingByDist[d],
    disbursed: clm.paidAmountByDist[d],
    coverage: D.baseline[d] > 0 ? (reg.distValid[d] / D.baseline[d]) * 100 : 0,
  })).sort((a, b) => (sort === "coverage" ? a.coverage - b.coverage : b[sort] - a[sort]))
  const total = rows.reduce((sum, row) => ({ registered: sum.registered + row.registered, baseline: sum.baseline + row.baseline, enrolments: sum.enrolments + row.enrolments, received: sum.received + row.received, pending: sum.pending + row.pending, disbursed: sum.disbursed + row.disbursed }), { registered: 0, baseline: 0, enrolments: 0, received: 0, pending: 0, disbursed: 0 })
  const body: Row[] = rows.map((row) => ({
    District: row.name,
    Registered: formatCount(row.registered),
    Baseline: formatCount(row.baseline),
    Coverage: pct(row.registered, row.baseline),
    Enrolments: formatCount(row.enrolments),
    Received: formatCount(row.received),
    Pending: formatCount(row.pending),
    Disbursed: moneyShort(row.disbursed),
  }))
  body.push({ District: "All districts", Registered: formatCount(total.registered), Baseline: formatCount(total.baseline), Coverage: pct(total.registered, total.baseline), Enrolments: formatCount(total.enrolments), Received: formatCount(total.received), Pending: formatCount(total.pending), Disbursed: moneyShort(total.disbursed) })
  return make(x, f, {
    code,
    title,
    summary,
    note: "Illustrative POC Data. The baseline is an illustrative estimate of unorganised workers, not a census figure, so coverage is indicative only. Enrolments count enrolments, not unique workers.",
    sourceIds: ["registry", "applications", "payments"],
    columns: [col("District", "District"), col("Registered", "Registered workers", true), col("Baseline", "Illustrative baseline", true), col("Coverage", "Coverage", true), col("Enrolments", "Enrolments", true), col("Received", "Cases received", true), col("Pending", "Pending cases", true), col("Disbursed", "Disbursed", true)],
    rows: body,
  })
}

function monthTable(x: Computed, f: KsuFilters, code: string, title: string, summary: string, sourceIds: string[], columns: DetailColumn[], build: (t: number) => Row, month?: number): KsuDetail {
  const months = KSU_MONTHS.slice(x.win.first, x.win.last + 1).filter((item) => month === undefined || item.index === month)
  return make(x, f, { code, title, summary, sourceIds, columns: [col("Month", "Month"), ...columns], rows: months.map((item) => ({ Month: item.label, ...build(item.index) })) })
}

function schemeTable(x: Computed, f: KsuFilters, code: string, title: string, summary: string, only?: string): KsuDetail {
  const { reg, clm } = x
  const schemes = KSU_SCHEMES.map((scheme, s) => ({ scheme, s })).filter(({ scheme }) => !only || scheme.id === only)
  const rows: Row[] = schemes.map(({ scheme, s }) => ({
    Scheme: scheme.name,
    Status: scheme.statusLabel,
    Enrolments: formatCount(reg.enrolByScheme[s]),
    Received: formatCount(clm.receivedByScheme[s]),
    Approved: formatCount(clm.approvedByScheme[s]),
    Beneficiaries: formatCount(clm.beneficiariesByScheme[s]),
    ApprovedAmount: moneyShort(clm.approvedAmountByScheme[s]),
    Disbursed: moneyShort(clm.paidAmountByScheme[s]),
  }))
  if (!only) {
    rows.push({
      Scheme: "All schemes",
      Status: "",
      Enrolments: `${formatCount(reg.enrolTotal)} (${formatCount(reg.uniqueEnrolled)} unique workers)`,
      Received: formatCount(clm.received),
      Approved: formatCount(clm.approvedCount),
      Beneficiaries: `${formatCount(clm.beneficiaries)} unique workers`,
      ApprovedAmount: moneyShort(clm.approvedAmount),
      Disbursed: moneyShort(clm.paidAmount),
    })
  }
  return make(x, f, {
    code,
    title,
    summary,
    note: "Illustrative POC Data. Enrolments and beneficiaries can overlap between schemes, so the scheme rows can add up to more than the unique workers in the total row. Approved and disbursed amounts are calculated separately and use different dates.",
    sourceIds: ["registry", "applications", "approvals", "payments"],
    columns: [col("Scheme", "Scheme"), col("Status", "Status"), col("Enrolments", "Enrolments", true), col("Received", "Cases received", true), col("Approved", "Cases approved", true), col("Beneficiaries", "Beneficiaries", true), col("ApprovedAmount", "Approved amount", true), col("Disbursed", "Disbursed amount", true)],
    rows,
  })
}

function categoryTable(x: Computed, f: KsuFilters, code: string, title: string, summary: string, label: string, rows: { name: string; value: number }[], total: number, apply?: KsuDetail["apply"]): KsuDetail {
  return make(x, f, {
    code,
    title,
    summary,
    sourceIds: ["registry"],
    columns: [col("Category", label), col("Workers", "Workers", true), col("Share", "Share", true)],
    rows: rows.map((row) => ({ Category: row.name, Workers: formatCount(row.value), Share: pct(row.value, total) })),
    apply,
  })
}

// ---------------------------------------------------------------- case register

function register(
  x: Computed,
  f: KsuFilters,
  parts: { code: string; title: string; summary: string; scope?: Scope; sourceIds: string[]; ageFrom: "received" | "approved"; include: (c: number, stage: number) => boolean; apply?: KsuDetail["apply"] },
): KsuDetail {
  const { D, win } = x
  const k = D.claims
  const picked: { c: number; stage: number }[] = []
  eachClaim(D, parts.scope ?? x.scope, win.endDay, (c, stage) => {
    if (parts.include(c, stage)) picked.push({ c, stage })
  })
  picked.sort((a, b) => k.recv[b.c] - k.recv[a.c])
  const shown = picked.slice(0, MAX_REGISTER_ROWS)
  const amount = picked.reduce((total, item) => total + k.amount[item.c], 0)
  const rows: Row[] = shown.map(({ c, stage }) => {
    const w = k.worker[c]
    return {
      Reference: claimRef(c),
      Worker: maskedWorker(w),
      District: KSU_DISTRICTS[D.dist[w]].name,
      Scheme: KSU_SCHEMES[k.scheme[c]].short,
      Benefit: KSU_BENEFITS[k.benefit[c]].name,
      Received: fmtDate(k.recv[c]),
      Status: KSU_CLAIM_STAGES[stage].name,
      Age: String(win.endDay - (parts.ageFrom === "approved" ? k.dec[c] : k.recv[c])),
      Amount: moneyShort(k.amount[c]),
    }
  })
  return make(x, f, {
    code: parts.code,
    title: parts.title,
    summary: `${parts.summary} ${formatCount(picked.length)} ${picked.length === 1 ? "case" : "cases"}, ${moneyShort(amount)} in total.${picked.length > shown.length ? ` The first ${shown.length} are listed, newest first.` : ""}`,
    note: "Illustrative POC Data. Worker IDs are synthetic and masked. Age counts days to the last day of the period. Amounts are placeholders, not notified rates.",
    sourceIds: parts.sourceIds,
    columns: [col("Reference", "Case"), col("Worker", "Worker (synthetic)"), col("District", "District"), col("Scheme", "Scheme"), col("Benefit", "Benefit type"), col("Received", "Received"), col("Status", "Status"), col("Age", parts.ageFrom === "approved" ? "Days since approval" : "Days since receipt", true), col("Amount", "Amount", true)],
    rows,
    apply: parts.apply,
  })
}

// ---------------------------------------------------------------- profiles

function districtProfile(x: Computed, f: KsuFilters, id: string): KsuDetail {
  const d = KSU_DISTRICTS.findIndex((item) => item.id === id)
  if (d < 0) return make(x, f, { code: "DIST", title: "District not found", summary: "No district matches the request.", sourceIds: [], columns: [col("Measure", "Measure")], rows: [] })
  const { reg, clm, D } = x
  const facilitation = reg.kskByDistrict[d] + KSU_MONTHS.slice(x.win.first, x.win.last + 1).reduce((total, month) => total + D.kskOther[d * 18 + month.index], 0)
  const rows: Row[] = [
    ["Registered workers (valid)", formatCount(reg.distValid[d])],
    ["Illustrative baseline of unorganised workers", formatCount(D.baseline[d])],
    ["Coverage against the baseline", pct(reg.distValid[d], D.baseline[d])],
    ["Scheme enrolments (not unique workers)", formatCount(reg.distEnrol[d])],
    ["Verified beneficiaries", formatCount(clm.beneficiariesByDist[d])],
    ["Cases received", formatCount(clm.receivedByDist[d])],
    ["Pending cases at the end of the period", formatCount(clm.pendingByDist[d])],
    ["Approved cases not yet paid", formatCount(clm.unpaidByDist[d])],
    ["Benefits disbursed", moneyShort(clm.paidAmountByDist[d])],
    ["Karmika Seva Kendra services", formatCount(facilitation)],
    ["e-Shram registrations (external reference, not KSUWSSB)", formatCount(D.eshram[d])],
  ].map(([Measure, Value]) => ({ Measure, Value }))
  return make(x, f, {
    code: "DIST",
    title: KSU_DISTRICTS[d].name,
    summary: "District totals for the selected period and filters. District is the lowest level shown on the executive view.",
    sourceIds: ["registry", "applications", "payments", "facilitation", "eshram"],
    columns: [col("Measure", "Measure"), col("Value", "Value", true)],
    rows,
    apply: { label: `Show only ${KSU_DISTRICTS[d].name}`, patch: { districtId: KSU_DISTRICTS[d].id } },
  })
}

// ---------------------------------------------------------------- dispatch

const stageIndex = (name?: string) => KSU_CLAIM_STAGES.findIndex((stage) => stage.name === name)

export function buildKsuDetail(drill: KsuDrill, filters: KsuFilters): KsuDetail {
  const x = computeKsu(filters)
  const f = filters
  const { D, reg, clm, win } = x
  const k = D.claims

  switch (drill.type) {
    case "district":
      return districtProfile(x, f, drill.id)

    case "scheme":
      return schemeTable(x, f, "SCH", `${KSU_SCHEMES.find((item) => item.id === drill.id)?.name ?? "Scheme"}`, "Enrolments, cases and amounts for the scheme in the selected period.", drill.id)

    case "priority": {
      const [districtId, schemeId] = drill.key.split(":")
      const d = KSU_DISTRICTS.findIndex((item) => item.id === districtId)
      const s = KSU_SCHEMES.findIndex((item) => item.id === schemeId)
      if (d < 0 || s < 0) return make(x, f, { code: "PRI", title: "Not found", summary: "No case group matches the request.", sourceIds: [], columns: [col("Reference", "Case")], rows: [] })
      return register(x, f, {
        code: "PRI",
        title: `${KSU_DISTRICTS[d].name}: ${KSU_SCHEMES[s].short}`,
        summary: "Cases that are pending, or approved and not yet paid, at the end of the period. They are listed for review.",
        scope: { ...x.scope, dist: d, scheme: s },
        sourceIds: ["applications", "approvals", "payments"],
        ageFrom: "received",
        include: (_c, stage) => stage === 0 || stage === 1 || stage === 3 || stage === 4 || stage === 6,
        apply: { label: `Show only ${KSU_DISTRICTS[d].name} and this scheme`, patch: { districtId: districtId, schemeId } },
      })
    }

    case "kpi":
      switch (drill.id) {
        case "registered":
          return districtTable(x, f, "K1", "KSUWSSB registered workers by district", "Distinct workers with a valid registration on the last day of the period, by district.", "registered")
        case "newRegistrations":
          return monthTable(x, f, "K2", "Workers registered, by month", "New registrations received in each month of the period.", ["registry"], [col("New", "New registrations", true), col("Stock", "Valid at month end", true)], (t) => ({ New: formatCount(reg.newByMonth[t]), Stock: formatCount(reg.validStock[t]) }))
        case "enrolments":
          return schemeTable(x, f, "K3", "Scheme enrolments by scheme", "Active enrolments on the last day of the period. A worker in two schemes counts in both.")
        case "beneficiaries":
          return schemeTable(x, f, "K4", "Verified beneficiaries by scheme", "Distinct workers with an approved benefit in the period. The total counts each worker once.")
        case "received":
          return register(x, f, { code: "K5", title: "Applications and claims received", summary: "Cases received in the period.", sourceIds: ["applications"], ageFrom: "received", include: (c) => k.recv[c] >= win.startDay })
        case "pending":
          return register(x, f, { code: "K6", title: "Pending applications and claims", summary: "Cases still waiting for a decision or for correction on the last day.", sourceIds: ["applications", "approvals"], ageFrom: "received", include: (_c, stage) => stage === 0 || stage === 1 })
        case "approved":
          return schemeTable(x, f, "K7", "Benefits approved, by scheme", "Approved amounts by scheme for cases approved in the period, shown beside amounts disbursed.")
        case "disbursed":
          return districtTable(x, f, "K8", "Benefits disbursed, by district", "Successful payments in the period, by district.", "disbursed")
        default:
          break
      }
      break

    case "strip":
      switch (drill.id) {
        case "cards":
        case "awaiting":
        case "rejected":
          return categoryTable(x, f, "S1", "Registrations by status", "All workers registered up to the last day, by their status on that day.", "Status", KSU_REG_STATUSES.map((item, index) => ({ name: item.name, value: reg.statusCounts[index] })), reg.inScope)
        case "unpaid":
          return register(x, f, { code: "S4", title: "Approved, not yet paid", summary: "Approved cases without a successful payment on the last day.", sourceIds: ["approvals", "payments"], ageFrom: "approved", include: (_c, stage) => stage === 3 || stage === 4 || stage === 6 })
        case "avgtime":
          return processingDetail(x, f)
        case "occupations":
          return categoryTable(x, f, "S6", "Workers by occupation", "Valid registered workers by occupation category.", "Occupation", KSU_OCCUPATIONS.map((item, index) => ({ name: item.name, value: reg.occupations[index] })).sort((a, b) => b.value - a.value), reg.valid)
        case "districts":
          return districtTable(x, f, "S7", "Districts with activity", "Registered workers and cases by district.", "registered")
        case "ksk":
          return facilitationMonths(x, f)
        default:
          break
      }
      break

    case "chart": {
      const category = drill.category
      switch (drill.chartId) {
        case "registration":
          return monthTable(x, f, "C1", "Registrations by month", "New registrations and valid registered workers at each month end.", ["registry"], [col("New", "New registrations", true), col("Stock", "Valid at month end", true)], (t) => ({ New: formatCount(reg.newByMonth[t]), Stock: formatCount(reg.validStock[t]) }), drill.month)
        case "occupation": {
          const hit = KSU_OCCUPATIONS.find((item) => item.name === category)
          return categoryTable(x, f, "C2", "Workers by occupation", "Valid registered workers on the last day.", "Occupation", KSU_OCCUPATIONS.map((item, index) => ({ name: item.name, value: reg.occupations[index] })).sort((a, b) => b.value - a.value), reg.valid, hit ? { label: `Show only ${hit.name}`, patch: { occupationId: hit.id } } : undefined)
        }
        case "gender": {
          const hit = KSU_GENDERS.find((item) => item.name === category)
          return categoryTable(x, f, "C3", "Workers by gender", "Valid registered workers on the last day.", "Gender", KSU_GENDERS.map((item, index) => ({ name: item.name, value: reg.genders[index] })), reg.valid, hit ? { label: `Show only ${hit.name}`, patch: { gender: hit.id } } : undefined)
        }
        case "age": {
          const hit = KSU_AGE_GROUPS.find((item) => item.name === category)
          return categoryTable(x, f, "C4", "Workers by age group", "Valid registered workers on the last day.", "Age group", KSU_AGE_GROUPS.map((item, index) => ({ name: item.name, value: reg.ages[index] })), reg.valid, hit ? { label: `Show only ${hit.name}`, patch: { ageGroup: hit.id } } : undefined)
        }
        case "settlement":
          return categoryTable(x, f, "C5", "Rural and urban workers", "Valid registered workers by the sample rural or urban class of their district. The classification must be validated before use.", "Class", [{ name: "Rural", value: reg.settlement[0] }, { name: "Urban", value: reg.settlement[1] }], reg.valid)
        case "status": {
          const hit = KSU_REG_STATUSES.find((item) => item.name === category)
          return categoryTable(x, f, "C6", "Registration status", "Workers registered up to the last day, by status.", "Status", KSU_REG_STATUSES.map((item, index) => ({ name: item.name, value: reg.statusCounts[index] })), reg.inScope, hit ? { label: `Show only ${hit.name}`, patch: { registrationStatus: hit.id } } : undefined)
        }
        case "districtClaims":
          return districtTable(x, f, "C8", "Claims by district", "Cases received, pending at the end and money disbursed, by district.", "received")
        case "districtDisbursed":
          return districtTable(x, f, "C9", "Benefits disbursed by district", "Successful payments in the period, by district.", "disbursed")
        case "scheme":
        case "funnel":
          return schemeTable(x, f, "C10", "Scheme performance", "Enrolments, cases and amounts for each configured scheme.")
        case "beneficiaryTrend":
          return monthTable(x, f, "C13", "Beneficiaries by month and scheme", "Distinct workers approved in each month. A worker approved under two schemes appears under both.", ["approvals"], KSU_SCHEMES.map((scheme) => col(scheme.id, scheme.short, true)), (t) => Object.fromEntries(KSU_SCHEMES.map((scheme, s) => [scheme.id, formatCount(clm.beneficiariesBySchemeMonth[s][t])])), drill.month)
        case "pipeline": {
          const stage = stageIndex(category)
          if (stage < 0) return categoryCases(x, f)
          return register(x, f, { code: "C12", title: `Cases: ${KSU_CLAIM_STAGES[stage].name}`, summary: "Cases received in the period that stood at this status on the last day.", sourceIds: ["applications", "approvals", "payments"], ageFrom: "received", include: (c, s) => s === stage && k.recv[c] >= win.startDay, apply: { label: `Show only: ${KSU_CLAIM_STAGES[stage].name}`, patch: { claimStatus: KSU_CLAIM_STAGES[stage].id } } })
        }
        case "benefit": {
          const hit = KSU_BENEFITS.find((_, index) => benefitLabel(index) === category)
          return register(x, f, { code: "C14", title: hit ? `Cases: ${benefitLabel(KSU_BENEFITS.indexOf(hit))}` : "Cases by benefit type", summary: "Cases received in the period.", sourceIds: ["applications"], ageFrom: "received", include: (c) => k.recv[c] >= win.startDay && (!hit || KSU_BENEFITS[k.benefit[c]].id === hit.id), apply: hit ? { label: `Show only ${hit.name}`, patch: { benefitType: hit.id } } : undefined })
        }
        case "pendingAge": {
          const bucket = KSU_PENDING_BUCKETS.indexOf(category ?? "")
          return register(x, f, { code: "C15", title: bucket >= 0 ? `Pending cases: ${KSU_PENDING_BUCKETS[bucket]}` : "Pending cases by age", summary: "Cases waiting for a decision or correction on the last day.", sourceIds: ["applications"], ageFrom: "received", include: (c, stage) => (stage === 0 || stage === 1) && (bucket < 0 || bucketOf(win.endDay - k.recv[c]) === bucket) })
        }
        case "processing":
          return processingDetail(x, f)
        case "reasons":
          return make(x, f, {
            code: "C17",
            title: "Return and rejection reasons",
            summary: "Reasons recorded when cases were returned or rejected in the period. The reasons come from a sample list.",
            sourceIds: ["approvals"],
            columns: [col("Reason", "Reason"), col("Cases", "Cases", true), col("Share", "Share", true)],
            rows: KSU_REASONS.map((name, index) => ({ Reason: name, Cases: formatCount(clm.reasons[index]), Share: pct(clm.reasons[index], clm.reasons.reduce((a, b) => a + b, 0)) })).sort((a, b) => Number(b.Cases.replace(/,/g, "")) - Number(a.Cases.replace(/,/g, ""))),
          })
        case "unpaidAge": {
          const bucket = KSU_PENDING_BUCKETS.indexOf(category ?? "")
          return register(x, f, { code: "C18", title: bucket >= 0 ? `Approved, not yet paid: ${KSU_PENDING_BUCKETS[bucket]}` : "Approved, not yet paid, by age", summary: "Approved cases without a successful payment on the last day.", sourceIds: ["approvals", "payments"], ageFrom: "approved", include: (c, stage) => (stage === 3 || stage === 4 || stage === 6) && (bucket < 0 || bucketOf(win.endDay - k.dec[c]) === bucket) })
        }
        case "payments":
          return monthTable(x, f, "C19", "Successful payments by month", "Payments that completed successfully. Initiated, failed and returned payments are not included.", ["payments"], [col("Amount", "Amount paid", true), col("Count", "Payments", true)], (t) => ({ Amount: moneyShort(clm.paidAmountByMonth[t]), Count: formatCount(clm.paidCountByMonth[t]) }), drill.month)
        case "finance":
        case "financeTrend": {
          const finance = financeFor(x)
          return make(x, f, {
            code: "C20",
            title: `Allocation, release, approval and expenditure, ${finance.yearLabel}`,
            summary: `Financial year to date as at ${finance.asOf}. Each stage is a separate measure and none is netted against another.`,
            note: `Illustrative POC Data. ${finance.note}`,
            sourceIds: ["finance", "approvals", "payments"],
            columns: [col("Scheme", "Scheme"), col("Allocation", "Allocation", true), col("Released", "Funds released", true), col("Approved", "Benefits approved", true), col("Disbursed", "Benefits disbursed", true), col("Expenditure", "Expenditure", true), col("Utilisation", "Utilisation", true)],
            rows: [
              ...finance.rows.map((row) => ({ Scheme: row.name, Allocation: moneyShort(row.allocation), Released: moneyShort(row.released), Approved: moneyShort(row.approved), Disbursed: moneyShort(row.disbursed), Expenditure: moneyShort(row.expenditure), Utilisation: row.utilisation === null ? "n/a" : `${row.utilisation}%` })),
              { Scheme: "All schemes", Allocation: moneyShort(finance.totals.allocation), Released: moneyShort(finance.totals.released), Approved: moneyShort(finance.totals.approved), Disbursed: moneyShort(finance.totals.disbursed), Expenditure: moneyShort(finance.totals.expenditure), Utilisation: finance.totals.utilisation === null ? "n/a" : `${finance.totals.utilisation}%` },
            ],
          })
        }
        case "facilitation":
          return facilitationMonths(x, f)
        case "facilitationDistricts": {
          const months = KSU_MONTHS.slice(win.first, win.last + 1)
          const rows = KSU_DISTRICTS.map((district, dIndex) => {
            const other = months.reduce((total, month) => total + D.kskOther[dIndex * 18 + month.index], 0)
            return { name: district.name, facilitated: reg.kskByDistrict[dIndex], other }
          }).filter((row) => x.scope.dist < 0 || KSU_DISTRICTS[x.scope.dist].name === row.name)
          return make(x, f, {
            code: "C23",
            title: "Karmika Seva Kendra services by district",
            summary: "Services recorded in the period, by district.",
            sourceIds: ["facilitation"],
            columns: [col("District", "District"), col("Facilitated", "Registrations supported", true), col("Other", "Other services", true), col("Total", "Total services", true)],
            rows: rows.sort((a, b) => b.facilitated + b.other - (a.facilitated + a.other)).map((row) => ({ District: row.name, Facilitated: formatCount(row.facilitated), Other: formatCount(row.other), Total: formatCount(row.facilitated + row.other) })),
          })
        }
        default:
          break
      }
      break
    }
  }
  return make(x, f, { code: "NA", title: "Detail not available", summary: "There is no detail view for this item yet.", sourceIds: [], columns: [col("Item", "Item")], rows: [] })
}

function categoryCases(x: Computed, f: KsuFilters): KsuDetail {
  const stages = x.clm.stageCounts
  const total = stages.reduce((sum, value) => sum + value, 0)
  return make(x, f, {
    code: "C12",
    title: "Cases by status",
    summary: "Cases received in the period, by their status on the last day. The statuses add up to the cases received.",
    sourceIds: ["applications", "approvals", "payments"],
    columns: [col("Status", "Status"), col("Cases", "Cases", true), col("Share", "Share", true)],
    rows: KSU_CLAIM_STAGES.map((stage, index) => ({ Status: stage.name, Cases: formatCount(stages[index]), Share: pct(stages[index], total) })),
  })
}

function processingDetail(x: Computed, f: KsuFilters): KsuDetail {
  const { clm } = x
  return make(x, f, {
    code: "C16",
    title: "Processing time by scheme",
    summary: "Days from receipt to decision, for cases decided in the period. Cases still waiting are not included.",
    sourceIds: ["approvals"],
    columns: [col("Scheme", "Scheme"), col("Decided", "Cases decided", true), col("Average", "Average days", true), col("Median", "Median days", true)],
    rows: [
      ...KSU_SCHEMES.map((scheme, s) => ({ Scheme: scheme.short, Decided: formatCount(clm.decisionDaysByScheme[s].length), Average: days(mean(clm.decisionDaysByScheme[s])), Median: days(median(clm.decisionDaysByScheme[s])) })),
      { Scheme: "All schemes", Decided: formatCount(clm.decisionDays.length), Average: days(mean(clm.decisionDays)), Median: days(median(clm.decisionDays)) },
    ],
  })
}

function facilitationMonths(x: Computed, f: KsuFilters): KsuDetail {
  const { D, reg, scope } = x
  return monthTable(x, f, "C22", "Karmika Seva Kendra services by month", "Registration support plus other services recorded in the period.", ["facilitation"], [col("Facilitated", "Registrations supported", true), col("Other", "Other services", true), col("Total", "Total services", true)], (t) => {
    let other = 0
    KSU_DISTRICTS.forEach((_, dIndex) => {
      if (scope.dist >= 0 && dIndex !== scope.dist) return
      other += D.kskOther[dIndex * 18 + t]
    })
    return { Facilitated: formatCount(reg.kskByMonth[t]), Other: formatCount(other), Total: formatCount(reg.kskByMonth[t] + other) }
  })
}
