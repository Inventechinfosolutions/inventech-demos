// Entities for the Interactive Analytics module.
// Dataset metadata, report definition, query execution, visualization and dashboard layout
// are kept in separate types so each can be stored, serialised and versioned on its own.

export type FieldKind = "dimension" | "measure" | "date" | "calculated"
export type DataType = "string" | "number" | "date"
export type Unit = "inr" | "count" | "days" | "percent" | "score" | "text" | "date"
export type Aggregation = "count" | "sum" | "avg" | "min" | "max" | "distinct"
export type DateGrain = "month" | "quarter" | "year"

export type VizType =
  | "kpi"
  | "bar"
  | "column"
  | "stacked"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "combo"
  | "scatter"
  | "funnel"
  | "heatmap"
  | "table"
  | "pivot"
  | "map"

export type FilterOperator = "eq" | "neq" | "contains" | "gt" | "lt" | "between" | "in" | "dateRange"
export type Combinator = "AND" | "OR"

export type RoleId = "secretary" | "labour" | "welfare" | "factories" | "gig" | "ksu" | "district" | "analyst"
export type Visibility = "private" | "shared" | "department" | "portal"
export type ReportStatus = "draft" | "published"

export type CellValue = string | number | null
export type Row = Record<string, CellValue>

// ---------------------------------------------------------------- dataset metadata

export interface DatasetField {
  id: string
  label: string
  kind: FieldKind
  dataType: DataType
  description: string
  groupable?: boolean
  /** Same meaning in every dataset that has it. Used for global filters and cross-filtering. */
  conformed?: boolean
  /** Personal information. Stored masked and never shown in detail unless the role has detail access. */
  sensitive?: boolean
  /** Record identifier. Only count and distinct count are allowed. */
  identifier?: boolean
  unit?: Unit
  metricId?: string
  /** Calculated measure: ratio of two summed measures. Never an average of row ratios. */
  ratio?: { numerator: string; denominator: string; scale?: number }
  /** Calculated measure: difference of two summed measures. */
  difference?: { minuend: string; subtrahend: string }
  /** Known values, used by filter pick lists. */
  values?: string[]
}

export interface Metric {
  id: string
  label: string
  definition: string
  unit: Unit
  allowed: Aggregation[]
  defaultAggregation: Aggregation
  additive: boolean
  /** Snapshot style counts that repeat across years. Totals need one financial year in scope. */
  requiresSingleYear?: boolean
  /** Counts taken at the end of a month, or distinct within a month. Adding months repeats them, so a total needs one month in scope. */
  requiresSingleMonth?: boolean
  /** Stage of a process, such as approved or disbursed. Different stages are never added or stacked together. */
  stage?: string
  owner: string
}

export interface DatasetAccess {
  roles: RoleId[]
  recordDetail: RoleId[]
}

export interface Dataset {
  id: string
  name: string
  description: string
  sourceDepartment: string
  sourceSystem: string
  freshness: string
  lastSync: string
  grain: string
  recordLabel: string
  primaryDate?: string
  pii: boolean
  access: DatasetAccess
  /** Field ids used to apply district and department restrictions. */
  scope: { district?: string; department?: string }
  fields: DatasetField[]
  /** Drill paths. Each path lists dimension ids from broad to narrow. */
  drill: string[][]
  defaultDimension?: string
}

// ---------------------------------------------------------------- report definition

export interface MeasureSelection {
  id: string
  fieldId: string
  /** "*" is the record count. "calc" is used by calculated measures. */
  aggregation: Aggregation | "calc"
  label?: string
}

export interface DimensionSelection {
  fieldId: string
  grain?: DateGrain
}

export interface FilterCondition {
  id: string
  kind: "condition"
  fieldId: string
  operator: FilterOperator
  value?: string
  value2?: string
  list?: string[]
}

export interface FilterGroup {
  id: string
  kind: "group"
  combinator: Combinator
  children: FilterNode[]
}

export type FilterNode = FilterCondition | FilterGroup

export interface SortSpec {
  columnId: string
  direction: "asc" | "desc"
}

export interface VisualizationConfig {
  type: VizType
  limit: number
  showLabels: boolean
  stacked: boolean
  /** Table only: list individual records instead of groups. */
  detail: boolean
  detailColumns: string[]
}

export interface ReportDefinition {
  id: string
  name: string
  description: string
  datasetId: string
  dimensions: DimensionSelection[]
  measures: MeasureSelection[]
  filters: FilterGroup
  sort: SortSpec[]
  visualization: VisualizationConfig
}

export interface ReportRecord {
  id: string
  name: string
  description: string
  datasetId: string
  createdBy: string
  createdAt: string
  modifiedAt: string
  visibility: Visibility
  status: ReportStatus
  templateId?: string
}

export interface ReportShare {
  userId: string
  access: "view" | "edit"
}

// ---------------------------------------------------------------- query execution

export interface ResultColumn {
  id: string
  label: string
  kind: "dimension" | "measure"
  fieldId: string
  unit: Unit
  grain?: DateGrain
  aggregation?: Aggregation | "calc"
  metricId?: string
  dataType: DataType
}

export interface AppliedFilter {
  label: string
  source: "report" | "global" | "cross" | "widget" | "drill" | "role"
}

export interface MetricRef {
  id: string
  label: string
  definition: string
  aggregation: string
}

export interface QueryResult {
  columns: ResultColumn[]
  rows: Row[]
  totalGroups: number
  scannedRows: number
  appliedFilters: AppliedFilter[]
  metrics: MetricRef[]
  warnings: string[]
  suppressedGroups: number
  mode: "aggregate" | "detail"
  executedAt: string
  durationMs: number
  datasetId: string
  datasetName: string
  sourceSystem: string
  lastSync: string
}

export interface Issue {
  code: string
  message: string
  fieldId?: string
}

export interface Validation {
  errors: Issue[]
  warnings: Issue[]
}

// ---------------------------------------------------------------- dashboards

export interface DashboardWidget {
  id: string
  kind: "report" | "kpi" | "chart" | "table" | "map"
  reportId: string
  title: string
  x: number
  y: number
  w: number
  h: number
  vizOverride?: VizType
  filters: FilterCondition[]
}

export interface GlobalFilters {
  financialYears: string[]
  from: string
  to: string
  districts: string[]
  departments: string[]
  compare: boolean
}

export interface CrossFilter {
  id: string
  fieldId: string
  value: string
  label: string
  sourceWidgetId: string | null
}

export interface DashboardRecord {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  modifiedAt: string
  visibility: Visibility
  columns: number
  globalFilters: GlobalFilters
}

export interface DashboardDefinition extends DashboardRecord {
  widgets: DashboardWidget[]
}

export interface SavedView {
  id: string
  ownerId: string
  name: string
  scope: "dashboard" | "report"
  targetId: string
  globalFilters: GlobalFilters
  crossFilters: CrossFilter[]
  createdAt: string
}

// ---------------------------------------------------------------- governance

export interface PermissionGrant {
  id: string
  targetType: "report" | "dashboard"
  targetId: string
  userId: string
  access: "view" | "edit"
  grantedBy: string
  grantedAt: string
}

export interface ExecutionRecord {
  id: string
  userId: string
  reportId: string | null
  reportName: string
  datasetId: string
  kind: "preview" | "saved" | "dashboard" | "nlq" | "export"
  executedAt: string
  durationMs: number
  rowCount: number
  filters: string[]
  snapshot: ReportDefinition | null
}

export type AuditAction =
  | "report.created"
  | "report.updated"
  | "report.renamed"
  | "report.duplicated"
  | "report.deleted"
  | "report.executed"
  | "report.exported"
  | "report.shared"
  | "dashboard.created"
  | "dashboard.updated"
  | "dashboard.deleted"
  | "dashboard.duplicated"
  | "dashboard.shared"
  | "access.denied"
  | "session.role-changed"

export interface AuditEntry {
  id: string
  at: string
  userId: string
  action: AuditAction
  targetType: "report" | "dashboard" | "dataset" | "session"
  targetId: string
  detail: string
}

export interface User {
  id: string
  name: string
  title: string
  department: string
  role: RoleId
  /** District restriction. Null means all districts. */
  districtScope: string | null
  /** Department restriction applied where a dataset defines a department scope. */
  departmentScope: string | null
  canDeleteAny: boolean
  canViewAudit: boolean
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  datasetId: string
  note?: string
  definition: Omit<ReportDefinition, "id" | "name" | "description">
}

/** Normalised persistence model. Mirrors the analytics_* tables. */
export interface AnalyticsDb {
  version: number
  analytics_reports: ReportRecord[]
  analytics_report_fields: {
    reportId: string
    position: number
    role: "dimension" | "measure" | "column"
    fieldId: string
    aggregation: string | null
    grain: string | null
    measureId: string | null
    label: string | null
  }[]
  analytics_report_filters: {
    id: string
    reportId: string
    parentId: string | null
    position: number
    kind: "group" | "condition"
    combinator: Combinator | null
    fieldId: string | null
    operator: FilterOperator | null
    value: string | null
    value2: string | null
    list: string[] | null
  }[]
  analytics_report_visualizations: {
    reportId: string
    type: VizType
    limit: number
    showLabels: boolean
    stacked: boolean
    detail: boolean
    sort: SortSpec[]
  }[]
  analytics_dashboards: DashboardRecord[]
  analytics_dashboard_widgets: (DashboardWidget & { dashboardId: string; position: number })[]
  analytics_saved_views: SavedView[]
  analytics_report_permissions: PermissionGrant[]
  analytics_execution_history: ExecutionRecord[]
  analytics_audit_log: AuditEntry[]
  preferences: Record<string, { defaultDashboardId?: string }>
}
