import type { DashboardFilters } from "@/types/dashboard"

export const DEFAULT_FILTERS: DashboardFilters = {
  financialYear: "2025-26",
  fromDate: "2025-04-01",
  toDate: "2026-03-31",
  districtId: "all",
}

export function financialYearBounds(financialYear: string) {
  const start = Number(financialYear.slice(0, 4))
  return {
    from: `${start}-04-01`,
    to: `${start + 1}-03-31`,
  }
}

export function withFinancialYear(filters: DashboardFilters, financialYear: string): DashboardFilters {
  const bounds = financialYearBounds(financialYear)
  return { ...filters, financialYear, fromDate: bounds.from, toDate: bounds.to }
}
