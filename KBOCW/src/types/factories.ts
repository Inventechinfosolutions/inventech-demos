import type { ChartModel, DetailModel } from "@/types/dashboard"

export interface FactoriesFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
  talukId: string
  category: string
  inspectionStatus: string
  severity: string
  complianceStatus: string
  boilerStatus: string
}

export interface FactoriesFilterOptions {
  financialYears: string[]
  districts: { id: string; name: string }[]
  taluks: { id: string; districtId: string; name: string }[]
  categories: { id: string; name: string }[]
  inspectionStatuses: { id: string; name: string }[]
  severities: { id: string; name: string }[]
  complianceStatuses: { id: string; name: string }[]
  boilerStatuses: { id: string; name: string }[]
}

export interface FactoriesKpi {
  id: string
  label: string
  displayValue: string
  hint: string
  group: "establishments" | "inspections" | "boilers"
}

export interface FactoriesException {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  reference: string
  district: string
  countLabel: string
  date: string
  action: string
}

export interface FactoriesMeasure {
  label: string
  displayValue: string
  note: string
}

export interface FactoriesMapDistrict {
  id: string
  name: string
  factories: number
  inspections: number
  accidents: number
  openCases: number
  boilers: number
}

export interface FactoriesOverview {
  source: string
  lastRefreshed: string
  illustrativeNote: string
  jurisdictionNote: string
  separationNote: string
  stageNote: string
  boundaryNote: string
  scopeLabel: string
  establishmentNote: string
  kpis: FactoriesKpi[]
  watch: FactoriesMeasure[]
  charts: Record<string, ChartModel>
  districts: FactoriesMapDistrict[]
  compliance: FactoriesMeasure[]
  boilers: FactoriesMeasure[]
  accidentCounts: FactoriesMeasure[]
  exceptions: FactoriesException[]
  registers: {
    factories: Record<string, string>[]
    inspections: Record<string, string>[]
    accidents: Record<string, string>[]
    boilers: Record<string, string>[]
  }
  filters: FactoriesFilters
}

export type FactoriesDrill =
  | { type: "kpi"; kpiId: string }
  | { type: "chart"; chartId: string; category?: string; series?: string }
  | { type: "exception"; exceptionId: string }
  | { type: "record"; register: "factories" | "inspections" | "accidents" | "boilers"; id: string }

export type FactoriesDetail = DetailModel
