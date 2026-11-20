import {
  KSU_AGE_GROUPS,
  KSU_BENEFITS,
  KSU_CLAIM_STAGES,
  KSU_DATA_END,
  KSU_DATA_START,
  KSU_DISTRICTS,
  KSU_FINANCIAL_YEARS,
  KSU_GENDERS,
  KSU_OCCUPATIONS,
  KSU_QUARTERS,
  KSU_REG_STATUSES,
  KSU_SCHEMES,
} from "@/data/ksuMasters"
import type { KsuFilterKey, KsuFilters } from "@/types/ksu"

export const DEFAULT_KSU_FILTERS: KsuFilters = {
  financialYear: "2026-27",
  fromDate: "2026-04-01",
  toDate: "2026-09-30",
  districtId: "all",
  schemeId: "all",
  occupationId: "all",
  registrationStatus: "all",
  claimStatus: "all",
  benefitType: "all",
  gender: "all",
  ageGroup: "all",
}

const KEY_TO_PARAM: Record<KsuFilterKey, string> = {
  districtId: "districtId",
  schemeId: "schemeId",
  occupationId: "occupationId",
  registrationStatus: "registrationStatus",
  claimStatus: "claimStatus",
  benefitType: "benefitType",
  gender: "gender",
  ageGroup: "ageGroup",
}

export const KSU_FILTER_KEYS = Object.keys(KEY_TO_PARAM) as KsuFilterKey[]

const ALLOWED: Record<KsuFilterKey, Set<string>> = {
  districtId: new Set(KSU_DISTRICTS.map((item) => item.id)),
  schemeId: new Set(KSU_SCHEMES.map((item) => item.id)),
  occupationId: new Set(KSU_OCCUPATIONS.map((item) => item.id)),
  registrationStatus: new Set(KSU_REG_STATUSES.map((item) => item.id)),
  claimStatus: new Set(KSU_CLAIM_STAGES.map((item) => item.id)),
  benefitType: new Set(KSU_BENEFITS.map((item) => item.id)),
  gender: new Set(KSU_GENDERS.map((item) => item.id)),
  ageGroup: new Set(KSU_AGE_GROUPS.map((item) => item.id)),
}

export function ksuYearBounds(financialYear: string) {
  const match = KSU_FINANCIAL_YEARS.find((item) => item.id === financialYear) ?? KSU_FINANCIAL_YEARS[KSU_FINANCIAL_YEARS.length - 1]
  return { from: match.from, to: match.to }
}

const isDate = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
const clampDate = (value: string) => (value < KSU_DATA_START ? KSU_DATA_START : value > KSU_DATA_END ? KSU_DATA_END : value)

export function readKsuFilters(params: URLSearchParams): KsuFilters {
  const requested = params.get("financialYear")
  const year = KSU_FINANCIAL_YEARS.some((item) => item.id === requested) ? (requested as string) : DEFAULT_KSU_FILTERS.financialYear
  const bounds = ksuYearBounds(year)
  const rawFrom = params.get("fromDate")
  const rawTo = params.get("toDate")
  const from = clampDate(isDate(rawFrom) ? rawFrom : bounds.from)
  const to = clampDate(isDate(rawTo) ? rawTo : bounds.to)
  const ordered = from <= to ? { fromDate: from, toDate: to } : { fromDate: to, toDate: from }
  const result: KsuFilters = { ...DEFAULT_KSU_FILTERS, financialYear: year, ...ordered }
  for (const key of KSU_FILTER_KEYS) {
    const value = params.get(KEY_TO_PARAM[key])
    result[key] = value && ALLOWED[key].has(value) ? value : "all"
  }
  return result
}

/** Query string for the page address. Only filters that are not at their default are written. */
export function ksuQuery(filters: KsuFilters) {
  const params = new URLSearchParams()
  const bounds = ksuYearBounds(filters.financialYear)
  if (filters.financialYear !== DEFAULT_KSU_FILTERS.financialYear) params.set("financialYear", filters.financialYear)
  if (filters.fromDate !== bounds.from) params.set("fromDate", filters.fromDate)
  if (filters.toDate !== bounds.to) params.set("toDate", filters.toDate)
  for (const key of KSU_FILTER_KEYS) if (filters[key] !== "all") params.set(KEY_TO_PARAM[key], filters[key])
  return params
}

/** Query string for the service. Names follow the mock endpoint contract. */
export function ksuApiQuery(filters: KsuFilters) {
  const params = new URLSearchParams()
  params.set("financialYear", filters.financialYear)
  const quarter = KSU_QUARTERS.find((item) => item.from === filters.fromDate && item.to === filters.toDate)
  if (quarter) params.set("quarter", quarter.id)
  params.set("fromDate", filters.fromDate)
  params.set("toDate", filters.toDate)
  for (const key of KSU_FILTER_KEYS) if (filters[key] !== "all") params.set(KEY_TO_PARAM[key], filters[key])
  return params
}

export const activeKsuKeys = (filters: KsuFilters): KsuFilterKey[] => KSU_FILTER_KEYS.filter((key) => filters[key] !== "all")

export const sameKsuFilters = (left: KsuFilters, right: KsuFilters) =>
  left.financialYear === right.financialYear && left.fromDate === right.fromDate && left.toDate === right.toDate && KSU_FILTER_KEYS.every((key) => left[key] === right[key])

export const ksuQuarterOf = (filters: KsuFilters) => KSU_QUARTERS.find((item) => item.from === filters.fromDate && item.to === filters.toDate)?.id ?? ""
