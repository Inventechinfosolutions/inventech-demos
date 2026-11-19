import { DATASETS } from "@/analytics/catalog"
import type { Dataset, DashboardRecord, PermissionGrant, ReportRecord, User } from "@/analytics/types"

// Role based access. Dataset access, record detail, report visibility and deletion are all decided here.

export const canAccessDataset = (user: User, dataset: Dataset) => dataset.access.roles.includes(user.role)

export const canViewRecordDetail = (user: User, dataset: Dataset) => dataset.access.recordDetail.includes(user.role)

export const datasetsFor = (user: User) => DATASETS.filter((dataset) => canAccessDataset(user, dataset))

export function accessReason(user: User, dataset: Dataset) {
  if (canAccessDataset(user, dataset)) {
    if (dataset.pii && !canViewRecordDetail(user, dataset)) return "Aggregated figures only. Individual records are not available to this role."
    return "Available to this role."
  }
  return dataset.pii
    ? "Not available to this role. The dataset holds personal information that is limited to authorised roles."
    : "Not available to this role. Ask the dataset owner for access."
}

export function scopeSummary(user: User, dataset: Dataset): string[] {
  const notes: string[] = []
  if (user.districtScope && dataset.scope.district) notes.push(`${user.districtScope} district only`)
  if (user.departmentScope && dataset.scope.department) notes.push(`${user.departmentScope} only`)
  return notes
}

type Shareable = { id: string; createdBy: string; visibility: ReportRecord["visibility"] }

function hasGrant(grants: PermissionGrant[], targetType: PermissionGrant["targetType"], targetId: string, userId: string, access?: "edit") {
  return grants.some((grant) => grant.targetType === targetType && grant.targetId === targetId && grant.userId === userId && (!access || grant.access === access))
}

function ownerDepartment(userId: string, users: User[]) {
  return users.find((user) => user.id === userId)?.department
}

export function canViewItem(user: User, item: Shareable, targetType: PermissionGrant["targetType"], grants: PermissionGrant[], users: User[]) {
  if (item.createdBy === user.id) return true
  if (item.visibility === "portal") return true
  if (item.visibility === "department" && ownerDepartment(item.createdBy, users) === user.department) return true
  return hasGrant(grants, targetType, item.id, user.id)
}

export function canEditItem(user: User, item: Shareable, targetType: PermissionGrant["targetType"], grants: PermissionGrant[]) {
  if (item.createdBy === user.id) return true
  return hasGrant(grants, targetType, item.id, user.id, "edit")
}

export const canViewReport = (user: User, report: ReportRecord, grants: PermissionGrant[], users: User[]) => canViewItem(user, report, "report", grants, users)
export const canEditReport = (user: User, report: ReportRecord, grants: PermissionGrant[]) => canEditItem(user, report, "report", grants)
export const canDeleteReport = (user: User, report: ReportRecord) => report.createdBy === user.id || user.canDeleteAny
export const canViewDashboard = (user: User, dashboard: DashboardRecord, grants: PermissionGrant[], users: User[]) => canViewItem(user, dashboard, "dashboard", grants, users)
export const canEditDashboard = (user: User, dashboard: DashboardRecord, grants: PermissionGrant[]) => canEditItem(user, dashboard, "dashboard", grants)
export const canDeleteDashboard = (user: User, dashboard: DashboardRecord) => dashboard.createdBy === user.id || user.canDeleteAny
