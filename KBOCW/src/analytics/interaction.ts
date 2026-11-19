import { fieldOf } from "@/analytics/catalog"
import type { ChartPoint } from "@/analytics/chartOptions"
import { formatGroupValue, newId } from "@/analytics/engine"
import { drillState } from "@/analytics/runtime"
import type { DrillStep } from "@/analytics/runtime"
import type { CrossFilter, Dataset, QueryResult, ReportDefinition } from "@/analytics/types"

export interface PointFilter {
  fieldId: string
  value: string
  label: string
  conformed: boolean
}

export interface PointDescription {
  heading: string
  filters: PointFilter[]
  drill: { step: DrillStep; nextLabel: string } | null
}

/** Turns a clicked chart element into the filters and drill step it can offer. */
export function describePoint(def: ReportDefinition, dataset: Dataset, result: QueryResult, point: ChartPoint, drill: DrillStep[]): PointDescription {
  const filters: PointFilter[] = []
  for (const column of result.columns) {
    if (column.kind !== "dimension" || point[column.id] === undefined || point[column.id] === "") continue
    const field = fieldOf(dataset, column.fieldId)
    if (!field || field.kind === "date") continue
    filters.push({ fieldId: field.id, value: point[column.id], label: `${field.label}: ${formatGroupValue(column, point[column.id])}`, conformed: Boolean(field.conformed) })
  }
  const state = drillState(def, drill)
  let drillTarget: PointDescription["drill"] = null
  if (state.level && state.next && point[state.level.fieldId] !== undefined && point[state.level.fieldId] !== "") {
    const next = fieldOf(dataset, state.next.fieldId)
    drillTarget = { step: { fieldId: state.level.fieldId, value: point[state.level.fieldId] }, nextLabel: next?.label ?? state.next.fieldId }
  }
  const heading = filters.length ? filters.map((item) => item.label).join(" and ") : "Selected item"
  return { heading, filters, drill: drillTarget }
}

/** Adds filters, or removes them when the same values are already applied. */
export function toggleCross(current: CrossFilter[], filters: PointFilter[], sourceWidgetId: string | null): CrossFilter[] {
  let next = [...current]
  for (const filter of filters) {
    const existing = next.find((item) => item.fieldId === filter.fieldId && item.sourceWidgetId === sourceWidgetId)
    if (existing && existing.value === filter.value) next = next.filter((item) => item.id !== existing.id)
    else {
      next = next.filter((item) => !(item.fieldId === filter.fieldId && item.sourceWidgetId === sourceWidgetId))
      next.push({ id: newId("x"), fieldId: filter.fieldId, value: filter.value, label: filter.label, sourceWidgetId })
    }
  }
  return next
}

export function drillLabels(dataset: Dataset, drill: DrillStep[]) {
  return drill.map((step) => `${fieldOf(dataset, step.fieldId)?.label ?? step.fieldId}: ${step.value}`)
}
