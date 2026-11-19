import { datasetById, fieldOf } from "@/analytics/catalog"
import { crossExtras, datasetHasField, globalExtras, withComparison } from "@/analytics/engine"
import type { ExtraFilter } from "@/analytics/engine"
import type { CrossFilter, Dataset, DimensionSelection, FilterCondition, GlobalFilters, ReportDefinition } from "@/analytics/types"

// Combines a saved report with the filters a viewer adds while exploring: dashboard filters,
// cross-filters from other widgets, widget filters and drill-down steps. The saved report is never changed.

export interface DrillStep {
  fieldId: string
  value: string
}

export interface RuntimeContext {
  global?: GlobalFilters | null
  cross?: CrossFilter[]
  widgetId?: string
  widgetFilters?: FilterCondition[]
  drill?: DrillStep[]
}

export function drillPathFor(dataset: Dataset, fieldId: string) {
  return dataset.drill.find((path) => path.includes(fieldId)) ?? null
}

export function drillState(def: ReportDefinition, steps: DrillStep[] = []) {
  const dataset = datasetById(def.datasetId)
  const first = def.dimensions[0]
  if (!dataset || !first) return { level: null as DimensionSelection | null, next: null as DimensionSelection | null, steps }
  const path = drillPathFor(dataset, first.fieldId)
  if (!path) return { level: first, next: null, steps }
  const start = path.indexOf(first.fieldId)
  const level = path[start + steps.length]
  const next = path[start + steps.length + 1]
  const asSelection = (fieldId: string | undefined): DimensionSelection | null => {
    if (!fieldId) return null
    const field = fieldOf(dataset, fieldId)
    return field?.kind === "date" ? { fieldId, grain: "month" as const } : { fieldId }
  }
  return { level: asSelection(level), next: asSelection(next), steps }
}

export function applyDrill(def: ReportDefinition, steps: DrillStep[]): { def: ReportDefinition; extras: ExtraFilter[] } {
  if (steps.length === 0) return { def, extras: [] }
  const state = drillState(def, steps)
  const dimensions = state.level ? [state.level, ...def.dimensions.slice(1)] : def.dimensions
  const extras = steps.map((step, index) => ({
    condition: { id: `drill-${index}`, kind: "condition" as const, fieldId: step.fieldId, operator: "eq" as const, value: step.value },
    source: "drill" as const,
  }))
  return { def: { ...def, dimensions }, extras }
}

/** Dashboard year and date filters replace the year or date set inside a report. */
function withoutOverridden(def: ReportDefinition, dataset: Dataset, extras: ExtraFilter[]): ReportDefinition {
  const overridden = new Set<string>()
  for (const extra of extras) {
    if (extra.source === "global" && (extra.condition.fieldId === "financial_year" || extra.condition.fieldId === dataset.primaryDate)) overridden.add(extra.condition.fieldId)
  }
  if (overridden.size === 0 || def.filters.combinator !== "AND") return def
  return { ...def, filters: { ...def.filters, children: def.filters.children.filter((child) => !(child.kind === "condition" && overridden.has(child.fieldId))) } }
}

export interface Prepared {
  def: ReportDefinition
  extras: ExtraFilter[]
  comparing: string[] | null
}

export function prepare(base: ReportDefinition, context: RuntimeContext = {}): Prepared {
  const dataset = datasetById(base.datasetId)
  if (!dataset) return { def: base, extras: [], comparing: null }
  const drilled = applyDrill(base, context.drill ?? [])
  let def = drilled.def
  const extras: ExtraFilter[] = [...drilled.extras]

  let comparing: string[] | null = null
  if (context.global) {
    const years = context.global.financialYears
    comparing = context.global.compare && years.length >= 2 && datasetHasField(dataset, "financial_year") ? years.slice(0, 2) : null
    extras.push(...globalExtras(comparing ? { ...context.global, financialYears: comparing } : context.global, dataset))
    if (comparing) def = withComparison(def, comparing)
  }
  if (context.cross) extras.push(...crossExtras(context.cross, dataset, context.widgetId))
  for (const condition of context.widgetFilters ?? []) {
    if (datasetHasField(dataset, condition.fieldId)) extras.push({ condition, source: "widget" })
  }
  def = withoutOverridden(def, dataset, extras)
  return { def, extras, comparing }
}
