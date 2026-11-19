import type { ChartModel, DetailModel } from "@/types/dashboard"

export interface IntelligenceFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
  departmentId: string
}

export interface IntelligenceFilterOptions {
  financialYears: string[]
  districts: { id: string; name: string }[]
  departments: { id: string; name: string }[]
}

export type IntelligenceTopic = "projects" | "cess" | "workers" | "welfare" | "safety" | "relationships" | "exceptions"

export interface IntelligenceKpi {
  id: string
  label: string
  displayValue: string
  hint: string
  topic: IntelligenceTopic
}

export interface IntelligenceEntity {
  id: string
  label: string
  recordId: string
  type: string
  department: string
  departmentId: string
  districtId: string
  system: string
  sourceRecordId: string
  recordDate: string
  lastUpdatedAt: string
}

export interface IntelligenceRelationship {
  id: string
  source: string
  target: string
  relationshipType: string
  matchingMethod: string
  matchingConfidence: string
  verificationStatus: string
}

export interface IntelligenceAudit {
  at: string
  text: string
}

export interface IntelligenceException {
  id: string
  type: string
  entity: string
  district: string
  districtId: string
  sources: string
  sourceDepartmentIds: string[]
  priority: "high" | "medium" | "low"
  matching: string
  assigned: string
  investigation: string
  created: string
  action: string
  notes: string[]
  audit: IntelligenceAudit[]
  domain: "projects" | "cess" | "workers" | "welfare" | "safety"
}

export interface IntelligenceReview {
  project: string
  department: string
  district: string
  districtId: string
  stage: string
  status: string
}

export interface IntelligenceStage {
  label: string
  displayValue: string
}

export interface IntelligenceCallout {
  label: string
  displayValue: string
  note: string
}

export interface IntelligenceOverview {
  source: string
  lastRefreshed: string
  illustrativeNote: string
  stageNote: string
  jurisdictionNote: string
  boundaryNote: string
  matchNote: string
  scopeLabel: string
  projectKpiNote: string
  workerNote: string
  welfareNote: string
  kpis: IntelligenceKpi[]
  charts: Record<string, ChartModel>
  districts: { id: string; name: string; projects: number }[]
  cessStages: IntelligenceStage[]
  collectedNotRemitted: string | null
  remittedNotCredited: string | null
  funnel: IntelligenceStage[]
  welfareCalls: IntelligenceCallout[]
  safetyCalls: IntelligenceCallout[]
  cessReviews: IntelligenceReview[]
  entities: IntelligenceEntity[]
  relationships: IntelligenceRelationship[]
  exceptions: IntelligenceException[]
  filters: IntelligenceFilters
}

export type IntelligenceDrill =
  | { type: "kpi"; kpiId: string }
  | { type: "chart"; chartId: string; category?: string; series?: string }
  | { type: "exception"; exceptionId: string }
  | { type: "entity"; entityId: string }

export type IntelligenceDetail = DetailModel
