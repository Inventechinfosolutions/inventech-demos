import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { datasetById } from "@/analytics/catalog"
import type { ChartPoint } from "@/analytics/chartOptions"
import { ChartActionMenu } from "@/analytics/components/ChartActionMenu"
import type { ChartAction } from "@/analytics/components/ChartActionMenu"
import { ActiveFilterBar, RuntimeFilters, crossChips, emptyGlobalFilters, globalChips, hasGlobalFilters } from "@/analytics/components/RuntimeFilters"
import type { ActiveChip } from "@/analytics/components/RuntimeFilters"
import { ResultMeta } from "@/analytics/components/ResultMeta"
import { ExportMenu } from "@/analytics/components/dialogs"
import { Button, EmptyState, Notice, cardClass } from "@/analytics/components/ui"
import { ResultTable, VizRenderer } from "@/analytics/components/VizRenderer"
import { datasetHasField, suggestVizTypes, VIZ_LABELS, vizIssue } from "@/analytics/engine"
import { useQuery } from "@/analytics/hooks"
import { describePoint, drillLabels, toggleCross } from "@/analytics/interaction"
import { drillState } from "@/analytics/runtime"
import type { DrillStep } from "@/analytics/runtime"
import { useCurrentUser } from "@/analytics/session"
import type { CrossFilter, GlobalFilters, ReportDefinition, VizType } from "@/analytics/types"

interface Props {
  def: ReportDefinition
  logKind: "preview" | "saved"
  onVizChange?: (type: VizType) => void
  actions?: ReactNode
  /** Filters the page started with, for example the defaults of a saved dashboard. */
  initialGlobal?: GlobalFilters
}

/** Runs one report and lets the viewer filter, cross-filter, drill and compare without changing the saved definition. */
export function ReportExplorer({ def, logKind, onVizChange, actions, initialGlobal }: Props) {
  const user = useCurrentUser()
  const dataset = datasetById(def.datasetId)
  const [global, setGlobal] = useState<GlobalFilters>(initialGlobal ?? emptyGlobalFilters())
  const [cross, setCross] = useState<CrossFilter[]>([])
  const [drill, setDrill] = useState<DrillStep[]>([])
  const [menu, setMenu] = useState<{ anchor: { x: number; y: number }; point: ChartPoint } | null>(null)
  const [showData, setShowData] = useState(false)

  // Drill steps and cross-filters belong to one dataset and grouping. Clear them when either changes.
  const owner = `${def.datasetId}|${def.dimensions[0]?.fieldId ?? ""}`
  const [seenOwner, setSeenOwner] = useState(owner)
  if (seenOwner !== owner) {
    setSeenOwner(owner)
    setDrill([])
    setCross([])
  }

  const context = useMemo(() => ({ global: hasGlobalFilters(global) ? global : null, cross, drill }), [global, cross, drill])
  const { data, loading } = useQuery({ def, context, log: { kind: logKind, reportId: def.id || null, reportName: def.name } })
  const outcome = data?.outcome
  const type = def.visualization.type
  const fitIssue = vizIssue(def, type)
  const state = drillState(def, drill)

  const reset = () => {
    setGlobal(emptyGlobalFilters())
    setCross([])
    setDrill([])
  }

  const chips: ActiveChip[] = [
    ...drill.map((step, index): ActiveChip => ({ id: `d${index}`, kind: "drill", label: drillLabels(dataset!, [step])[0], onRemove: () => setDrill(drill.slice(0, index)) })),
    ...globalChips(global, setGlobal),
    ...crossChips(cross, (id) => setCross(cross.filter((item) => item.id !== id))),
  ]

  const point = menu && dataset && outcome?.ok ? describePoint(def, dataset, outcome.result, menu.point, drill) : null
  const actionsForPoint: ChartAction[] = []
  if (point) {
    if (point.drill) {
      actionsForPoint.push({ id: "drill", label: `Drill down to ${point.drill.nextLabel}`, hint: `Keeps ${point.drill.step.value} and breaks it down by ${point.drill.nextLabel.toLowerCase()}.`, onSelect: () => setDrill([...drill, point.drill!.step]) })
    }
    if (point.filters.length > 0) {
      actionsForPoint.push({ id: "filter", label: `Filter to ${point.heading}`, hint: "Limits this report to the selected item.", onSelect: () => setCross((current) => toggleCross(current, point.filters, null)) })
    }
  }
  const onPoint = (value: ChartPoint, anchor: { x: number; y: number }) => {
    if (!dataset || !outcome?.ok) return
    const description = describePoint(def, dataset, outcome.result, value, drill)
    if (!description.drill && description.filters.length === 0) return
    setMenu({ anchor, point: value })
  }

  if (!dataset) return <EmptyState title="Choose a dataset">Pick a dataset to start building.</EmptyState>
  const hide = { year: !datasetHasField(dataset, "financial_year"), dates: !dataset.primaryDate, district: !datasetHasField(dataset, "district"), department: !datasetHasField(dataset, "department") }

  return (
    <div className="flex flex-col gap-3">
      <RuntimeFilters global={global} onChange={setGlobal} onReset={reset} hide={hide} resetLabel="Reset all" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ActiveFilterBar chips={chips} onReset={reset} emptyText="None. Click a bar, slice or row to filter or drill." />
        {state.steps.length > 0 ? (
          <Button size="sm" onClick={() => setDrill(drill.slice(0, -1))}>
            Back one level
          </Button>
        ) : null}
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[color:var(--c-text-461220)]">{def.name}</h2>
            <p className="text-xs text-[color:var(--c-text-9d8189)]">
              {VIZ_LABELS[type]} on {dataset.name}
              {loading ? ". Updating" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {type !== "table" && type !== "kpi" && type !== "pivot" ? (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[color:var(--c-text-663a46)]">
                <input type="checkbox" className="h-4 w-4 accent-[color:var(--c-bg-461220)]" checked={showData} onChange={(event) => setShowData(event.target.checked)} />
                Show data
              </label>
            ) : null}
            <ExportMenu
              size="sm"
              disabled={!outcome?.ok}
              getInput={() => (data?.outcome.ok ? { def: { ...data.prepared.def, id: def.id, name: def.name, description: def.description }, result: data.outcome.result, user, vizType: type, showLabels: def.visualization.showLabels, stacked: def.visualization.stacked } : null)}
            />
            {actions}
          </div>
        </div>

        {!data ? (
          <div className="h-[320px] animate-pulse rounded-xl bg-[color:var(--c-bg-ffeee7)]" aria-label="Loading" />
        ) : !outcome?.ok ? (
          <div className="flex flex-col gap-2" role="alert">
            {outcome?.issues.map((issue) => (
              <Notice key={issue.code + (issue.fieldId ?? "")} tone="red" title={issue.code === "no-access" ? "Access restricted" : undefined}>
                {issue.message}
              </Notice>
            ))}
          </div>
        ) : fitIssue ? (
          <FitIssue message={fitIssue} def={def} onVizChange={onVizChange} />
        ) : (
          <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
            <VizRenderer result={outcome.result} type={type} showLabels={def.visualization.showLabels} stacked={def.visualization.stacked} comparison={data.comparison} onPoint={onPoint} height={380} />
            {showData && type !== "table" && type !== "kpi" && type !== "pivot" ? (
              <div className="mt-4">
                <ResultTable result={outcome.result} />
              </div>
            ) : null}
            <ResultMeta result={outcome.result} />
          </div>
        )}
      </div>

      {menu && point ? <ChartActionMenu anchor={menu.anchor} heading={point.heading} actions={actionsForPoint} onClose={() => setMenu(null)} /> : null}
    </div>
  )
}

function FitIssue({ message, def, onVizChange }: { message: string; def: ReportDefinition; onVizChange?: (type: VizType) => void }) {
  const options = suggestVizTypes(def).slice(0, 4)
  return (
    <EmptyState
      title="This chart needs a different set of fields"
      action={
        onVizChange && options.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {options.map((option) => (
              <Button key={option} size="sm" onClick={() => onVizChange(option)}>
                Use {VIZ_LABELS[option].toLowerCase()}
              </Button>
            ))}
          </div>
        ) : undefined
      }
    >
      {message}
    </EmptyState>
  )
}