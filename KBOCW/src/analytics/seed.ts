import { reportToTables } from "@/analytics/entities"
import { condition, definitionFromTemplate, defaultVisualization, measure, recordCount, templateById } from "@/analytics/templates"
import type { AnalyticsDb, AuditEntry, DashboardRecord, DashboardWidget, ExecutionRecord, GlobalFilters, PermissionGrant, ReportDefinition, ReportRecord, Visibility } from "@/analytics/types"

export const DB_VERSION = 1

export const defaultGlobalFilters = (): GlobalFilters => ({ financialYears: ["2025-26"], from: "", to: "", districts: [], departments: [], compare: false })

const group = (...children: ReturnType<typeof condition>[]) => ({ id: "root", kind: "group" as const, combinator: "AND" as const, children })

interface SeedReport {
  id: string
  owner: string
  visibility: Visibility
  status: "draft" | "published"
  created: string
  modified: string
  template?: string
  def: ReportDefinition
  grants?: { userId: string; access: "view" | "edit" }[]
}

function fromTemplate(templateId: string, id: string): ReportDefinition {
  const template = templateById(templateId)
  if (!template) throw new Error(`Missing template ${templateId}`)
  return definitionFromTemplate(template, id)
}

function custom(id: string, name: string, description: string, datasetId: string, rest: Partial<ReportDefinition>): ReportDefinition {
  return {
    id,
    name,
    description,
    datasetId,
    dimensions: [],
    measures: [],
    filters: group(),
    sort: [],
    visualization: defaultVisualization("column"),
    ...rest,
  }
}

function kpi(id: string, name: string, description: string, datasetId: string, fieldId: string, aggregation: "sum" | "calc" | "count", withYear: boolean): ReportDefinition {
  return custom(id, name, description, datasetId, {
    measures: [fieldId === "*" ? recordCount() : measure(fieldId, aggregation)],
    filters: withYear ? group(condition("financial_year", "eq", { value: "2025-26" })) : group(),
    visualization: defaultVisualization("kpi"),
  })
}

const REPORTS: SeedReport[] = [
  { id: "RPT-0001", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-14T10:20:00+05:30", modified: "2026-11-10T16:05:00+05:30", template: "tpl-district-cess-collection", def: fromTemplate("tpl-district-cess-collection", "RPT-0001") },
  { id: "RPT-0002", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-14T10:40:00+05:30", modified: "2026-11-12T11:15:00+05:30", template: "tpl-cess-reconciliation", def: fromTemplate("tpl-cess-reconciliation", "RPT-0002") },
  { id: "RPT-0003", owner: "u-welfare", visibility: "portal", status: "published", created: "2026-09-20T09:10:00+05:30", modified: "2026-10-28T14:30:00+05:30", template: "tpl-fy-worker-registration", def: fromTemplate("tpl-fy-worker-registration", "RPT-0003") },
  { id: "RPT-0004", owner: "u-welfare", visibility: "portal", status: "published", created: "2026-09-21T15:45:00+05:30", modified: "2026-11-02T10:00:00+05:30", template: "tpl-scheme-welfare-disbursement", def: fromTemplate("tpl-scheme-welfare-disbursement", "RPT-0004") },
  { id: "RPT-0005", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-25T12:00:00+05:30", modified: "2026-11-05T17:20:00+05:30", template: "tpl-department-project-performance", def: fromTemplate("tpl-department-project-performance", "RPT-0005") },
  {
    id: "RPT-0006",
    owner: "u-welfare",
    visibility: "shared",
    status: "published",
    created: "2026-10-03T11:30:00+05:30",
    modified: "2026-11-14T09:45:00+05:30",
    template: "tpl-pending-welfare-applications",
    def: fromTemplate("tpl-pending-welfare-applications", "RPT-0006"),
    grants: [
      { userId: "u-secretary", access: "view" },
      { userId: "u-district", access: "view" },
    ],
  },
  { id: "RPT-0007", owner: "u-labour", visibility: "department", status: "published", created: "2026-10-05T10:05:00+05:30", modified: "2026-11-11T13:10:00+05:30", template: "tpl-district-compliance", def: fromTemplate("tpl-district-compliance", "RPT-0007") },
  {
    id: "RPT-0008",
    owner: "u-labour",
    visibility: "portal",
    status: "published",
    created: "2026-10-07T14:25:00+05:30",
    modified: "2026-11-09T10:50:00+05:30",
    def: custom("RPT-0008", "Projects by type and status", "Construction projects by type, split by project status.", "construction_projects", {
      dimensions: [{ fieldId: "project_type" }, { fieldId: "status" }],
      measures: [recordCount()],
      visualization: defaultVisualization("stacked"),
    }),
  },
  {
    id: "RPT-0009",
    owner: "u-analyst",
    visibility: "portal",
    status: "published",
    created: "2026-10-12T16:00:00+05:30",
    modified: "2026-11-13T15:40:00+05:30",
    def: custom("RPT-0009", "Inspection outcomes", "Share of inspections by outcome. An item for follow-up is not a confirmed violation.", "inspections", {
      dimensions: [{ fieldId: "status" }],
      measures: [recordCount()],
      visualization: defaultVisualization("donut"),
    }),
  },
  {
    id: "RPT-0010",
    owner: "u-finance",
    visibility: "private",
    status: "draft",
    created: "2026-11-08T09:30:00+05:30",
    modified: "2026-11-08T09:55:00+05:30",
    def: custom("RPT-0010", "Remitted and credited by reconciliation status", "Remitted and credited cess side by side. Credit is a separate stage.", "treasury_transactions", {
      dimensions: [{ fieldId: "status" }],
      measures: [measure("cess_remitted", "sum"), measure("cess_credited", "sum")],
      visualization: defaultVisualization("column"),
    }),
  },
  { id: "RPT-0011", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-30T10:00:00+05:30", modified: "2026-10-30T10:00:00+05:30", def: kpi("RPT-0011", "Cess assessed", "Cess at the assessment stage for FY 2025-26.", "district_performance", "cess_assessed", "sum", true) },
  { id: "RPT-0012", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-30T10:05:00+05:30", modified: "2026-10-30T10:05:00+05:30", def: kpi("RPT-0012", "Cess collected", "Cess at the collection stage for FY 2025-26.", "district_performance", "cess_collected", "sum", true) },
  { id: "RPT-0013", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-30T10:10:00+05:30", modified: "2026-10-30T10:10:00+05:30", def: kpi("RPT-0013", "Workers registered", "Workers registered in FY 2025-26.", "district_performance", "workers_registered", "sum", true) },
  { id: "RPT-0014", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-30T10:15:00+05:30", modified: "2026-10-30T10:15:00+05:30", def: kpi("RPT-0014", "Welfare disbursement", "Welfare amount released in FY 2025-26.", "district_performance", "disbursement", "sum", true) },
  { id: "RPT-0015", owner: "u-secretary", visibility: "portal", status: "published", created: "2026-09-30T10:20:00+05:30", modified: "2026-10-30T10:20:00+05:30", def: kpi("RPT-0015", "Pending applications", "Applications awaiting a decision in FY 2025-26.", "district_performance", "pending_applications", "sum", true) },
  { id: "RPT-0016", owner: "u-labour", visibility: "portal", status: "published", created: "2026-10-15T10:00:00+05:30", modified: "2026-11-01T10:00:00+05:30", def: kpi("RPT-0016", "Inspections recorded", "Inspections recorded in the diary.", "inspections", "*", "count", false) },
  { id: "RPT-0017", owner: "u-labour", visibility: "portal", status: "published", created: "2026-10-15T10:05:00+05:30", modified: "2026-11-01T10:05:00+05:30", def: kpi("RPT-0017", "Violations recorded", "Violations recorded at inspection.", "inspections", "violations_found", "sum", false) },
  { id: "RPT-0018", owner: "u-labour", visibility: "portal", status: "published", created: "2026-10-15T10:10:00+05:30", modified: "2026-11-01T10:10:00+05:30", def: kpi("RPT-0018", "Collection rate", "Cess collected as a percentage of cess assessed.", "district_performance", "collection_rate", "calc", false) },
]

const widget = (id: string, kind: DashboardWidget["kind"], reportId: string, title: string, x: number, y: number, w: number, h: number, vizOverride?: DashboardWidget["vizOverride"]): DashboardWidget => ({
  id,
  kind,
  reportId,
  title,
  x,
  y,
  w,
  h,
  filters: [],
  ...(vizOverride ? { vizOverride } : {}),
})

interface SeedDashboard {
  record: DashboardRecord
  widgets: DashboardWidget[]
  grants?: { userId: string; access: "view" | "edit" }[]
}

const DASHBOARDS: SeedDashboard[] = [
  {
    record: {
      id: "DSH-0001",
      name: "Secretary overview: cess and welfare",
      description: "Cess stages, district collection and welfare delivery on one page.",
      createdBy: "u-secretary",
      createdAt: "2026-10-01T10:00:00+05:30",
      modifiedAt: "2026-11-12T12:00:00+05:30",
      visibility: "portal",
      columns: 12,
      globalFilters: defaultGlobalFilters(),
    },
    widgets: [
      widget("w1", "kpi", "RPT-0011", "Cess assessed", 0, 0, 3, 2),
      widget("w2", "kpi", "RPT-0012", "Cess collected", 3, 0, 3, 2),
      widget("w3", "kpi", "RPT-0013", "Workers registered", 6, 0, 3, 2),
      widget("w4", "kpi", "RPT-0014", "Welfare disbursement", 9, 0, 3, 2),
      widget("w5", "map", "RPT-0001", "Cess collected by district", 0, 2, 6, 6, "map"),
      widget("w6", "chart", "RPT-0002", "Cess stages by financial year", 6, 2, 6, 6),
      widget("w7", "chart", "RPT-0004", "Welfare sanctioned by scheme", 0, 8, 6, 5),
      widget("w8", "chart", "RPT-0005", "Projects and processing time by department", 6, 8, 6, 5),
    ],
  },
  {
    record: {
      id: "DSH-0002",
      name: "Compliance and field operations",
      description: "Inspections, violations and project mix for the Labour Commissionerate.",
      createdBy: "u-labour",
      createdAt: "2026-10-16T11:00:00+05:30",
      modifiedAt: "2026-11-11T14:00:00+05:30",
      visibility: "department",
      columns: 12,
      globalFilters: { ...defaultGlobalFilters(), financialYears: [] },
    },
    widgets: [
      widget("w1", "kpi", "RPT-0016", "Inspections recorded", 0, 0, 4, 2),
      widget("w2", "kpi", "RPT-0017", "Violations recorded", 4, 0, 4, 2),
      widget("w3", "kpi", "RPT-0018", "Collection rate", 8, 0, 4, 2),
      widget("w4", "chart", "RPT-0007", "Inspections and violations by district", 0, 2, 7, 6),
      widget("w5", "chart", "RPT-0009", "Inspection outcomes", 7, 2, 5, 6),
      widget("w6", "chart", "RPT-0008", "Projects by type and status", 0, 8, 12, 5),
    ],
  },
]

export function seedDb(): AnalyticsDb {
  const db: AnalyticsDb = {
    version: DB_VERSION,
    analytics_reports: [],
    analytics_report_fields: [],
    analytics_report_filters: [],
    analytics_report_visualizations: [],
    analytics_dashboards: [],
    analytics_dashboard_widgets: [],
    analytics_saved_views: [],
    analytics_report_permissions: [],
    analytics_execution_history: [],
    analytics_audit_log: [],
    preferences: { "u-secretary": { defaultDashboardId: "DSH-0001" }, "u-labour": { defaultDashboardId: "DSH-0002" } },
  }
  const audit: AuditEntry[] = []
  const grants: PermissionGrant[] = []

  for (const item of REPORTS) {
    const record: ReportRecord = {
      id: item.id,
      name: item.def.name,
      description: item.def.description,
      datasetId: item.def.datasetId,
      createdBy: item.owner,
      createdAt: item.created,
      modifiedAt: item.modified,
      visibility: item.visibility,
      status: item.status,
      ...(item.template ? { templateId: item.template } : {}),
    }
    db.analytics_reports.push(record)
    const tables = reportToTables(item.def)
    db.analytics_report_fields.push(...tables.fields)
    db.analytics_report_filters.push(...tables.filters)
    db.analytics_report_visualizations.push(tables.visualization)
    audit.push({ id: `a-${item.id}`, at: item.created, userId: item.owner, action: "report.created", targetType: "report", targetId: item.id, detail: `Created report ${item.def.name}.` })
    for (const grant of item.grants ?? []) {
      grants.push({ id: `g-${item.id}-${grant.userId}`, targetType: "report", targetId: item.id, userId: grant.userId, access: grant.access, grantedBy: item.owner, grantedAt: item.modified })
      audit.push({ id: `a-${item.id}-${grant.userId}`, at: item.modified, userId: item.owner, action: "report.shared", targetType: "report", targetId: item.id, detail: `Shared with ${grant.userId} (${grant.access}).` })
    }
  }

  for (const item of DASHBOARDS) {
    db.analytics_dashboards.push(item.record)
    item.widgets.forEach((entry, position) => db.analytics_dashboard_widgets.push({ ...entry, dashboardId: item.record.id, position }))
    audit.push({ id: `a-${item.record.id}`, at: item.record.createdAt, userId: item.record.createdBy, action: "dashboard.created", targetType: "dashboard", targetId: item.record.id, detail: `Created dashboard ${item.record.name}.` })
  }

  const history: ExecutionRecord[] = [
    ["u-secretary", "RPT-0002", "2026-11-18T09:42:00+05:30", 4, 12],
    ["u-secretary", "RPT-0001", "2026-11-18T09:38:00+05:30", 6, 15],
    ["u-secretary", "RPT-0005", "2026-11-17T17:05:00+05:30", 3, 6],
    ["u-labour", "RPT-0007", "2026-11-18T10:12:00+05:30", 4, 15],
    ["u-labour", "RPT-0008", "2026-11-17T12:30:00+05:30", 3, 18],
    ["u-welfare", "RPT-0004", "2026-11-18T08:50:00+05:30", 5, 8],
    ["u-welfare", "RPT-0006", "2026-11-17T15:10:00+05:30", 4, 15],
    ["u-analyst", "RPT-0009", "2026-11-18T11:20:00+05:30", 2, 3],
    ["u-finance", "RPT-0010", "2026-11-17T10:00:00+05:30", 2, 3],
    ["u-district", "RPT-0006", "2026-11-17T14:20:00+05:30", 3, 8],
  ].map(([userId, reportId, at, duration, rows], index) => {
    const source = REPORTS.find((item) => item.id === reportId)
    return {
      id: `h-seed-${index}`,
      userId: userId as string,
      reportId: reportId as string,
      reportName: source?.def.name ?? "Report",
      datasetId: source?.def.datasetId ?? "",
      kind: "saved" as const,
      executedAt: at as string,
      durationMs: duration as number,
      rowCount: rows as number,
      filters: [],
      snapshot: source ? source.def : null,
    }
  })
  db.analytics_execution_history = history
  audit.push({ id: "a-export-1", at: "2026-11-16T15:20:00+05:30", userId: "u-secretary", action: "report.exported", targetType: "report", targetId: "RPT-0002", detail: "Exported Cess Reconciliation Summary as Excel (4 rows)." })
  audit.push({ id: "a-denied-1", at: "2026-11-17T11:05:00+05:30", userId: "u-district", action: "access.denied", targetType: "dataset", targetId: "beneficiaries", detail: "Tried to open Beneficiaries. The dataset is not available to the District office role." })

  db.analytics_report_permissions = grants
  db.analytics_audit_log = audit.sort((a, b) => b.at.localeCompare(a.at))
  return db
}
