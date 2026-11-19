import { useMemo, useState } from "react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { formatLongDate } from "@/lib/format"
import type { IntelligenceException } from "@/types/intelligence"

const pageSize = 8
const statuses = [
  { id: "new", label: "New" },
  { id: "in-review", label: "In review" },
  { id: "awaiting-source", label: "Awaiting source" },
  { id: "closed", label: "Closed" },
]

function matchingLabel(value: string) {
  if (value === "requires-verification") return "Requires verification"
  if (value === "verified") return "Verified"
  if (value === "unmatched") return "Unmatched"
  return value
}

function statusLabel(value: string) {
  return statuses.find((item) => item.id === value)?.label ?? value
}

export function ExceptionRegister({
  rows,
  domain,
  onTrace,
  onStatus,
  onNote,
}: {
  rows: IntelligenceException[]
  domain?: IntelligenceException["domain"]
  onTrace: (id: string) => void
  onStatus: (id: string, status: string) => void
  onNote: (id: string, note: string) => void
}) {
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState("all")
  const [matching, setMatching] = useState("all")
  const [investigation, setInvestigation] = useState("all")
  const [sortKey, setSortKey] = useState<"id" | "type" | "district" | "priority" | "matching" | "investigation" | "created">("created")
  const [direction, setDirection] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    const priorityRank = { high: 0, medium: 1, low: 2 }
    const next = rows.filter((row) => {
      if (domain && row.domain !== domain) return false
      if (priority !== "all" && row.priority !== priority) return false
      if (matching !== "all" && row.matching !== matching) return false
      if (investigation !== "all" && row.investigation !== investigation) return false
      if (!text) return true
      return [row.id, row.type, row.entity, row.district, row.sources, row.assigned].join(" ").toLowerCase().includes(text)
    })
    next.sort((a, b) => {
      const left = sortKey === "priority" ? priorityRank[a.priority] : a[sortKey]
      const right = sortKey === "priority" ? priorityRank[b.priority] : b[sortKey]
      const order = String(left).localeCompare(String(right), "en")
      return direction === "asc" ? order : -order
    })
    return next
  }, [direction, domain, investigation, matching, priority, query, rows, sortKey])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const slice = filtered.slice(current * pageSize, current * pageSize + pageSize)
  const open = rows.find((row) => row.id === openId) ?? null

  function sortBy(key: typeof sortKey) {
    setPage(0)
    if (sortKey === key) setDirection((value) => (value === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setDirection(key === "created" ? "desc" : "asc")
    }
  }

  const header = (key: typeof sortKey, label: string) => (
    <th className="px-3 py-3 text-left">
      <button type="button" className="font-semibold" onClick={() => sortBy(key)}>
        {label}{sortKey === key ? (direction === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  )

  return (
    <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
      <h3 className="text-lg font-semibold text-[color:var(--c-text-461220)]">{domain === "cess" ? "Cess exception register" : "Intelligence exception register"}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">Every row points at a source record. Notes and status changes stay in this browser session and are not written to a government system.</p>
      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <input
          className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm md:col-span-1"
          placeholder="Search exceptions"
          value={query}
          aria-label="Search exceptions"
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
        />
        <select className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm" aria-label="Priority" value={priority} onChange={(event) => { setPriority(event.target.value); setPage(0) }}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm" aria-label="Matching status" value={matching} onChange={(event) => { setMatching(event.target.value); setPage(0) }}>
          <option value="all">All matching statuses</option>
          <option value="verified">Verified</option>
          <option value="requires-verification">Requires verification</option>
          <option value="unmatched">Unmatched</option>
        </select>
        <select className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm" aria-label="Investigation status" value={investigation} onChange={(event) => { setInvestigation(event.target.value); setPage(0) }}>
          <option value="all">All investigation statuses</option>
          {statuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-slate-500">
              {header("id", "Exception ID")}
              {header("type", "Exception type")}
              <th className="px-3 py-3 font-semibold">Related entity</th>
              {header("district", "District")}
              <th className="px-3 py-3 font-semibold">Source departments</th>
              {header("priority", "Priority")}
              {header("matching", "Matching status")}
              <th className="px-3 py-3 font-semibold">Assigned department</th>
              {header("investigation", "Investigation status")}
              {header("created", "Created date")}
              <th className="px-3 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={11}>No exceptions in the selected scope.</td>
              </tr>
            ) : slice.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--c-border-ffeae1)]">
                <td className="px-3 py-3 font-medium">{row.id}</td>
                <td className="px-3 py-3">{row.type}</td>
                <td className="px-3 py-3">{row.entity}</td>
                <td className="px-3 py-3">{row.district}</td>
                <td className="px-3 py-3">{row.sources}</td>
                <td className="px-3 py-3"><StatusBadge value={row.priority} /></td>
                <td className="px-3 py-3">{matchingLabel(row.matching)}</td>
                <td className="px-3 py-3">{row.assigned}</td>
                <td className="px-3 py-3">{statusLabel(row.investigation)}</td>
                <td className="px-3 py-3">{formatLongDate(row.created)}</td>
                <td className="px-3 py-3 text-right">
                  <button type="button" className="font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => { setOpenId(row.id); setDraft("") }}>
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="text-slate-500">{filtered.length} exceptions</p>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 py-1.5 font-semibold disabled:opacity-40" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
          <span className="px-2 py-1.5">Page {current + 1} of {pageCount}</span>
          <button type="button" className="rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 py-1.5 font-semibold disabled:opacity-40" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>Next</button>
        </div>
      </div>
      {open ? (
        <div className="mt-4 rounded-lg border border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-fff7f3)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--c-text-8c2f39)]">{open.id}</p>
              <h4 className="mt-1 text-lg font-semibold text-[color:var(--c-text-461220)]">{open.type}</h4>
            </div>
            <button type="button" className="text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => onTrace(open.id)}>Trace source records</button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Related entity</dt><dd className="font-medium">{open.entity}</dd></div>
            <div><dt className="text-slate-500">District</dt><dd className="font-medium">{open.district}</dd></div>
            <div><dt className="text-slate-500">Source departments</dt><dd className="font-medium">{open.sources}</dd></div>
            <div><dt className="text-slate-500">Assigned department</dt><dd className="font-medium">{open.assigned}</dd></div>
            <div><dt className="text-slate-500">Matching status</dt><dd className="font-medium">{matchingLabel(open.matching)}</dd></div>
            <div><dt className="text-slate-500">Recommended action</dt><dd className="font-medium">{open.action}</dd></div>
          </dl>
          <label className="mt-4 block text-sm text-slate-600">
            Investigation status
            <select className="mt-1 h-10 w-full max-w-xs rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3" value={open.investigation} onChange={(event) => onStatus(open.id, event.target.value)}>
              {statuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <h5 className="mt-4 text-sm font-semibold text-[color:var(--c-text-461220)]">Investigation notes</h5>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--c-text-461220)]">
            {open.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input className="h-10 flex-1 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm" value={draft} placeholder="Add an investigation note" aria-label="Investigation note" onChange={(event) => setDraft(event.target.value)} />
            <button
              type="button"
              className="h-10 rounded-lg bg-[color:var(--c-bg-461220)] px-3 text-sm font-semibold text-white"
              onClick={() => {
                const note = draft.trim()
                if (!note) return
                onNote(open.id, note)
                setDraft("")
              }}
            >
              Add note
            </button>
          </div>
          <h5 className="mt-4 text-sm font-semibold text-[color:var(--c-text-461220)]">Audit history</h5>
          <ol className="mt-2 space-y-1 text-sm text-slate-600">
            {open.audit.map((entry) => <li key={`${entry.at}-${entry.text}`}>{entry.at}: {entry.text}</li>)}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
