import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { canAccessDataset, canEditDashboard } from "@/analytics/access"
import { datasetById } from "@/analytics/catalog"
import { DashboardSurface } from "@/analytics/components/DashboardSurface"
import { effectiveWidgetDef } from "@/analytics/components/DashboardWidgetView"
import { ConditionList } from "@/analytics/components/FilterBuilder"
import { ShareDialog } from "@/analytics/components/dialogs"
import { Badge, Button, EmptyState, Modal, Notice, Segmented, cardClass, fieldClass, labelClass, notify } from "@/analytics/components/ui"
import { useDashboardState } from "@/analytics/dashboardState"
import { newId, VIZ_LABELS, VIZ_ORDER, vizIssue } from "@/analytics/engine"
import { DEFAULT_SIZE, MIN_SIZE, layoutBottom, moveItem, placeNew, resizeItem } from "@/analytics/layout"
import { defaultGlobalFilters } from "@/analytics/seed"
import { useCurrentUser } from "@/analytics/session"
import { dashboardDefinition, dashboardRecord, defaultDashboardId, duplicateDashboard, reportDefinition, reportRecord, saveDashboard, setDefaultDashboard, useDb, visibleReports } from "@/analytics/store"
import type { DashboardDefinition, DashboardWidget, VizType } from "@/analytics/types"

export default function DashboardBuilderPage() {
  const { id } = useParams()
  const location = useLocation()
  const nonce = (location.state as { nonce?: number } | null)?.nonce ?? ""
  return <Builder key={`${id ?? "new"}|${nonce}`} id={id} />
}

const KIND_INFO: Record<DashboardWidget["kind"], { label: string; text: string }> = {
  report: { label: "Report", text: "Shows a saved report in the chart type it was saved with." },
  kpi: { label: "KPI card", text: "Shows the report's measures as large totals." },
  chart: { label: "Chart", text: "Shows the report as a chart. Pick the chart type afterwards." },
  table: { label: "Table", text: "Shows the report's figures in a sortable table." },
  map: { label: "District map", text: "Colours Karnataka districts by the report's measure. The report must group by district." },
}

function Builder({ id }: { id?: string }) {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const location = useLocation()
  const record = id ? dashboardRecord(id, db) : undefined

  const initial = useMemo<DashboardDefinition | null>(() => {
    if (id) return dashboardDefinition(id, db)
    const now = new Date().toISOString()
    const blank: DashboardDefinition = { id: "", name: "Untitled dashboard", description: "", createdBy: user.id, createdAt: now, modifiedAt: now, visibility: "private", columns: 12, globalFilters: defaultGlobalFilters(), widgets: [] }
    const addReportId = (location.state as { addReportId?: string } | null)?.addReportId
    const report = addReportId ? reportRecord(addReportId, db) : undefined
    if (report) blank.widgets = [{ id: newId("w"), kind: "report", reportId: report.id, title: report.name, ...placeNew([], DEFAULT_SIZE.report), filters: [] }]
    return blank
    // The builder is keyed on its route, so the starting dashboard is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [def, setDef] = useState<DashboardDefinition | null>(initial)
  const state = useDashboardState(initial?.globalFilters ?? defaultGlobalFilters())
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [selectedId, setSelectedId] = useState<string | null>(initial?.widgets[0]?.id ?? null)
  const [dialog, setDialog] = useState<"add" | "share" | null>(null)
  const signature = JSON.stringify([def?.name, def?.description, def?.widgets, state.global])
  const [savedSignature, setSavedSignature] = useState(signature)
  const dirty = signature !== savedSignature

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  if (id && !record) {
    return (
      <EmptyState title="This dashboard no longer exists" action={<Link to="/analytics/dashboards"><Button>Back to saved dashboards</Button></Link>}>
        It may have been deleted.
      </EmptyState>
    )
  }
  if (id && record && !canEditDashboard(user, record, db.analytics_report_permissions)) {
    return (
      <EmptyState
        title="You can view this dashboard but not edit it"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to={`/analytics/dashboards/${record.id}`}>
              <Button variant="primary">Open dashboard</Button>
            </Link>
            <Button
              onClick={() => {
                const copy = duplicateDashboard(record.id, user)
                if (copy) navigate(`/analytics/build-dashboard/${copy}`)
              }}
            >
              Edit a copy
            </Button>
          </div>
        }
      >
        Only the owner and named editors can change {record.name}. A copy has the same widgets and belongs to you.
      </EmptyState>
    )
  }
  if (!def) return null

  const selected = def.widgets.find((widget) => widget.id === selectedId) ?? null
  const setWidgets = (widgets: DashboardWidget[]) => setDef((current) => (current ? { ...current, widgets } : current))
  const patchWidget = (widgetId: string, patch: Partial<DashboardWidget>) => setWidgets(def.widgets.map((widget) => (widget.id === widgetId ? { ...widget, ...patch } : widget)))

  const addWidget = (kind: DashboardWidget["kind"], reportId: string, title: string) => {
    const report = reportRecord(reportId, db)
    const widget: DashboardWidget = { id: newId("w"), kind, reportId, title: title.trim() || report?.name || "Widget", ...placeNew(def.widgets, DEFAULT_SIZE[kind]), filters: [] }
    setWidgets([...def.widgets, widget])
    setSelectedId(widget.id)
    setMode("edit")
  }
  const duplicate = (widgetId: string) => {
    const source = def.widgets.find((widget) => widget.id === widgetId)
    if (!source) return
    const copy: DashboardWidget = { ...JSON.parse(JSON.stringify(source)), id: newId("w"), title: `${source.title} (copy)`, x: 0, y: layoutBottom(def.widgets) }
    setWidgets([...def.widgets, copy])
    setSelectedId(copy.id)
  }
  const remove = (widgetId: string) => {
    setWidgets(def.widgets.filter((widget) => widget.id !== widgetId))
    if (selectedId === widgetId) setSelectedId(null)
  }

  const save = () => {
    if (!def.name.trim()) return notify("Enter a name for the dashboard.", "red")
    if (def.widgets.length === 0) return notify("Add at least one widget before saving.", "red")
    try {
      const savedId = saveDashboard({ ...def, globalFilters: state.global }, user)
      setSavedSignature(signature)
      notify(`${def.name.trim()} saved as ${savedId}.`)
      navigate(`/analytics/dashboards/${savedId}`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "The dashboard could not be saved.", "red")
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[min(100%,18rem)] flex-[1_1_18rem]">
          <label className="block">
            <span className="sr-only">Dashboard name</span>
            <input className="w-full max-w-xl rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)] hover:border-[color:var(--c-border-fed4c1)] focus:border-[color:var(--c-border-b23a48)] focus:bg-[color:var(--c-bg-ffffff)]" value={def.name} placeholder="Untitled dashboard" onChange={(event) => setDef({ ...def, name: event.target.value })} />
          </label>
          <label className="block">
            <span className="sr-only">Description</span>
            <input className="mt-0.5 w-full max-w-2xl rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm text-[color:var(--c-text-663a46)] hover:border-[color:var(--c-border-fed4c1)] focus:border-[color:var(--c-border-b23a48)] focus:bg-[color:var(--c-bg-ffffff)]" value={def.description} placeholder="Add a short description" onChange={(event) => setDef({ ...def, description: event.target.value })} />
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2 px-1 text-xs text-[color:var(--c-text-86646d)]">
            {record ? <Badge tone="brass">{record.id}</Badge> : <Badge>New dashboard</Badge>}
            {dirty ? <Badge tone="red">Unsaved changes</Badge> : record ? <span>All changes saved</span> : null}
            <span>
              {def.widgets.length} widget{def.widgets.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Canvas mode" value={mode} onChange={setMode} options={[{ id: "edit", label: "Edit" }, { id: "preview", label: "Preview" }]} />
          <Button onClick={() => setDialog("add")}>Add widget</Button>
          {record ? (
            <>
              <Button
                onClick={() => {
                  const next = defaultDashboardId(user.id, db) === record.id ? null : record.id
                  setDefaultDashboard(user.id, next)
                  notify(next ? `${record.name} is now your default dashboard.` : "Default dashboard cleared.")
                }}
              >
                {defaultDashboardId(user.id, db) === record.id ? "Remove as default" : "Set as default"}
              </Button>
              <Button onClick={() => setDialog("share")}>Share</Button>
              <Button
                onClick={() => {
                  const copy = duplicateDashboard(record.id, user)
                  if (copy) {
                    notify(`Duplicated as ${copy}.`)
                    navigate(`/analytics/build-dashboard/${copy}`)
                  }
                }}
              >
                Duplicate
              </Button>
            </>
          ) : null}
          <Button variant="primary" onClick={save}>
            Save dashboard
          </Button>
        </div>
      </div>

      {def.widgets.length === 0 ? (
        <EmptyState title="Start with a widget" action={<Button variant="primary" onClick={() => setDialog("add")}>Add widget</Button>}>
          Widgets are built from saved reports. Choose a KPI card, chart, table or district map. Drag a widget by its title bar to move it and pull its bottom right corner to resize it.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <DashboardSurface widgets={def.widgets} state={state} defaults={initial?.globalFilters ?? defaultGlobalFilters()} editable={mode === "edit"} onLayoutChange={setWidgets} selectedId={selectedId} onSelect={setSelectedId} onDuplicate={duplicate} onRemove={remove} />
          {mode === "edit" ? (
            <aside className={`${cardClass} p-4 xl:sticky xl:top-20`} aria-label="Widget settings">
              {selected ? (
                <WidgetSettings
                  key={selected.id}
                  widget={selected}
                  widgets={def.widgets}
                  onPatch={(patch) => patchWidget(selected.id, patch)}
                  onLayout={setWidgets}
                  onDuplicate={() => duplicate(selected.id)}
                  onRemove={() => remove(selected.id)}
                />
              ) : (
                <div>
                  <p className="text-sm font-semibold text-[color:var(--c-text-461220)]">Widget settings</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--c-text-86646d)]">Select a widget to rename it, change its report or chart type, set widget filters, or fine-tune its position and size.</p>
                </div>
              )}
            </aside>
          ) : (
            <aside className={`${cardClass} p-4`}>
              <p className="text-sm font-semibold text-[color:var(--c-text-461220)]">Preview mode</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--c-text-86646d)]">Charts respond to clicks as they will for viewers. Filters you set above are saved as the dashboard defaults.</p>
            </aside>
          )}
        </div>
      )}

      {dialog === "add" ? <AddWidgetDialog onAdd={(kind, reportId, title) => { addWidget(kind, reportId, title); setDialog(null) }} onClose={() => setDialog(null)} /> : null}
      {dialog === "share" && record ? (
        <ShareDialog targetType="dashboard" id={record.id} name={record.name} datasetIds={[...new Set(def.widgets.map((widget) => reportRecord(widget.reportId, db)?.datasetId).filter((value): value is string => Boolean(value)))]} user={user} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------- add widget

function AddWidgetDialog({ onAdd, onClose }: { onAdd: (kind: DashboardWidget["kind"], reportId: string, title: string) => void; onClose: () => void }) {
  const user = useCurrentUser()
  const db = useDb()
  const reports = visibleReports(user, db).filter((report) => {
    const dataset = datasetById(report.datasetId)
    return dataset && canAccessDataset(user, dataset)
  })
  const hidden = visibleReports(user, db).length - reports.length
  const [kind, setKind] = useState<DashboardWidget["kind"]>("report")
  const [reportId, setReportId] = useState(reports[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const definition = reportId ? reportDefinition(reportId, db) : null
  const issue = definition ? vizIssue(effectiveWidgetDef({ id: "x", kind, reportId, title: "", x: 0, y: 0, w: 1, h: 1, filters: [] }, definition)) : null

  return (
    <Modal
      title="Add widget"
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!reportId} onClick={() => onAdd(kind, reportId, title)}>
            Add to dashboard
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className={`${labelClass} mb-1.5`}>Widget type</legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {(Object.keys(KIND_INFO) as DashboardWidget["kind"][]).map((item) => (
              <label key={item} className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 ${kind === item ? "border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-fff4ef)]" : "border-[color:var(--c-border-fed4c1)] hover:border-[color:var(--c-border-b23a48)]"}`}>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <input type="radio" name="widget-kind" className="accent-[color:var(--c-bg-461220)]" checked={kind === item} onChange={() => setKind(item)} />
                  {KIND_INFO[item].label}
                </span>
                <span className="mt-0.5 pl-5 text-xs leading-4 text-[color:var(--c-text-86646d)]">{KIND_INFO[item].text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Report</span>
          {reports.length === 0 ? (
            <Notice tone="brass">No saved report is available to your role yet. Build and save a report first.</Notice>
          ) : (
            <select className={fieldClass} value={reportId} onChange={(event) => setReportId(event.target.value)}>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.name} ({datasetById(report.datasetId)?.name})
                </option>
              ))}
            </select>
          )}
        </label>
        {hidden > 0 ? <p className="-mt-2 text-xs text-[color:var(--c-text-9d8189)]">{hidden} report{hidden === 1 ? " is" : "s are"} hidden because your role cannot open its dataset.</p> : null}
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Widget title</span>
          <input className={fieldClass} value={title} placeholder="Uses the report name when left empty" onChange={(event) => setTitle(event.target.value)} />
        </label>
        {issue ? <Notice tone="brass">{issue} The widget can still be added and fixed later by choosing another report or type.</Notice> : null}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- settings

function WidgetSettings({ widget, widgets, onPatch, onLayout, onDuplicate, onRemove }: { widget: DashboardWidget; widgets: DashboardWidget[]; onPatch: (patch: Partial<DashboardWidget>) => void; onLayout: (widgets: DashboardWidget[]) => void; onDuplicate: () => void; onRemove: () => void }) {
  const user = useCurrentUser()
  const db = useDb()
  const available = visibleReports(user, db).filter((report) => {
    const dataset = datasetById(report.datasetId)
    return (dataset && canAccessDataset(user, dataset)) || report.id === widget.reportId
  })
  const base = reportDefinition(widget.reportId, db)
  const dataset = base ? datasetById(base.datasetId) : undefined
  const minimum = MIN_SIZE[widget.kind]
  const move = (dx: number, dy: number) => onLayout(moveItem(widgets, widget.id, widget.x + dx, widget.y + dy))
  const size = (dw: number, dh: number) => onLayout(resizeItem(widgets, widget.id, widget.w + dw, widget.h + dh, minimum))
  const arrow = "grid h-8 w-8 place-items-center rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] text-sm hover:border-[color:var(--c-border-b23a48)] disabled:opacity-35"

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[color:var(--c-text-461220)]">Widget settings</p>
      <label className="block">
        <span className={`${labelClass} mb-1 block`}>Title</span>
        <input className={fieldClass} value={widget.title} onChange={(event) => onPatch({ title: event.target.value })} />
      </label>
      <label className="block">
        <span className={`${labelClass} mb-1 block`}>Report</span>
        <select className={fieldClass} value={widget.reportId} onChange={(event) => onPatch({ reportId: event.target.value, filters: [] })}>
          {available.some((report) => report.id === widget.reportId) ? null : <option value={widget.reportId}>{widget.reportId} (unavailable)</option>}
          {available.map((report) => (
            <option key={report.id} value={report.id}>
              {report.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Widget type</span>
          <select className={fieldClass} value={widget.kind} onChange={(event) => onPatch({ kind: event.target.value as DashboardWidget["kind"], ...(widget.vizOverride ? { vizOverride: undefined } : {}) })}>
            {(Object.keys(KIND_INFO) as DashboardWidget["kind"][]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_INFO[kind].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Chart type</span>
          <select className={fieldClass} value={widget.vizOverride ?? ""} onChange={(event) => onPatch({ vizOverride: (event.target.value || undefined) as VizType | undefined })}>
            <option value="">From the report</option>
            {VIZ_ORDER.map((type) => (
              <option key={type} value={type}>
                {VIZ_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {base ? (() => {
        const issue = vizIssue(effectiveWidgetDef(widget, base))
        return issue ? <Notice tone="brass">{issue}</Notice> : null
      })() : null}

      <div>
        <p className={`${labelClass} mb-1.5`}>Position and size</p>
        <p className="mb-2 text-xs text-[color:var(--c-text-9d8189)]">
          Column {widget.x + 1}, row {widget.y + 1}. {widget.w} columns wide, {widget.h} rows tall.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Move widget">
            <span />
            <button type="button" className={arrow} aria-label="Move up" disabled={widget.y === 0} onClick={() => move(0, -1)}>↑</button>
            <span />
            <button type="button" className={arrow} aria-label="Move left" disabled={widget.x === 0} onClick={() => move(-1, 0)}>←</button>
            <span />
            <button type="button" className={arrow} aria-label="Move right" disabled={widget.x + widget.w >= 12} onClick={() => move(1, 0)}>→</button>
            <span />
            <button type="button" className={arrow} aria-label="Move down" onClick={() => move(0, 1)}>↓</button>
            <span />
          </div>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Resize widget">
            <Button size="sm" disabled={widget.w <= minimum.w} onClick={() => size(-1, 0)}>Narrower</Button>
            <Button size="sm" disabled={widget.x + widget.w >= 12} onClick={() => size(1, 0)}>Wider</Button>
            <Button size="sm" disabled={widget.h <= minimum.h} onClick={() => size(0, -1)}>Shorter</Button>
            <Button size="sm" onClick={() => size(0, 1)}>Taller</Button>
          </div>
        </div>
      </div>

      <div>
        <p className={`${labelClass} mb-1.5`}>Widget filters</p>
        {dataset ? (
          <>
            <ConditionList dataset={dataset} conditions={widget.filters} onChange={(filters) => onPatch({ filters })} />
            <p className="mt-2 text-xs leading-5 text-[color:var(--c-text-9d8189)]">These apply to this widget only, on top of the dashboard filters.</p>
          </>
        ) : (
          <p className="text-xs text-[color:var(--c-text-9d8189)]">Choose an available report to add widget filters.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[color:var(--c-border-fee4d8)] pt-3">
        <Button size="sm" onClick={onDuplicate}>Duplicate widget</Button>
        <Button size="sm" variant="danger" onClick={onRemove}>Remove widget</Button>
      </div>
    </div>
  )
}
