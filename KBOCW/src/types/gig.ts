import type { DetailColumn } from "@/types/dashboard"

export interface GigFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
  cityId: string
  aggregatorId: string
  sectorId: string
  activity: string
  gender: string
  ageGroup: string
  schemeId: string
  grievanceCategory: string
  status: string
}

/** Filters that can be turned on or off. The reporting period is always set. */
export type GigFilterKey = Exclude<keyof GigFilters, "financialYear" | "fromDate" | "toDate">

export interface GigOption {
  id: string
  name: string
}

export interface GigFilterOptions {
  financialYears: { id: string; label: string; from: string; to: string }[]
  quarters: { id: string; label: string; financialYear: string; from: string; to: string }[]
  districts: GigOption[]
  cities: { id: string; name: string; districtId: string }[]
  aggregators: { id: string; name: string; sectorId: string }[]
  sectors: GigOption[]
  activities: GigOption[]
  genders: GigOption[]
  ageGroups: GigOption[]
  schemes: { id: string; name: string; operational: boolean }[]
  grievanceCategories: GigOption[]
  statusGroups: { label: string; items: GigOption[] }[]
}

export interface GigComparison {
  /** What the figure is compared with, for example "Oct 2025 to Mar 2026". */
  label: string
  /** Percentage change, or null when no comparable earlier period exists. */
  change: number | null
  note: string
}

export interface GigKpi {
  id: string
  label: string
  unit: "count" | "inr"
  value: number
  displayValue: string
  comparison: GigComparison
  spark: number[]
  period: string
  definition: string
  basis: string
  sourceIds: string[]
  notAffectedBy: string[]
}

export interface GigStat {
  id: string
  label: string
  displayValue: string
  hint: string
  sourceIds: string[]
}

export interface GigSourceStatus {
  id: string
  name: string
  updated: string
  ageDays: number
  cadenceDays: number
  status: "current" | "delayed" | "stale"
}

export interface GigMapDistrict {
  id: string
  name: string
  drawn: boolean
  unique: number
  active: number
  payout: number
  benefits: number
  grievances: number
}

export type GigMapMetric = "unique" | "active" | "payout" | "benefits" | "grievances"

export interface GigAggregatorRow {
  id: string
  name: string
  sector: string
  period: string
  records: number
  unique: number | null
  payout: number
  payable: number
  deposited: number
  returnStatus: string
  lastSubmission: string
  reporting: boolean
  outstanding: number
}

export type GigExceptionKind = "return" | "shortfall" | "mismatch" | "reconciliation" | "validation" | "payment" | "grievance" | "claim"

export interface GigException {
  id: string
  kind: GigExceptionKind
  /** Aggregator, scheme or category the exception relates to. */
  key: string
  category: string
  scope: string
  description: string
  measure: string
  priority: "high" | "medium" | "low"
  unit: string
  status: string
  due: string
  aggregatorId: string | null
  amount: number
}

export interface GigRegistrationChart {
  months: string[]
  records: number[]
  newlyRegistered: number[]
  separated: number[]
  notAffectedBy: string[]
}

export interface GigSectorChart {
  rows: { id: string; name: string; workers: number }[]
  total: number
  notAffectedBy: string[]
}

export interface GigAggregatorChart {
  rows: { id: string; name: string; sector: string; workers: number; engagements: number; returnStatus: string; reporting: boolean }[]
  uniqueTotal: number
  engagementTotal: number
  notAffectedBy: string[]
}

export interface GigPayoutChart {
  months: string[]
  payout: number[]
  transactions: number[]
  activeWorkers: number[]
  total: number
  avgPerActive: number | null
  notAffectedBy: string[]
}

export interface GigFeeChart {
  months: string[]
  payable: number[]
  declared: number[]
  deposited: number[]
  reconciled: number[]
  totals: { payable: number; declared: number; deposited: number; reconciled: number }
  shortfall: number
  excess: number
  notAffectedBy: string[]
}

export interface GigFundChart {
  months: string[]
  receipts: number[]
  expenditure: number[]
  closing: number[]
  summary: {
    opening: number
    receipts: { label: string; value: number }[]
    receiptsTotal: number
    expenditure: { label: string; value: number }[]
    expenditureTotal: number
    adjustments: number
    closing: number
    asOf: string
  }
  notAffectedBy: string[]
}

export interface GigSchemeChart {
  stageLabels: string[]
  pipeline: { label: string; value: number; hint: string }[]
  rows: { id: string; name: string; operational: boolean; applications: number; beneficiaries: number; amount: number; stages: number[] }[]
  notAffectedBy: string[]
}

export interface GigGrievanceChart {
  categories: { id: string; name: string; resolved: number; pending: number; escalated: number }[]
  months: string[]
  received: number[]
  resolved: number[]
  totals: { received: number; resolved: number; pending: number; escalated: number; appealsReceived: number; appealsDisposed: number; beyondTarget: number }
  targetDays: number
  notAffectedBy: string[]
}

export interface GigSafetyChart {
  months: string[]
  fatal: number[]
  nonFatal: number[]
  claimsInitiated: number[]
  claimsSettled: number[]
  types: { id: string; name: string; fatal: number; nonFatal: number }[]
  totals: { accidents: number; fatal: number; nonFatal: number; claimsInitiated: number; claimsSettled: number; trainees: number }
  notAffectedBy: string[]
}

export interface GigMetricDefinition {
  code: string
  name: string
  definition: string
  calculation: string
  aggregation: string
  dateBasis: string
  sources: string[]
  exclusions: string
  owner: string
  effectiveDate: string
  version: string
  tooltip: string
}

export interface GigOverview {
  title: string
  illustrativeNote: string
  source: string
  lastRefreshed: string
  reportingDate: string
  periodLabel: string
  asOfLabel: string
  scopeLabel: string
  locationNote: string
  boundaryNote: string
  activityRuleNote: string
  feeNote: string
  schemeNote: string
  filters: GigFilters
  activeFilters: { key: GigFilterKey; label: string; value: string }[]
  empty: boolean
  months: { index: number; short: string; label: string }[]
  kpis: GigKpi[]
  strip: GigStat[]
  registration: GigRegistrationChart
  sector: GigSectorChart
  aggregators: GigAggregatorChart
  payout: GigPayoutChart
  fee: GigFeeChart
  fund: GigFundChart
  schemes: GigSchemeChart
  grievances: GigGrievanceChart
  safety: GigSafetyChart
  districts: GigMapDistrict[]
  aggregatorTable: GigAggregatorRow[]
  exceptions: GigException[]
  exceptionCount: number
  sources: GigSourceStatus[]
  benchmark: { text: string; source: string; date: string; url: string }
  definitions: GigMetricDefinition[]
}

export type GigChartId =
  | "registration"
  | "sector"
  | "aggregators"
  | "payout"
  | "fee"
  | "fund"
  | "schemes"
  | "grievances"
  | "grievanceTrend"
  | "safety"
  | "safetyTypes"

export type GigDrill =
  | { type: "kpi"; id: string }
  | { type: "strip"; id: string }
  | { type: "chart"; chartId: GigChartId; category?: string; series?: string; month?: number }
  | { type: "district"; id: string }
  | { type: "aggregator"; id: string; view: "profile" | "history" | "outstanding" }
  | { type: "exception"; id: string }

export interface GigDetail {
  title: string
  summary: string
  note: string
  meta: { reference: string; source: string; period: string; received: string; validation: string; access: string }
  columns: DetailColumn[]
  rows: Record<string, string>[]
  apply?: { label: string; patch: Partial<GigFilters> }
}
