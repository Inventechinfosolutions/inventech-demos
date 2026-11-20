import labour from "@/data/labour-commissionerate.json" with { type: "json" }
import type { Aggregation, Dataset, DatasetField, Metric, RoleId, Unit } from "@/analytics/types"

// Metadata-driven definitions: analytics_datasets, analytics_dataset_fields and analytics_metrics.
// Nothing in the UI or the engine names a dataset or field directly. Everything is read from here.
//
// Every dataset is built from the figures behind one of the five department dashboards, so a total
// for the same scope and period matches that dashboard. No other source is used.

export const ILLUSTRATIVE_NOTE =
  "Illustrative data. This demonstration is not connected to Karnataka Government systems. Every dataset is built from the same figures as the five department dashboards, so a total for the same scope and period matches the dashboard."

export const BOARD = {
  labour: "Labour Commissionerate",
  welfare: "KBOCW Welfare Board",
  factories: "Factories & Boilers",
  gig: "Gig Workers Welfare Board",
  ksu: "Unorganised Workers Social Security Board",
} as const

export const DEPARTMENTS: string[] = Object.values(BOARD)

const labourDistricts = (labour as { districts: { id: string; name: string }[] }).districts
/** The thirty districts on the labour, welfare and factories dashboards, plus Vijayanagara, which the gig and KSUWSSB dashboards list on their own. */
export const DISTRICTS: { id: string; name: string }[] = [...labourDistricts, { id: "vijayanagara", name: "Vijayanagara" }]
export const DISTRICT_NAMES = DISTRICTS.map((district) => district.name)
export const FINANCIAL_YEARS = ["2023-24", "2024-25", "2025-26", "2026-27"]

// ---------------------------------------------------------------- governed metrics

const SUM_SET: Aggregation[] = ["sum", "avg", "min", "max"]
const SPREAD_SET: Aggregation[] = ["avg", "min", "max"]

const metric = (
  id: string,
  label: string,
  definition: string,
  unit: Unit,
  allowed: Aggregation[],
  defaultAggregation: Aggregation,
  owner: string,
  extra: Partial<Metric> = {},
): Metric => ({ id, label, definition, unit, allowed, defaultAggregation, additive: allowed.includes("sum"), owner, ...extra })

const YEAR_NOTE = "A financial year's figure repeats the register, so a total needs one financial year in scope."
const MONTH_NOTE = "It is counted at a point in time, so adding months repeats it. A total needs one month in scope."
const ratio = (id: string, label: string, definition: string, owner: string, unit: Unit = "percent"): Metric =>
  metric(id, label, definition, unit, [], "sum", owner, { additive: false })

const L = BOARD.labour
const W = BOARD.welfare
const F = BOARD.factories
const G = BOARD.gig
const K = BOARD.ksu

export const METRICS: Metric[] = [
  metric("records", "Record count", "Number of records in the selected dataset after filters. The record type differs by dataset.", "count", ["count"], "count", "Analytics"),

  // Labour Commissionerate
  metric("lab_establishments", "Registered establishments", `Establishments on the labour establishment register. The dashboard adds the monthly figures to give the financial year figure. ${YEAR_NOTE}`, "count", SUM_SET, "sum", L, { requiresSingleYear: true }),
  metric("lab_projects", "Active construction projects", `Ongoing construction projects on the labour project file. ${YEAR_NOTE}`, "count", SUM_SET, "sum", L, { requiresSingleYear: true }),
  metric("lab_inspections", "Inspections conducted", "Inspections recorded in the month.", "count", SUM_SET, "sum", L),
  metric("lab_violations", "Violations identified", "Findings recorded at inspection. A recorded finding is a potential exception until it is reviewed. It is not a confirmed violation.", "count", SUM_SET, "sum", L),
  metric("lab_pending", "Pending compliance cases", `Compliance cases still open. ${YEAR_NOTE}`, "count", SUM_SET, "sum", L, { requiresSingleYear: true }),
  metric("lab_new_reg", "New registrations", "Establishments newly registered in the month.", "count", SUM_SET, "sum", L),
  metric("lab_renewed_reg", "Renewed registrations", "Establishment registrations renewed in the month.", "count", SUM_SET, "sum", L),
  metric("lab_assessed", "Cess assessed", "Cess assessed at the assessment stage. Assessment and collection are separate stages and are never added together.", "inr", SUM_SET, "sum", L, { stage: "assessed" }),
  metric("lab_collected", "Cess collected", "Cess received at the collection stage, before remittance. Reported separately from cess assessed.", "inr", SUM_SET, "sum", L, { stage: "collected" }),
  ratio("lab_outstanding", "Outstanding assessed cess", "Cess assessed minus cess collected for the group. It is a gap between two stages, not an extra stage.", L, "inr"),
  ratio("lab_collection_rate", "Collection rate", "Cess collected as a percentage of cess assessed. Calculated from the totals of each group, never as an average of row rates.", L),
  ratio("lab_violation_rate", "Violations per inspection", "Violations identified as a percentage of inspections conducted. Calculated from group totals.", L),

  // KBOCW Welfare Board
  metric("wel_workers", "Registered workers", `Workers on the Board register. ${YEAR_NOTE}`, "count", SUM_SET, "sum", W, { requiresSingleYear: true }),
  metric("wel_renewals", "Membership renewals", "Memberships renewed in the month.", "count", SUM_SET, "sum", W),
  metric("wel_beneficiaries", "Beneficiaries", `People who received a benefit, each counted once. ${YEAR_NOTE}`, "count", SUM_SET, "sum", W, { requiresSingleYear: true }),
  metric("wel_applications", "Applications received", "Welfare applications received. Applications are counted apart from unique workers.", "count", SUM_SET, "sum", W),
  metric("wel_pending", "Applications pending", `Applications still open. ${YEAR_NOTE}`, "count", SUM_SET, "sum", W, { requiresSingleYear: true }),
  metric("wel_approved", "Assistance approved", "Assistance sanctioned. Approval is a decision and is shown on its own. It is not added to the amount disbursed.", "inr", SUM_SET, "sum", W, { stage: "approved" }),
  metric("wel_disbursed", "Amount disbursed", "Successful payments only. Failed and returned payments stay out of this figure.", "inr", SUM_SET, "sum", W, { stage: "disbursed" }),
  metric("wel_failed", "Failed or returned payments", "Payments that failed or were returned. They are kept apart from successful payments.", "count", SUM_SET, "sum", W),
  ratio("wel_disb_ratio", "Disbursed as a share of approved", "Amount disbursed as a percentage of assistance approved in the same scope. Payments can relate to earlier approvals, so this is a ratio of totals and not a completion rate.", W),
  metric("ws_under_verification", "Applications under verification", "Applications whose documents are being verified. Application statuses are separate, so they add up to applications received.", "count", SUM_SET, "sum", W),
  metric("ws_approved_apps", "Applications approved", "Applications with the status Approved on the Board's application file. Application statuses are separate.", "count", SUM_SET, "sum", W),
  metric("ws_payment_processing", "Payment processing", "Applications whose payment is being processed.", "count", SUM_SET, "sum", W),
  metric("ws_disbursed_apps", "Applications disbursed", "Applications whose payment has been made.", "count", SUM_SET, "sum", W),
  metric("ws_rejected", "Applications rejected", "Applications rejected after verification.", "count", SUM_SET, "sum", W),
  metric("ws_pending", "Applications pending (status)", "Applications with the status Pending.", "count", SUM_SET, "sum", W),
  metric(
    "ws_people",
    "People assisted",
    "People assisted under the scheme. A person who used more than one scheme is counted under each, so adding schemes repeats people. Only average, minimum and maximum are available.",
    "count",
    SPREAD_SET,
    "avg",
    W,
  ),
  metric("ws_allocated", "Funds allocated", "Funds allocated to the scheme for the financial year.", "inr", SUM_SET, "sum", W),

  // Factories & Boilers
  metric("fac_factories", "Registered factories", `Factories on the factories register. Other regulated establishments are a separate list. ${YEAR_NOTE}`, "count", SUM_SET, "sum", F, { requiresSingleYear: true }),
  metric("fac_active", "Active establishments", `Active factories plus other active regulated establishments. It is not the same count as registered factories. ${YEAR_NOTE}`, "count", SUM_SET, "sum", F, { requiresSingleYear: true }),
  metric("fac_inspections", "Inspections conducted", "Inspections recorded in the month.", "count", SUM_SET, "sum", F),
  metric("fac_pending", "Pending inspections", `Inspections planned and not yet carried out. ${YEAR_NOTE}`, "count", SUM_SET, "sum", F, { requiresSingleYear: true }),
  metric("fac_violations", "Safety violations", "Violations recorded at inspection. A violation stays open until a closure is recorded.", "count", SUM_SET, "sum", F),
  metric("fac_cases", "Open compliance cases", `Cases with no recorded closure. ${YEAR_NOTE}`, "count", SUM_SET, "sum", F, { requiresSingleYear: true }),
  metric("fac_accidents", "Reported accidents", "Accident events reported in the month.", "count", SUM_SET, "sum", F),
  metric("fac_boilers", "Registered boilers", `Boilers on the boiler register. ${YEAR_NOTE}`, "count", SUM_SET, "sum", F, { requiresSingleYear: true }),
  metric("fac_boilers_due", "Boiler inspections due", `Registered boilers whose inspection is due. ${YEAR_NOTE}`, "count", SUM_SET, "sum", F, { requiresSingleYear: true }),
  ratio("fac_violation_rate", "Violations per inspection", "Safety violations as a percentage of inspections conducted. Calculated from group totals.", F),
  metric("fc_factories", "Registered factories", "Factories on the factories register in the category.", "count", SUM_SET, "sum", F),
  metric("fc_active_factories", "Active factories", "Registered factories that are active.", "count", SUM_SET, "sum", F),
  metric("fc_active_other", "Other active establishments", "Other regulated establishments that are active. They are not factories.", "count", SUM_SET, "sum", F),
  metric("fc_pending", "Pending inspections", "Inspections planned and not yet carried out.", "count", SUM_SET, "sum", F),
  metric("fc_injuries", "Injuries", "Injuries recorded in accidents.", "count", SUM_SET, "sum", F),
  metric("fc_fatalities", "Fatalities", "Deaths recorded in accidents.", "count", SUM_SET, "sum", F),
  metric("fc_boilers", "Registered boilers", "Boilers on the boiler register.", "count", SUM_SET, "sum", F),
  metric("fc_boilers_due", "Boiler inspections due", "Registered boilers whose inspection is due.", "count", SUM_SET, "sum", F),

  // Gig Workers Welfare Board
  metric("gig_records", "Records received", "Records received from aggregators. This is not a count of unique workers.", "count", SUM_SET, "sum", G),
  metric("gig_added", "New Board registrations", "Workers newly registered with the Board in the month.", "count", SUM_SET, "sum", G),
  metric("gig_separated", "Workers separated", "Workers separated or deactivated in the month.", "count", SUM_SET, "sum", G),
  metric("gig_unique", "Registered workers", `Distinct workers with a valid Board ID at the end of the month. A worker on several platforms is counted once. ${MONTH_NOTE}`, "count", SUM_SET, "sum", G, { requiresSingleMonth: true }),
  metric("gig_active", "Active workers", `Distinct workers with a reported payout in the month. The activity rule is a placeholder until the Board approves one. ${MONTH_NOTE}`, "count", SUM_SET, "sum", G, { requiresSingleMonth: true }),
  metric("gig_aggregators", "Reporting aggregators", `Aggregators that sent data in the month. ${MONTH_NOTE}`, "count", SUM_SET, "sum", G, { requiresSingleMonth: true }),
  metric("gig_payouts", "Worker payouts", "Final payouts to workers reported by aggregators, in rupees.", "inr", SUM_SET, "sum", G),
  metric("gig_transactions", "Payout transactions", "Payout transactions reported by aggregators in the month.", "count", SUM_SET, "sum", G),
  metric("gig_fee_payable", "Welfare fee payable", "Fee due on payouts at the configured rates. Payable, declared, deposited and reconciled are separate stages and are not added together.", "inr", SUM_SET, "sum", G, { stage: "payable" }),
  metric("gig_fee_declared", "Welfare fee declared", "Fee declared by the aggregator in its return.", "inr", SUM_SET, "sum", G, { stage: "declared" }),
  metric("gig_fee_deposited", "Welfare fee deposited", "Verified welfare fee deposits.", "inr", SUM_SET, "sum", G, { stage: "deposited" }),
  metric("gig_fee_reconciled", "Welfare fee reconciled", "Deposits matched to the declared fee.", "inr", SUM_SET, "sum", G, { stage: "reconciled" }),
  metric("gig_fee_shortfall", "Fee shortfall", "Where the welfare fee deposited falls short of the fee payable, the shortfall. Deposits above the fee payable are not netted off, so this is not simply payable minus deposited.", "inr", SUM_SET, "sum", G),
  metric("gig_fund_receipts", "Welfare fund receipts", "Money received into the welfare fund in the month.", "inr", SUM_SET, "sum", G),
  metric("gig_fund_expenditure", "Welfare fund expenditure", "Money spent from the welfare fund in the month.", "inr", SUM_SET, "sum", G),
  metric("gig_fund_balance", "Welfare fund balance", `Closing balance of the welfare fund from the ledger. ${MONTH_NOTE}`, "inr", SUM_SET, "sum", G, { requiresSingleMonth: true }),
  metric("gig_benefits", "Welfare benefits disbursed", "Successful benefit payments only. Approved or initiated payments are not counted as disbursed.", "inr", SUM_SET, "sum", G),
  metric("gig_grievances", "Grievances", "Grievances raised in the month.", "count", SUM_SET, "sum", G),
  metric("gig_fatal", "Fatal accidents", "Accidents recorded as fatal in the month.", "count", SUM_SET, "sum", G),
  metric("gig_nonfatal", "Non-fatal accidents", "Accidents recorded as non-fatal in the month.", "count", SUM_SET, "sum", G),
  metric("gig_claims_initiated", "Claims initiated", "Accident claims started in the month.", "count", SUM_SET, "sum", G),
  metric("gig_claims_settled", "Claims settled", "Accident claims settled in the month.", "count", SUM_SET, "sum", G),
  metric(
    "gig_agg_workers",
    "Unique workers",
    "Unique workers counted once for an aggregator in the month. A worker on several platforms is counted under each, and a worker seen in several months is counted in each, so adding rows repeats workers. Only average, minimum and maximum are available.",
    "count",
    SPREAD_SET,
    "avg",
    G,
  ),

  // Unorganised Workers Social Security Board
  metric("ksu_registered", "Registered workers", `Distinct workers whose registration is verified and has not lapsed on the last day of the month. ${MONTH_NOTE}`, "count", SUM_SET, "sum", K, { requiresSingleMonth: true }),
  metric("ksu_new", "New registrations", "New unique registrations received in the month, whatever their verification status.", "count", SUM_SET, "sum", K),
  metric("ksu_enrolments", "Scheme enrolments", `Active scheme enrolments on the last day of the month. A worker enrolled in two schemes counts twice, so this is not a count of workers. ${MONTH_NOTE}`, "count", SUM_SET, "sum", K, { requiresSingleMonth: true }),
  metric("ksu_beneficiaries", "Verified beneficiaries", `Distinct workers with at least one approved benefit decided in the month. ${MONTH_NOTE}`, "count", SUM_SET, "sum", K, { requiresSingleMonth: true }),
  metric("ksu_received", "Applications and claims received", "Applications and claims received in the month. Each is one case, so a worker with two cases counts twice.", "count", SUM_SET, "sum", K),
  metric("ksu_pending", "Pending applications and claims", `Cases received on or before the last day that are still waiting for a decision or for correction. ${MONTH_NOTE}`, "count", SUM_SET, "sum", K, { requiresSingleMonth: true }),
  metric("ksu_approved", "Benefits approved", "Value of benefits approved in the month. Approval is a decision, not a payment.", "inr", SUM_SET, "sum", K, { stage: "approved" }),
  metric("ksu_disbursed", "Benefits disbursed", "Value of payments that completed successfully in the month. Initiated, failed and returned payments are left out.", "inr", SUM_SET, "sum", K, { stage: "disbursed" }),
  metric("ksu_approved_cases", "Cases approved", "Applications and claims approved in the month.", "count", SUM_SET, "sum", K),
  metric("ksu_paid_cases", "Cases paid", "Approved cases whose payment completed successfully in the month.", "count", SUM_SET, "sum", K),
]

export const metricById = (id: string) => METRICS.find((item) => item.id === id)

// ---------------------------------------------------------------- field helpers

const dim = (id: string, label: string, description: string, extra: Partial<DatasetField> = {}): DatasetField => ({
  id,
  label,
  kind: "dimension",
  dataType: "string",
  description,
  groupable: true,
  unit: "text",
  ...extra,
})

const meas = (id: string, label: string, description: string, metricId: string, unit: Unit): DatasetField => ({
  id,
  label,
  kind: "measure",
  dataType: "number",
  description,
  metricId,
  unit,
})

const date = (id: string, label: string, description: string): DatasetField => ({
  id,
  label,
  kind: "date",
  dataType: "date",
  description,
  groupable: true,
  unit: "date",
})

const calc = (id: string, label: string, description: string, metricId: string, unit: Unit, rule: Pick<DatasetField, "ratio" | "difference">): DatasetField => ({
  id,
  label,
  kind: "calculated",
  dataType: "number",
  description,
  metricId,
  unit,
  ...rule,
})

const department = () => dim("department", "Department", "Board or office that owns the figures.", { conformed: true })
const district = () => dim("district", "District", "District of the figures.", { conformed: true })
const financialYear = () => dim("financial_year", "Financial year", "Financial year from 1 April to 31 March.", { conformed: true })
const month = () => date("period", "Month", "Calendar month of the figures.")

const DISTRICT_DRILL = ["district"]
const TIME_DRILL = ["financial_year", "period"]

const ALL_ROLES: RoleId[] = ["secretary", "analyst"]
const access = (...roles: RoleId[]) => ({ roles: [...ALL_ROLES, ...roles], recordDetail: [...ALL_ROLES, ...roles] })

const SYNC = {
  labour: "2026-11-18T09:30:00+05:30",
  gig: "2026-10-06T09:30:00+05:30",
  ksu: "2026-10-05T08:30:00+05:30",
}

// ---------------------------------------------------------------- datasets

export const DATASETS: Dataset[] = [
  // Labour Commissionerate
  {
    id: "labour_monthly",
    name: "Labour Register by District and Month",
    description: "Establishments, projects, inspections, compliance and cess for each district and month, as the Labour Commissionerate dashboard counts them. Cess assessment and collection are separate columns.",
    sourceDepartment: L,
    sourceSystem: "Labour Commissionerate dashboard figures (illustrative)",
    freshness: "Daily refresh",
    lastSync: SYNC.labour,
    grain: "One row per district per month",
    recordLabel: "District months",
    primaryDate: "period",
    pii: false,
    access: access("labour", "district"),
    scope: { district: "district", department: "department" },
    drill: [DISTRICT_DRILL, TIME_DRILL],
    defaultDimension: "district",
    fields: [
      department(),
      district(),
      financialYear(),
      month(),
      meas("establishments", "Registered establishments", "Establishments on the labour register.", "lab_establishments", "count"),
      meas("projects", "Active construction projects", "Ongoing construction projects.", "lab_projects", "count"),
      meas("inspections", "Inspections conducted", "Inspections recorded.", "lab_inspections", "count"),
      meas("violations", "Violations identified", "Findings recorded at inspection.", "lab_violations", "count"),
      meas("pending_cases", "Pending compliance cases", "Compliance cases still open.", "lab_pending", "count"),
      meas("new_registrations", "New registrations", "Establishments newly registered.", "lab_new_reg", "count"),
      meas("renewed_registrations", "Renewed registrations", "Registrations renewed.", "lab_renewed_reg", "count"),
      meas("cess_assessed", "Cess assessed", "Assessment stage, in rupees.", "lab_assessed", "inr"),
      meas("cess_collected", "Cess collected", "Collection stage, in rupees.", "lab_collected", "inr"),
      calc("outstanding_cess", "Outstanding assessed cess", "Cess assessed minus cess collected.", "lab_outstanding", "inr", { difference: { minuend: "cess_assessed", subtrahend: "cess_collected" } }),
      calc("collection_rate", "Collection rate", "Cess collected as a percentage of cess assessed.", "lab_collection_rate", "percent", { ratio: { numerator: "cess_collected", denominator: "cess_assessed", scale: 100 } }),
      calc("violation_rate", "Violations per inspection", "Violations as a percentage of inspections.", "lab_violation_rate", "percent", { ratio: { numerator: "violations", denominator: "inspections", scale: 100 } }),
    ],
  },
  {
    id: "labour_projects",
    name: "Labour Projects by District and Category",
    description: "Active construction projects in each district split by project category, using the category mix on the Labour Commissionerate dashboard.",
    sourceDepartment: L,
    sourceSystem: "Labour Commissionerate dashboard figures (illustrative)",
    freshness: "Daily refresh",
    lastSync: SYNC.labour,
    grain: "One row per district, category and financial year",
    recordLabel: "District categories",
    pii: false,
    access: access("labour", "district"),
    scope: { district: "district", department: "department" },
    drill: [DISTRICT_DRILL, ["financial_year"], ["category"]],
    defaultDimension: "category",
    fields: [
      department(),
      district(),
      dim("category", "Project category", "Type of construction work."),
      financialYear(),
      meas("projects", "Active construction projects", "Ongoing construction projects in the category.", "lab_projects", "count"),
    ],
  },

  // KBOCW Welfare Board
  {
    id: "welfare_monthly",
    name: "Welfare Register by District and Month",
    description: "Registered workers, renewals, beneficiaries, applications, assistance approved and amount disbursed for each district and month, as the KBOCW Welfare Board dashboard counts them. Approved and disbursed amounts are separate columns.",
    sourceDepartment: W,
    sourceSystem: "KBOCW Welfare Board dashboard figures (illustrative)",
    freshness: "Daily refresh",
    lastSync: SYNC.labour,
    grain: "One row per district per month",
    recordLabel: "District months",
    primaryDate: "period",
    pii: false,
    access: access("welfare", "district"),
    scope: { district: "district", department: "department" },
    drill: [DISTRICT_DRILL, TIME_DRILL],
    defaultDimension: "district",
    fields: [
      department(),
      district(),
      financialYear(),
      month(),
      meas("workers", "Registered workers", "Workers on the Board register.", "wel_workers", "count"),
      meas("renewals", "Membership renewals", "Memberships renewed.", "wel_renewals", "count"),
      meas("beneficiaries", "Beneficiaries", "People who received a benefit.", "wel_beneficiaries", "count"),
      meas("applications", "Applications received", "Welfare applications received.", "wel_applications", "count"),
      meas("pending_applications", "Applications pending", "Applications still open.", "wel_pending", "count"),
      meas("assistance_approved", "Assistance approved", "Approval stage, in rupees.", "wel_approved", "inr"),
      meas("assistance_disbursed", "Amount disbursed", "Successful payments, in rupees.", "wel_disbursed", "inr"),
      meas("failed_payments", "Failed or returned payments", "Payments that failed or were returned.", "wel_failed", "count"),
      calc("disbursed_share", "Disbursed as a share of approved", "Amount disbursed as a percentage of assistance approved.", "wel_disb_ratio", "percent", { ratio: { numerator: "assistance_disbursed", denominator: "assistance_approved", scale: 100 } }),
    ],
  },
  {
    id: "welfare_schemes",
    name: "Welfare Schemes",
    description: "Applications by status, people assisted, assistance approved and disbursed, and funds allocated for each welfare scheme in financial year 2025-26, as on the KBOCW Welfare Board dashboard.",
    sourceDepartment: W,
    sourceSystem: "KBOCW Welfare Board dashboard figures (illustrative)",
    freshness: "Daily refresh",
    lastSync: SYNC.labour,
    grain: "One row per scheme",
    recordLabel: "Schemes",
    pii: false,
    access: access("welfare"),
    scope: { department: "department" },
    drill: [["scheme"]],
    defaultDimension: "scheme",
    fields: [
      department(),
      dim("scheme", "Scheme", "Welfare scheme.", { conformed: true }),
      financialYear(),
      meas("applications", "Applications received", "Applications received under the scheme.", "wel_applications", "count"),
      meas("disbursed_applications", "Applications disbursed", "Applications whose payment has been made.", "ws_disbursed_apps", "count"),
      meas("approved_applications", "Applications approved", "Applications with the status Approved.", "ws_approved_apps", "count"),
      meas("payment_processing", "Payment processing", "Applications whose payment is being processed.", "ws_payment_processing", "count"),
      meas("pending", "Applications pending", "Applications with the status Pending.", "ws_pending", "count"),
      meas("under_verification", "Applications under verification", "Applications being verified.", "ws_under_verification", "count"),
      meas("rejected", "Applications rejected", "Applications rejected.", "ws_rejected", "count"),
      meas("people_assisted", "People assisted", "People assisted under the scheme.", "ws_people", "count"),
      meas("approved_rupees", "Assistance approved", "Approval stage, in rupees.", "wel_approved", "inr"),
      meas("disbursed_rupees", "Amount disbursed", "Successful payments, in rupees.", "wel_disbursed", "inr"),
      meas("allocated_rupees", "Funds allocated", "Funds allocated to the scheme.", "ws_allocated", "inr"),
    ],
  },

  // Factories & Boilers
  {
    id: "factories_monthly",
    name: "Factories Register by District and Month",
    description: "Factories, inspections, violations, accidents and boilers for each district and month, as the Factories & Boilers dashboard counts them.",
    sourceDepartment: F,
    sourceSystem: "Factories & Boilers dashboard figures (illustrative)",
    freshness: "Daily refresh",
    lastSync: SYNC.labour,
    grain: "One row per district per month",
    recordLabel: "District months",
    primaryDate: "period",
    pii: false,
    access: access("factories", "district"),
    scope: { district: "district", department: "department" },
    drill: [DISTRICT_DRILL, TIME_DRILL],
    defaultDimension: "district",
    fields: [
      department(),
      district(),
      financialYear(),
      month(),
      meas("factories", "Registered factories", "Factories on the factories register.", "fac_factories", "count"),
      meas("active_establishments", "Active establishments", "Active factories and other regulated establishments.", "fac_active", "count"),
      meas("inspections", "Inspections conducted", "Inspections recorded.", "fac_inspections", "count"),
      meas("pending_inspections", "Pending inspections", "Inspections not yet carried out.", "fac_pending", "count"),
      meas("violations", "Safety violations", "Violations recorded at inspection.", "fac_violations", "count"),
      meas("open_cases", "Open compliance cases", "Cases with no recorded closure.", "fac_cases", "count"),
      meas("accidents", "Reported accidents", "Accident events reported.", "fac_accidents", "count"),
      meas("boilers", "Registered boilers", "Boilers on the boiler register.", "fac_boilers", "count"),
      meas("boilers_due", "Boiler inspections due", "Boilers whose inspection is due.", "fac_boilers_due", "count"),
      calc("violation_rate", "Violations per inspection", "Violations as a percentage of inspections.", "fac_violation_rate", "percent", { ratio: { numerator: "violations", denominator: "inspections", scale: 100 } }),
    ],
  },
  {
    id: "factories_categories",
    name: "Factories by Establishment Category",
    description: "Factories, inspections, violations, accidents and boilers for each establishment category in financial year 2025-26, as on the Factories & Boilers dashboard. Other regulated establishments are listed as their own category.",
    sourceDepartment: F,
    sourceSystem: "Factories & Boilers dashboard figures (illustrative)",
    freshness: "Daily refresh",
    lastSync: SYNC.labour,
    grain: "One row per establishment category",
    recordLabel: "Categories",
    pii: false,
    access: access("factories"),
    scope: { department: "department" },
    drill: [["category"]],
    defaultDimension: "category",
    fields: [
      department(),
      dim("category", "Establishment category", "Industry category of the establishment."),
      dim("category_kind", "Establishment type", "Factory, or other regulated establishment."),
      financialYear(),
      meas("factories", "Registered factories", "Factories on the register.", "fc_factories", "count"),
      meas("active_factories", "Active factories", "Registered factories that are active.", "fc_active_factories", "count"),
      meas("active_other", "Other active establishments", "Other regulated establishments that are active.", "fc_active_other", "count"),
      meas("inspections", "Inspections conducted", "Inspections recorded.", "fac_inspections", "count"),
      meas("pending", "Pending inspections", "Inspections not yet carried out.", "fc_pending", "count"),
      meas("violations", "Safety violations", "Violations recorded at inspection.", "fac_violations", "count"),
      meas("accidents", "Reported accidents", "Accident events reported.", "fac_accidents", "count"),
      meas("injuries", "Injuries", "Injuries recorded in accidents.", "fc_injuries", "count"),
      meas("fatalities", "Fatalities", "Deaths recorded in accidents.", "fc_fatalities", "count"),
      meas("boilers", "Registered boilers", "Boilers on the boiler register.", "fc_boilers", "count"),
      meas("boilers_due", "Boiler inspections due", "Boilers whose inspection is due.", "fc_boilers_due", "count"),
      calc("violation_rate", "Violations per inspection", "Violations as a percentage of inspections.", "fac_violation_rate", "percent", { ratio: { numerator: "violations", denominator: "inspections", scale: 100 } }),
    ],
  },

  // Gig Workers Welfare Board
  {
    id: "gig_monthly",
    name: "Gig Workers Board by Month",
    description: "Records, registrations, payouts, welfare fee stages, welfare fund, benefits and accidents for each month, as the Gig Workers Welfare Board dashboard counts them. Records are not unique workers, and the fee stages are separate columns.",
    sourceDepartment: G,
    sourceSystem: "Gig Workers Welfare Board dashboard figures (illustrative)",
    freshness: "Every two days",
    lastSync: SYNC.gig,
    grain: "One row per month, for all of Karnataka",
    recordLabel: "Months",
    primaryDate: "period",
    pii: false,
    access: access("gig"),
    scope: { department: "department" },
    drill: [TIME_DRILL],
    defaultDimension: "financial_year",
    fields: [
      department(),
      financialYear(),
      month(),
      meas("records", "Records received", "Records received from aggregators.", "gig_records", "count"),
      meas("added", "New Board registrations", "Workers newly registered.", "gig_added", "count"),
      meas("separated", "Workers separated", "Workers separated or deactivated.", "gig_separated", "count"),
      meas("unique_workers", "Registered workers", "Distinct workers with a valid Board ID at month end.", "gig_unique", "count"),
      meas("active_workers", "Active workers", "Distinct workers with a reported payout in the month.", "gig_active", "count"),
      meas("aggregators", "Reporting aggregators", "Aggregators that sent data.", "gig_aggregators", "count"),
      meas("payouts", "Worker payouts", "Payouts reported by aggregators, in rupees.", "gig_payouts", "inr"),
      meas("transactions", "Payout transactions", "Payout transactions reported.", "gig_transactions", "count"),
      meas("fee_payable", "Welfare fee payable", "Payable stage, in rupees.", "gig_fee_payable", "inr"),
      meas("fee_declared", "Welfare fee declared", "Declared stage, in rupees.", "gig_fee_declared", "inr"),
      meas("fee_deposited", "Welfare fee deposited", "Deposited stage, in rupees.", "gig_fee_deposited", "inr"),
      meas("fee_reconciled", "Welfare fee reconciled", "Reconciled stage, in rupees.", "gig_fee_reconciled", "inr"),
      meas("fund_receipts", "Welfare fund receipts", "Receipts into the welfare fund, in rupees.", "gig_fund_receipts", "inr"),
      meas("fund_expenditure", "Welfare fund expenditure", "Spending from the welfare fund, in rupees.", "gig_fund_expenditure", "inr"),
      meas("fund_balance", "Welfare fund balance", "Closing balance, in rupees.", "gig_fund_balance", "inr"),
      meas("benefits", "Welfare benefits disbursed", "Successful benefit payments, in rupees.", "gig_benefits", "inr"),
      meas("fatal_accidents", "Fatal accidents", "Accidents recorded as fatal.", "gig_fatal", "count"),
      meas("nonfatal_accidents", "Non-fatal accidents", "Accidents recorded as non-fatal.", "gig_nonfatal", "count"),
      meas("claims_initiated", "Claims initiated", "Accident claims started.", "gig_claims_initiated", "count"),
      meas("claims_settled", "Claims settled", "Accident claims settled.", "gig_claims_settled", "count"),
      meas("fee_shortfall", "Fee shortfall", "Where the fee deposited falls short of the fee payable, in rupees.", "gig_fee_shortfall", "inr"),
    ],
  },
  {
    id: "gig_districts",
    name: "Gig Workers by District and Month",
    description: "Registered and active workers, payouts, benefits and grievances for each district and month, as the Gig Workers Welfare Board dashboard counts them. Worker counts are taken at a point in time, so a total needs one month in scope.",
    sourceDepartment: G,
    sourceSystem: "Gig Workers Welfare Board dashboard figures (illustrative)",
    freshness: "Every two days",
    lastSync: SYNC.gig,
    grain: "One row per district per month",
    recordLabel: "District months",
    primaryDate: "period",
    pii: false,
    access: access("gig", "district"),
    scope: { district: "district", department: "department" },
    drill: [DISTRICT_DRILL, TIME_DRILL],
    defaultDimension: "district",
    fields: [
      department(),
      district(),
      financialYear(),
      month(),
      meas("unique_workers", "Registered workers", "Distinct workers with a valid Board ID at month end.", "gig_unique", "count"),
      meas("active_workers", "Active workers", "Distinct workers with a reported payout in the month.", "gig_active", "count"),
      meas("payouts", "Worker payouts", "Payouts reported by aggregators, in rupees.", "gig_payouts", "inr"),
      meas("benefits", "Welfare benefits disbursed", "Successful benefit payments, in rupees.", "gig_benefits", "inr"),
      meas("grievances", "Grievances", "Grievances raised.", "gig_grievances", "count"),
    ],
  },
  {
    id: "gig_aggregators",
    name: "Gig Aggregators by Month",
    description: "Records, workers reported, payouts and welfare fee for each aggregator and month, as the aggregator table on the Gig Workers Welfare Board dashboard. Fee payable and fee deposited are separate stages.",
    sourceDepartment: G,
    sourceSystem: "Gig Workers Welfare Board dashboard figures (illustrative)",
    freshness: "Every two days",
    lastSync: SYNC.gig,
    grain: "One row per aggregator per month",
    recordLabel: "Aggregator months",
    primaryDate: "period",
    pii: false,
    access: access("gig"),
    scope: { department: "department" },
    drill: [["aggregator"], TIME_DRILL],
    defaultDimension: "aggregator",
    fields: [
      department(),
      dim("aggregator", "Aggregator", "Platform that reports to the Board. Names are synthetic."),
      dim("sector", "Sector", "Sector the aggregator works in."),
      financialYear(),
      month(),
      meas("records", "Records received", "Records received from the aggregator.", "gig_records", "count"),
      meas("unique_workers", "Unique workers", "Unique workers counted once for the aggregator.", "gig_agg_workers", "count"),
      meas("payouts", "Worker payouts", "Payouts reported, in rupees.", "gig_payouts", "inr"),
      meas("fee_payable", "Welfare fee payable", "Payable stage, in rupees.", "gig_fee_payable", "inr"),
      meas("fee_deposited", "Welfare fee deposited", "Deposited stage, in rupees.", "gig_fee_deposited", "inr"),
      meas("fee_shortfall", "Fee shortfall", "Where the fee deposited falls short of the fee payable, in rupees.", "gig_fee_shortfall", "inr"),
    ],
  },

  // Unorganised Workers Social Security Board
  {
    id: "ksu_monthly",
    name: "Unorganised Workers Board by Month",
    description: "Registrations, scheme enrolments, applications and claims, approved benefits and disbursed benefits for each month, as the Unorganised Workers Social Security Board dashboard counts them. Approval and payment are separate columns.",
    sourceDepartment: K,
    sourceSystem: "Unorganised Workers Social Security Board dashboard figures (illustrative)",
    freshness: "Every two days",
    lastSync: SYNC.ksu,
    grain: "One row per month, for all of Karnataka",
    recordLabel: "Months",
    primaryDate: "period",
    pii: false,
    access: access("ksu"),
    scope: { department: "department" },
    drill: [TIME_DRILL],
    defaultDimension: "financial_year",
    fields: [
      department(),
      financialYear(),
      month(),
      meas("registered", "Registered workers", "Distinct workers with a valid registration on the last day.", "ksu_registered", "count"),
      meas("new_registrations", "New registrations", "Registrations received in the month.", "ksu_new", "count"),
      meas("enrolments", "Scheme enrolments", "Active scheme enrolments on the last day. Not a count of workers.", "ksu_enrolments", "count"),
      meas("beneficiaries", "Verified beneficiaries", "Distinct workers with an approved benefit in the month.", "ksu_beneficiaries", "count"),
      meas("received", "Applications and claims received", "Cases received in the month.", "ksu_received", "count"),
      meas("pending", "Pending applications and claims", "Cases still waiting on the last day.", "ksu_pending", "count"),
      meas("approved", "Benefits approved", "Approval stage, in rupees.", "ksu_approved", "inr"),
      meas("disbursed", "Benefits disbursed", "Payments completed, in rupees.", "ksu_disbursed", "inr"),
    ],
  },
  {
    id: "ksu_districts",
    name: "Unorganised Workers by District and Month",
    description: "Registered workers, scheme enrolments, verified beneficiaries, cases received, pending cases and benefits disbursed for each district and month, as on the Unorganised Workers Social Security Board dashboard. Counts taken at a point in time need one month in scope.",
    sourceDepartment: K,
    sourceSystem: "Unorganised Workers Social Security Board dashboard figures (illustrative)",
    freshness: "Every two days",
    lastSync: SYNC.ksu,
    grain: "One row per district per month",
    recordLabel: "District months",
    primaryDate: "period",
    pii: false,
    access: access("ksu", "district"),
    scope: { district: "district", department: "department" },
    drill: [DISTRICT_DRILL, TIME_DRILL],
    defaultDimension: "district",
    fields: [
      department(),
      district(),
      financialYear(),
      month(),
      meas("registered", "Registered workers", "Distinct workers with a valid registration on the last day.", "ksu_registered", "count"),
      meas("enrolments", "Scheme enrolments", "Active scheme enrolments on the last day. Not a count of workers.", "ksu_enrolments", "count"),
      meas("beneficiaries", "Verified beneficiaries", "Distinct workers with an approved benefit in the month.", "ksu_beneficiaries", "count"),
      meas("received", "Applications and claims received", "Cases received in the month.", "ksu_received", "count"),
      meas("pending", "Pending applications and claims", "Cases still waiting on the last day.", "ksu_pending", "count"),
      meas("disbursed", "Benefits disbursed", "Payments completed, in rupees.", "ksu_disbursed", "inr"),
    ],
  },
  {
    id: "ksu_schemes",
    name: "Unorganised Workers by Scheme and Month",
    description: "Scheme enrolments, cases received, approved and paid, verified beneficiaries and benefit amounts for each scheme and month, as on the Unorganised Workers Social Security Board dashboard. Scheme names and amounts are sample configuration.",
    sourceDepartment: K,
    sourceSystem: "Unorganised Workers Social Security Board dashboard figures (illustrative)",
    freshness: "Every two days",
    lastSync: SYNC.ksu,
    grain: "One row per scheme per month",
    recordLabel: "Scheme months",
    primaryDate: "period",
    pii: false,
    access: access("ksu"),
    scope: { department: "department" },
    drill: [["scheme"], TIME_DRILL],
    defaultDimension: "scheme",
    fields: [
      department(),
      dim("scheme", "Scheme", "Social security scheme. Names are sample configuration.", { conformed: true }),
      financialYear(),
      month(),
      meas("enrolments", "Scheme enrolments", "Active enrolments on the last day.", "ksu_enrolments", "count"),
      meas("received", "Applications and claims received", "Cases received in the month.", "ksu_received", "count"),
      meas("approved_cases", "Cases approved", "Cases approved in the month.", "ksu_approved_cases", "count"),
      meas("paid_cases", "Cases paid", "Approved cases paid in the month.", "ksu_paid_cases", "count"),
      meas("beneficiaries", "Verified beneficiaries", "Distinct workers with an approved benefit in the month.", "ksu_beneficiaries", "count"),
      meas("approved", "Benefits approved", "Approval stage, in rupees.", "ksu_approved", "inr"),
      meas("disbursed", "Benefits disbursed", "Payments completed, in rupees.", "ksu_disbursed", "inr"),
    ],
  },
]

export const datasetById = (id: string) => DATASETS.find((dataset) => dataset.id === id)

export function fieldOf(dataset: Dataset, fieldId: string) {
  return dataset.fields.find((field) => field.id === fieldId)
}

/** Grouping fields offered as quick picks. Only those present in the dataset are shown. */
export const CORE_GROUPINGS = ["district", "department", "financial_year", "scheme", "category", "aggregator", "sector"]

export const RECORD_COUNT_FIELD = "*"

export const AGGREGATION_LABELS: Record<Aggregation | "calc", string> = {
  count: "Count",
  sum: "Sum",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
  distinct: "Distinct count",
  calc: "Ratio of totals",
}
