import { financialYearBounds } from "@/lib/period"
import type { FactoriesFilters } from "@/types/factories"

const categories = new Set(["engineering", "chemical", "food", "textiles", "metals", "power", "other"])
const inspections = new Set(["conducted", "pending"])
const severities = new Set(["fatal", "serious", "minor", "non-injury"])
const compliance = new Set(["open", "closed", "overdue"])
const boilers = new Set(["completed", "due", "expiring", "expired"])

export const DEFAULT_FACTORIES_FILTERS: FactoriesFilters = {
  financialYear: "2025-26",
  fromDate: "2025-04-01",
  toDate: "2026-03-31",
  districtId: "all",
  talukId: "all",
  category: "all",
  inspectionStatus: "all",
  severity: "all",
  complianceStatus: "all",
  boilerStatus: "all",
}

function known(value: string | null, allowed: Set<string>) {
  return value && allowed.has(value) ? value : "all"
}

export function readFactoriesFilters(params: URLSearchParams): FactoriesFilters {
  const financialYear = params.get("financialYear") || DEFAULT_FACTORIES_FILTERS.financialYear
  const year = /^\d{4}-\d{2}$/.test(financialYear) ? financialYear : DEFAULT_FACTORIES_FILTERS.financialYear
  const bounds = financialYearBounds(year)
  const fromDate = params.get("from") || bounds.from
  const toDate = params.get("to") || bounds.to
  const ordered = fromDate <= toDate ? { fromDate, toDate } : { fromDate: toDate, toDate: fromDate }
  return {
    financialYear: year,
    ...ordered,
    districtId: params.get("districtId") || "all",
    talukId: params.get("talukId") || "all",
    category: known(params.get("category"), categories),
    inspectionStatus: known(params.get("inspectionStatus"), inspections),
    severity: known(params.get("severity"), severities),
    complianceStatus: known(params.get("complianceStatus"), compliance),
    boilerStatus: known(params.get("boilerStatus"), boilers),
  }
}

export function factoriesQuery(filters: FactoriesFilters) {
  const params = new URLSearchParams()
  params.set("financialYear", filters.financialYear)
  params.set("from", filters.fromDate)
  params.set("to", filters.toDate)
  if (filters.districtId !== "all") params.set("districtId", filters.districtId)
  if (filters.talukId !== "all") params.set("talukId", filters.talukId)
  if (filters.category !== "all") params.set("category", filters.category)
  if (filters.inspectionStatus !== "all") params.set("inspectionStatus", filters.inspectionStatus)
  if (filters.severity !== "all") params.set("severity", filters.severity)
  if (filters.complianceStatus !== "all") params.set("complianceStatus", filters.complianceStatus)
  if (filters.boilerStatus !== "all") params.set("boilerStatus", filters.boilerStatus)
  return params
}

export function factoriesScopeQuery(filters: FactoriesFilters) {
  const params = new URLSearchParams()
  params.set("financialYear", filters.financialYear)
  params.set("from", filters.fromDate)
  params.set("to", filters.toDate)
  if (filters.districtId !== "all") params.set("districtId", filters.districtId)
  return params
}

export const FACTORIES_LINKS = [
  { label: "Labour Commissionerate", to: "/departments/labour-commissionerate" },
  { label: "KBOCW Welfare Board", to: "/departments/kbocw-welfare-board" },
  { label: "Construction & Infrastructure", to: "/departments/construction-infrastructure" },
  { label: "Health & Social Security", to: "/departments/health-social-security" },
  { label: "ESIS", to: "/departments/esis" },
  { label: "Department Relationship Map", to: "/intelligence/relationship-map" },
  { label: "Cross-Department Intelligence", to: "/intelligence/cross-analytics" },
]
