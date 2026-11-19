import { useSyncExternalStore } from "react"
import { canDeleteDashboard, canDeleteReport, canEditDashboard, canEditReport, canViewDashboard, canViewReport } from "@/analytics/access"
import { newId } from "@/analytics/engine"
import { reportToTables, tablesToDashboard, tablesToReport } from "@/analytics/entities"
import { DB_VERSION, seedDb } from "@/analytics/seed"
import { USERS, userById } from "@/analytics/users"
import type {
  AnalyticsDb,
  AuditAction,
  AuditEntry,
  DashboardDefinition,
  DashboardRecord,
  ExecutionRecord,
  PermissionGrant,
  ReportDefinition,
  ReportRecord,
  ReportStatus,
  SavedView,
  User,
  Visibility,
} from "@/analytics/types"

// Persistence for reports, dashboards, saved views, permissions, execution history and the audit trail.
// The data lives in the browser for the demonstration. Every function here maps to one API call in a
// real deployment, and the tables match the analytics_* entities.

const KEY = "kbocw.analytics.db.v1"
const listeners = new Set<() => void>()

function load(): AnalyticsDb | null {
  try {
    const text = window.localStorage.getItem(KEY)
    if (!text) return null
    const parsed = JSON.parse(text) as AnalyticsDb
    return parsed.version === DB_VERSION ? parsed : null
  } catch {
    return null
  }
}

function persist(next: AnalyticsDb) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable or full. The session keeps working in memory.
  }
}

let db: AnalyticsDb = typeof window === "undefined" ? seedDb() : (load() ?? seedDb())
if (typeof window !== "undefined") persist(db)

function commit(next: AnalyticsDb) {
  db = next
  persist(next)
  listeners.forEach((listener) => listener())
}

export const getDb = () => db

export function useDb(): AnalyticsDb {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getDb,
    getDb,
  )
}

export function resetDemoData() {
  commit(seedDb())
}

const nowIso = () => new Date().toISOString()

function nextCode(prefix: string, existing: string[]) {
  const highest = existing.reduce((max, id) => (id.startsWith(`${prefix}-`) ? Math.max(max, Number(id.slice(prefix.length + 1)) || 0) : max), 0)
  return `${prefix}-${String(highest + 1).padStart(4, "0")}`
}

function auditEntry(user: User | null, action: AuditAction, targetType: AuditEntry["targetType"], targetId: string, detail: string): AuditEntry {
  return { id: newId("a"), at: nowIso(), userId: user?.id ?? "system", action, targetType, targetId, detail }
}

function withAudit(base: AnalyticsDb, entry: AuditEntry): AnalyticsDb {
  return { ...base, analytics_audit_log: [entry, ...base.analytics_audit_log].slice(0, 500) }
}

export function logAudit(user: User | null, action: AuditAction, targetType: AuditEntry["targetType"], targetId: string, detail: string) {
  commit(withAudit(db, auditEntry(user, action, targetType, targetId, detail)))
}

// ---------------------------------------------------------------- selectors

export const reportRecord = (id: string, source: AnalyticsDb = db) => source.analytics_reports.find((record) => record.id === id)

export function reportDefinition(id: string, source: AnalyticsDb = db): ReportDefinition | null {
  const record = reportRecord(id, source)
  return record ? tablesToReport(source, record) : null
}

export const dashboardRecord = (id: string, source: AnalyticsDb = db) => source.analytics_dashboards.find((record) => record.id === id)

export function dashboardDefinition(id: string, source: AnalyticsDb = db): DashboardDefinition | null {
  const record = dashboardRecord(id, source)
  return record ? tablesToDashboard(source, record) : null
}

export const visibleReports = (user: User, source: AnalyticsDb = db) =>
  source.analytics_reports.filter((record) => canViewReport(user, record, source.analytics_report_permissions, USERS)).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))

export const visibleDashboards = (user: User, source: AnalyticsDb = db) =>
  source.analytics_dashboards.filter((record) => canViewDashboard(user, record, source.analytics_report_permissions, USERS)).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))

export const grantsFor = (targetType: PermissionGrant["targetType"], targetId: string, source: AnalyticsDb = db) =>
  source.analytics_report_permissions.filter((grant) => grant.targetType === targetType && grant.targetId === targetId)

export const defaultDashboardId = (userId: string, source: AnalyticsDb = db) => source.preferences[userId]?.defaultDashboardId

// ---------------------------------------------------------------- reports

export interface SaveReportOptions {
  visibility?: Visibility
  status?: ReportStatus
  templateId?: string
}

export function saveReport(def: ReportDefinition, user: User, options: SaveReportOptions = {}): string {
  const existing = def.id ? reportRecord(def.id) : undefined
  if (existing && !canEditReport(user, existing, db.analytics_report_permissions)) throw new Error("You do not have permission to edit this report.")
  const id = existing ? existing.id : nextCode("RPT", db.analytics_reports.map((record) => record.id))
  const name = def.name.trim() || "Untitled report"
  const saved: ReportDefinition = { ...def, id, name }
  const now = nowIso()
  const record: ReportRecord = {
    id,
    name,
    description: def.description,
    datasetId: def.datasetId,
    createdBy: existing?.createdBy ?? user.id,
    createdAt: existing?.createdAt ?? now,
    modifiedAt: now,
    visibility: options.visibility ?? existing?.visibility ?? "private",
    status: options.status ?? existing?.status ?? "published",
    ...(options.templateId ?? existing?.templateId ? { templateId: options.templateId ?? existing?.templateId } : {}),
  }
  const tables = reportToTables(saved)
  const next: AnalyticsDb = {
    ...db,
    analytics_reports: existing ? db.analytics_reports.map((item) => (item.id === id ? record : item)) : [record, ...db.analytics_reports],
    analytics_report_fields: [...db.analytics_report_fields.filter((row) => row.reportId !== id), ...tables.fields],
    analytics_report_filters: [...db.analytics_report_filters.filter((row) => row.reportId !== id), ...tables.filters],
    analytics_report_visualizations: [...db.analytics_report_visualizations.filter((row) => row.reportId !== id), tables.visualization],
  }
  commit(withAudit(next, auditEntry(user, existing ? "report.updated" : "report.created", "report", id, `${existing ? "Updated" : "Created"} report ${name}.`)))
  return id
}

export function duplicateReport(id: string, user: User): string | null {
  const source = reportDefinition(id)
  const record = reportRecord(id)
  if (!source || !record) return null
  const copy: ReportDefinition = { ...JSON.parse(JSON.stringify(source)), id: "", name: `${source.name} (copy)` }
  const created = saveReport(copy, user, { visibility: "private", status: "draft", templateId: record.templateId })
  logAudit(user, "report.duplicated", "report", created, `Duplicated ${source.name} as ${created}.`)
  return created
}

export function renameReport(id: string, name: string, user: User) {
  const record = reportRecord(id)
  if (!record || !canEditReport(user, record, db.analytics_report_permissions)) throw new Error("You do not have permission to rename this report.")
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Enter a name for the report.")
  commit(withAudit({ ...db, analytics_reports: db.analytics_reports.map((item) => (item.id === id ? { ...item, name: trimmed, modifiedAt: nowIso() } : item)) }, auditEntry(user, "report.renamed", "report", id, `Renamed ${record.name} to ${trimmed}.`)))
}

export function setReportStatus(id: string, status: ReportStatus, user: User) {
  const record = reportRecord(id)
  if (!record || !canEditReport(user, record, db.analytics_report_permissions)) throw new Error("You do not have permission to change this report.")
  commit(withAudit({ ...db, analytics_reports: db.analytics_reports.map((item) => (item.id === id ? { ...item, status, modifiedAt: nowIso() } : item)) }, auditEntry(user, "report.updated", "report", id, `Marked ${record.name} as ${status}.`)))
}

export function deleteReport(id: string, user: User) {
  const record = reportRecord(id)
  if (!record) return
  if (!canDeleteReport(user, record)) throw new Error("Only the owner or the Secretary can delete this report.")
  commit(
    withAudit(
      {
        ...db,
        analytics_reports: db.analytics_reports.filter((item) => item.id !== id),
        analytics_report_fields: db.analytics_report_fields.filter((row) => row.reportId !== id),
        analytics_report_filters: db.analytics_report_filters.filter((row) => row.reportId !== id),
        analytics_report_visualizations: db.analytics_report_visualizations.filter((row) => row.reportId !== id),
        analytics_report_permissions: db.analytics_report_permissions.filter((grant) => !(grant.targetType === "report" && grant.targetId === id)),
      },
      auditEntry(user, "report.deleted", "report", id, `Deleted report ${record.name}.`),
    ),
  )
}

export interface ShareRequest {
  visibility: Visibility
  grants: { userId: string; access: "view" | "edit" }[]
}

export function shareItem(targetType: PermissionGrant["targetType"], id: string, request: ShareRequest, user: User) {
  const record: ReportRecord | DashboardRecord | undefined = targetType === "report" ? reportRecord(id) : dashboardRecord(id)
  if (!record) throw new Error("The item no longer exists.")
  const allowed = targetType === "report" ? canEditReport(user, record as ReportRecord, db.analytics_report_permissions) : canEditDashboard(user, record as DashboardRecord, db.analytics_report_permissions)
  if (!allowed) throw new Error("Only the owner or an editor can change sharing.")
  const now = nowIso()
  const grants: PermissionGrant[] = request.grants
    .filter((grant) => grant.userId !== record.createdBy)
    .map((grant) => ({ id: newId("g"), targetType, targetId: id, userId: grant.userId, access: grant.access, grantedBy: user.id, grantedAt: now }))
  const people = grants.map((grant) => `${userById(grant.userId)?.name ?? grant.userId} (${grant.access})`).join(", ") || "no named users"
  const next: AnalyticsDb = {
    ...db,
    analytics_report_permissions: [...db.analytics_report_permissions.filter((grant) => !(grant.targetType === targetType && grant.targetId === id)), ...grants],
    ...(targetType === "report"
      ? { analytics_reports: db.analytics_reports.map((item) => (item.id === id ? { ...item, visibility: request.visibility, modifiedAt: now } : item)) }
      : { analytics_dashboards: db.analytics_dashboards.map((item) => (item.id === id ? { ...item, visibility: request.visibility, modifiedAt: now } : item)) }),
  }
  commit(withAudit(next, auditEntry(user, targetType === "report" ? "report.shared" : "dashboard.shared", targetType, id, `Visibility ${request.visibility}. Shared with ${people}.`)))
}

// ---------------------------------------------------------------- dashboards

export function saveDashboard(def: DashboardDefinition, user: User): string {
  const existing = def.id ? dashboardRecord(def.id) : undefined
  if (existing && !canEditDashboard(user, existing, db.analytics_report_permissions)) throw new Error("You do not have permission to edit this dashboard.")
  const id = existing ? existing.id : nextCode("DSH", db.analytics_dashboards.map((record) => record.id))
  const now = nowIso()
  const name = def.name.trim() || "Untitled dashboard"
  const record: DashboardRecord = {
    id,
    name,
    description: def.description,
    createdBy: existing?.createdBy ?? user.id,
    createdAt: existing?.createdAt ?? now,
    modifiedAt: now,
    visibility: existing?.visibility ?? def.visibility ?? "private",
    columns: def.columns,
    globalFilters: def.globalFilters,
  }
  const widgets = def.widgets.map((entry, position) => ({ ...entry, dashboardId: id, position }))
  const next: AnalyticsDb = {
    ...db,
    analytics_dashboards: existing ? db.analytics_dashboards.map((item) => (item.id === id ? record : item)) : [record, ...db.analytics_dashboards],
    analytics_dashboard_widgets: [...db.analytics_dashboard_widgets.filter((row) => row.dashboardId !== id), ...widgets],
  }
  commit(withAudit(next, auditEntry(user, existing ? "dashboard.updated" : "dashboard.created", "dashboard", id, `${existing ? "Updated" : "Created"} dashboard ${name} with ${widgets.length} widgets.`)))
  return id
}

export function duplicateDashboard(id: string, user: User): string | null {
  const source = dashboardDefinition(id)
  if (!source) return null
  const copy: DashboardDefinition = { ...JSON.parse(JSON.stringify(source)), id: "", name: `${source.name} (copy)`, visibility: "private" }
  const created = saveDashboard(copy, user)
  logAudit(user, "dashboard.duplicated", "dashboard", created, `Duplicated ${source.name} as ${created}.`)
  return created
}

export function renameDashboard(id: string, name: string, user: User) {
  const record = dashboardRecord(id)
  if (!record || !canEditDashboard(user, record, db.analytics_report_permissions)) throw new Error("You do not have permission to rename this dashboard.")
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Enter a name for the dashboard.")
  commit(withAudit({ ...db, analytics_dashboards: db.analytics_dashboards.map((item) => (item.id === id ? { ...item, name: trimmed, modifiedAt: nowIso() } : item)) }, auditEntry(user, "dashboard.updated", "dashboard", id, `Renamed ${record.name} to ${trimmed}.`)))
}

export function deleteDashboard(id: string, user: User) {
  const record = dashboardRecord(id)
  if (!record) return
  if (!canDeleteDashboard(user, record)) throw new Error("Only the owner or the Secretary can delete this dashboard.")
  const preferences = Object.fromEntries(Object.entries(db.preferences).map(([userId, value]) => [userId, value.defaultDashboardId === id ? {} : value]))
  commit(
    withAudit(
      {
        ...db,
        analytics_dashboards: db.analytics_dashboards.filter((item) => item.id !== id),
        analytics_dashboard_widgets: db.analytics_dashboard_widgets.filter((row) => row.dashboardId !== id),
        analytics_saved_views: db.analytics_saved_views.filter((view) => !(view.scope === "dashboard" && view.targetId === id)),
        analytics_report_permissions: db.analytics_report_permissions.filter((grant) => !(grant.targetType === "dashboard" && grant.targetId === id)),
        preferences,
      },
      auditEntry(user, "dashboard.deleted", "dashboard", id, `Deleted dashboard ${record.name}.`),
    ),
  )
}

export function setDefaultDashboard(userId: string, id: string | null) {
  commit({ ...db, preferences: { ...db.preferences, [userId]: id ? { defaultDashboardId: id } : {} } })
}

// ---------------------------------------------------------------- saved views

export function saveView(view: Omit<SavedView, "id" | "createdAt">): string {
  const id = newId("v")
  commit({ ...db, analytics_saved_views: [{ ...view, id, createdAt: nowIso() }, ...db.analytics_saved_views] })
  return id
}

export function deleteView(id: string) {
  commit({ ...db, analytics_saved_views: db.analytics_saved_views.filter((view) => view.id !== id) })
}

// ---------------------------------------------------------------- execution history and exports

export function logExecution(entry: Omit<ExecutionRecord, "id" | "executedAt">) {
  const now = Date.now()
  const window = entry.kind === "preview" ? 90_000 : entry.kind === "nlq" ? 5_000 : 30_000
  const recent = db.analytics_execution_history.find(
    (item) =>
      item.userId === entry.userId &&
      item.kind === entry.kind &&
      item.datasetId === entry.datasetId &&
      item.reportId === entry.reportId &&
      now - Date.parse(item.executedAt) < window,
  )
  const record: ExecutionRecord = { ...entry, id: recent?.id ?? newId("h"), executedAt: nowIso() }
  const history = recent ? db.analytics_execution_history.map((item) => (item.id === recent.id ? record : item)) : [record, ...db.analytics_execution_history]
  let next: AnalyticsDb = { ...db, analytics_execution_history: history.slice(0, 200) }
  if (!recent && entry.kind !== "preview") {
    next = withAudit(next, auditEntry(userById(entry.userId) ?? null, "report.executed", "report", entry.reportId ?? entry.datasetId, `Ran ${entry.reportName} on ${entry.datasetId} (${entry.rowCount} ${entry.rowCount === 1 ? "row" : "rows"}).`))
  }
  commit(next)
}

export function clearHistory(userId: string) {
  commit({ ...db, analytics_execution_history: db.analytics_execution_history.filter((item) => item.userId !== userId) })
}

export function logExport(user: User, target: { reportId: string | null; name: string; datasetId: string }, format: string, rows: number) {
  commit(withAudit(db, auditEntry(user, "report.exported", target.reportId ? "report" : "dataset", target.reportId ?? target.datasetId, `Exported ${target.name} as ${format} (${rows} ${rows === 1 ? "row" : "rows"}).`)))
}
