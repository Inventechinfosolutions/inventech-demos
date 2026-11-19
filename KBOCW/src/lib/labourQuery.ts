import { financialYearBounds } from "@/lib/period"
import type { LabourFilters } from "@/types/labour"

export const DEFAULT_LABOUR_FILTERS: LabourFilters = {
  financialYear: "2025-26",
  fromDate: "2025-04-01",
  toDate: "2026-03-31",
  districtId: "all",
  talukId: "all",
  category: "all",
  projectStatus: "all",
  cessStatus: "all",
  inspectionStatus: "all",
}

export function readLabourFilters(params: URLSearchParams): LabourFilters {
  const financialYear = params.get("financialYear") || DEFAULT_LABOUR_FILTERS.financialYear
  const bounds = financialYearBounds(/^\d{4}-\d{2}$/.test(financialYear) ? financialYear : DEFAULT_LABOUR_FILTERS.financialYear)
  const fromDate = params.get("from") || bounds.from
  const toDate = params.get("to") || bounds.to
  const ordered = fromDate <= toDate ? { fromDate, toDate } : { fromDate: toDate, toDate: fromDate }
  return {
    financialYear: /^\d{4}-\d{2}$/.test(financialYear) ? financialYear : DEFAULT_LABOUR_FILTERS.financialYear,
    ...ordered,
    districtId: params.get("districtId") || "all",
    talukId: params.get("talukId") || "all",
    category: params.get("category") || "all",
    projectStatus: params.get("projectStatus") || "all",
    cessStatus: params.get("cessStatus") || "all",
    inspectionStatus: params.get("inspectionStatus") || "all",
  }
}

export function labourQuery(filters: LabourFilters) {
  const params = new URLSearchParams()
  params.set("financialYear", filters.financialYear)
  params.set("from", filters.fromDate)
  params.set("to", filters.toDate)
  if (filters.districtId !== "all") params.set("districtId", filters.districtId)
  if (filters.talukId !== "all") params.set("talukId", filters.talukId)
  if (filters.category !== "all") params.set("category", filters.category)
  if (filters.projectStatus !== "all") params.set("projectStatus", filters.projectStatus)
  if (filters.cessStatus !== "all") params.set("cessStatus", filters.cessStatus)
  if (filters.inspectionStatus !== "all") params.set("inspectionStatus", filters.inspectionStatus)
  return params
}

export const LABOUR_LINKS = [
  { label: "Construction & Infrastructure", to: "/departments/construction-infrastructure" },
  { label: "Cess & Financial", to: "/departments/cess-financial" },
  { label: "KBOCW Welfare Board", to: "/departments/kbocw-welfare-board" },
  { label: "Factories & Boilers", to: "/departments/factories-boilers" },
  { label: "Department Relationship Map", to: "/intelligence/relationship-map" },
  { label: "Construction Project Explorer", to: "/intelligence/project-explorer" },
  { label: "Construction-to-Cess Lifecycle", to: "/intelligence/cess-lifecycle" },
]
