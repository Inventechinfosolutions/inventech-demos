import { defaultVisualization } from "@/analytics/templates"
import type {
  AnalyticsDb,
  DashboardDefinition,
  DashboardRecord,
  DashboardWidget,
  DateGrain,
  FilterGroup,
  FilterNode,
  ReportDefinition,
  ReportRecord,
} from "@/analytics/types"

// Moves a report between its JSON form and the normalised analytics_* tables. The JSON form is
// what the UI edits, exports and shares. The tables are what is stored.

type FieldRow = AnalyticsDb["analytics_report_fields"][number]
type FilterRow = AnalyticsDb["analytics_report_filters"][number]
type VizRow = AnalyticsDb["analytics_report_visualizations"][number]

export interface ReportTables {
  fields: FieldRow[]
  filters: FilterRow[]
  visualization: VizRow
}

export function reportToTables(def: ReportDefinition): ReportTables {
  const fields: FieldRow[] = []
  def.dimensions.forEach((dimension, position) => {
    fields.push({ reportId: def.id, position, role: "dimension", fieldId: dimension.fieldId, aggregation: null, grain: dimension.grain ?? null, measureId: null, label: null })
  })
  def.measures.forEach((measure, position) => {
    fields.push({ reportId: def.id, position, role: "measure", fieldId: measure.fieldId, aggregation: measure.aggregation, grain: null, measureId: measure.id, label: measure.label ?? null })
  })
  def.visualization.detailColumns.forEach((fieldId, position) => {
    fields.push({ reportId: def.id, position, role: "column", fieldId, aggregation: null, grain: null, measureId: null, label: null })
  })

  const filters: FilterRow[] = []
  const walk = (node: FilterNode, parentId: string | null, position: number) => {
    if (node.kind === "group") {
      filters.push({ id: node.id, reportId: def.id, parentId, position, kind: "group", combinator: node.combinator, fieldId: null, operator: null, value: null, value2: null, list: null })
      node.children.forEach((child, index) => walk(child, node.id, index))
      return
    }
    filters.push({
      id: node.id,
      reportId: def.id,
      parentId,
      position,
      kind: "condition",
      combinator: null,
      fieldId: node.fieldId,
      operator: node.operator,
      value: node.value ?? null,
      value2: node.value2 ?? null,
      list: node.list ?? null,
    })
  }
  walk(def.filters, null, 0)

  const viz = def.visualization
  return {
    fields,
    filters,
    visualization: { reportId: def.id, type: viz.type, limit: viz.limit, showLabels: viz.showLabels, stacked: viz.stacked, detail: viz.detail, sort: def.sort },
  }
}

export function tablesToReport(db: AnalyticsDb, record: ReportRecord): ReportDefinition {
  const fields = db.analytics_report_fields.filter((row) => row.reportId === record.id)
  const dimensions = fields
    .filter((row) => row.role === "dimension")
    .sort((a, b) => a.position - b.position)
    .map((row) => ({ fieldId: row.fieldId, ...(row.grain ? { grain: row.grain as DateGrain } : {}) }))
  const measures = fields
    .filter((row) => row.role === "measure")
    .sort((a, b) => a.position - b.position)
    .map((row) => ({ id: row.measureId ?? `${row.aggregation}:${row.fieldId}`, fieldId: row.fieldId, aggregation: (row.aggregation ?? "sum") as ReportDefinition["measures"][number]["aggregation"], ...(row.label ? { label: row.label } : {}) }))
  const detailColumns = fields
    .filter((row) => row.role === "column")
    .sort((a, b) => a.position - b.position)
    .map((row) => row.fieldId)

  const rows = db.analytics_report_filters.filter((row) => row.reportId === record.id)
  const build = (row: FilterRow): FilterNode => {
    if (row.kind === "group") {
      const children = rows
        .filter((child) => child.parentId === row.id)
        .sort((a, b) => a.position - b.position)
        .map(build)
      return { id: row.id, kind: "group", combinator: row.combinator ?? "AND", children }
    }
    return {
      id: row.id,
      kind: "condition",
      fieldId: row.fieldId ?? "",
      operator: row.operator ?? "eq",
      ...(row.value != null ? { value: row.value } : {}),
      ...(row.value2 != null ? { value2: row.value2 } : {}),
      ...(row.list ? { list: row.list } : {}),
    }
  }
  const root = rows.find((row) => row.parentId === null)
  const filters = (root ? build(root) : { id: `${record.id}-root`, kind: "group", combinator: "AND", children: [] }) as FilterGroup

  const viz = db.analytics_report_visualizations.find((row) => row.reportId === record.id)
  const base = defaultVisualization(viz?.type ?? "column")
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    datasetId: record.datasetId,
    dimensions,
    measures,
    filters,
    sort: viz?.sort ?? [],
    visualization: viz ? { ...base, limit: viz.limit, showLabels: viz.showLabels, stacked: viz.stacked, detail: viz.detail, detailColumns } : base,
  }
}

export function widgetRows(db: AnalyticsDb, dashboardId: string): DashboardWidget[] {
  return db.analytics_dashboard_widgets
    .filter((row) => row.dashboardId === dashboardId)
    .sort((a, b) => a.position - b.position)
    .map((row) => {
      const { dashboardId: _dashboardId, position: _position, ...widget } = row
      void _dashboardId
      void _position
      return widget
    })
}

export function tablesToDashboard(db: AnalyticsDb, record: DashboardRecord): DashboardDefinition {
  return { ...record, widgets: widgetRows(db, record.id) }
}

/** The JSON form of a report that is shown, copied and imported in the builder. */
export function serializeReport(def: ReportDefinition) {
  return JSON.stringify(def, null, 2)
}

export function parseReport(text: string): ReportDefinition {
  const value = JSON.parse(text) as Partial<ReportDefinition>
  if (!value || typeof value !== "object" || !value.datasetId || !Array.isArray(value.measures) || !Array.isArray(value.dimensions) || !value.filters || !value.visualization) {
    throw new Error("The text is not a report definition.")
  }
  return {
    id: value.id ?? "",
    name: value.name ?? "Imported report",
    description: value.description ?? "",
    datasetId: value.datasetId,
    dimensions: value.dimensions,
    measures: value.measures,
    filters: value.filters,
    sort: value.sort ?? [],
    visualization: { ...defaultVisualization(value.visualization.type), ...value.visualization },
  }
}
