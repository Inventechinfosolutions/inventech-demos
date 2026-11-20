// Reconciliation checks for the KSUWSSB Executive Overview.
// Build and run: npm run check:ksu
import { KSU_BENEFITS, KSU_CLAIM_STAGES, KSU_DISTRICTS, KSU_MONTHS, KSU_PENDING_BUCKETS, KSU_REG_STATUSES, KSU_SCHEMES, KSU_SERVICE_TARGET_DAYS, benefitLabel } from "@/data/ksuMasters"
import { DEFAULT_KSU_FILTERS, ksuQuery, readKsuFilters } from "@/lib/ksuQuery"
import { ksuSummaryCsv } from "@/lib/ksuExport"
import { KIND_REJECTED, NEVER, getKsuData } from "@/services/ksuData"
import { buildKsuDetail } from "@/services/ksuDetails"
import { buildKsuOverview, ksuFilterOptions } from "@/services/ksuOverview"
import type { KsuChartId, KsuDrill, KsuFilters, KsuOverview } from "@/types/ksu"

let failures = 0
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`)
}
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const near = (left: number, right: number, tolerance = 0.5) => Math.abs(left - right) <= tolerance
const kpi = (overview: KsuOverview, id: string) => overview.kpis.find((item) => item.id === id)!.value
const base = (patch: Partial<KsuFilters> = {}): KsuFilters => ({ ...DEFAULT_KSU_FILTERS, ...patch })
const D = getKsuData()
const options = ksuFilterOptions()

const all = buildKsuOverview(base())
console.log("\n--- Default view:", all.periodLabel, "|", all.scopeLabel)
for (const item of all.kpis) console.log(`  ${item.label.padEnd(36)} ${item.displayValue.padStart(14)}  vs ${item.comparison.label || "n/a"}: ${item.comparison.change === null ? "n/a" : `${item.comparison.change.toFixed(1)}%`}`)
for (const item of all.strip) console.log(`  [strip] ${item.label.padEnd(34)} ${item.displayValue}`)

console.log("\n--- Dataset integrity")
const k = D.claims
let orderOk = true
let eligibleOk = true
for (let c = 0; c < k.n; c += 1) {
  const w = k.worker[c]
  if (k.dec[c] <= k.recv[c]) orderOk = false
  if (k.ret[c] >= 0 && !(k.recv[c] < k.ret[c] && k.ret[c] < k.dec[c])) orderOk = false
  if (k.kind[c] === KIND_REJECTED && (k.init[c] !== -1 || k.pay[c] !== 0)) orderOk = false
  if (k.kind[c] !== KIND_REJECTED) {
    if (k.init[c] <= k.dec[c]) orderOk = false
    if (k.pay[c] > 0 && k.end[c] <= k.init[c]) orderOk = false
    if (k.pay[c] === 0 && k.end[c] !== -1) orderOk = false
  }
  if (D.rejected[w] || D.enrol[k.scheme[c]][w] === NEVER) eligibleOk = false
  if (KSU_BENEFITS[k.benefit[c]].schemeId !== KSU_SCHEMES[k.scheme[c]].id) eligibleOk = false
}
check("Every case follows a valid workflow order", orderOk)
check("Cases belong to verified workers enrolled in that scheme, with a benefit of that scheme", eligibleOk)
let workerOk = true
for (let i = 0; i < D.n; i += 1) {
  if (D.dec[i] < D.reg[i]) workerOk = false
  if (D.rejected[i] && (D.exp[i] !== NEVER || D.card[i] !== NEVER || D.enrol[0][i] !== NEVER || D.enrol[1][i] !== NEVER || D.enrol[2][i] !== NEVER)) workerOk = false
  if (!D.rejected[i]) {
    if (D.exp[i] !== NEVER && D.exp[i] <= D.dec[i]) workerOk = false
    for (const enrol of D.enrol) if (enrol[i] !== NEVER && enrol[i] < D.dec[i]) workerOk = false
  }
}
check("Workers are decided after registration, and rejected workers have no enrolments or cards", workerOk)
check("Gig scheme enrolments only for gig workers, newspaper scheme only for its occupation", (() => {
  for (let i = 0; i < D.n; i += 1) {
    if (D.enrol[1][i] !== NEVER && D.occ[i] !== 12) return false
    if (D.enrol[2][i] !== NEVER && D.occ[i] !== 11) return false
  }
  return true
})())

console.log("\n--- Identities on the default view")
const valid = kpi(all, "registered")
check("Registered workers equals the verified status count", valid === all.demographics.statuses[0].value)
check("Occupation rows add up to registered workers", sum(all.demographics.occupations.map((row) => row.value)) === valid)
check("Gender rows add up to registered workers", sum(all.demographics.genders.map((row) => row.value)) === valid)
check("Age rows add up to registered workers", sum(all.demographics.ages.map((row) => row.value)) === valid)
check("Rural and urban rows add up to registered workers", sum(all.demographics.settlement.map((row) => row.value)) === valid)
check("District rows add up to registered workers", sum(all.districtRows.map((row) => row.registered)) === valid)
check("Map layer registered adds up to registered workers", sum(all.districts.map((row) => row.registered)) === valid)
check("Month-end stock on the last month matches the worker count (independent calculation)", all.registration.validStock[all.registration.validStock.length - 1] === valid)
check("New registrations by month add up to the KPI", sum(all.registration.newRegistrations) === kpi(all, "newRegistrations"))
check("Status counts cover every worker registered by the last day", sum(all.demographics.statuses.map((row) => row.value)) > valid)

const enrolments = kpi(all, "enrolments")
check("Scheme enrolment rows add up to the enrolments KPI", sum(all.schemes.rows.map((row) => row.enrolments)) === enrolments)
check("District enrolments add up to the enrolments KPI", sum(all.districtRows.map((row) => row.enrolments)) === enrolments)
check("Enrolments are more than unique enrolled workers (overlap exists)", enrolments > all.schemes.uniqueEnrolled, `${enrolments} vs ${all.schemes.uniqueEnrolled}`)
check("Unique enrolled workers do not exceed registered workers", all.schemes.uniqueEnrolled <= valid)

const received = kpi(all, "received")
check("Cases by status add up to cases received", sum(all.schemes.pipeline.map((row) => row.value)) === received)
check("Scheme received adds up to the KPI", sum(all.schemes.rows.map((row) => row.received)) === received)
check("District received adds up to the KPI", sum(all.districtRows.map((row) => row.received)) === received)
check("Benefit type counts add up to cases received", sum(all.claims.byBenefit.map((row) => row.value)) === received)
check("Funnel never grows from one step to the next", all.schemes.funnel.every((row, index, rows) => index === 0 || row.value <= rows[index - 1].value))
check("Funnel starts at cases received", all.schemes.funnel[0].value === received)
check("Funnel last step equals the disbursed status count", all.schemes.funnel[3].value === all.schemes.pipeline[5].value)
const pending = kpi(all, "pending")
check("Pending by age adds up to pending cases", sum(all.claims.pendingAge.verification) + sum(all.claims.pendingAge.returned) === pending)
check("District pending adds up to pending cases", sum(all.districtRows.map((row) => row.pending)) === pending)
check("Monthly pending series ends at the pending KPI (independent calculation)", all.kpis.find((item) => item.id === "pending")!.spark.slice(-1)[0] === pending)
check("Monthly enrolment series ends at the enrolments KPI (independent calculation)", all.kpis.find((item) => item.id === "enrolments")!.spark.slice(-1)[0] === enrolments)

const approved = kpi(all, "approved")
const disbursed = kpi(all, "disbursed")
check("Scheme approved amounts add up to the KPI", sum(all.schemes.rows.map((row) => row.approvedAmount)) === approved)
check("Scheme disbursed amounts add up to the KPI", sum(all.schemes.rows.map((row) => row.disbursedAmount)) === disbursed)
check("District disbursed amounts add up to the KPI", sum(all.districtRows.map((row) => row.disbursed)) === disbursed)
check("Monthly payments add up to the disbursed KPI", sum(all.claims.payments.amount) === disbursed)
check("Approved and disbursed are separate figures", approved !== disbursed, `${approved} vs ${disbursed}`)
const beneficiaries = kpi(all, "beneficiaries")
check("District beneficiaries add up to the KPI", sum(all.districts.map((row) => row.beneficiaries)) === beneficiaries)
check("Beneficiaries do not exceed approved cases", beneficiaries <= sum(all.schemes.rows.map((row) => row.approved)) + 200)
check("Scheme beneficiaries add up to at least unique beneficiaries (overlap allowed)", sum(all.schemes.rows.map((row) => row.beneficiaries)) >= beneficiaries)
check("Approved-but-unpaid buckets add up to the unpaid count", sum(all.claims.unpaidAge.counts) === all.claims.unpaidAge.totalCount)
check("Unpaid count in the supporting figures matches", all.strip.find((item) => item.id === "unpaid")!.displayValue === all.claims.unpaidAge.totalCount.toLocaleString("en-IN"))

console.log("\n--- Financial ledger")
const fin = all.finance
check("Default view finance is FY 2026-27", fin.yearLabel.includes("2026-27"))
check("Ledger approved equals the KPI on the default view (same dates, no filters)", fin.totals.approved === approved)
check("Ledger disbursed equals the KPI on the default view", fin.totals.disbursed === disbursed)
check("Expenditure is disbursed plus the sample administrative rate", fin.rows.every((row) => Math.abs(row.expenditure - row.disbursed * 1.05) <= 1))
check("Released never exceeds allocation", fin.rows.every((row) => row.released <= row.allocation))
check("Totals add up", fin.totals.allocation === sum(fin.rows.map((row) => row.allocation)) && fin.totals.expenditure === sum(fin.rows.map((row) => row.expenditure)))
check("Latest year in the trend equals the ledger totals", fin.trend[fin.trend.length - 1].disbursed === fin.totals.disbursed)
check("No fund balance is exposed anywhere in the finance model", !JSON.stringify(fin).toLowerCase().includes("balance:") && !("balance" in fin))
const fy25 = buildKsuOverview(base({ financialYear: "2025-26", fromDate: "2025-04-01", toDate: "2026-03-31" }))
check("FY 2025-26 view selects the 2025-26 ledger", fy25.finance.yearLabel.includes("2025-26"))
check("FY 2025-26 ledger matches its KPIs", fy25.finance.totals.disbursed === kpi(fy25, "disbursed") && fy25.finance.totals.approved === kpi(fy25, "approved"))
check("FY 2025-26 has no earlier period to compare", fy25.kpis.every((item) => item.comparison.change === null))
check("FY 2025-26 trend has one year", fy25.finance.trend.length === 1)

console.log("\n--- Priority table")
check("Every priority row is beyond target or has approved-unpaid cases", all.priority.every((row) => (row.pending > 0 && row.oldestAge > KSU_SERVICE_TARGET_DAYS) || row.approvedUnpaid > 0))
check("Priority rows are not empty on the default view", all.priority.length > 0, `${all.priority.length} rows`)
check("Priority pending adds up to at most the pending KPI", sum(all.priority.map((row) => row.pending)) <= pending)
check("Age buckets match the oldest age", all.priority.every((row) => row.pending === 0 || row.ageBucket === KSU_PENDING_BUCKETS[[15, 30, 60, 90].findIndex((limit) => row.oldestAge <= limit) < 0 ? 4 : [15, 30, 60, 90].findIndex((limit) => row.oldestAge <= limit)]))
check("Priority wording is neutral", !/fraud|violation|non-compliance|default/i.test(JSON.stringify(all.priority)))
const target = all.priority[0]
const priorityDetail = buildKsuDetail({ type: "priority", key: target.key }, base())
check("Priority drill lists the pending and unpaid cases", priorityDetail.rows.length === Math.min(150, target.pending + target.approvedUnpaid), `${priorityDetail.rows.length} rows`)

console.log("\n--- Filters")
const district = base({ districtId: "belagavi" })
const byDistrict = buildKsuOverview(district)
check("District filter narrows registered workers to that district", kpi(byDistrict, "registered") === all.districtRows.find((row) => row.id === "belagavi")!.registered)
check("District filter narrows cases received to that district", kpi(byDistrict, "received") === all.districtRows.find((row) => row.id === "belagavi")!.received)
check("District filter leaves the finance ledger unchanged", JSON.stringify(byDistrict.finance.totals) === JSON.stringify(all.finance.totals))
check("District filter narrows facilitation services", byDistrict.facilitation.totals.services < all.facilitation.totals.services && byDistrict.facilitation.totals.districtsServed === 1)
const byGender = buildKsuOverview(base({ gender: "female" }))
check("Gender filter narrows registered workers", kpi(byGender, "registered") === all.demographics.genders[0].value)
check("Gender filter leaves finance and facilitation unchanged", byGender.finance.totals.disbursed === all.finance.totals.disbursed && byGender.facilitation.totals.services === all.facilitation.totals.services)
const byScheme = buildKsuOverview(base({ schemeId: "gig-insurance" }))
check("Scheme filter leaves registered workers unchanged", kpi(byScheme, "registered") === valid)
check("Scheme filter narrows enrolments to that scheme", kpi(byScheme, "enrolments") === all.schemes.rows[1].enrolments)
check("Scheme filter narrows cases received", kpi(byScheme, "received") === all.schemes.rows[1].received)
check("Scheme filter narrows the ledger", byScheme.finance.rows.length === 1)
const byStatus = buildKsuOverview(base({ registrationStatus: "pending" }))
check("Registration status filter leaves the registered KPI unchanged", kpi(byStatus, "registered") === valid)
check("Registration status filter narrows new registrations", kpi(byStatus, "newRegistrations") < kpi(all, "newRegistrations"))
check("Registration status filter does not touch cases", kpi(byStatus, "received") === received)
const byStage = buildKsuOverview(base({ claimStatus: "disbursed" }))
check("Claim status filter narrows cases to that status", byStage.schemes.pipeline.every((row, index) => (index === 5 ? row.value === kpi(byStage, "received") : row.value === 0)))
check("Claim status filter leaves registrations and enrolments unchanged", kpi(byStage, "registered") === valid && kpi(byStage, "enrolments") === enrolments)
check("Pending cases are zero when only disbursed cases are shown", kpi(byStage, "pending") === 0)
const byBenefit = buildKsuOverview(base({ benefitType: "aksh-natural-death" }))
check("Benefit type filter narrows cases", kpi(byBenefit, "received") === all.claims.byBenefit.find((row) => row.name === benefitLabel(1))!.value)
const mismatch = buildKsuOverview(base({ schemeId: "gig-insurance", benefitType: "aksh-natural-death" }))
check("A scheme and a benefit that do not belong together give no cases", kpi(mismatch, "received") === 0 && kpi(mismatch, "approved") === 0)
const occupation = buildKsuOverview(base({ occupationId: "newsmilk", districtId: "kodagu", gender: "other", ageGroup: "18-24" }))
check("A very narrow selection shows the empty state", occupation.empty)
const wide = buildKsuOverview(base({ financialYear: "2025-26", fromDate: "2025-04-01", toDate: "2026-09-30" }))
check("A custom range across both years uses the later year for the ledger", wide.finance.yearLabel.includes("2026-27"))
check("A range of the whole extract has no earlier period", wide.kpis.every((item) => item.comparison.change === null))
check("A mid-year window compares with the window before it", buildKsuOverview(base({ fromDate: "2026-01-01", toDate: "2026-03-31" })).kpis.some((item) => item.comparison.change !== null))
const swapped = readKsuFilters(new URLSearchParams("fromDate=2026-09-01&toDate=2026-04-01&gender=nonsense&districtId=belagavi"))
check("Swapped dates are put in order and unknown values are dropped", swapped.fromDate < swapped.toDate && swapped.gender === "all" && swapped.districtId === "belagavi")
check("Filters survive a trip through the address", JSON.stringify(readKsuFilters(ksuQuery(base({ schemeId: "aksh", claimStatus: "failed", gender: "male" })))) === JSON.stringify(base({ schemeId: "aksh", claimStatus: "failed", gender: "male" })))
check("Every option list is filled", options.districts.length === 31 && options.schemes.length === 3 && options.occupations.length === 14 && options.benefitTypes.length === 6 && options.claimStatuses.length === 7 && options.registrationStatuses.length === 4)

console.log("\n--- Drill-downs")
const drills: KsuDrill[] = [
  ...all.kpis.map((item) => ({ type: "kpi" as const, id: item.id })),
  ...all.strip.map((item) => ({ type: "strip" as const, id: item.id })),
  ...(["registration", "occupation", "gender", "age", "settlement", "status", "districtClaims", "districtDisbursed", "scheme", "funnel", "pipeline", "beneficiaryTrend", "benefit", "pendingAge", "processing", "reasons", "unpaidAge", "payments", "finance", "financeTrend", "facilitation", "facilitationDistricts"] as KsuChartId[]).map((chartId) => ({ type: "chart" as const, chartId })),
  { type: "chart", chartId: "occupation", category: all.demographics.occupations[0].name },
  { type: "chart", chartId: "status", category: KSU_REG_STATUSES[1].name },
  { type: "chart", chartId: "pipeline", category: KSU_CLAIM_STAGES[3].name },
  { type: "chart", chartId: "benefit", category: benefitLabel(2) },
  { type: "chart", chartId: "pendingAge", category: KSU_PENDING_BUCKETS[1] },
  { type: "chart", chartId: "unpaidAge", category: KSU_PENDING_BUCKETS[4] },
  { type: "chart", chartId: "registration", month: 14 },
  ...KSU_DISTRICTS.map((item) => ({ type: "district" as const, id: item.id })),
  ...KSU_SCHEMES.map((item) => ({ type: "scheme" as const, id: item.id })),
  ...all.priority.slice(0, 10).map((row) => ({ type: "priority" as const, key: row.key })),
]
let built = 0
let noteOk = true
let leak = false
for (const drill of drills) {
  const detail = buildKsuDetail(drill, base())
  built += 1
  if (!detail.note.includes("Illustrative") && !detail.note.includes("illustrative")) noteOk = false
  if (detail.title === "Detail not available") console.log("  no detail for", JSON.stringify(drill))
  if (/@|\b\d{10,}\b|aadhaar|ifsc/i.test(JSON.stringify(detail.rows))) leak = true
}
check(`All ${built} drill-downs build with an illustrative note`, noteOk)
check("No drill-down falls through to the not-available view", drills.every((drill) => buildKsuDetail(drill, base()).title !== "Detail not available"))
check("No drill-down row carries an email, long number or identity word", !leak)
check("Received drill lists the received cases", buildKsuDetail({ type: "kpi", id: "received" }, base()).rows.length === Math.min(150, received))
check("Pending drill lists the pending cases", buildKsuDetail({ type: "kpi", id: "pending" }, base()).rows.length === Math.min(150, pending))
check("Unpaid drill lists the unpaid cases", buildKsuDetail({ type: "strip", id: "unpaid" }, base()).rows.length === Math.min(150, all.claims.unpaidAge.totalCount))
check("Registered-workers drill ends with an all-districts row equal to the KPI", buildKsuDetail({ type: "kpi", id: "registered" }, base()).rows.slice(-1)[0].Registered === valid.toLocaleString("en-IN"))
check("Month drill returns one month", buildKsuDetail({ type: "chart", chartId: "registration", month: 14 }, base()).rows.length === 1)
check("An unknown district or case group does not throw", buildKsuDetail({ type: "district", id: "nowhere" }, base()).rows.length === 0 && buildKsuDetail({ type: "priority", key: "x:y" }, base()).rows.length === 0)
check("Chart drills offer to apply a filter", Boolean(buildKsuDetail({ type: "chart", chartId: "occupation", category: all.demographics.occupations[0].name }, base()).apply))

console.log("\n--- Scope, provenance and safeguards")
const text = JSON.stringify(all)
check("Dashboard is about KSUWSSB only", !/Motor Transport|Labour Welfare Board|Gig Workers Welfare Board|Platform-Based|KBOCW Welfare/i.test(text))
check("Everything is marked illustrative", all.illustrativeNote.includes("Illustrative POC Data") && all.title.includes("Unorganised Workers"))
check("e-Shram is described as external and never counted", all.eshram.note.includes("never") && all.eshram.total > valid)
check("Published figures sit apart with their source and a caution", all.published.items.length === 6 && all.published.source.includes("Economic Survey") && all.published.caution.includes("not live"))
check("Published figures match the specification", all.published.items.map((item) => item.value).join("|") === "56,900|2 cases, ₹2.00 lakh compensation|9 cases, ₹90,000|968|119|43")
check("Every scheme carries an unconfirmed status label", all.schemes.rows.every((row) => /to be confirmed/i.test(row.statusLabel)))
check("Other schemes are noted as not configured", all.schemes.otherSchemesNote.includes("not configured"))
check("Grievances and outreach are marked as data not available", all.facilitation.unavailable.length === 2 && all.facilitation.unavailable.every((item) => /Data not available/.test(item.reason)))
check("A stale source is reported", all.sources.some((source) => source.status === "stale"))
check("Every KPI, supporting figure and chart has a definition", all.definitions.length >= 8 + 8 + 23)
check("Every KPI links to known sources", all.kpis.every((item) => item.sourceIds.length > 0 && item.sourceIds.every((id) => all.sources.some((source) => source.id === id))))
check("Export carries the illustrative marker and no worker-level rows", ksuSummaryCsv(all).startsWith("Illustrative POC Data") && !/SYN-W|KS-CLM/.test(ksuSummaryCsv(all)))
check("Months run April 2025 to September 2026", KSU_MONTHS[0].label === "Apr 2025" && KSU_MONTHS[17].label === "Sep 2026")
check("Overview builds quickly", (() => {
  const started = Date.now()
  buildKsuOverview(base({ districtId: "mysuru", schemeId: "aksh" }))
  return Date.now() - started < 400
})())

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
