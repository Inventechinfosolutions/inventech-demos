import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { datasetById } from "@/analytics/catalog"
import { Badge, Button, ConfirmDialog, EmptyState, Segmented, cardClass, fieldClass, formatDateTime, notify } from "@/analytics/components/ui"
import { useCurrentUser } from "@/analytics/session"
import { clearHistory, resetDemoData, useDb, visibleReports } from "@/analytics/store"
import type { AuditAction, ExecutionRecord } from "@/analytics/types"
import { USERS, userById } from "@/analytics/users"

const KIND_LABEL: Record<ExecutionRecord["kind"], string> = {
  preview: "Builder preview",
  saved: "Saved report",
  dashboard: "Dashboard widget",
  nlq: "Question",
  export: "Export",
}

const ACTION_LABEL: Record<AuditAction, string> = {
  "report.created": "Report created",
  "report.updated": "Report updated",
  "report.renamed": "Report renamed",
  "report.duplicated": "Report duplicated",
  "report.deleted": "Report deleted",
  "report.executed": "Report run",
  "report.exported": "Export",
  "report.shared": "Report shared",
  "dashboard.created": "Dashboard created",
  "dashboard.updated": "Dashboard updated",
  "dashboard.deleted": "Dashboard deleted",
  "dashboard.duplicated": "Dashboard duplicated",
  "dashboard.shared": "Dashboard shared",
  "access.denied": "Access denied",
  "session.role-changed": "Role changed",
}

export default function RecentAnalysisPage() {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const [tab, setTab] = useState<"mine" | "audit">("mine")
  const [action, setAction] = useState("")
  const [who, setWho] = useState("")
  const [confirm, setConfirm] = useState<"history" | "reset" | null>(null)

  const mine = db.analytics_execution_history.filter((item) => item.userId === user.id)
  const reports = visibleReports(user, db)
  const audit = db.analytics_audit_log.filter((entry) => (user.canViewAudit ? !who || entry.userId === who : entry.userId === user.id) && (!action || entry.action === action))
  const counts = {
    exports: db.analytics_audit_log.filter((entry) => entry.action === "report.exported").length,
    shares: db.analytics_audit_log.filter((entry) => entry.action === "report.shared" || entry.action === "dashboard.shared").length,
    denied: db.analytics_audit_log.filter((entry) => entry.action === "access.denied").length,
    runs: db.analytics_audit_log.filter((entry) => entry.action === "report.executed").length,
  }

  return (
    <section className={`${cardClass} p-4 sm:p-5`} aria-label="Recent analysis">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--c-text-461220)]">Recent analysis</h2>
          <p className="text-xs text-[color:var(--c-text-9d8189)]">{tab === "mine" ? `${mine.length} runs by ${user.title}` : user.canViewAudit ? "Report creation, runs, exports, shares and access decisions across the workspace" : "Your own activity"}</p>
        </div>
        <Segmented label="View" value={tab} onChange={setTab} options={[{ id: "mine", label: "My analysis" }, { id: "audit", label: user.canViewAudit ? "Audit trail" : "My activity" }]} />
      </div>

      {tab === "mine" ? (
        <>
          <div className="mt-4 flex justify-end">
            <Button size="sm" disabled={mine.length === 0} onClick={() => setConfirm("history")}>
              Clear my history
            </Button>
          </div>
          {mine.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No analysis yet" action={<Link to="/analytics/build-report"><Button variant="primary">Build a report</Button></Link>}>
                Reports you preview, open or export are listed here so you can pick up where you left off.
              </EmptyState>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-[color:var(--c-border-fee2d5)]">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead className="bg-[color:var(--c-bg-ffeee7)] text-left text-xs font-semibold text-[color:var(--c-text-663a46)]">
                  <tr>
                    {["When", "Report or question", "Dataset", "Type", "Rows", "Time", "Filters", ""].map((heading) => (
                      <th key={heading || "open"} scope="col" className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2.5 whitespace-nowrap">
                        {heading || <span className="sr-only">Reopen</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mine.map((item) => {
                    const exists = item.reportId ? reports.some((report) => report.id === item.reportId) : false
                    return (
                      <tr key={item.id} className="border-b border-[color:var(--c-border-ffeae1)] align-top last:border-b-0 hover:bg-[color:var(--c-bg-fff8f4)]">
                        <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--c-text-86646d)]">{formatDateTime(item.executedAt)}</td>
                        <td className="max-w-[280px] px-3 py-2.5 font-medium text-[color:var(--c-text-461220)]">{item.reportName}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--c-text-663a46)]">{datasetById(item.datasetId)?.name}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge tone={item.kind === "saved" ? "blue" : item.kind === "dashboard" ? "brass" : "neutral"}>{KIND_LABEL[item.kind]}</Badge>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{item.rowCount.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums text-[color:var(--c-text-86646d)]">{item.durationMs} ms</td>
                        <td className="max-w-[260px] px-3 py-2.5 text-xs leading-5 text-[color:var(--c-text-86646d)]" title={item.filters.join(". ")}>
                          {item.filters.length === 0 ? "None" : `${item.filters.length}. ${item.filters[0]}`}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          {exists ? (
                            <Link to={`/analytics/reports/${item.reportId}`} className="text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">
                              Open
                            </Link>
                          ) : item.snapshot ? (
                            <button type="button" className="text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline" onClick={() => navigate("/analytics/build-report", { state: { definition: item.snapshot, nonce: Date.now() } })}>
                              Reopen in builder
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {user.canViewAudit ? (
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Report runs", counts.runs],
                ["Exports", counts.exports],
                ["Shares", counts.shares],
                ["Access denied", counts.denied],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] px-3 py-2.5">
                  <p className="text-xs font-semibold text-[color:var(--c-text-86646d)]">{label}</p>
                  <p className="text-xl font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-xl">
            <select aria-label="Event" className={fieldClass} value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="">All events</option>
              {(Object.keys(ACTION_LABEL) as AuditAction[]).map((item) => (
                <option key={item} value={item}>
                  {ACTION_LABEL[item]}
                </option>
              ))}
            </select>
            {user.canViewAudit ? (
              <select aria-label="User" className={fieldClass} value={who} onChange={(event) => setWho(event.target.value)}>
                <option value="">All users</option>
                {USERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {audit.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No events match">Change the event or user filter.</EmptyState>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-[color:var(--c-border-fee2d5)]">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead className="bg-[color:var(--c-bg-ffeee7)] text-left text-xs font-semibold text-[color:var(--c-text-663a46)]">
                  <tr>
                    {["When", "User", "Event", "Item", "Detail"].map((heading) => (
                      <th key={heading} scope="col" className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2.5 whitespace-nowrap">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.slice(0, 150).map((entry) => (
                    <tr key={entry.id} className="border-b border-[color:var(--c-border-ffeae1)] align-top last:border-b-0">
                      <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--c-text-86646d)]">{formatDateTime(entry.at)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{userById(entry.userId)?.title ?? entry.userId}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Badge tone={entry.action === "access.denied" ? "red" : entry.action === "report.exported" ? "brass" : entry.action.endsWith("shared") ? "blue" : "neutral"}>{ACTION_LABEL[entry.action]}</Badge>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--c-text-663a46)]">{entry.targetId}</td>
                      <td className="px-3 py-2.5 text-xs leading-5 text-[color:var(--c-text-663a46)]">{entry.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setConfirm("reset")}>
              Reset demonstration data
            </Button>
          </div>
        </>
      )}

      {confirm === "history" ? (
        <ConfirmDialog title="Clear your history?" confirmLabel="Clear history" danger onClose={() => setConfirm(null)} onConfirm={() => { clearHistory(user.id); setConfirm(null); notify("History cleared.") }}>
          Your list of recent runs is removed. Saved reports, dashboards and the audit trail are not affected.
        </ConfirmDialog>
      ) : null}
      {confirm === "reset" ? (
        <ConfirmDialog title="Reset demonstration data?" confirmLabel="Reset data" danger onClose={() => setConfirm(null)} onConfirm={() => { resetDemoData(); setConfirm(null); notify("Demonstration data restored.") }}>
          Every report, dashboard, saved view, share and audit entry created in this browser is replaced by the starting set.
        </ConfirmDialog>
      ) : null}
    </section>
  )
}
