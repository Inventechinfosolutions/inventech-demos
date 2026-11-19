import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { datasetById } from "@/analytics/catalog"
import type { ChartPoint } from "@/analytics/chartOptions"
import { ChartActionMenu } from "@/analytics/components/ChartActionMenu"
import type { ChartAction } from "@/analytics/components/ChartActionMenu"
import type { HandleProps } from "@/analytics/components/DashboardCanvas"
import { ConditionList } from "@/analytics/components/FilterBuilder"
import { hasGlobalFilters } from "@/analytics/components/RuntimeFilters"
import { Button, Chip, Notice, Popover, notify } from "@/analytics/components/ui"
import { VizRenderer } from "@/analytics/components/VizRenderer"
import type { DashboardState } from "@/analytics/dashboardState"
import { crossFiltersApplying, describeFilters, newId, suggestVizTypes, VIZ_LABELS, vizIssue } from "@/analytics/engine"
import { exportReport } from "@/analytics/exporters"
import type { ExportFormat } from "@/analytics/exporters"
import { useQuery } from "@/analytics/hooks"
import { describePoint, drillLabels, toggleCross } from "@/analytics/interaction"
import { useCurrentUser } from "@/analytics/session"
import type { DashboardWidget, FilterCondition, ReportDefinition, VizType } from "@/analytics/types"

const CHART_TYPES: VizType[] = ["column", "bar", "stacked", "line", "area", "pie", "donut", "combo", "scatter", "funnel", "heatmap"]

/** The report as this widget shows it. The widget kind and any override decide the chart type. */
export function effectiveWidgetDef(widget: DashboardWidget, base: ReportDefinition): ReportDefinition {
  let type: VizType = base.visualization.type
  if (widget.vizOverride) type = widget.vizOverride
  else if (widget.kind === "kpi") type = "kpi"
  else if (widget.kind === "table") type = "table"
  else if (widget.kind === "map") type = "map"
  else if (widget.kind === "chart" && !CHART_TYPES.includes(type)) type = suggestVizTypes(base).find((option) => CHART_TYPES.includes(option)) ?? "column"
  return { ...base, visualization: { ...base.visualization, type, detail: type === "table" ? base.visualization.detail : false } }
}

interface Props {
  widget: DashboardWidget
  base: ReportDefinition | null
  state: DashboardState
  editable: boolean
  handle: HandleProps | null
  selected: boolean
  onDuplicate?: () => void
  onRemove?: () => void
}

export function DashboardWidgetView({ widget, base, state, editable, handle, selected, onDuplicate, onRemove }: Props) {
  const user = useCurrentUser()
  const dataset = base ? datasetById(base.datasetId) : undefined
  const eff = useMemo(() => (base ? effectiveWidgetDef(widget, base) : null), [widget, base])
  const drill = state.drill[widget.id] ?? []
  const temp = state.temp[widget.id] ?? []
  const [menu, setMenu] = useState<{ anchor: { x: number; y: number }; point: ChartPoint } | null>(null)

  const context = { global: hasGlobalFilters(state.global) ? state.global : null, cross: state.cross, widgetId: widget.id, widgetFilters: [...widget.filters, ...temp], drill }
  const { data, loading } = useQuery({ def: eff, context, log: editable || !base ? null : { kind: "dashboard", reportId: widget.reportId, reportName: widget.title || base.name } })
  const outcome = data?.outcome
  const title = widget.title || base?.name || "Widget"
  const type = eff?.visualization.type
  const fit = eff && type ? vizIssue(eff, type) : null
  const filteredBy = dataset ? crossFiltersApplying(state.cross, dataset, widget.id).length : 0

  const description = menu && base && dataset && outcome?.ok ? describePoint(base, dataset, outcome.result, menu.point, drill) : null
  const actions: ChartAction[] = []
  if (description) {
    if (description.drill) {
      const step = description.drill.step
      actions.push({ id: "drill", label: `Drill down to ${description.drill.nextLabel}`, hint: `Breaks ${step.value} down by ${description.drill.nextLabel.toLowerCase()} in this widget.`, onSelect: () => state.setDrillFor(widget.id, [...drill, step]) })
    }
    if (description.filters.length > 0) {
      const shared = description.filters.every((item) => item.conformed)
      const active = state.cross.some((item) => item.sourceWidgetId === widget.id && description.filters.every((candidate) => candidate.fieldId === item.fieldId && candidate.value === item.value))
      actions.push({
        id: "cross",
        label: active ? `Remove filter on ${description.heading}` : `Filter other widgets to ${description.heading}`,
        hint: shared ? "Cross-filter. Every widget with this field narrows to the selection." : "Only shared fields such as district, year, scheme and department can filter other widgets.",
        disabled: !shared,
        onSelect: () => state.setCross(toggleCross(state.cross, description.filters, widget.id)),
      })
      actions.push({
        id: "local",
        label: `Filter this widget to ${description.heading}`,
        hint: "Applies to this widget only.",
        onSelect: () =>
          state.setTempFor(widget.id, [
            ...temp,
            ...description.filters.map((item): FilterCondition => ({ id: newId("wf"), kind: "condition", fieldId: item.fieldId, operator: "eq", value: item.value })),
          ]),
      })
    }
  }
  const onPoint = (point: ChartPoint, anchor: { x: number; y: number }) => {
    if (editable || !base || !dataset || !outcome?.ok) return
    const next = describePoint(base, dataset, outcome.result, point, drill)
    if (!next.drill && next.filters.length === 0) return
    setMenu({ anchor, point })
  }

  const runExport = async (format: ExportFormat, close: () => void) => {
    close()
    if (!eff || !data?.outcome.ok) return
    try {
      await exportReport(format, { def: { ...data.prepared.def, id: widget.reportId, name: title }, result: data.outcome.result, user, vizType: eff.visualization.type, showLabels: eff.visualization.showLabels, stacked: eff.visualization.stacked })
      notify(`${format === "xlsx" ? "Excel" : format.toUpperCase()} file downloaded.`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "The export failed.", "red")
    }
  }

  const chips = [
    ...(base && dataset ? drill.map((step, index) => ({ id: `d${index}`, label: drillLabels(dataset, [step])[0], tone: "green" as const, remove: () => state.setDrillFor(widget.id, drill.slice(0, index)) })) : []),
    ...(dataset ? temp.map((condition) => ({ id: condition.id, label: describeFilters({ id: "x", kind: "group", combinator: "AND", children: [condition] }, dataset)[0] ?? "Filter", tone: "neutral" as const, remove: () => state.setTempFor(widget.id, temp.filter((item) => item.id !== condition.id)) })) : []),
  ]

  return (
    <article className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-[color:var(--c-bg-ffffff)] shadow-[0_10px_32px_rgb(var(--c-shadow-rgb)/0.05)] ${selected && editable ? "border-[color:var(--c-border-b23a48)] ring-2 ring-[color:var(--c-border-b23a48)]/40" : "border-[color:var(--c-border-fed9c8)]"}`} aria-label={title}>
      <header className="flex items-center gap-1.5 border-b border-[color:var(--c-border-ffeae1)] px-3 py-2">
        <div {...(handle ?? {})} className={`flex min-w-0 flex-1 items-center gap-2 ${handle ? "rounded-md focus-visible:outline-2 focus-visible:outline-[color:var(--c-border-b23a48)]" : ""}`}>
          {handle ? (
            <svg viewBox="0 0 10 16" className="h-4 w-2.5 shrink-0 text-[color:var(--c-text-bfadb2)]" fill="currentColor" aria-hidden>
              <circle cx="2" cy="3" r="1.2" />
              <circle cx="8" cy="3" r="1.2" />
              <circle cx="2" cy="8" r="1.2" />
              <circle cx="8" cy="8" r="1.2" />
              <circle cx="2" cy="13" r="1.2" />
              <circle cx="8" cy="13" r="1.2" />
            </svg>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[color:var(--c-text-461220)]">{title}</h3>
            <p className="truncate text-[11px] text-[color:var(--c-text-9d8189)]">
              {type ? VIZ_LABELS[type] : "Unavailable"}
              {filteredBy > 0 ? `. Filtered by ${filteredBy} selection${filteredBy === 1 ? "" : "s"}` : ""}
              {loading && data ? ". Updating" : ""}
            </p>
          </div>
        </div>
        {drill.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => state.setDrillFor(widget.id, drill.slice(0, -1))} aria-label={`Drill up in ${title}`}>
            Up
          </Button>
        ) : null}
        {editable ? (
          <>
            <button type="button" aria-label={`Duplicate ${title}`} title="Duplicate" onClick={onDuplicate} className="grid h-7 w-7 place-items-center rounded-full text-sm text-[color:var(--c-text-86646d)] hover:bg-[color:var(--c-bg-ffeee7)]">
              ⧉
            </button>
            <button type="button" aria-label={`Remove ${title}`} title="Remove from dashboard" onClick={onRemove} className="grid h-7 w-7 place-items-center rounded-full text-lg text-[color:var(--c-text-86646d)] hover:bg-[color:var(--c-bg-ffe9df)] hover:text-[color:var(--c-text-8c2f39)]">
              ×
            </button>
          </>
        ) : base && dataset ? (
          <Popover label="More" size="sm" variant="ghost" align="right">
            {(close) => (
              <div className="w-[min(20rem,80vw)] p-1" role="group" aria-label={`Options for ${title}`}>
                <p className="mb-1.5 text-xs font-semibold text-[color:var(--c-text-8c2f39)]">Filter this widget</p>
                <ConditionList dataset={dataset} conditions={temp} onChange={(next) => state.setTempFor(widget.id, next)} />
                <div className="my-2 border-t border-[color:var(--c-border-fee4d8)]" />
                <p className="mb-1 text-xs font-semibold text-[color:var(--c-text-8c2f39)]">Export this widget</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" disabled={!outcome?.ok} onClick={() => void runExport("xlsx", close)}>
                    Excel
                  </Button>
                  <Button size="sm" disabled={!outcome?.ok} onClick={() => void runExport("csv", close)}>
                    CSV
                  </Button>
                  <Button size="sm" disabled={!outcome?.ok} onClick={() => void runExport("pdf", close)}>
                    PDF
                  </Button>
                </div>
                <div className="my-2 border-t border-[color:var(--c-border-fee4d8)]" />
                <Link to={`/analytics/reports/${widget.reportId}`} className="text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">
                  Open the report
                </Link>
              </div>
            )}
          </Popover>
        ) : null}
      </header>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2">
          {chips.map((chip) => (
            <Chip key={chip.id} tone={chip.tone} onRemove={editable ? undefined : chip.remove}>
              {chip.label}
            </Chip>
          ))}
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1 p-3">
        <div className="absolute inset-3 overflow-auto">
          {!base ? (
            <Notice tone="brass">The report behind this widget is no longer available. Remove the widget or choose another report.</Notice>
          ) : !data ? (
            <div className="h-full min-h-[120px] animate-pulse rounded-xl bg-[color:var(--c-bg-ffeee7)]" aria-label="Loading" />
          ) : !outcome?.ok ? (
            <div className="flex flex-col gap-2">
              {outcome?.issues.map((issue) => (
                <Notice key={issue.code + (issue.fieldId ?? "")} tone={issue.code === "no-access" ? "brass" : "red"} title={issue.code === "no-access" ? "Access restricted" : undefined}>
                  {issue.message}
                </Notice>
              ))}
            </div>
          ) : fit ? (
            <Notice tone="brass">{fit}</Notice>
          ) : eff ? (
            <div className={`h-full ${loading ? "opacity-60" : ""} transition-opacity`}>
              <VizRenderer result={outcome.result} type={eff.visualization.type} showLabels={eff.visualization.showLabels} stacked={eff.visualization.stacked} comparison={data.comparison} onPoint={editable ? undefined : onPoint} height="100%" compact />
            </div>
          ) : null}
        </div>
      </div>
      {menu && description ? <ChartActionMenu anchor={menu.anchor} heading={description.heading} actions={actions} onClose={() => setMenu(null)} /> : null}
    </article>
  )
}
