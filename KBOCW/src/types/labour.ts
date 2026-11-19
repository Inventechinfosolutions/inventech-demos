import type { ChartModel, DetailColumn, DetailModel } from "@/types/dashboard"

export interface LabourFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
  talukId: string
  category: string
  projectStatus: string
  cessStatus: string
  inspectionStatus: string
}

export interface LabourFilterOptions {
  financialYears: string[]
  districts: { id: string; name: string }[]
  taluks: { id: string; districtId: string; name: string }[]
  categories: { id: string; name: string }[]
  projectStatuses: { id: string; name: string }[]
  cessStatuses: { id: string; name: string }[]
  inspectionStatuses: { id: string; name: string }[]
}

export interface LabourKpi {
  id: string
  label: string
  hint: string
  displayValue: string
  group: "register" | "finance" | "compliance"
}

export interface LabourMapDistrict {
  id: string
  name: string
  projects: number
  establishments: number
  cessCollected: number
  inspections: number
  pendingCompliance: number
}

export interface LabourQueueItem {
  id: string
  title: string
  description: string
  source: string
  severity: "high" | "medium" | "low"
  countLabel: string
}

export interface LabourRegister {
  caption: string
  columns: DetailColumn[]
  rows: Record<string, string>[]
}

export interface LabourOverview {
  source: string
  lastRefreshed: string
  illustrativeNote: string
  boundaryNote: string
  separationNote: string
  stageNote: string
  scopeLabel: string
  filters: LabourFilters
  kpis: LabourKpi[]
  charts: ChartModel[]
  districts: LabourMapDistrict[]
  registers: {
    establishments: LabourRegister
    assessments: LabourRegister
    inspections: LabourRegister
  }
  queue: LabourQueueItem[]
}

export type LabourRegisterKey = "establishments" | "assessments" | "inspections"

export type LabourDrill =
  | { type: "kpi"; kpiId: string }
  | { type: "chart"; chartId: string; category?: string; series?: string }
  | { type: "exception"; exceptionId: string }
  | { type: "record"; register: LabourRegisterKey; id: string }

export type { DetailModel }
