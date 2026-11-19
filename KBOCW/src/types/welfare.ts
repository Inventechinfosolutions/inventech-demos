import type { ChartModel, DetailColumn } from "@/types/dashboard"

export interface WelfareFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
  talukId: string
  membershipStatus: string
  scheme: string
  applicationStatus: string
  paymentStatus: string
}

export interface WelfareFilterOptions {
  financialYears: string[]
  districts: { id: string; name: string }[]
  taluks: { id: string; districtId: string; name: string }[]
  membershipStatuses: { id: string; name: string }[]
  schemes: { id: string; name: string }[]
  applicationStatuses: { id: string; name: string }[]
  paymentStatuses: { id: string; name: string }[]
}

export interface WelfareKpi {
  id: string
  label: string
  hint: string
  displayValue: string
  group: "membership" | "coverage" | "assistance"
}

export interface WelfareStage {
  id: string
  label: string
  displayValue: string
}

export interface WelfareFinance {
  available: string
  allocated: string
  approved: string
  disbursed: string
  remaining: string
  definition: string
}

export interface WelfareAction {
  id: string
  title: string
  description: string
  source: string
  severity: "high" | "medium" | "low"
  countLabel: string
}

export interface WelfareMapDistrict {
  id: string
  name: string
  workers: number
  activeMemberships: number
  beneficiaries: number
  pendingApplications: number
  disbursed: number
}

export interface WelfareRegister {
  title: string
  caption: string
  columns: DetailColumn[]
  rows: Record<string, string>[]
}

export type WelfareRegisterKey = "workers" | "applications" | "disbursements"

export interface WelfareOverview {
  source: string
  lastRefreshed: string
  illustrativeNote: string
  boundaryNote: string
  separationNote: string
  stageNote: string
  schemeNote: string
  scopeLabel: string
  filters: WelfareFilters
  kpis: WelfareKpi[]
  stages: WelfareStage[]
  finance: WelfareFinance
  charts: ChartModel[]
  districts: WelfareMapDistrict[]
  actions: WelfareAction[]
  registers: Record<WelfareRegisterKey, WelfareRegister>
}

export type WelfareDrill =
  | { type: "kpi"; kpiId: string }
  | { type: "chart"; chartId: string; category?: string; series?: string }
  | { type: "stage"; stageId: string }
  | { type: "exception"; exceptionId: string }
  | { type: "record"; register: WelfareRegisterKey; id: string }
