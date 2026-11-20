import type { KsuDatasetDefinition, KsuMetricDefinition } from "@/types/ksu"

/**
 * Data dictionary for the dashboard. The KPI cards, the definitions section and the data dictionary
 * all read from here, so a definition is written once.
 */

interface Spec {
  name: string
  definition: string
  calculation: string
  dateBasis: string
  /** Filters the figure responds to. */
  filters: string
  /** Filters shown on the card as not applying. */
  notAffectedBy: string[]
  sources: string[]
  exclusions: string
  basis: string
  unit: "count" | "inr"
}

export const KSU_KPI_SPECS: Record<string, Spec> = {
  registered: {
    name: "KSUWSSB Registered Workers",
    definition: "Distinct workers whose KSUWSSB registration is verified and has not lapsed on the last day of the period.",
    calculation: "Count of synthetic worker IDs with outcome verified, decision date on or before the end date and expiry after it.",
    dateBasis: "Stock on the last day of the selected period.",
    filters: "Period, district, occupation, gender, age group.",
    notAffectedBy: ["scheme", "registration status", "claim status", "benefit type"],
    sources: ["registry"],
    exclusions: "Pending, rejected or returned and lapsed registrations. e-Shram registrations are never included.",
    basis: "Count of distinct workers.",
    unit: "count",
  },
  newRegistrations: {
    name: "Workers Registered in Period",
    definition: "New unique KSUWSSB registrations received during the period, whatever their verification status.",
    calculation: "Count of synthetic worker IDs whose registration was received in the period and whose status on the last day matches the status filter.",
    dateBasis: "Registration received date.",
    filters: "Period, district, occupation, gender, age group, registration status.",
    notAffectedBy: ["scheme", "claim status", "benefit type"],
    sources: ["registry"],
    exclusions: "Workers registered before the period. Renewals are not modelled.",
    basis: "Count of distinct workers.",
    unit: "count",
  },
  enrolments: {
    name: "Scheme Enrolments",
    definition: "Active scheme enrolments on the last day of the period. A worker enrolled in two schemes counts twice, so this is not a count of workers.",
    calculation: "Count of worker and scheme pairs where the worker is verified, enrolled on or before the end date and not lapsed.",
    dateBasis: "Stock on the last day of the selected period.",
    filters: "Period, district, scheme, occupation, gender, age group.",
    notAffectedBy: ["registration status", "claim status", "benefit type"],
    sources: ["registry"],
    exclusions: "Enrolments of workers whose registration is pending, rejected or lapsed.",
    basis: "Count of enrolments. Not unique workers.",
    unit: "count",
  },
  beneficiaries: {
    name: "Verified Beneficiaries",
    definition: "Distinct workers with at least one approved benefit decided in the period. A worker approved under two schemes counts once.",
    calculation: "Count of distinct worker IDs on cases approved in the period.",
    dateBasis: "Approval date.",
    filters: "Period, district, scheme, occupation, gender, age group, benefit type, claim status.",
    notAffectedBy: ["registration status"],
    sources: ["approvals"],
    exclusions: "Rejected, returned and still pending cases. Approval is not the same as payment.",
    basis: "Count of distinct workers.",
    unit: "count",
  },
  received: {
    name: "Applications and Claims Received",
    definition: "Applications and claims received in the period. Each is one case, so a worker with two cases counts twice.",
    calculation: "Count of cases with a received date in the period.",
    dateBasis: "Received date.",
    filters: "Period, district, scheme, occupation, gender, age group, benefit type, claim status.",
    notAffectedBy: ["registration status"],
    sources: ["applications"],
    exclusions: "Cases received outside the period.",
    basis: "Count of cases.",
    unit: "count",
  },
  pending: {
    name: "Pending Applications and Claims",
    definition: "Cases received on or before the last day that are still waiting for a decision or for correction on that day.",
    calculation: "Count of cases whose status on the last day is under verification or returned for correction.",
    dateBasis: "Stock on the last day of the selected period.",
    filters: "Period, district, scheme, occupation, gender, age group, benefit type, claim status.",
    notAffectedBy: ["registration status"],
    sources: ["applications", "approvals"],
    exclusions: "Approved cases awaiting payment are shown separately and are not pending decisions.",
    basis: "Count of cases at the end date.",
    unit: "count",
  },
  approved: {
    name: "Benefits Approved",
    definition: "Value of benefits approved in the period. Approval is a decision, not a payment.",
    calculation: "Sum of approved amounts for cases approved in the period.",
    dateBasis: "Approval date.",
    filters: "Period, district, scheme, occupation, gender, age group, benefit type, claim status.",
    notAffectedBy: ["registration status"],
    sources: ["approvals"],
    exclusions: "Rejected and pending cases. Placeholder amounts, not notified rates.",
    basis: "Rupees. Calculated separately from disbursements.",
    unit: "inr",
  },
  disbursed: {
    name: "Benefits Disbursed",
    definition: "Value of payments that completed successfully in the period. Initiated, failed and returned payments are left out.",
    calculation: "Sum of amounts on cases whose payment succeeded in the period.",
    dateBasis: "Payment success date.",
    filters: "Period, district, scheme, occupation, gender, age group, benefit type, claim status.",
    notAffectedBy: ["registration status"],
    sources: ["payments"],
    exclusions: "Payment initiated but not confirmed, failed and returned payments.",
    basis: "Rupees. Calculated separately from approvals.",
    unit: "inr",
  },
}

export const KSU_KPI_ORDER = ["registered", "newRegistrations", "enrolments", "beneficiaries", "received", "pending", "approved", "disbursed"]

const m = (code: string, name: string, kind: KsuMetricDefinition["kind"], definition: string, calculation: string, dateBasis: string, filters: string, sources: string[], exclusions: string): KsuMetricDefinition => ({
  code,
  name,
  kind,
  definition,
  calculation,
  dateBasis,
  filters,
  sources,
  exclusions,
})

const REG_FILTERS = "Period, district, occupation, gender, age group. Not scheme, registration status, claim status or benefit type."
const CLAIM_FILTERS = "Period, district, scheme, occupation, gender, age group, benefit type, claim status. Not registration status."

export const KSU_DEFINITIONS: KsuMetricDefinition[] = [
  ...KSU_KPI_ORDER.map((id, index) => {
    const spec = KSU_KPI_SPECS[id]
    return m(`K${index + 1}`, spec.name, "KPI", spec.definition, spec.calculation, spec.dateBasis, spec.filters, spec.sources, spec.exclusions)
  }),
  m("S1", "Smart cards issued", "Supporting figure", "Smart cards issued to workers up to the last day.", "Count of workers with a card issue month on or before the end month.", "Card issue month.", REG_FILTERS, ["registry"], "Cards for rejected registrations."),
  m("S2", "Awaiting verification", "Supporting figure", "Registrations received but not yet decided on the last day.", "Count of workers in the pending verification status.", "Stock on the last day.", REG_FILTERS, ["registry"], "Decided registrations."),
  m("S3", "Rejected or returned registrations", "Supporting figure", "Registrations rejected or returned for correction up to the last day.", "Count of workers in the rejected status.", "Stock on the last day.", REG_FILTERS, ["registry"], "Verified registrations."),
  m("S4", "Approved, not yet paid", "Supporting figure", "Approved cases where payment has not succeeded: not initiated, initiated but unconfirmed, or failed or returned.", "Count of cases at those three statuses on the last day.", "Stock on the last day.", CLAIM_FILTERS, ["approvals", "payments"], "Cases awaiting a decision."),
  m("S5", "Average processing time", "Supporting figure", "Mean days from receipt to decision for cases decided in the period.", "Mean of decision date minus received date, for approved and rejected cases decided in the period.", "Decision date.", CLAIM_FILTERS, ["approvals"], "Cases not yet decided and returned cases."),
  m("S6", "Occupation categories", "Supporting figure", "Occupation categories with at least one registered worker in the selection.", "Count of occupation categories with a non-zero worker count.", "Stock on the last day.", REG_FILTERS, ["registry"], "Categories without workers."),
  m("S7", "Districts with activity", "Supporting figure", "Districts with registered workers or cases in the selection.", "Count of districts with a non-zero worker or case count.", "Last day and period.", CLAIM_FILTERS, ["registry", "applications"], "Districts without records."),
  m("S8", "Facilitation services", "Supporting figure", "Services recorded at Karmika Seva Kendra, including registration support.", "Registrations facilitated plus other services delivered, in the period.", "Service date.", "Period and district only.", ["facilitation"], "Grievances and outreach, for which no validated source exists yet."),

  m("C1", "Registrations by month", "Chart", "New registrations received each month, with valid registered workers at each month end.", "Bars: workers registered in the month. Line: stock of valid registrations at month end.", "Registration received month.", "Period, district, occupation, gender, age group, registration status.", ["registry"], "Registrations before the period."),
  m("C2", "Workers by occupation", "Chart", "Valid registered workers on the last day by occupation category.", "Count of distinct workers per occupation.", "Stock on the last day.", REG_FILTERS, ["registry"], "Workers who are not valid."),
  m("C3", "Workers by gender", "Chart", "Valid registered workers by gender.", "Count of distinct workers per gender.", "Stock on the last day.", REG_FILTERS, ["registry"], "Workers who are not valid."),
  m("C4", "Workers by age group", "Chart", "Valid registered workers by age band.", "Count of distinct workers per age band.", "Stock on the last day.", REG_FILTERS, ["registry"], "Workers who are not valid."),
  m("C5", "Rural and urban workers", "Chart", "Valid registered workers by the sample rural or urban classification of their district.", "Count of distinct workers per class.", "Stock on the last day.", REG_FILTERS, ["registry"], "The classification is a sample and must be validated before use."),
  m("C6", "Registration status", "Chart", "All workers registered up to the last day by their status on that day.", "Count of distinct workers per status: verified, pending, rejected or returned, inactive or expired.", "Status on the last day.", REG_FILTERS, ["registry"], "Workers registered after the last day."),
  m("C7", "District map and ranking", "Chart", "Selected measure by district, with registered workers compared against an illustrative baseline of estimated unorganised workers.", "District sums of the measure. Coverage is valid registered workers divided by the baseline.", "As for the measure shown.", "Depends on the layer. See each layer's definition.", ["registry", "applications", "payments"], "The baseline is illustrative and is not a census figure."),
  m("C8", "Claims by district", "Chart", "Cases received, pending and successfully paid by district.", "Counts per district.", "Received date, last day, payment date.", CLAIM_FILTERS, ["applications", "payments"], "District level only. No worker details."),
  m("C9", "Benefits disbursed by district", "Chart", "Value of successful payments by district.", "Sum of amounts per district.", "Payment success date.", CLAIM_FILTERS, ["payments"], "Payments initiated, failed or returned."),
  m("C10", "Scheme performance", "Chart", "Enrolments, cases and amounts for each configured scheme.", "Counts and sums per scheme.", "As for each column.", "Period, district, occupation, gender, age group, benefit type, claim status.", ["registry", "applications", "approvals", "payments"], "A scheme is not shown as open for applications until the Board confirms it."),
  m("C11", "Applications and claims funnel", "Chart", "How cases received in the period have moved on, from receipt to successful payment.", "Received; approved; payment initiated; successfully disbursed, as at the last day.", "Received date, status on the last day.", CLAIM_FILTERS, ["applications", "approvals", "payments"], "Cases received outside the period."),
  m("C12", "Cases by status", "Chart", "Cases received in the period by their status on the last day.", "Count per status. The statuses add up to the cases received.", "Status on the last day.", CLAIM_FILTERS, ["applications", "approvals", "payments"], "None."),
  m("C13", "Beneficiaries by month and scheme", "Chart", "Distinct workers approved in each month, for each scheme.", "Count of distinct workers per scheme and month.", "Approval month.", CLAIM_FILTERS, ["approvals"], "Bars for different schemes can include the same worker."),
  m("C14", "Cases by benefit type", "Chart", "Cases received in the period by benefit type.", "Count per benefit type.", "Received date.", CLAIM_FILTERS, ["applications"], "None."),
  m("C15", "Pending cases by age", "Chart", "Cases waiting for a decision or correction on the last day, by days since receipt and by stage.", "Count by age bucket.", "Last day.", CLAIM_FILTERS, ["applications"], "Approved cases."),
  m("C16", "Processing time", "Chart", "Average and median days from receipt to decision, by scheme.", "Mean and median of decision date minus received date.", "Decision date.", CLAIM_FILTERS, ["approvals"], "Undecided cases."),
  m("C17", "Return and rejection reasons", "Chart", "Reasons recorded when cases were returned or rejected in the period.", "Count per reason.", "Return or rejection date.", CLAIM_FILTERS, ["approvals"], "Reasons come from a sample list."),
  m("C18", "Approved but unpaid, by age", "Chart", "Approved cases without a successful payment on the last day, by days since approval.", "Count and value by age bucket.", "Approval date and last day.", CLAIM_FILTERS, ["approvals", "payments"], "Successfully paid cases."),
  m("C19", "Successful payments by month", "Chart", "Value and number of payments that completed successfully each month.", "Sum and count by payment success month.", "Payment success date.", CLAIM_FILTERS, ["payments"], "Initiated, failed and returned payments."),
  m("C20", "Allocation, release, approval and expenditure", "Chart", "For the financial year to date, the sample allocation, funds released, benefits approved, benefits disbursed and expenditure. Each stage is kept separate and no balance is calculated.", "Allocation and release come from the sample ledger. Approved and disbursed come from case records. Expenditure is disbursements plus a sample administrative rate.", "Financial year to the last day.", "Scheme only. Other filters do not narrow the ledger.", ["finance", "approvals", "payments"], "No fund balance is shown because the ledger is incomplete."),
  m("C21", "Financial year trend", "Chart", "Approved, disbursed and expenditure by financial year to date.", "Sums per financial year.", "Approval, payment and ledger dates.", "Scheme only.", ["finance", "approvals", "payments"], "The latest year covers part of the year."),
  m("C22", "Facilitation activity", "Chart", "Karmika Seva Kendra services by month, split between registration support and other services.", "Counts per month.", "Service date.", "Period and district only.", ["facilitation"], "Grievances and outreach are not shown because no validated source exists."),
  m("C23", "Facilitation by district", "Chart", "Karmika Seva Kendra services by district.", "Sum per district.", "Service date.", "Period and district only.", ["facilitation"], "District level only."),
]

export const KSU_DATASETS: KsuDatasetDefinition[] = [
  { id: "workers", name: "Worker registrations", grain: "One row per synthetic worker ID", fields: "district, occupation, gender, age group, rural or urban class, registration month, verification decision month, outcome, expiry month, card issue month, facilitated flag", rows: "130,000", notes: "Deduplicated by worker ID. No names, Aadhaar, phone or bank details. Status on any date is worked out from the dates." },
  { id: "enrolments", name: "Scheme enrolments", grain: "One enrolment month per worker and scheme", fields: "scheme, enrolment month", rows: "Worker count per scheme", notes: "A worker can be enrolled in more than one scheme, so enrolments are never labelled as unique workers." },
  { id: "cases", name: "Applications and claims", grain: "One row per case", fields: "case reference, worker ID, scheme, benefit type, received day, outcome, decision day, payment initiated day, return or payment result day, reason, amount", rows: "About 4,000", notes: "Status on any date is worked out from the workflow dates, so totals reconcile with the statuses. Approved and paid amounts are summed separately." },
  { id: "masters", name: "District, occupation, scheme and benefit masters", grain: "One row per item", fields: "id, name, weight, status label, effective date, placeholder amount range", rows: "31 districts, 14 occupations, 3 schemes, 6 benefit types", notes: "Sample entries. The Board must supply its own notified lists, and scheme rules must carry effective dates." },
  { id: "ledger", name: "Sample budget and fund ledger", grain: "Scheme and financial year", fields: "allocation, release schedule, administrative rate", rows: "3 schemes, 2 years", notes: "Allocation is set from 2025-26 disbursements so the ledger is plausible. It stands in for the approved budget." },
  { id: "facilitation", name: "Karmika Seva Kendra activity", grain: "District and month", fields: "other services delivered", rows: "31 districts, 18 months", notes: "Registration support comes from the worker table. Grievances and outreach have no source yet." },
  { id: "eshram", name: "e-Shram reference", grain: "One figure per district", fields: "registrations", rows: "31", notes: "External reference only. Not part of any KSUWSSB figure." },
  { id: "published", name: "Published reference figures", grain: "Six reported figures", fields: "label, value, source, period", rows: "6", notes: "Taken from the Karnataka Economic Survey 2025-26. Kept apart from synthetic figures." },
]
