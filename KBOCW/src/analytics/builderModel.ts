import { RECORD_COUNT_FIELD, fieldOf, metricById } from "@/analytics/catalog"
import { allowedAggregations } from "@/analytics/engine"
import { measure } from "@/analytics/templates"
import type { Aggregation, Dataset, DatasetField, MeasureSelection, ReportDefinition } from "@/analytics/types"

export const MAX_DIMENSIONS = 2

/** Removes sort entries that no longer point at a column of the report. */
export function normalize(def: ReportDefinition): ReportDefinition {
  const columns = new Set([...def.dimensions.map((dimension) => dimension.fieldId), ...def.measures.map((item) => item.id), ...def.visualization.detailColumns])
  const sort = def.sort.filter((entry) => columns.has(entry.columnId))
  return sort.length === def.sort.length ? def : { ...def, sort }
}

export function defaultMeasure(field: DatasetField): MeasureSelection {
  if (field.kind === "calculated") return measure(field.id, "calc")
  const allowed = allowedAggregations(field)
  const metric = field.metricId ? metricById(field.metricId) : undefined
  const preferred = metric?.defaultAggregation
  const aggregation = (preferred && allowed.includes(preferred) ? preferred : allowed[0]) as Aggregation | "calc"
  return measure(field.id, aggregation)
}

export type Selection = "dimension" | "measure" | "column" | null

export function selectionOf(def: ReportDefinition, field: DatasetField): Selection {
  if (def.visualization.type === "table" && def.visualization.detail) return def.visualization.detailColumns.includes(field.id) ? "column" : null
  if (def.dimensions.some((dimension) => dimension.fieldId === field.id)) return "dimension"
  if (def.measures.some((item) => item.fieldId === field.id)) return "measure"
  return null
}

export function isUsableField(field: DatasetField, detail: boolean) {
  if (detail) return true
  return field.kind !== "dimension" || field.groupable || field.identifier
}

/** Adds or removes a field. Returns a message when the change is refused. */
export function toggleField(def: ReportDefinition, _dataset: Dataset, field: DatasetField): { def: ReportDefinition; message?: string } {
  const detail = def.visualization.type === "table" && def.visualization.detail
  if (detail) {
    const columns = def.visualization.detailColumns
    const next = columns.includes(field.id) ? columns.filter((id) => id !== field.id) : [...columns, field.id]
    return { def: normalize({ ...def, visualization: { ...def.visualization, detailColumns: next } }) }
  }
  const asDimension = (field.kind === "date" || field.kind === "dimension") && field.groupable
  if (asDimension) {
    if (def.dimensions.some((dimension) => dimension.fieldId === field.id)) {
      return { def: normalize({ ...def, dimensions: def.dimensions.filter((dimension) => dimension.fieldId !== field.id) }) }
    }
    if (def.dimensions.length >= MAX_DIMENSIONS) return { def, message: `A report groups by at most ${MAX_DIMENSIONS} fields. Remove one under Grouping first.` }
    return { def: { ...def, dimensions: [...def.dimensions, field.kind === "date" ? { fieldId: field.id, grain: "month" } : { fieldId: field.id }] } }
  }
  if (def.measures.some((item) => item.fieldId === field.id)) {
    return { def: normalize({ ...def, measures: def.measures.filter((item) => item.fieldId !== field.id) }) }
  }
  const added = field.kind === "dimension" ? measure(field.id, "distinct") : defaultMeasure(field)
  return { def: { ...def, measures: [...def.measures, added] } }
}

export function toggleRecordCount(def: ReportDefinition): ReportDefinition {
  if (def.measures.some((item) => item.fieldId === RECORD_COUNT_FIELD)) return normalize({ ...def, measures: def.measures.filter((item) => item.fieldId !== RECORD_COUNT_FIELD) })
  return { ...def, measures: [...def.measures, measure(RECORD_COUNT_FIELD, "count")] }
}

export function setAggregation(def: ReportDefinition, measureId: string, aggregation: Aggregation | "calc"): ReportDefinition {
  const current = def.measures.find((item) => item.id === measureId)
  if (!current) return def
  const id = `${aggregation}:${current.fieldId}`
  if (id !== measureId && def.measures.some((item) => item.id === id)) return def
  return normalize({
    ...def,
    measures: def.measures.map((item) => (item.id === measureId ? { ...item, id, aggregation, label: undefined } : item)),
    sort: def.sort.map((entry) => (entry.columnId === measureId ? { ...entry, columnId: id } : entry)),
  })
}

/** Columns a sort can use for the current report. */
export function sortColumns(def: ReportDefinition, dataset: Dataset): { id: string; label: string }[] {
  if (def.visualization.type === "table" && def.visualization.detail) {
    return def.visualization.detailColumns.map((id) => ({ id, label: fieldOf(dataset, id)?.label ?? id }))
  }
  return [
    ...def.dimensions.map((dimension) => ({ id: dimension.fieldId, label: fieldOf(dataset, dimension.fieldId)?.label ?? dimension.fieldId })),
    ...def.measures.map((item) => ({ id: item.id, label: item.label ?? (item.fieldId === RECORD_COUNT_FIELD ? dataset.recordLabel : `${fieldOf(dataset, item.fieldId)?.label ?? item.fieldId}`) })),
  ]
}

export const LIMIT_CHOICES = [5, 10, 15, 25, 30, 50, 100, 0]
