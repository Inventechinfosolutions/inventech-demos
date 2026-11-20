import type { GigFilterKey, GigFilters } from "@/types/gig"

// The extract covers October 2025 to September 2026. Financial years are clipped to that coverage
// so the default view never shows empty months.
export const GIG_DATA_START = "2025-10-01"
export const GIG_DATA_END = "2026-09-30"

export const GIG_FINANCIAL_YEARS = [
  { id: "2025-26", label: "FY 2025-26 (Oct 2025 to Mar 2026)", from: "2025-10-01", to: "2026-03-31" },
  { id: "2026-27", label: "FY 2026-27 (Apr to Sep 2026)", from: "2026-04-01", to: "2026-09-30" },
]

export const GIG_QUARTERS = [
  { id: "q3", label: "Q3 (Oct to Dec 2025)", financialYear: "2025-26", from: "2025-10-01", to: "2025-12-31" },
  { id: "q4", label: "Q4 (Jan to Mar 2026)", financialYear: "2025-26", from: "2026-01-01", to: "2026-03-31" },
  { id: "q1", label: "Q1 (Apr to Jun 2026)", financialYear: "2026-27", from: "2026-04-01", to: "2026-06-30" },
  { id: "q2", label: "Q2 (Jul to Sep 2026)", financialYear: "2026-27", from: "2026-07-01", to: "2026-09-30" },
]

export const GIG_ACTIVITY = [
  { id: "active", name: "Active in the period" },
  { id: "inactive", name: "Registered, no payout in the period" },
]

export const GIG_STATUS_GROUPS = [
  {
    label: "Quarterly return",
    items: [
      { id: "ret-on-time", name: "Return filed on time" },
      { id: "ret-late", name: "Return filed late" },
      { id: "ret-overdue", name: "Return overdue, not filed" },
      { id: "ret-not-due", name: "Return not yet due" },
    ],
  },
  {
    label: "Reconciliation",
    items: [
      { id: "rec-done", name: "Fully reconciled" },
      { id: "rec-partial", name: "Partly reconciled" },
      { id: "rec-pending", name: "Reconciliation pending" },
    ],
  },
]

const STATUS_IDS = new Set(GIG_STATUS_GROUPS.flatMap((group) => group.items.map((item) => item.id)))
const ACTIVITY_IDS = new Set(GIG_ACTIVITY.map((item) => item.id))
const GENDER_IDS = new Set(["female", "male", "other"])
const AGE_IDS = new Set(["18-24", "25-34", "35-44", "45+"])

export const DEFAULT_GIG_FILTERS: GigFilters = {
  financialYear: "2026-27",
  fromDate: "2026-04-01",
  toDate: "2026-09-30",
  districtId: "all",
  cityId: "all",
  aggregatorId: "all",
  sectorId: "all",
  activity: "all",
  gender: "all",
  ageGroup: "all",
  schemeId: "all",
  grievanceCategory: "all",
  status: "all",
}

export function gigYearBounds(financialYear: string) {
  const match = GIG_FINANCIAL_YEARS.find((item) => item.id === financialYear) ?? GIG_FINANCIAL_YEARS[GIG_FINANCIAL_YEARS.length - 1]
  return { from: match.from, to: match.to }
}

const isDate = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
const clampDate = (value: string) => (value < GIG_DATA_START ? GIG_DATA_START : value > GIG_DATA_END ? GIG_DATA_END : value)
const text = (value: string | null) => (value && /^[a-z0-9+-]{1,40}$/.test(value) ? value : "all")
const known = (value: string | null, allowed: Set<string>) => (value && allowed.has(value) ? value : "all")

export function readGigFilters(params: URLSearchParams): GigFilters {
  const requested = params.get("financialYear")
  const year = GIG_FINANCIAL_YEARS.some((item) => item.id === requested) ? (requested as string) : DEFAULT_GIG_FILTERS.financialYear
  const bounds = gigYearBounds(year)
  const rawFrom = params.get("fromDate")
  const rawTo = params.get("toDate")
  const from = clampDate(isDate(rawFrom) ? rawFrom : bounds.from)
  const to = clampDate(isDate(rawTo) ? rawTo : bounds.to)
  const ordered = from <= to ? { fromDate: from, toDate: to } : { fromDate: to, toDate: from }
  return {
    financialYear: year,
    ...ordered,
    districtId: text(params.get("districtId")),
    cityId: text(params.get("cityId")),
    aggregatorId: text(params.get("aggregatorId")),
    sectorId: text(params.get("sectorId")),
    activity: known(params.get("activity"), ACTIVITY_IDS),
    gender: known(params.get("gender"), GENDER_IDS),
    ageGroup: known(params.get("ageGroup"), AGE_IDS),
    schemeId: text(params.get("schemeId")),
    grievanceCategory: text(params.get("grievanceCategory")),
    status: known(params.get("status"), STATUS_IDS),
  }
}

const KEY_TO_PARAM: Record<GigFilterKey, string> = {
  districtId: "districtId",
  cityId: "cityId",
  aggregatorId: "aggregatorId",
  sectorId: "sectorId",
  activity: "activity",
  gender: "gender",
  ageGroup: "ageGroup",
  schemeId: "schemeId",
  grievanceCategory: "grievanceCategory",
  status: "status",
}

export const GIG_FILTER_KEYS = Object.keys(KEY_TO_PARAM) as GigFilterKey[]

/** Query string for the page address. Only filters that are not at their default are written. */
export function gigQuery(filters: GigFilters) {
  const params = new URLSearchParams()
  const bounds = gigYearBounds(filters.financialYear)
  if (filters.financialYear !== DEFAULT_GIG_FILTERS.financialYear) params.set("financialYear", filters.financialYear)
  if (filters.fromDate !== bounds.from) params.set("fromDate", filters.fromDate)
  if (filters.toDate !== bounds.to) params.set("toDate", filters.toDate)
  for (const key of GIG_FILTER_KEYS) {
    if (filters[key] !== "all") params.set(KEY_TO_PARAM[key], filters[key])
  }
  return params
}

/** Query string for the service. Names follow the mock endpoint contract in the specification. */
export function gigApiQuery(filters: GigFilters) {
  const params = new URLSearchParams()
  params.set("financialYear", filters.financialYear)
  const quarter = GIG_QUARTERS.find((item) => item.from === filters.fromDate && item.to === filters.toDate)
  if (quarter) params.set("quarter", quarter.id)
  params.set("fromDate", filters.fromDate)
  params.set("toDate", filters.toDate)
  for (const key of GIG_FILTER_KEYS) {
    if (filters[key] !== "all") params.set(KEY_TO_PARAM[key], filters[key])
  }
  return params
}

export function activeGigKeys(filters: GigFilters): GigFilterKey[] {
  return GIG_FILTER_KEYS.filter((key) => filters[key] !== "all")
}

export function sameGigFilters(left: GigFilters, right: GigFilters) {
  return left.financialYear === right.financialYear && left.fromDate === right.fromDate && left.toDate === right.toDate && GIG_FILTER_KEYS.every((key) => left[key] === right[key])
}

export function gigQuarterOf(filters: GigFilters) {
  return GIG_QUARTERS.find((item) => item.from === filters.fromDate && item.to === filters.toDate)?.id ?? ""
}
