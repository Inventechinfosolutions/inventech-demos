import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { canDeleteDashboard, canEditDashboard } from "@/analytics/access"
import { RenameDialog, ShareDialog, VISIBILITY_LABEL } from "@/analytics/components/dialogs"
import { Badge, Button, ConfirmDialog, EmptyState, MenuItem, Popover, cardClass, formatDay, notify } from "@/analytics/components/ui"
import { useCurrentUser } from "@/analytics/session"
import { defaultDashboardId, deleteDashboard, duplicateDashboard, renameDashboard, reportRecord, setDefaultDashboard, useDb, visibleDashboards } from "@/analytics/store"
import type { DashboardRecord } from "@/analytics/types"
import { userById } from "@/analytics/users"

export default function SavedDashboardsPage() {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<{ kind: "rename" | "delete" | "share"; dashboard: DashboardRecord } | null>(null)
  const dashboards = visibleDashboards(user, db)
  const defaultId = defaultDashboardId(user.id, db)

  return (
    <section aria-label="Saved dashboards">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--c-text-461220)]">Saved dashboards</h2>
          <p className="text-xs text-[color:var(--c-text-9d8189)]">{dashboards.length} available to you</p>
        </div>
        <Link to="/analytics/build-dashboard">
          <Button variant="primary">New dashboard</Button>
        </Link>
      </div>

      {dashboards.length === 0 ? (
        <EmptyState title="No dashboards yet" action={<Link to="/analytics/build-dashboard"><Button variant="primary">Build a dashboard</Button></Link>}>
          Dashboards you build or that are shared with you are listed here.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboards.map((dashboard) => {
            const widgets = db.analytics_dashboard_widgets.filter((widget) => widget.dashboardId === dashboard.id)
            const editable = canEditDashboard(user, dashboard, db.analytics_report_permissions)
            const deletable = canDeleteDashboard(user, dashboard)
            const isDefault = dashboard.id === defaultId
            const reportNames = [...new Set(widgets.map((widget) => reportRecord(widget.reportId, db)?.name).filter(Boolean))]
            return (
              <article key={dashboard.id} className={`${cardClass} flex flex-col p-5 ${isDefault ? "ring-1 ring-[color:var(--c-border-b23a48)]" : ""}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brass">{dashboard.id}</Badge>
                  {isDefault ? <Badge tone="green">Your default</Badge> : null}
                  <Badge>{VISIBILITY_LABEL[dashboard.visibility]}</Badge>
                </div>
                <h3 className="mt-2 text-base font-semibold text-[color:var(--c-text-461220)]">
                  <Link to={`/analytics/dashboards/${dashboard.id}`} className="hover:text-[color:var(--c-text-8c2f39)]">
                    {dashboard.name}
                  </Link>
                </h3>
                {dashboard.description ? <p className="mt-1 line-clamp-3 text-sm leading-6 text-[color:var(--c-text-663a46)]">{dashboard.description}</p> : null}
                <p className="mt-2 text-xs leading-5 text-[color:var(--c-text-86646d)]">
                  {widgets.length} widget{widgets.length === 1 ? "" : "s"}
                  {reportNames.length ? `. ${reportNames.slice(0, 3).join(", ")}${reportNames.length > 3 ? " and more" : ""}` : ""}
                </p>
                <p className="mt-1 text-xs text-[color:var(--c-text-9d8189)]">
                  {userById(dashboard.createdBy)?.title ?? dashboard.createdBy}. Updated {formatDay(dashboard.modifiedAt)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                  <Link to={`/analytics/dashboards/${dashboard.id}`}>
                    <Button variant="primary" size="sm">
                      Open
                    </Button>
                  </Link>
                  <Button size="sm" disabled={!editable} title={editable ? undefined : "Only the owner and editors can edit"} onClick={() => navigate(`/analytics/build-dashboard/${dashboard.id}`)}>
                    Edit
                  </Button>
                  <Popover label="More ▾" size="sm" align="right" className="ml-auto">
                    {(close) => (
                      <div role="menu" aria-label={`Actions for ${dashboard.name}`}>
                        <MenuItem
                          onClick={() => {
                            close()
                            setDefaultDashboard(user.id, isDefault ? null : dashboard.id)
                            notify(isDefault ? "Default dashboard cleared." : `${dashboard.name} is now your default dashboard.`)
                          }}
                        >
                          {isDefault ? "Remove as default" : "Set as my default"}
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            close()
                            const copy = duplicateDashboard(dashboard.id, user)
                            if (copy) notify(`Duplicated as ${copy}. The copy is private.`)
                          }}
                        >
                          Duplicate
                        </MenuItem>
                        <MenuItem disabled={!editable} onClick={() => { close(); setDialog({ kind: "rename", dashboard }) }}>
                          Rename
                        </MenuItem>
                        <MenuItem disabled={!editable} onClick={() => { close(); setDialog({ kind: "share", dashboard }) }}>
                          Share
                        </MenuItem>
                        <MenuItem danger disabled={!deletable} title={deletable ? undefined : "Only the owner or the Secretary can delete"} onClick={() => { close(); setDialog({ kind: "delete", dashboard }) }}>
                          Delete
                        </MenuItem>
                      </div>
                    )}
                  </Popover>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {dialog?.kind === "rename" ? <RenameDialog title="Rename dashboard" initial={dialog.dashboard.name} onClose={() => setDialog(null)} onSubmit={(name) => { renameDashboard(dialog.dashboard.id, name, user); notify("Dashboard renamed.") }} /> : null}
      {dialog?.kind === "share" ? (
        <ShareDialog
          targetType="dashboard"
          id={dialog.dashboard.id}
          name={dialog.dashboard.name}
          datasetIds={[...new Set(db.analytics_dashboard_widgets.filter((widget) => widget.dashboardId === dialog.dashboard.id).map((widget) => reportRecord(widget.reportId, db)?.datasetId).filter((value): value is string => Boolean(value)))]}
          user={user}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "delete" ? (
        <ConfirmDialog
          title="Delete dashboard?"
          confirmLabel="Delete dashboard"
          danger
          onClose={() => setDialog(null)}
          onConfirm={() => {
            try {
              deleteDashboard(dialog.dashboard.id, user)
              notify(`${dialog.dashboard.name} deleted.`)
            } catch (caught) {
              notify(caught instanceof Error ? caught.message : "The dashboard could not be deleted.", "red")
            }
            setDialog(null)
          }}
        >
          {dialog.dashboard.name} and its widget layout will be removed. The reports it uses are not deleted.
        </ConfirmDialog>
      ) : null}
    </section>
  )
}
