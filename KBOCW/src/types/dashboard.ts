export interface DashboardFilters {
  financialYear: string
  fromDate: string
  toDate: string
  districtId: string
}

export interface FilterOptions {
  financialYears: string[]
  districts: { id: string; name: string }[]
}

export interface KpiModel {
  id: string
  label: string
  hint: string
  displayValue: string
  change: number | null
  lowerIsBetter: boolean
}

export interface ChartSeries {
  name: string
  color: string
  values: number[]
}

export interface ChartModel {
  id: string
  title: string
  description: string
  kind: "line" | "grouped" | "stacked-line" | "horizontal"
  categories: string[]
  series: ChartSeries[]
  unit: "count" | "crore" | "lakh"
  line?: ChartSeries
  lineUnit?: "lakh"
  emptyLabel?: string
  stack?: boolean
  height?: number
}

export interface DistrictMetric {
  id: string
  name: string
  projects: number
  workers: number
  cessAssessed: number
  cessCollected: number
  cessRemitted: number
  cessCredited: number
  beneficiaries: number
  disbursement: number
  pendingApplications: number
}

export interface DepartmentRow {
  id: string
  name: string
  category: string
  records: string
  lastUpdated: string
  status: "current" | "partial" | "delayed"
}

export interface ExceptionRow {
  id: string
  title: string
  description: string
  sourceDepartment: string
  priority: "high" | "medium" | "low"
  countLabel: string
}

export interface SecretaryOverview {
  source: string
  lastRefreshed: string
  illustrativeNote: string
  boundaryNote: string
  stageNote: string
  scopeLabel: string
  filters: DashboardFilters
  kpis: KpiModel[]
  charts: ChartModel[]
  districts: DistrictMetric[]
  departments: DepartmentRow[]
  exceptions: ExceptionRow[]
}

export type DrillRequest =
  | { type: "kpi"; kpiId: string }
  | { type: "chart"; chartId: string; category?: string; series?: string }
  | { type: "exception"; exceptionId: string }
  | { type: "department"; departmentId: string }

export interface DetailColumn {
  key: string
  label: string
  align?: "left" | "right"
  kind?: "text" | "status" | "priority"
}

export interface DetailModel {
  title: string
  summary: string
  note: string
  columns: DetailColumn[]
  rows: Record<string, string>[]
}

export type MetricKey =
  | "projects"
  | "workers"
  | "cessAssessed"
  | "cessCollected"
  | "cessRemitted"
  | "cessCredited"
  | "beneficiaries"
  | "disbursement"
  | "pendingApplications"
  | "applicationsSanctioned"
  | "applicationsReturned"

export interface SecretaryDataFile {
  meta: {
    illustrative: boolean
    source: string
    lastRefreshed: string
    illustrativeNote: string
    boundaryNote: string
    stageNote: string
  }
  years: string[]
  months: { index: number; label: string; full: string }[]
  districts: { id: string; name: string }[]
  metrics: Record<MetricKey, number[][][]>
  schemes: { id: string; name: string; byDistrict: number[][] }[]
  departments: {
    id: string
    name: string
    category: string
    recordsByYear: number[]
    lastUpdated: string
    status: "current" | "partial" | "delayed"
    shareMetric: MetricKey
  }[]
  exceptions: {
    id: string
    title: string
    description: string
    sourceDepartment: string
    priority: "high" | "medium" | "low"
    counts: number[][][]
  }[]
  samples: {
    projects: {
      id: string
      year: string
      monthIndex: number
      districtId: string
      reference: string
      project: string
      workType: string
      cessAssessment: string
    }[]
    cess: {
      id: string
      year: string
      monthIndex: number
      districtId: string
      reference: string
      stage: string
      amountRupees: number
      reconciliation: string
    }[]
    welfare: {
      id: string
      year: string
      monthIndex: number
      districtId: string
      reference: string
      scheme: string
      status: string
      amountRupees: number
    }[]
    exceptions: {
      id: string
      year: string
      monthIndex: number
      districtId: string
      exceptionId: string
      reference: string
      detail: string
      records: number
    }[]
    departments: {
      id: string
      year: string
      monthIndex: number
      districtId: string
      departmentId: string
      reference: string
      records: number
      status: "current" | "partial" | "delayed"
    }[]
    incidents: {
      id: string
      year: string
      monthIndex: number
      districtId: string
      reference: string
      incidentType: string
      status: string
    }[]
  }
}
