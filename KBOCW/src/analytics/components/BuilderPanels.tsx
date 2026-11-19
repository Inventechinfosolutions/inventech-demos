import { useState } from "react"
import { canViewRecordDetail } from "@/analytics/access"
import { AGGREGATION_LABELS, CORE_GROUPINGS, RECORD_COUNT_FIELD, fieldOf, metricById } from "@/analytics/catalog"
import { LIMIT_CHOICES, MAX_DIMENSIONS, defaultMeasure, normalize, selectionOf, setAggregation, sortColumns, toggleField, toggleRecordCount } from "@/analytics/builderModel"
import { Badge, Button, fieldClass, labelClass } from "@/analytics/components/ui"
import { allowedAggregations } from "@/analytics/engine"
import type { Aggregation, Dataset, DatasetField, DateGrain, Issue, ReportDefinition, User } from "@/analytics/types"

interface PanelProps {
  def: ReportDefinition
  dataset: Dataset
  onChange: (def: ReportDefinition) => void
}

// ---------------------------------------------------------------- field picker

const GROUPS: { kind: DatasetField["kind"]; title: string }[] = [
  { kind: "dimension", title: "Dimensions" },
  { kind: "measure", title: "Measures" },
  { kind: "date", title: "Dates" },
  { kind: "calculated", title: "Calculated" },
]

const ROLE_TEXT = { dimension: "Grouping", measure: "Measure", column: "Column" }

export function FieldPicker({ def, dataset, onChange, onMessage }: PanelProps & { onMessage: (message: string) => void }) {
  const [query, setQuery] = useState("")
  const detail = def.visualization.type === "table" && def.visualization.detail
  const matches = (field: DatasetField) => `${field.label} ${field.description}`.toLowerCase().includes(query.toLowerCase())
  const recordCountSelected = def.measures.some((item) => item.fieldId === RECORD_COUNT_FIELD)

  return (
    <div>
      <input className={`${fieldClass} mb-3`} placeholder="Search fields" aria-label="Search fields" value={query} onChange={(event) => setQuery(event.target.value)} />
      {detail ? <p className="mb-3 rounded-lg bg-[color:var(--c-bg-ffeee7)] px-3 py-2 text-xs leading-5 text-[color:var(--c-text-663a46)]">Record detail is on. Tick the columns to list.</p> : null}
      <div className="flex flex-col gap-4">
        {GROUPS.map((group) => {
          const fields = dataset.fields.filter((field) => field.kind === group.kind && matches(field))
          const showCount = group.kind === "measure" && !detail && "record count".includes(query.toLowerCase())
          if (fields.length === 0 && !showCount) return null
          return (
            <div key={group.kind}>
              <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--c-text-8c2f39)] uppercase">{group.title}</p>
              <ul className="flex flex-col gap-1">
                {showCount ? (
                  <li>
                    <button type="button" aria-pressed={recordCountSelected} onClick={() => onChange(toggleRecordCount(def))} className={rowClass(recordCountSelected)}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{dataset.recordLabel} (count)</span>
                        <span className="block truncate text-xs text-[color:var(--c-text-9d8189)]">Number of records</span>
                      </span>
                      {recordCountSelected ? <Badge tone="ink">Measure</Badge> : null}
                    </button>
                  </li>
                ) : null}
                {fields.map((field) => {
                  const selected = selectionOf(def, field)
                  const hint = field.identifier ? "Counted only. Never listed." : (field.description ?? "")
                  return (
                    <li key={field.id}>
                      <button
                        type="button"
                        aria-pressed={selected != null}
                        title={field.description}
                        onClick={() => {
                          const result = toggleField(def, dataset, field)
                          if (result.message) onMessage(result.message)
                          else onChange(result.def)
                        }}
                        className={rowClass(selected != null)}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{field.label}</span>
                          <span className="block truncate text-xs text-[color:var(--c-text-9d8189)]">{hint}</span>
                        </span>
                        {field.sensitive ? <Badge tone="red">Masked</Badge> : null}
                        {field.conformed && !selected ? <Badge tone="blue">Shared</Badge> : null}
                        {selected ? <Badge tone="ink">{ROLE_TEXT[selected]}</Badge> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const rowClass = (selected: boolean) =>
  `flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${selected ? "border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-fff4ef)]" : "border-transparent hover:border-[color:var(--c-border-fed4c1)] hover:bg-[color:var(--c-bg-fff8f4)]"}`

// ---------------------------------------------------------------- grouping

const GRAINS: { id: DateGrain; label: string }[] = [
  { id: "month", label: "By month" },
  { id: "quarter", label: "By quarter" },
  { id: "year", label: "By year" },
]

export function GroupingPanel({ def, dataset, onChange, onMessage }: PanelProps & { onMessage: (message: string) => void }) {
  const move = (index: number, delta: number) => {
    const next = [...def.dimensions]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ ...def, dimensions: next })
  }
  const available = dataset.fields.filter((field) => field.groupable && !def.dimensions.some((dimension) => dimension.fieldId === field.id))
  const quick = CORE_GROUPINGS.map((id) => available.find((field) => field.id === id)).filter((field): field is DatasetField => Boolean(field))
  const others = available.filter((field) => !quick.includes(field))
  const add = (field: DatasetField) => {
    const result = toggleField(def, dataset, field)
    if (result.message) onMessage(result.message)
    else onChange(result.def)
  }
  return (
    <div className="flex flex-col gap-3">
      {def.dimensions.length === 0 ? <p className="text-sm text-[color:var(--c-text-86646d)]">No grouping. Measures are shown as one total. Pick a field below to break them down.</p> : null}
      {def.dimensions.map((dimension, index) => {
        const field = fieldOf(dataset, dimension.fieldId)
        return (
          <div key={dimension.fieldId} className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] p-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--c-bg-ffede5)] text-[11px] font-semibold text-[color:var(--c-text-8c2f39)]">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{field?.label ?? dimension.fieldId}</span>
            {field?.kind === "date" ? (
              <select aria-label={`${field.label} grain`} className={`${fieldClass} !h-8 !w-auto`} value={dimension.grain ?? "month"} onChange={(event) => onChange({ ...def, dimensions: def.dimensions.map((item) => (item.fieldId === dimension.fieldId ? { ...item, grain: event.target.value as DateGrain } : item)) })}>
                {GRAINS.map((grain) => (
                  <option key={grain.id} value={grain.id}>
                    {grain.label}
                  </option>
                ))}
              </select>
            ) : null}
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--c-text-86646d)] hover:bg-[color:var(--c-bg-fee4d8)] disabled:opacity-30">
              ↑
            </button>
            <button type="button" aria-label="Move down" disabled={index === def.dimensions.length - 1} onClick={() => move(index, 1)} className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--c-text-86646d)] hover:bg-[color:var(--c-bg-fee4d8)] disabled:opacity-30">
              ↓
            </button>
            <button type="button" aria-label={`Remove ${field?.label ?? "grouping"}`} onClick={() => onChange(normalize({ ...def, dimensions: def.dimensions.filter((item) => item.fieldId !== dimension.fieldId) }))} className="grid h-7 w-7 place-items-center rounded-full text-lg text-[color:var(--c-text-9d8189)] hover:bg-[color:var(--c-bg-fee4d8)] hover:text-[color:var(--c-text-8c2f39)]">
              ×
            </button>
          </div>
        )
      })}
      {def.dimensions.length < MAX_DIMENSIONS ? (
        <div>
          <p className={`${labelClass} mb-1.5`}>Group by</p>
          <div className="flex flex-wrap gap-1.5">
            {quick.map((field) => (
              <button key={field.id} type="button" onClick={() => add(field)} className="h-8 rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-xs font-semibold text-[color:var(--c-text-52212e)] hover:border-[color:var(--c-border-b23a48)]">
                + {field.label}
              </button>
            ))}
          </div>
          {others.length > 0 ? (
            <select aria-label="More grouping fields" className={`${fieldClass} mt-2`} value="" onChange={(event) => { const field = fieldOf(dataset, event.target.value); if (field) add(field) }}>
              <option value="">More fields in this dataset</option>
              {others.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-[color:var(--c-text-9d8189)]">Two grouping fields is the limit. Remove one to choose another.</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- measures and aggregation

const ALL_AGGREGATIONS: Aggregation[] = ["sum", "count", "avg", "min", "max", "distinct"]

export function MeasurePanel({ def, dataset, onChange, issues }: PanelProps & { issues: Issue[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (def.measures.length === 0) return <p className="text-sm text-[color:var(--c-text-86646d)]">No measure yet. Tick a measure in Fields, or use the record count.</p>
  return (
    <div className="flex flex-col gap-2">
      {def.measures.map((item) => {
        const isCount = item.fieldId === RECORD_COUNT_FIELD
        const field = isCount ? undefined : fieldOf(dataset, item.fieldId)
        const metric = field?.metricId ? metricById(field.metricId) : isCount ? metricById("records") : undefined
        const allowed = field ? allowedAggregations(field) : (["count"] as (Aggregation | "calc")[])
        const problems = issues.filter((issue) => issue.fieldId === item.fieldId)
        return (
          <div key={item.id} className={`rounded-xl border p-2 ${problems.length ? "border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-fff3ed)]" : "border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)]"}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium" title={field?.description}>
                {isCount ? `${dataset.recordLabel} (count)` : (field?.label ?? item.fieldId)}
              </span>
              {isCount ? (
                <Badge>Count</Badge>
              ) : field?.kind === "calculated" ? (
                <Badge tone="brass" title="Ratio or difference of totals">
                  Calculated
                </Badge>
              ) : (
                <select aria-label={`${field?.label ?? "Measure"} aggregation`} className={`${fieldClass} !h-8 !w-auto`} value={item.aggregation} onChange={(event) => onChange(setAggregation(def, item.id, event.target.value as Aggregation))}>
                  {ALL_AGGREGATIONS.map((aggregation) => (
                    <option key={aggregation} value={aggregation} disabled={!allowed.includes(aggregation)}>
                      {AGGREGATION_LABELS[aggregation]}
                      {allowed.includes(aggregation) ? "" : " (not allowed)"}
                    </option>
                  ))}
                </select>
              )}
              {metric ? (
                <button type="button" aria-expanded={open === item.id} aria-label={`Definition of ${metric.label}`} onClick={() => setOpen(open === item.id ? null : item.id)} className="grid h-7 w-7 place-items-center rounded-full border border-[color:var(--c-border-fed4c1)] text-xs font-semibold text-[color:var(--c-text-8c2f39)] hover:bg-[color:var(--c-bg-ffeee7)]">
                  i
                </button>
              ) : null}
              <button type="button" aria-label="Remove measure" onClick={() => onChange(isCount ? toggleRecordCount(def) : normalize({ ...def, measures: def.measures.filter((candidate) => candidate.id !== item.id) }))} className="grid h-7 w-7 place-items-center rounded-full text-lg text-[color:var(--c-text-9d8189)] hover:bg-[color:var(--c-bg-fee4d8)] hover:text-[color:var(--c-text-8c2f39)]">
                ×
              </button>
            </div>
            {open === item.id && metric ? (
              <p className="mt-2 rounded-lg bg-[color:var(--c-bg-ffffff)] px-2.5 py-2 text-xs leading-5 text-[color:var(--c-text-663a46)]">
                <span className="font-semibold text-[color:var(--c-text-8c2f39)]">{metric.label}. </span>
                {metric.definition}
                <span className="mt-1 block text-[color:var(--c-text-9d8189)]">
                  Owner: {metric.owner}. Allowed: {metric.allowed.map((aggregation) => AGGREGATION_LABELS[aggregation].toLowerCase()).join(", ")}.
                </span>
              </p>
            ) : null}
            {problems.map((issue) => (
              <p key={issue.code} className="mt-1.5 text-xs leading-5 text-[color:var(--c-text-8c2f39)]">
                {issue.message}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function addDefaultMeasure(def: ReportDefinition, dataset: Dataset): ReportDefinition {
  const first = dataset.fields.find((field) => field.kind === "measure")
  return first ? { ...def, measures: [defaultMeasure(first)] } : toggleRecordCount(def)
}

// ---------------------------------------------------------------- sorting and display

export function SortPanel({ def, dataset, user, onChange }: PanelProps & { user: User }) {
  const columns = sortColumns(def, dataset)
  const canDetail = canViewRecordDetail(user, dataset)
  const stackable = def.visualization.type === "column" || def.visualization.type === "bar" || def.visualization.type === "area"
  const setViz = (patch: Partial<ReportDefinition["visualization"]>) => onChange({ ...def, visualization: { ...def.visualization, ...patch } })
  const update = (index: number, patch: Partial<ReportDefinition["sort"][number]>) => onChange({ ...def, sort: def.sort.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)) })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {def.sort.length === 0 ? <p className="text-sm text-[color:var(--c-text-86646d)]">Default order. Groups are ranked by the first measure, and time is shown oldest to newest.</p> : null}
        {def.sort.map((entry, index) => (
          <div key={index} className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] p-2">
            <select aria-label="Sort column" className={`${fieldClass} !h-8 !w-auto min-w-[8rem] flex-1`} value={entry.columnId} onChange={(event) => update(index, { columnId: event.target.value })}>
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
            <select aria-label="Sort direction" className={`${fieldClass} !h-8 !w-auto`} value={entry.direction} onChange={(event) => update(index, { direction: event.target.value as "asc" | "desc" })}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button type="button" aria-label="Remove sort" onClick={() => onChange({ ...def, sort: def.sort.filter((_, position) => position !== index) })} className="grid h-7 w-7 place-items-center rounded-full text-lg text-[color:var(--c-text-9d8189)] hover:bg-[color:var(--c-bg-fee4d8)] hover:text-[color:var(--c-text-8c2f39)]">
              ×
            </button>
          </div>
        ))}
        <div>
          <Button size="sm" disabled={columns.length === 0 || def.sort.length >= 2} onClick={() => onChange({ ...def, sort: [...def.sort, { columnId: columns.find((column) => !def.sort.some((entry) => entry.columnId === column.id))?.id ?? columns[0].id, direction: "desc" }] })}>
            + Add sort
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <label className="block">
          <span className={`${labelClass} mb-1 block`}>Groups shown</span>
          <select className={fieldClass} value={def.visualization.limit} onChange={(event) => setViz({ limit: Number(event.target.value) })}>
            {LIMIT_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice === 0 ? "All groups" : `First ${choice}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[color:var(--c-bg-461220)]" checked={def.visualization.showLabels} onChange={(event) => setViz({ showLabels: event.target.checked })} />
          Show values on chart
        </label>
      </div>
      {stackable ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[color:var(--c-bg-461220)]" checked={def.visualization.stacked} onChange={(event) => setViz({ stacked: event.target.checked })} />
          Stack the series
        </label>
      ) : null}
      {def.visualization.type === "table" ? (
        <label className={`flex items-start gap-2 text-sm ${canDetail ? "cursor-pointer" : "cursor-not-allowed text-[color:var(--c-text-9d8189)]"}`} title={canDetail ? undefined : "Individual records are not available to your role."}>
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[color:var(--c-bg-461220)]"
            disabled={!canDetail}
            checked={def.visualization.detail}
            onChange={(event) => setViz({ detail: event.target.checked, detailColumns: event.target.checked && def.visualization.detailColumns.length === 0 ? dataset.fields.filter((field) => !field.identifier && field.kind !== "calculated").slice(0, 6).map((field) => field.id) : def.visualization.detailColumns })}
          />
          <span>
            List individual records
            {canDetail ? null : <span className="block text-xs">Not available to your role. Grouped figures only.</span>}
          </span>
        </label>
      ) : null}
    </div>
  )
}
