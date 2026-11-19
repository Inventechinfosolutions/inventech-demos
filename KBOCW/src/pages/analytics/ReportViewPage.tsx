import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { canDeleteReport, canEditReport, canViewReport } from "@/analytics/access"
import { datasetById } from "@/analytics/catalog"
import { JsonDialog, RenameDialog, ShareDialog, VISIBILITY_LABEL } from "@/analytics/components/dialogs"
import { ReportExplorer } from "@/analytics/components/ReportExplorer"
import { Badge, Button, ConfirmDialog, EmptyState, MenuItem, Notice, Popover, formatDay, notify } from "@/analytics/components/ui"
import { useCurrentUser } from "@/analytics/session"
import { deleteReport, duplicateReport, renameReport, reportDefinition, reportRecord, useDb } from "@/analytics/store"
import { USERS, userById } from "@/analytics/users"

export default function ReportViewPage() {
  const { id } = useParams()
  return <View key={id} id={id ?? ""} />
}

function View({ id }: { id: string }) {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<"rename" | "share" | "delete" | "json" | null>(null)
  const record = reportRecord(id, db)

  if (!record) {
    return (
      <EmptyState title="This report no longer exists" action={<Link to="/analytics/reports"><Button>Back to saved reports</Button></Link>}>
        It may have been deleted.
      </EmptyState>
    )
  }
  if (!canViewReport(user, record, db.analytics_report_permissions, USERS)) {
    return (
      <EmptyState title="You do not have access to this report" action={<Link to="/analytics/reports"><Button>Back to saved reports</Button></Link>}>
        {record.name} is private to {userById(record.createdBy)?.name ?? "its owner"}. Ask them to share it with you.
      </EmptyState>
    )
  }
  const def = reportDefinition(id, db)
  const dataset = datasetById(record.datasetId)
  if (!def) return null
  const editable = canEditReport(user, record, db.analytics_report_permissions)
  const deletable = canDeleteReport(user, record)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">{record.name}</h2>
            <Badge tone="brass">{record.id}</Badge>
            <Badge tone={record.status === "published" ? "green" : "neutral"}>{record.status === "published" ? "Published" : "Draft"}</Badge>
            <Badge>{VISIBILITY_LABEL[record.visibility]}</Badge>
          </div>
          {record.description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--c-text-663a46)]">{record.description}</p> : null}
          <p className="mt-1 text-xs text-[color:var(--c-text-9d8189)]">
            {dataset?.name}. Created by {userById(record.createdBy)?.name ?? record.createdBy} on {formatDay(record.createdAt)}. Modified {formatDay(record.modifiedAt)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => navigate("/analytics/build-dashboard", { state: { addReportId: record.id, nonce: Date.now() } })}>Add to a dashboard</Button>
          <Popover label="More ▾" align="right">
            {(close) => (
              <div role="menu">
                <MenuItem
                  onClick={() => {
                    close()
                    const copy = duplicateReport(id, user)
                    if (copy) {
                      notify(`Duplicated as ${copy}. The copy is a private draft.`)
                      navigate(`/analytics/reports/${copy}`)
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
                <MenuItem onClick={() => { close(); setDialog("json") }}>View definition</MenuItem>
                <MenuItem danger disabled={!deletable} title={deletable ? undefined : "Only the owner or the Secretary can delete"} onClick={() => { close(); setDialog("delete") }}>
                  Delete
                </MenuItem>
              </div>
            )}
          </Popover>
          {editable ? (
            <Link to={`/analytics/build-report/${id}`}>
              <Button variant="primary">Edit report</Button>
            </Link>
          ) : (
            <Button onClick={() => navigate("/analytics/build-report", { state: { definition: def, nonce: Date.now() } })}>Edit a copy</Button>
          )}
        </div>
      </div>
      {record.status === "draft" ? <Notice tone="brass">This report is a draft. Only people it was shared with can see it until it is published.</Notice> : null}

      <ReportExplorer def={def} logKind="saved" />

      {dialog === "rename" ? <RenameDialog title="Rename report" initial={record.name} onClose={() => setDialog(null)} onSubmit={(name) => { renameReport(id, name, user); notify("Report renamed.") }} /> : null}
      {dialog === "share" ? <ShareDialog targetType="report" id={id} name={record.name} datasetIds={[record.datasetId]} user={user} onClose={() => setDialog(null)} /> : null}
      {dialog === "json" ? <JsonDialog def={def} canImport={false} onImport={() => undefined} onClose={() => setDialog(null)} /> : null}
      {dialog === "delete" ? (
        <ConfirmDialog
          title="Delete report?"
          confirmLabel="Delete report"
          danger
          onClose={() => setDialog(null)}
          onConfirm={() => {
            try {
              deleteReport(id, user)
              notify(`${record.name} deleted.`)
              navigate("/analytics/reports", { replace: true })
            } catch (caught) {
              notify(caught instanceof Error ? caught.message : "The report could not be deleted.", "red")
              setDialog(null)
            }
          }}
        >
          {record.id}, {record.name}, will be removed. Dashboard widgets that use it will show that the report is unavailable.
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
