import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { canDeleteReport, canEditReport } from "@/analytics/access"
import { DATASETS, datasetById } from "@/analytics/catalog"
import { RenameDialog, ShareDialog, VISIBILITY_LABEL } from "@/analytics/components/dialogs"
import { Badge, Button, ConfirmDialog, EmptyState, MenuItem, Popover, cardClass, fieldClass, formatDay, notify } from "@/analytics/components/ui"
import { exportSavedReport } from "@/analytics/exportSaved"
import type { ExportFormat } from "@/analytics/exporters"
import { useCurrentUser } from "@/analytics/session"
import { deleteReport, duplicateReport, renameReport, useDb, visibleReports } from "@/analytics/store"
import type { ReportRecord, Visibility } from "@/analytics/types"
import { userById } from "@/analytics/users"

export default function SavedReportsPage() {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [datasetId, setDatasetId] = useState("")
  const [visibility, setVisibility] = useState<"" | Visibility>("")
  const [status, setStatus] = useState("")
  const [owner, setOwner] = useState<"all" | "mine">("all")
  const [dialog, setDialog] = useState<{ kind: "rename" | "delete" | "share"; report: ReportRecord } | null>(null)

  const all = visibleReports(user, db)
  const rows = all.filter(
    (report) =>
      (!datasetId || report.datasetId === datasetId) &&
      (!visibility || report.visibility === visibility) &&
      (!status || report.status === status) &&
      (owner === "all" || report.createdBy === user.id) &&
      `${report.id} ${report.name} ${report.description}`.toLowerCase().includes(query.toLowerCase()),
  )
  const filtered = Boolean(query || datasetId || visibility || status || owner === "mine")

  const runExport = async (report: ReportRecord, format: ExportFormat, close: () => void) => {
    close()
    try {
      await exportSavedReport(report.id, format, user)
      notify(`${report.name} exported as ${format === "xlsx" ? "Excel" : format.toUpperCase()}.`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "The export failed.", "red")
    }
  }

  return (
    <section className={`${cardClass} p-4 sm:p-5`} aria-label="Saved reports">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--c-text-461220)]">Saved reports</h2>
          <p className="text-xs text-[color:var(--c-text-9d8189)]">
            {rows.length} of {all.length} shown
          </p>
        </div>
        <Link to="/analytics/build-report">
          <Button variant="primary">New report</Button>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <input aria-label="Search reports" className={`${fieldClass} col-span-2 lg:col-span-1`} placeholder="Search by name or ID" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Dataset" className={fieldClass} value={datasetId} onChange={(event) => setDatasetId(event.target.value)}>
          <option value="">All datasets</option>
          {DATASETS.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>
        <select aria-label="Visibility" className={fieldClass} value={visibility} onChange={(event) => setVisibility(event.target.value as "" | Visibility)}>
          <option value="">Any visibility</option>
          {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((item) => (
            <option key={item} value={item}>
              {VISIBILITY_LABEL[item]}
            </option>
          ))}
        </select>
        <select aria-label="Status" className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select aria-label="Created by" className={fieldClass} value={owner} onChange={(event) => setOwner(event.target.value as "all" | "mine")}>
          <option value="all">Created by anyone</option>
          <option value="mine">Created by me</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={filtered ? "No report matches these filters" : "No saved reports yet"}
            action={
              filtered ? (
                <Button
                  onClick={() => {
                    setQuery("")
                    setDatasetId("")
                    setVisibility("")
                    setStatus("")
                    setOwner("all")
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link to="/analytics/build-report">
                  <Button variant="primary">Build the first report</Button>
                </Link>
              )
            }
          >
            {filtered ? "Try a different search or clear the filters." : "Reports you save are listed here."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--c-border-fee2d5)]">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-[color:var(--c-bg-ffeee7)] text-left text-xs font-semibold text-[color:var(--c-text-663a46)]">
              <tr>
                {["Report ID", "Name", "Dataset", "Created by", "Created", "Modified", "Visibility", "Status", ""].map((heading) => (
                  <th key={heading || "actions"} scope="col" className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2.5 whitespace-nowrap">
                    {heading || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((report) => {
                const editable = canEditReport(user, report, db.analytics_report_permissions)
                const deletable = canDeleteReport(user, report)
                return (
                  <tr key={report.id} className="border-b border-[color:var(--c-border-ffeae1)] align-top last:border-b-0 hover:bg-[color:var(--c-bg-fff8f4)]">
                    <td className="px-3 py-3 font-medium whitespace-nowrap text-[color:var(--c-text-8c2f39)]">{report.id}</td>
                    <td className="min-w-[240px] max-w-[320px] px-3 py-3">
                      <Link to={`/analytics/reports/${report.id}`} className="font-semibold text-[color:var(--c-text-461220)] hover:text-[color:var(--c-text-8c2f39)]">
                        {report.name}
                      </Link>
                      {report.description ? <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[color:var(--c-text-86646d)]">{report.description}</p> : null}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[color:var(--c-text-663a46)]">{datasetById(report.datasetId)?.name ?? report.datasetId}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-[color:var(--c-text-663a46)]">{userById(report.createdBy)?.title ?? report.createdBy}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-[color:var(--c-text-86646d)]">{formatDay(report.createdAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-[color:var(--c-text-86646d)]">{formatDay(report.modifiedAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge>{VISIBILITY_LABEL[report.visibility]}</Badge>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge tone={report.status === "published" ? "green" : "neutral"}>{report.status === "published" ? "Published" : "Draft"}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Popover label="Actions ▾" size="sm" align="right">
                        {(close) => (
                          <div role="menu" aria-label={`Actions for ${report.name}`}>
                            <MenuItem onClick={() => navigate(`/analytics/reports/${report.id}`)}>Open</MenuItem>
                            <MenuItem disabled={!editable} title={editable ? undefined : "Only the owner and editors can edit"} onClick={() => navigate(`/analytics/build-report/${report.id}`)}>
                              Edit
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                close()
                                const copy = duplicateReport(report.id, user)
                                if (copy) notify(`Duplicated as ${copy}. The copy is a private draft.`)
                              }}
                            >
                              Duplicate
                            </MenuItem>
                            <MenuItem disabled={!editable} title={editable ? undefined : "Only the owner and editors can rename"} onClick={() => { close(); setDialog({ kind: "rename", report }) }}>
                              Rename
                            </MenuItem>
                            <MenuItem disabled={!editable} title={editable ? undefined : "Only the owner and editors can share"} onClick={() => { close(); setDialog({ kind: "share", report }) }}>
                              Share
                            </MenuItem>
                            <div className="my-1 border-t border-[color:var(--c-border-fee4d8)]" />
                            <MenuItem onClick={() => void runExport(report, "xlsx", close)}>Export to Excel</MenuItem>
                            <MenuItem onClick={() => void runExport(report, "csv", close)}>Export to CSV</MenuItem>
                            <MenuItem onClick={() => void runExport(report, "pdf", close)}>Export to PDF</MenuItem>
                            <div className="my-1 border-t border-[color:var(--c-border-fee4d8)]" />
                            <MenuItem danger disabled={!deletable} title={deletable ? undefined : "Only the owner or the Secretary can delete"} onClick={() => { close(); setDialog({ kind: "delete", report }) }}>
                              Delete
                            </MenuItem>
                          </div>
                        )}
                      </Popover>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === "rename" ? <RenameDialog title="Rename report" initial={dialog.report.name} onClose={() => setDialog(null)} onSubmit={(name) => { renameReport(dialog.report.id, name, user); notify("Report renamed.") }} /> : null}
      {dialog?.kind === "share" ? <ShareDialog targetType="report" id={dialog.report.id} name={dialog.report.name} datasetIds={[dialog.report.datasetId]} user={user} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === "delete" ? (
        <ConfirmDialog
          title="Delete report?"
          confirmLabel="Delete report"
          danger
          onClose={() => setDialog(null)}
          onConfirm={() => {
            try {
              deleteReport(dialog.report.id, user)
              notify(`${dialog.report.name} deleted.`)
            } catch (caught) {
              notify(caught instanceof Error ? caught.message : "The report could not be deleted.", "red")
            }
            setDialog(null)
          }}
        >
          {dialog.report.id}, {dialog.report.name}, will be removed. Dashboard widgets that use it will show that the report is unavailable.
        </ConfirmDialog>
      ) : null}
    </section>
  )
}
