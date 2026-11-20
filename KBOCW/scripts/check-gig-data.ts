// Reconciliation checks for the Gig Workers Welfare Board overview.
// Build and run: vite build --ssr scripts/check-gig-data.ts --outDir /tmp/gigcheck && node /tmp/gigcheck/check-gig-data.js
import { DEFAULT_GIG_FILTERS } from "@/lib/gigQuery"
import { buildGigDetail } from "@/services/gigDetails"
import { computeFor } from "@/services/gigEngine"
import { buildExceptions, buildGigOverview, gigFilterOptions } from "@/services/gigOverview"
import type { GigDrill, GigFilters, GigOverview } from "@/types/gig"

/** Turns "₹23.3 Cr", "₹54.4 lakh" or "₹12,345" back into rupees. */
function parseMoney(text: string): number {
  const number = Number(text.replace(/[^0-9.\-]/g, ""))
  if (/Cr/.test(text)) return number * 1e7
  if (/lakh/.test(text)) return number * 1e5
  return number
}
const buildGigExceptionsForCheck = () => buildExceptions(computeFor(DEFAULT_GIG_FILTERS))

let failures = 0
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`)
}
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const near = (left: number, right: number, tolerance = 0.5) => Math.abs(left - right) <= tolerance
const kpi = (overview: GigOverview, id: string) => overview.kpis.find((item) => item.id === id)!.value
const base = (patch: Partial<GigFilters> = {}): GigFilters => ({ ...DEFAULT_GIG_FILTERS, ...patch })
const options = gigFilterOptions()

const all = buildGigOverview(base())
console.log("\n--- Default view:", all.periodLabel, "|", all.scopeLabel)
for (const item of all.kpis) {
  console.log(`  ${item.label.padEnd(34)} ${item.displayValue.padStart(16)}  vs ${item.comparison.label || "n/a"}: ${item.comparison.change === null ? "n/a" : item.comparison.change.toFixed(1) + "%"}`)
}
for (const item of all.strip) console.log(`  [strip] ${item.label.padEnd(28)} ${item.displayValue}`)

console.log("\n--- Identities on the default view")
check("Sector rows add up to unique workers", near(sum(all.sector.rows.map((row) => row.workers)), kpi(all, "unique")))
check("Aggregator unique counts are at least the unique total", sum(all.aggregators.rows.map((row) => row.workers)) >= kpi(all, "unique"))
check("Engagements are at least unique workers", all.aggregators.engagementTotal >= kpi(all, "unique"), `${all.aggregators.engagementTotal} vs ${kpi(all, "unique")}`)
check("Aggregator table records add up to the records KPI", near(sum(all.aggregatorTable.map((row) => row.records)), kpi(all, "records")))
check("Aggregator table payouts add up to the payout KPI", near(sum(all.aggregatorTable.map((row) => row.payout)), kpi(all, "payouts")))
check("Aggregator table deposits add up to the deposit KPI", near(sum(all.aggregatorTable.map((row) => row.deposited)), kpi(all, "deposited")))
check("District unique counts add up to the unique KPI", near(sum(all.districts.map((row) => row.unique)), kpi(all, "unique")))
check("District payouts add up to the payout KPI", near(sum(all.districts.map((row) => row.payout)), kpi(all, "payouts")))
check("District benefits add up to the benefits KPI", near(sum(all.districts.map((row) => row.benefits)), kpi(all, "benefits")))
check("Monthly payouts add up", near(sum(all.payout.payout), kpi(all, "payouts")))
check("Monthly records add up", near(sum(all.registration.records), kpi(all, "records")))
check("Fee stages: declared never above payable", all.fee.totals.declared <= all.fee.totals.payable)
check("Fee stages: reconciled never above deposited", all.fee.totals.reconciled <= all.fee.totals.deposited)
check("Fee KPI equals fee chart deposited", near(all.fee.totals.deposited, kpi(all, "deposited")))
check("Fund: opening + receipts - expenditure + adjustments = closing", near(all.fund.summary.opening + all.fund.summary.receiptsTotal - all.fund.summary.expenditureTotal + all.fund.summary.adjustments, all.fund.summary.closing, 1))
check("Fund: fee receipts equal the deposit KPI (no filters)", near(all.fund.summary.receipts[0].value, kpi(all, "deposited")))
check("Fund: scheme disbursement equals the benefits KPI (no filters)", near(all.fund.summary.expenditure[0].value, kpi(all, "benefits")))
check("Fund: closing equals the fund KPI", near(all.fund.summary.closing, kpi(all, "fund")))
check("Fund: balance stays positive", all.fund.closing.every((value) => value > 0), all.fund.closing.map((value) => (value / 1e7).toFixed(1)).join(", "))
const pipeline = Object.fromEntries(all.schemes.pipeline.map((item) => [item.label, item.value]))
check("Schemes: received = scrutiny + rejected + approved", pipeline["Applications received"] === pipeline["Under scrutiny"] + pipeline["Rejected"] + pipeline["Approved"])
check("Schemes: scheme rows add up to received", sum(all.schemes.rows.map((row) => row.applications)) === pipeline["Applications received"])
check("Schemes: initiated = disbursed + failed + processing", pipeline["Payments initiated"] >= pipeline["Successfully disbursed"] + pipeline["Failed or returned"])
check("Schemes: unnotified schemes have no applications", all.schemes.rows.filter((row) => !row.operational).every((row) => row.applications === 0))
check("Grievances: resolved + pending + escalated = received", all.grievances.totals.resolved + all.grievances.totals.pending + all.grievances.totals.escalated === all.grievances.totals.received)
check("Grievances: category rows add up to received", sum(all.grievances.categories.map((row) => row.resolved + row.pending + row.escalated)) === all.grievances.totals.received)
check("Grievances: monthly received adds up", sum(all.grievances.received) === all.grievances.totals.received)
check("Safety: fatal + non-fatal = accidents", all.safety.totals.fatal + all.safety.totals.nonFatal === all.safety.totals.accidents)
check("Safety: type rows add up to accidents", sum(all.safety.types.map((row) => row.fatal + row.nonFatal)) === all.safety.totals.accidents)
check("Safety: claims settled never above initiated", all.safety.totals.claimsSettled <= all.safety.totals.claimsInitiated)
const separatedCount = Number(all.strip.find((item) => item.id === "separated")!.displayValue.replace(/,/g, ""))
check("Active workers are within registered workers plus those separated in the period", kpi(all, "active") <= kpi(all, "unique") + separatedCount, `${kpi(all, "active")} <= ${kpi(all, "unique")} + ${separatedCount}`)

console.log("\n--- Sums over every slice equal the unfiltered total")
function slices(label: string, key: keyof GigFilters, ids: string[], metrics: [string, (o: GigOverview) => number][]) {
  const parts = ids.map((id) => buildGigOverview(base({ [key]: id } as Partial<GigFilters>)))
  for (const [name, read] of metrics) {
    const total = sum(parts.map(read))
    const expected = read(all)
    check(`${label}: ${name}`, near(total, expected, 1), `${Math.round(total)} vs ${Math.round(expected)}`)
  }
}
const coreMetrics: [string, (o: GigOverview) => number][] = [
  ["unique workers", (o) => kpi(o, "unique")],
  ["records", (o) => kpi(o, "records")],
  ["payouts", (o) => kpi(o, "payouts")],
  ["deposited", (o) => kpi(o, "deposited")],
  ["active workers", (o) => kpi(o, "active")],
]
slices("By district", "districtId", options.districts.map((item) => item.id), [...coreMetrics, ["benefits", (o) => kpi(o, "benefits")], ["grievances", (o) => o.grievances.totals.received], ["accidents", (o) => o.safety.totals.accidents]])
slices("By gender", "gender", options.genders.map((item) => item.id), [...coreMetrics, ["benefits", (o) => kpi(o, "benefits")]])
slices("By age group", "ageGroup", options.ageGroups.map((item) => item.id), coreMetrics.slice(0, 4))
slices("By activity", "activity", ["active", "inactive"], [["unique workers", (o) => kpi(o, "unique")]])
const aggParts = options.aggregators.map((item) => buildGigOverview(base({ aggregatorId: item.id })))
check("By aggregator: payouts add up", near(sum(aggParts.map((o) => kpi(o, "payouts"))), kpi(all, "payouts"), 1))
check("By aggregator: deposits add up", near(sum(aggParts.map((o) => kpi(o, "deposited"))), kpi(all, "deposited"), 1))
check("By aggregator: records add up", near(sum(aggParts.map((o) => kpi(o, "records"))), kpi(all, "records"), 1))
check("By aggregator: unique workers add up to MORE than the total (multi-platform)", sum(aggParts.map((o) => kpi(o, "unique"))) > kpi(all, "unique"))
const sectorParts = options.sectors.map((item) => buildGigOverview(base({ sectorId: item.id })))
check("By sector: payouts add up", near(sum(sectorParts.map((o) => kpi(o, "payouts"))), kpi(all, "payouts"), 1))
slices("By scheme", "schemeId", options.schemes.map((item) => item.id), [["benefits", (o) => kpi(o, "benefits")]])
slices("By grievance category", "grievanceCategory", options.grievanceCategories.map((item) => item.id), [["grievances", (o) => o.grievances.totals.received]])

console.log("\n--- Filters that do not apply leave a figure unchanged")
const withScheme = buildGigOverview(base({ schemeId: "medical" }))
check("Scheme filter does not change payouts", near(kpi(withScheme, "payouts"), kpi(all, "payouts")))
check("Scheme filter changes benefits", kpi(withScheme, "benefits") < kpi(all, "benefits"))
const withDistrict = buildGigOverview(base({ districtId: "mysuru" }))
check("District filter does not change the fund balance", near(kpi(withDistrict, "fund"), kpi(all, "fund")))
check("District filter changes unique workers", kpi(withDistrict, "unique") < kpi(all, "unique"))
check("Chart notes name filters that do not apply", withScheme.payout.notAffectedBy.includes("Scheme") && withScheme.fund.notAffectedBy.includes("Scheme"))

console.log("\n--- Periods and comparison")
const q2 = buildGigOverview(base({ fromDate: "2026-07-01", toDate: "2026-09-30" }))
check("Q2 has a comparison with Q1", q2.kpis.every((item) => item.comparison.change !== null || item.id === "aggregators"), q2.kpis.map((item) => item.comparison.label).join(" | "))
const fy2526 = buildGigOverview(base({ financialYear: "2025-26", fromDate: "2025-10-01", toDate: "2026-03-31" }))
check("The first period has no comparison", fy2526.kpis.every((item) => item.comparison.change === null))
check("Default period has a comparison", all.kpis.some((item) => item.comparison.change !== null))
const oneMonth = buildGigOverview(base({ fromDate: "2026-09-01", toDate: "2026-09-30" }))
check("A one-month period still builds", oneMonth.months.length === 1)
check("Fund balance moves with the period end", kpi(fy2526, "fund") !== kpi(all, "fund"))

console.log("\n--- Combination and empty states")
const combo = buildGigOverview(base({ districtId: "kodagu", sectorId: "healthcare", gender: "female", ageGroup: "45+" }))
check("A very narrow filter builds without errors", combo.kpis.length === 8, `unique=${kpi(combo, "unique")} records=${kpi(combo, "records")} empty=${combo.empty}`)
const city = buildGigOverview(base({ cityId: "mysuru" }))
check("City filter is inside its district", kpi(city, "unique") <= kpi(buildGigOverview(base({ districtId: "mysuru" })), "unique"))
const wrongCity = buildGigOverview(base({ cityId: "mysuru", districtId: "belagavi" }))
check("City and district that do not match give no workers", kpi(wrongCity, "unique") === 0 && wrongCity.empty)
const overdue = buildGigOverview(base({ status: "ret-overdue" }))
check("Overdue-return filter leaves deposits at zero", kpi(overdue, "deposited") === 0, `payable=${Math.round(overdue.fee.totals.payable)}`)

console.log("\n--- Exceptions (default view):", all.exceptionCount)
for (const item of all.exceptions) console.log(`  ${item.priority.padEnd(6)} ${item.id.padEnd(22)} ${item.category.padEnd(46)} ${item.scope.padEnd(40)} ${item.measure}`)
console.log("\n--- Aggregator table")
for (const row of all.aggregatorTable) console.log(`  ${row.name.padEnd(12)} rec=${String(row.records).padStart(7)} uniq=${String(row.unique ?? "-").padStart(7)} payout=${(row.payout / 1e7).toFixed(1).padStart(7)} Cr dep=${(row.deposited / 1e7).toFixed(2).padStart(6)} Cr | ${row.returnStatus} | ${row.lastSubmission}`)

console.log("\n--- Drill-downs")
const drills: GigDrill[] = [
  ...all.kpis.map((item): GigDrill => ({ type: "kpi", id: item.id })),
  ...all.strip.map((item): GigDrill => ({ type: "strip", id: item.id })),
  { type: "chart", chartId: "registration", month: 11 },
  { type: "chart", chartId: "sector", category: all.sector.rows[0].name },
  { type: "chart", chartId: "aggregators", category: "Platform A" },
  { type: "chart", chartId: "payout", month: 10 },
  { type: "chart", chartId: "fee", month: 10 },
  { type: "chart", chartId: "fund", month: 8 },
  { type: "chart", chartId: "schemes", category: "Accidental benefit" },
  { type: "chart", chartId: "grievances", category: all.grievances.categories[0].name, series: "Pending" },
  { type: "chart", chartId: "grievanceTrend", month: 11 },
  { type: "chart", chartId: "safety", month: 11 },
  { type: "chart", chartId: "safetyTypes", category: all.safety.types[0].name },
  { type: "district", id: "mysuru" },
  { type: "aggregator", id: "platform-l", view: "profile" },
  { type: "aggregator", id: "platform-l", view: "history" },
  { type: "aggregator", id: "platform-l", view: "outstanding" },
  { type: "aggregator", id: "platform-o", view: "profile" },
  ...buildGigExceptionsForCheck().map((item): GigDrill => ({ type: "exception", id: item.id })),
]
for (const drill of drills) {
  const label = JSON.stringify(drill)
  try {
    const detail = buildGigDetail(drill, base())
    const wide = detail.rows.every((row) => detail.columns.every((column) => typeof row[column.key] === "string"))
    check(`Detail builds: ${label.slice(0, 80)}`, detail.title.length > 0 && wide && detail.meta.reference.startsWith("GIG/"), `${detail.rows.length} rows | ${detail.title}`)
  } catch (error) {
    check(`Detail builds: ${label.slice(0, 80)}`, false, String(error))
  }
}
const sample = buildGigDetail({ type: "kpi", id: "grievances" }, base())
console.log("  Sample register row:", JSON.stringify(sample.rows[0]))
const sampleFee = buildGigDetail({ type: "kpi", id: "deposited" }, base())
check("Fee detail rows add up to the deposit KPI", near(sum(sampleFee.rows.map((row) => parseMoney(row.deposited))), kpi(all, "deposited"), kpi(all, "deposited") * 0.01))

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`)
if (failures > 0) process.exitCode = 1
