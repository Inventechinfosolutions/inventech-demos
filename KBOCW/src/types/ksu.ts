import type { DetailColumn } from "@/types/dashboard"

export interface KsuFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
  schemeId: string
  occupationId: string
  registrationStatus: string
  claimStatus: string
  benefitType: string
  gender: string
  ageGroup: string
}

export type KsuFilterKey = Exclude<keyof KsuFilters, "financialYear" | "fromDate" | "toDate">

export interface KsuOption {
  id: string
  name: string
}

export interface KsuFilterOptions {
  financialYears: { id: string; label: string; from: string; to: string }[]
  quarters: { id: string; label: string; financialYear: string; from: string; to: string }[]
  districts: KsuOption[]
  schemes: { id: string; name: string; statusLabel: string }[]
  occupations: KsuOption[]
  registrationStatuses: KsuOption[]
  claimStatuses: KsuOption[]
  benefitTypes: { id: string; name: string; schemeId: string; schemeName: string }[]
  genders: KsuOption[]
  ageGroups: KsuOption[]
}

export interface KsuComparison {
  label: string
  change: number | null
  note: string
}

/** Same shape as the card used by the other dashboards. */
export interface KsuKpi {
  id: string
  label: string
  unit: "count" | "inr"
  value: number
  displayValue: string
  comparison: KsuComparison
  spark: number[]
  period: string
  definition: string
  basis: string
  sourceIds: string[]
  notAffectedBy: string[]
}

export interface KsuStat {
  id: string
  label: string
  displayValue: string
  hint: string
  sourceIds: string[]
}

export interface KsuSourceStatus {
  id: string
  name: string
  updated: string
  ageDays: number
  cadenceDays: number
  status: "current" | "delayed" | "stale"
}

export interface KsuMapDistrict {
  id: string
  name: string
  drawn: boolean
  registered: number
  enrolments: number
  beneficiaries: number
  received: number
  pending: number
  disbursed: number
}

export type KsuMapMetric = "registered" | "enrolments" | "beneficiaries" | "received" | "pending" | "disbursed"

export interface KsuDistrictRow {
  id: string
  name: string
  registered: number
  baseline: number
  /** Valid registrations as a share of the illustrative baseline, in per cent. */
  coverage: number
  enrolments: number
  received: number
  pending: number
  disbursed: number
  eshram: number
}

export interface KsuCategoryRow {
  id: string
  name: string
  value: number
}

export interface KsuRegistrationChart {
  months: string[]
  monthIndexes: number[]
  newRegistrations: number[]
  validStock: number[]
  notAffectedBy: string[]
}

export interface KsuDemographics {
  occupations: KsuCategoryRow[]
  genders: KsuCategoryRow[]
  ages: KsuCategoryRow[]
  settlement: KsuCategoryRow[]
  statuses: KsuCategoryRow[]
  total: number
  notAffectedBy: { demographics: string[]; status: string[] }
}

export interface KsuSchemeRow {
  id: string
  name: string
  statusLabel: string
  enrolments: number
  received: number
  approved: number
  disbursedCases: number
  beneficiaries: number
  approvedAmount: number
  disbursedAmount: number
  avgDays: number | null
  medianDays: number | null
}

export interface KsuSchemeSection {
  rows: KsuSchemeRow[]
  enrolmentTotal: number
  uniqueEnrolled: number
  otherSchemesNote: string
  funnel: { id: string; label: string; value: number }[]
  pipeline: { id: string; label: string; value: number }[]
  beneficiaryTrend: { months: string[]; monthIndexes: number[]; series: { id: string; name: string; values: number[] }[] }
  notAffectedBy: { enrolments: string[]; claims: string[] }
}

export interface KsuClaimsSection {
  byBenefit: { id: string; name: string; scheme: string; value: number }[]
  pendingAge: { buckets: string[]; verification: number[]; returned: number[]; total: number }
  processing: { rows: { id: string; name: string; avg: number | null; median: number | null; decided: number }[]; avg: number | null; median: number | null; decided: number }
  reasons: { id: string; name: string; value: number }[]
  unpaidAge: { buckets: string[]; counts: number[]; amounts: number[]; totalCount: number; totalAmount: number }
  payments: { months: string[]; monthIndexes: number[]; amount: number[]; count: number[]; totalAmount: number; totalCount: number }
  notAffectedBy: string[]
}

export interface KsuFinanceSection {
  yearLabel: string
  asOf: string
  rows: {
    id: string
    name: string
    allocation: number
    released: number
    approved: number
    disbursed: number
    expenditure: number
    utilisation: number | null
  }[]
  totals: { allocation: number; released: number; approved: number; disbursed: number; expenditure: number; utilisation: number | null }
  trend: { id: string; label: string; approved: number; disbursed: number; expenditure: number }[]
  note: string
  notAffectedBy: string[]
}

export interface KsuFacilitationSection {
  months: string[]
  monthIndexes: number[]
  services: number[]
  facilitated: number[]
  districts: KsuCategoryRow[]
  totals: { services: number; facilitated: number; districtsServed: number }
  unavailable: { title: string; reason: string }[]
  notAffectedBy: string[]
}

export interface KsuPriorityRow {
  key: string
  districtId: string
  district: string
  schemeId: string
  scheme: string
  pending: number
  oldestAge: number
  ageBucket: string
  approvedUnpaid: number
  approvedUnpaidAmount: number
  lastUpdated: string
  note: string
}

export interface KsuMetricDefinition {
  code: string
  name: string
  kind: "KPI" | "Chart" | "Supporting figure"
  definition: string
  calculation: string
  dateBasis: string
  filters: string
  sources: string[]
  exclusions: string
}

export interface KsuDatasetDefinition {
  id: string
  name: string
  grain: string
  fields: string
  rows: string
  notes: string
}

export interface KsuOverview {
  title: string
  subtitle: string
  illustrativeNote: string
  source: string
  lastRefreshed: string
  reportingDate: string
  periodLabel: string
  asOfLabel: string
  scopeLabel: string
  filters: KsuFilters
  activeFilters: { key: KsuFilterKey; label: string; value: string }[]
  empty: boolean
  months: { index: number; short: string; label: string }[]
  kpis: KsuKpi[]
  strip: KsuStat[]
  registration: KsuRegistrationChart
  demographics: KsuDemographics
  districts: KsuMapDistrict[]
  districtRows: KsuDistrictRow[]
  schemes: KsuSchemeSection
  claims: KsuClaimsSection
  finance: KsuFinanceSection
  facilitation: KsuFacilitationSection
  eshram: { total: number; note: string }
  priority: KsuPriorityRow[]
  priorityTarget: number
  sources: KsuSourceStatus[]
  published: { source: string; period: string; caution: string; items: { id: string; label: string; value: string }[] }
  definitions: KsuMetricDefinition[]
  datasets: KsuDatasetDefinition[]
  notes: { counting: string; payments: string; period: string; classification: string }
}

export type KsuChartId =
  | "registration"
  | "occupation"
  | "gender"
  | "age"
  | "settlement"
  | "status"
  | "districtClaims"
  | "districtDisbursed"
  | "scheme"
  | "funnel"
  | "pipeline"
  | "beneficiaryTrend"
  | "benefit"
  | "pendingAge"
  | "processing"
  | "reasons"
  | "unpaidAge"
  | "payments"
  | "finance"
  | "financeTrend"
  | "facilitation"
  | "facilitationDistricts"

export type KsuDrill =
  | { type: "kpi"; id: string }
  | { type: "strip"; id: string }
  | { type: "chart"; chartId: KsuChartId; category?: string; series?: string; month?: number }
  | { type: "district"; id: string }
  | { type: "scheme"; id: string }
  | { type: "priority"; key: string }

export interface KsuDetail {
  title: string
  summary: string
  note: string
  meta: { reference: string; source: string; period: string; received: string; validation: string; access: string }
  columns: DetailColumn[]
  rows: Record<string, string>[]
  apply?: { label: string; patch: Partial<KsuFilters> }
}
