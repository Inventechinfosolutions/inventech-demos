import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { canDeleteDashboard, canEditDashboard, canViewDashboard } from "@/analytics/access"
import { DashboardSurface } from "@/analytics/components/DashboardSurface"
import { RenameDialog, ShareDialog, VISIBILITY_LABEL } from "@/analytics/components/dialogs"
import { Badge, Button, ConfirmDialog, EmptyState, MenuItem, Popover, formatDay, notify } from "@/analytics/components/ui"
import { useDashboardState } from "@/analytics/dashboardState"
import { reportRecord } from "@/analytics/store"
import { useCurrentUser } from "@/analytics/session"
import { dashboardDefinition, defaultDashboardId, deleteDashboard, deleteView, duplicateDashboard, renameDashboard, saveView, setDefaultDashboard, useDb, dashboardRecord } from "@/analytics/store"
import { USERS, userById } from "@/analytics/users"
import { defaultGlobalFilters } from "@/analytics/seed"

export default function DashboardViewPage() {
  const { id } = useParams()
  return <View key={id} id={id ?? ""} />
}

function View({ id }: { id: string }) {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const record = dashboardRecord(id, db)
  const state = useDashboardState(record?.globalFilters ?? defaultGlobalFilters())
  const [dialog, setDialog] = useState<"rename" | "share" | "delete" | "view" | null>(null)

  if (!record) {
    return (
      <EmptyState title="This dashboard no longer exists" action={<Link to="/analytics/dashboards"><Button>Back to saved dashboards</Button></Link>}>
        It may have been deleted.
      </EmptyState>
    )
  }
  if (!canViewDashboard(user, record, db.analytics_report_permissions, USERS)) {
    return (
      <EmptyState title="You do not have access to this dashboard" action={<Link to="/analytics/dashboards"><Button>Back to saved dashboards</Button></Link>}>
        {record.name} is private to {userById(record.createdBy)?.name ?? "its owner"}. Ask them to share it with you.
      </EmptyState>
    )
  }
  const def = dashboardDefinition(id, db)
  if (!def) return null
  const editable = canEditDashboard(user, record, db.analytics_report_permissions)
  const isDefault = defaultDashboardId(user.id, db) === id
  const views = db.analytics_saved_views.filter((view) => view.scope === "dashboard" && view.targetId === id && view.ownerId === user.id)
  const missing = def.widgets.filter((widget) => !reportRecord(widget.reportId, db)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">{record.name}</h2>
            <Badge tone="brass">{record.id}</Badge>
            {isDefault ? <Badge tone="green">Your default</Badge> : null}
            <Badge>{VISIBILITY_LABEL[record.visibility]}</Badge>
          </div>
          {record.description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--c-text-663a46)]">{record.description}</p> : null}
          <p className="mt-1 text-xs text-[color:var(--c-text-9d8189)]">
            Owner {userById(record.createdBy)?.name ?? record.createdBy}. Updated {formatDay(record.modifiedAt)}. {def.widgets.length} widget{def.widgets.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover label="Saved views ▾" align="right">
            {(close) => (
              <div className="w-72">
                <MenuItem
                  onClick={() => {
                    close()
                    setDialog("view")
                  }}
                >
                  Save the current view
                </MenuItem>
                <div className="my-1 border-t border-[color:var(--c-border-fee4d8)]" />
                {views.length === 0 ? <p className="px-3 py-2 text-xs text-[color:var(--c-text-9d8189)]">No saved views yet. A view keeps your filters and chart selections.</p> : null}
                {views.map((view) => (
                  <div key={view.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-[color:var(--c-bg-ffeee7)]"
                      onClick={() => {
                        state.restore(view)
                        close()
                        notify(`View ${view.name} applied.`)
                      }}
                    >
                      {view.name}
                    </button>
                    <button type="button" aria-label={`Delete view ${view.name}`} className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--c-text-9d8189)] hover:bg-[color:var(--c-bg-ffe9df)] hover:text-[color:var(--c-text-8c2f39)]" onClick={() => deleteView(view.id)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Popover>
          <Popover label="More ▾" align="right">
            {(close) => (
              <div role="menu">
                <MenuItem
                  onClick={() => {
                    setDefaultDashboard(user.id, isDefault ? null : id)
                    notify(isDefault ? "Default dashboard cleared." : `${record.name} is now your default dashboard.`)
                    close()
                  }}
                >
                  {isDefault ? "Remove as default" : "Set as my default"}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    const copy = duplicateDashboard(id, user)
                    close()
                    if (copy) {
                      notify(`Duplicated as ${copy}.`)
                      navigate(`/analytics/dashboards/${copy}`)
                    }
                  }}
                >
                  Duplicate
                </MenuItem>
                <MenuItem disabled={!editable} title={editable ? undefined : "Only the owner and editors can rename"} onClick={() => { close(); setDialog("rename") }}>
                  Rename
                </MenuItem>
                <MenuItem disabled={!editable} title={editable ? undefined : "Only the owner and editors can share"} onClick={() => { close(); setDialog("share") }}>
                  Share
                </MenuItem>
                <MenuItem danger disabled={!canDeleteDashboard(user, record)} title={canDeleteDashboard(user, record) ? undefined : "Only the owner or the Secretary can delete"} onClick={() => { close(); setDialog("delete") }}>
                  Delete
                </MenuItem>
              </div>
            )}
          </Popover>
          {editable ? (
            <Link to={`/analytics/build-dashboard/${id}`}>
              <Button variant="primary">Edit dashboard</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {missing > 0 ? <p className="text-xs text-[color:var(--c-text-b23a48)]">{missing} widget{missing === 1 ? " uses" : "s use"} a report that has been deleted.</p> : null}

      {def.widgets.length === 0 ? (
        <EmptyState title="This dashboard has no widgets yet" action={editable ? <Link to={`/analytics/build-dashboard/${id}`}><Button variant="primary">Add widgets</Button></Link> : undefined}>
          Widgets show saved reports as charts, KPI cards, tables and maps.
        </EmptyState>
      ) : (
        <DashboardSurface widgets={def.widgets} state={state} defaults={def.globalFilters} editable={false} />
      )}

      {dialog === "rename" ? <RenameDialog title="Rename dashboard" initial={record.name} onClose={() => setDialog(null)} onSubmit={(name) => { renameDashboard(id, name, user); notify("Dashboard renamed.") }} /> : null}
      {dialog === "view" ? <RenameDialog title="Save the current view" confirmLabel="Save view" initial="" onClose={() => setDialog(null)} onSubmit={(name) => { saveView({ ownerId: user.id, name, scope: "dashboard", targetId: id, globalFilters: state.global, crossFilters: state.cross }); notify(`View ${name} saved.`) }} /> : null}
      {dialog === "share" ? <ShareDialog targetType="dashboard" id={id} name={record.name} datasetIds={[...new Set(def.widgets.map((widget) => reportRecord(widget.reportId, db)?.datasetId).filter((value): value is string => Boolean(value)))]} user={user} onClose={() => setDialog(null)} /> : null}
      {dialog === "delete" ? (
        <ConfirmDialog
          title="Delete dashboard?"
          confirmLabel="Delete dashboard"
          danger
          onClose={() => setDialog(null)}
          onConfirm={() => {
            try {
              deleteDashboard(id, user)
              notify(`${record.name} deleted.`)
              navigate("/analytics/dashboards", { replace: true })
            } catch (caught) {
              notify(caught instanceof Error ? caught.message : "The dashboard could not be deleted.", "red")
              setDialog(null)
            }
          }}
        >
          {record.name} and its widget layout will be removed. The reports it uses are not deleted.
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
