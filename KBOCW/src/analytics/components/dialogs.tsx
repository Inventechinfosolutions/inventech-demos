import { useState } from "react"
import { datasetById } from "@/analytics/catalog"
import { Button, Modal, Notice, Popover, MenuItem, fieldClass, labelClass, notify } from "@/analytics/components/ui"
import { exportReport } from "@/analytics/exporters"
import type { ExportFormat, ExportInput } from "@/analytics/exporters"
import { parseReport, serializeReport } from "@/analytics/entities"
import { canAccessDataset } from "@/analytics/access"
import { saveReport, shareItem, grantsFor, useDb } from "@/analytics/store"
import { USERS } from "@/analytics/users"
import type { ReportDefinition, ReportRecord, ReportStatus, User, Visibility } from "@/analytics/types"

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: "Only me",
  shared: "Named people",
  department: "My department",
  portal: "Everyone on the portal",
}

// ---------------------------------------------------------------- save

export function SaveReportDialog({ def, record, user, templateId, onSaved, onClose }: { def: ReportDefinition; record?: ReportRecord; user: User; templateId?: string; onSaved: (id: string) => void; onClose: () => void }) {
  const [name, setName] = useState(def.name === "Untitled report" ? "" : def.name)
  const [description, setDescription] = useState(def.description)
  const [visibility, setVisibility] = useState<Visibility>(record?.visibility ?? "private")
  const [status, setStatus] = useState<ReportStatus>(record?.status ?? "published")
  const [copy, setCopy] = useState(false)
  const [error, setError] = useState("")
  const submit = () => {
    if (!name.trim()) return setError("Enter a name so you can find this report later.")
    try {
      const id = saveReport({ ...def, id: copy ? "" : def.id, name: name.trim(), description: description.trim() }, user, { visibility, status, templateId: templateId ?? record?.templateId })
      notify(copy || !record ? `Saved as ${id}.` : `${id} updated.`)
      onSaved(id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The report could not be saved.")
    }
  }
  return (
    <Modal
      title={record ? "Save report" : "Save new report"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {copy || !record ? "Save report" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Report name</span>
          <input autoFocus className={`${fieldClass} ${error && !name.trim() ? "border-[color:var(--c-border-daa1a8)]" : ""}`} value={name} onChange={(event) => { setName(event.target.value); setError("") }} placeholder="District-wise cess collection" />
        </label>
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Description</span>
          <textarea className={`${fieldClass} !h-20 py-2`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What this report answers" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={`${labelClass} mb-1 block`}>Visible to</span>
            <select className={fieldClass} value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
              {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((item) => (
                <option key={item} value={item}>
                  {VISIBILITY_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={`${labelClass} mb-1 block`}>Status</span>
            <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
        {record ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[color:var(--c-bg-461220)]" checked={copy} onChange={(event) => setCopy(event.target.checked)} />
            Save as a new report and keep {record.id} unchanged
          </label>
        ) : null}
        {error ? <Notice tone="red">{error}</Notice> : null}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- rename

export function RenameDialog({ title, initial, onSubmit, onClose, confirmLabel = "Rename" }: { title: string; initial: string; onSubmit: (name: string) => void; onClose: () => void; confirmLabel?: string }) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState("")
  const submit = () => {
    if (!name.trim()) return setError("Enter a name.")
    try {
      onSubmit(name.trim())
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The name could not be saved.")
    }
  }
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <input autoFocus aria-label="Name" className={fieldClass} value={name} onChange={(event) => { setName(event.target.value); setError("") }} onKeyDown={(event) => event.key === "Enter" && submit()} />
      {error ? <div className="mt-3"><Notice tone="red">{error}</Notice></div> : null}
    </Modal>
  )
}

// ---------------------------------------------------------------- share

export function ShareDialog({ targetType, id, name, datasetIds, user, onClose }: { targetType: "report" | "dashboard"; id: string; name: string; datasetIds: string[]; user: User; onClose: () => void }) {
  const db = useDb()
  const record = (targetType === "report" ? db.analytics_reports : db.analytics_dashboards).find((item) => item.id === id)
  const existing = grantsFor(targetType, id, db)
  const [visibility, setVisibility] = useState<Visibility>(record?.visibility ?? "private")
  const [access, setAccess] = useState<Record<string, "none" | "view" | "edit">>(() => Object.fromEntries(USERS.map((candidate) => [candidate.id, existing.find((grant) => grant.userId === candidate.id)?.access ?? "none"])))
  const [error, setError] = useState("")
  const datasets = datasetIds.map((datasetId) => datasetById(datasetId)).filter((dataset): dataset is NonNullable<typeof dataset> => Boolean(dataset))

  const submit = () => {
    try {
      shareItem(targetType, id, { visibility, grants: USERS.filter((candidate) => candidate.id !== record?.createdBy && access[candidate.id] !== "none").map((candidate) => ({ userId: candidate.id, access: access[candidate.id] as "view" | "edit" })) }, user)
      notify(`Sharing updated for ${name}.`)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sharing could not be updated.")
    }
  }
  const link = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/analytics/${targetType === "report" ? "reports" : "dashboards"}/${id}`

  return (
    <Modal
      title={`Share ${name}`}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <Button
            onClick={() => {
              void navigator.clipboard?.writeText(link)
              notify("Link copied.")
            }}
          >
            Copy link
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Save sharing
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Who can open it</span>
          <select className={fieldClass} value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
            {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((item) => (
              <option key={item} value={item}>
                {VISIBILITY_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className={`${labelClass} mb-1.5`}>Named people</p>
          <ul className="divide-y divide-[color:var(--c-border-ffeae1)] rounded-xl border border-[color:var(--c-border-fee2d5)]">
            {USERS.filter((candidate) => candidate.id !== record?.createdBy).map((candidate) => {
              const blocked = datasets.filter((dataset) => !canAccessDataset(candidate, dataset))
              return (
                <li key={candidate.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{candidate.name}</p>
                    <p className="truncate text-xs text-[color:var(--c-text-9d8189)]">{candidate.title}</p>
                    {blocked.length > 0 ? <p className="text-xs text-[color:var(--c-text-b23a48)]">No access to {blocked.map((dataset) => dataset.name).join(", ")}. They will see an access notice, not data.</p> : null}
                  </div>
                  <select aria-label={`Access for ${candidate.name}`} className={`${fieldClass} !h-8 !w-28`} value={access[candidate.id]} onChange={(event) => setAccess({ ...access, [candidate.id]: event.target.value as "none" | "view" | "edit" })}>
                    <option value="none">No access</option>
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                  </select>
                </li>
              )
            })}
          </ul>
        </div>
        <p className="text-xs leading-5 text-[color:var(--c-text-86646d)]">Sharing a report shares its definition, not the data. Each person sees only the rows their role and district allow.</p>
        {error ? <Notice tone="red">{error}</Notice> : null}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- JSON

export function JsonDialog({ def, onImport, onClose, canImport }: { def: ReportDefinition; onImport: (def: ReportDefinition) => void; onClose: () => void; canImport: boolean }) {
  const [tab, setTab] = useState<"view" | "import">("view")
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const json = serializeReport(def)
  return (
    <Modal
      title="Report definition"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        tab === "view" ? (
          <>
            <Button
              onClick={() => {
                void navigator.clipboard?.writeText(json)
                notify("Definition copied.")
              }}
            >
              Copy JSON
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                try {
                  onImport(parseReport(text))
                  notify("Definition loaded into the builder.")
                  onClose()
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "That is not a valid report definition.")
                }
              }}
            >
              Load definition
            </Button>
          </>
        )
      }
    >
      <div className="mb-3 inline-flex rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffeee7)] p-0.5">
        {([["view", "This report"], ["import", "Import"]] as const).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} disabled={id === "import" && !canImport} className={`h-7 rounded-full px-3 text-xs font-semibold disabled:opacity-40 ${tab === id ? "bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]" : "text-[color:var(--c-text-86646d)]"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "view" ? (
        <>
          <p className="mb-2 text-xs leading-5 text-[color:var(--c-text-86646d)]">The report is stored as this structured definition. The query service reads it directly. No SQL is written or stored.</p>
          <pre className="max-h-[50vh] overflow-auto rounded-xl bg-[color:var(--c-bg-461220)] p-3 text-xs leading-5 text-[color:var(--c-text-fedbcb)]">{json}</pre>
        </>
      ) : (
        <>
          <p className="mb-2 text-xs leading-5 text-[color:var(--c-text-86646d)]">Paste a report definition. Fields must belong to its dataset, and your role must have access to that dataset.</p>
          <textarea aria-label="Report JSON" className="h-64 w-full rounded-xl border border-[color:var(--c-border-fed4c1)] p-3 font-mono text-xs" value={text} onChange={(event) => { setText(event.target.value); setError("") }} />
          {error ? <div className="mt-2"><Notice tone="red">{error}</Notice></div> : null}
        </>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------- export

export function ExportMenu({ getInput, disabled, size = "md", variant = "secondary", label = "Export" }: { getInput: () => ExportInput | null | Promise<ExportInput | null>; disabled?: boolean; size?: "sm" | "md"; variant?: "secondary" | "primary" | "ghost"; label?: string }) {
  const [busy, setBusy] = useState(false)
  const run = async (format: ExportFormat, close: () => void) => {
    close()
    setBusy(true)
    try {
      const input = await getInput()
      if (!input) return notify("Nothing to export yet. Fix the highlighted issues first.", "red")
      await exportReport(format, input)
      notify(`${format === "xlsx" ? "Excel" : format.toUpperCase()} file downloaded.`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "The export failed.", "red")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Popover label={busy ? "Exporting" : `${label} ▾`} disabled={disabled || busy} size={size} variant={variant} align="right">
      {(close) => (
        <div role="menu" aria-label="Export format">
          <MenuItem onClick={() => void run("xlsx", close)}>Excel workbook (.xlsx)</MenuItem>
          <MenuItem onClick={() => void run("csv", close)}>CSV file (.csv)</MenuItem>
          <MenuItem onClick={() => void run("pdf", close)}>PDF report (.pdf)</MenuItem>
        </div>
      )}
    </Popover>
  )
}
