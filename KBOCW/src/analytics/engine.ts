import { canAccessDataset, canViewRecordDetail } from "@/analytics/access"
import { datasetById, fieldOf, metricById, RECORD_COUNT_FIELD } from "@/analytics/catalog"
import { getRows } from "@/analytics/seedData"
import type {
  Aggregation,
  AppliedFilter,
  CellValue,
  CrossFilter,
  Dataset,
  DatasetField,
  DateGrain,
  DimensionSelection,
  FilterCondition,
  FilterGroup,
  FilterNode,
  FilterOperator,
  GlobalFilters,
  Issue,
  MeasureSelection,
  MetricRef,
  QueryResult,
  ReportDefinition,
  ResultColumn,
  Row,
  User,
  Validation,
  VizType,
} from "@/analytics/types"

// Query execution. This layer never accepts free text. It runs a structured report definition
// against governed dataset metadata, so a user cannot reach a field or an aggregation that the
// catalogue does not expose.

export const SMALL_GROUP_LIMIT = 5
export const DETAIL_ROW_CAP = 2000

let counter = 0
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter += 1).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export const emptyGroup = (combinator: "AND" | "OR" = "AND"): FilterGroup => ({ id: newId("fg"), kind: "group", combinator, children: [] })

export interface ExtraFilter {
  condition: FilterCondition
  source: AppliedFilter["source"]
}

// ---------------------------------------------------------------- operators

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "equals",
  neq: "does not equal",
  contains: "contains",
  gt: "is greater than",
  lt: "is less than",
  between: "is between",
  in: "is one of",
  dateRange: "is within dates",
}

export function operatorsFor(field: DatasetField): FilterOperator[] {
  if (field.dataType === "date") return ["dateRange", "gt", "lt", "between"]
  if (field.dataType === "number") return ["eq", "neq", "gt", "lt", "between"]
  return ["eq", "neq", "contains", "in"]
}

export function operatorLabel(operator: FilterOperator, field: DatasetField) {
  if (field.dataType === "date") {
    if (operator === "gt") return "is after"
    if (operator === "lt") return "is before"
  }
  return OPERATOR_LABELS[operator]
}

export function isFilterable(field: DatasetField) {
  return field.kind !== "calculated" && !field.sensitive
}

export function isConditionComplete(condition: FilterCondition) {
  switch (condition.operator) {
    case "between":
      return Boolean(condition.value) && Boolean(condition.value2)
    case "in":
      return (condition.list?.length ?? 0) > 0
    case "dateRange":
      return Boolean(condition.value) || Boolean(condition.value2)
    default:
      return Boolean(condition.value)
  }
}

function conditionText(condition: FilterCondition, field: DatasetField | undefined, formatValue: (value: string) => string = (value) => value) {
  const name = field?.label ?? condition.fieldId
  const verb = field ? operatorLabel(condition.operator, field) : OPERATOR_LABELS[condition.operator]
  switch (condition.operator) {
    case "between":
      return `${name} ${verb} ${formatValue(condition.value ?? "")} and ${formatValue(condition.value2 ?? "")}`
    case "in":
      return `${name} ${verb} ${(condition.list ?? []).join(", ")}`
    case "dateRange":
      if (condition.value && condition.value2) return `${name} from ${condition.value} to ${condition.value2}`
      return condition.value ? `${name} from ${condition.value}` : `${name} up to ${condition.value2}`
    default:
      return `${name} ${verb} ${formatValue(condition.value ?? "")}`
  }
}

function nodeText(node: FilterNode, dataset: Dataset): string | null {
  if (node.kind === "condition") return isConditionComplete(node) ? conditionText(node, fieldOf(dataset, node.fieldId)) : null
  const parts = node.children.map((child) => nodeText(child, dataset)).filter((part): part is string => Boolean(part))
  if (parts.length === 0) return null
  return parts.length === 1 ? parts[0] : `(${parts.join(` ${node.combinator} `)})`
}

export function describeFilters(group: FilterGroup, dataset: Dataset): string[] {
  const parts = group.children.map((child) => nodeText(child, dataset)).filter((part): part is string => Boolean(part))
  if (parts.length === 0) return []
  return group.combinator === "OR" && parts.length > 1 ? [parts.join(" OR ")] : parts
}

export function countConditions(group: FilterGroup): number {
  return group.children.reduce((total, child) => total + (child.kind === "condition" ? 1 : countConditions(child)), 0)
}

// ---------------------------------------------------------------- filter evaluation

function numeric(value: CellValue | undefined) {
  return typeof value === "number" ? value : value == null || value === "" ? NaN : Number(value)
}

function matches(row: Row, condition: FilterCondition, field: DatasetField): boolean {
  const raw = row[condition.fieldId]
  if (raw == null) return false
  const isNumber = field.dataType === "number"
  const isDate = field.dataType === "date"
  const text = String(raw)
  switch (condition.operator) {
    case "eq":
      return isNumber ? numeric(raw) === Number(condition.value) : text === condition.value
    case "neq":
      return isNumber ? numeric(raw) !== Number(condition.value) : text !== condition.value
    case "contains":
      return text.toLowerCase().includes((condition.value ?? "").toLowerCase())
    case "gt":
      return isNumber ? numeric(raw) > Number(condition.value) : text > (condition.value ?? "")
    case "lt":
      return isNumber ? numeric(raw) < Number(condition.value) : text < (condition.value ?? "")
    case "between":
      if (isNumber) return numeric(raw) >= Number(condition.value) && numeric(raw) <= Number(condition.value2)
      return text >= (condition.value ?? "") && text <= (condition.value2 ?? "")
    case "in":
      return (condition.list ?? []).includes(text)
    case "dateRange":
      if (!isDate) return false
      return (!condition.value || text >= condition.value) && (!condition.value2 || text <= condition.value2)
    default:
      return true
  }
}

function evaluate(node: FilterNode, row: Row, dataset: Dataset): boolean | null {
  if (node.kind === "condition") {
    const field = fieldOf(dataset, node.fieldId)
    if (!field || !isConditionComplete(node) || !isFilterable(field)) return null
    return matches(row, node, field)
  }
  const results = node.children.map((child) => evaluate(child, row, dataset)).filter((result): result is boolean => result !== null)
  if (results.length === 0) return null
  return node.combinator === "AND" ? results.every(Boolean) : results.some(Boolean)
}

// ---------------------------------------------------------------- dates and grouping values

export function quarterOfMonth(month: number) {
  const fiscal = (month + 8) % 12
  return Math.floor(fiscal / 3) + 1
}

function fyOfIso(isoDate: string) {
  const year = Number(isoDate.slice(0, 4))
  const month = Number(isoDate.slice(5, 7))
  const start = month >= 4 ? year : year - 1
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`
}

export function dateGroupValue(isoDate: string, grain: DateGrain) {
  if (grain === "year") return fyOfIso(isoDate)
  if (grain === "quarter") return `${fyOfIso(isoDate)} Q${quarterOfMonth(Number(isoDate.slice(5, 7)))}`
  return isoDate.slice(0, 7)
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatGroupValue(column: Pick<ResultColumn, "dataType" | "grain" | "fieldId">, value: CellValue) {
  if (value == null) return "Not recorded"
  const text = String(value)
  if (column.dataType === "date" && (column.grain ?? "month") === "month" && /^\d{4}-\d{2}$/.test(text)) {
    return `${MONTH_NAMES[Number(text.slice(5, 7)) - 1]} ${text.slice(0, 4)}`
  }
  return text
}

export function dimensionColumnId(selection: DimensionSelection, field: DatasetField) {
  return field.kind === "date" ? `${selection.fieldId}` : selection.fieldId
}

export function measureLabel(dataset: Dataset, measure: MeasureSelection) {
  if (measure.label) return measure.label
  if (measure.fieldId === RECORD_COUNT_FIELD) return dataset.recordLabel
  const field = fieldOf(dataset, measure.fieldId)
  if (!field) return measure.fieldId
  if (measure.aggregation === "calc" || measure.aggregation === "sum") return field.label
  const verb: Record<string, string> = { avg: "Average", min: "Minimum", max: "Maximum", distinct: "Distinct", count: "Count of" }
  const prefix = verb[measure.aggregation] ?? ""
  if (prefix && field.label.toLowerCase().startsWith(prefix.toLowerCase())) return field.label
  return `${prefix} ${field.label.toLowerCase()}`.trim()
}

// ---------------------------------------------------------------- validation

export function allowedAggregations(field: DatasetField): (Aggregation | "calc")[] {
  if (field.kind === "calculated") return ["calc"]
  if (field.identifier) return ["distinct", "count"]
  if (field.kind === "measure") {
    const metric = field.metricId ? metricById(field.metricId) : undefined
    return metric?.allowed.length ? metric.allowed : ["sum"]
  }
  return ["distinct", "count"]
}

function singleYearScoped(def: ReportDefinition, extras: ExtraFilter[]) {
  if (def.dimensions.some((dimension) => dimension.fieldId === "financial_year" || dimension.grain === "year")) return true
  const scoped = (condition: FilterCondition) =>
    condition.fieldId === "financial_year" && ((condition.operator === "eq" && Boolean(condition.value)) || (condition.operator === "in" && condition.list?.length === 1))
  if (def.filters.combinator === "AND" && def.filters.children.some((child) => child.kind === "condition" && scoped(child))) return true
  return extras.some((extra) => scoped(extra.condition))
}

function singleMonthScoped(dataset: Dataset, def: ReportDefinition, extras: ExtraFilter[]) {
  const date = dataset.primaryDate
  if (!date) return false
  if (def.dimensions.some((dimension) => dimension.fieldId === date && (dimension.grain ?? "month") === "month")) return true
  const scoped = (condition: FilterCondition) => {
    if (condition.fieldId !== date) return false
    if (condition.operator === "eq") return Boolean(condition.value)
    if ((condition.operator === "dateRange" || condition.operator === "between") && condition.value && condition.value2) return condition.value.slice(0, 7) === condition.value2.slice(0, 7)
    return false
  }
  if (def.filters.combinator === "AND" && def.filters.children.some((child) => child.kind === "condition" && scoped(child))) return true
  return extras.some((extra) => scoped(extra.condition))
}

export function validateReport(def: ReportDefinition, user: User, extras: ExtraFilter[] = []): Validation {
  const errors: Issue[] = []
  const warnings: Issue[] = []
  const dataset = datasetById(def.datasetId)
  if (!dataset) {
    errors.push({ code: "no-dataset", message: "Choose a dataset to start." })
    return { errors, warnings }
  }
  if (!canAccessDataset(user, dataset)) {
    errors.push({ code: "no-access", message: `Your role does not have access to ${dataset.name}.` })
    return { errors, warnings }
  }
  const detail = def.visualization.type === "table" && def.visualization.detail

  if (detail) {
    if (!canViewRecordDetail(user, dataset)) {
      errors.push({ code: "detail-denied", message: `Individual ${dataset.recordLabel.toLowerCase()} are not available to your role. Switch off record detail to see grouped figures.` })
    }
    if (def.visualization.detailColumns.length === 0) errors.push({ code: "no-columns", message: "Choose at least one column to list." })
    for (const columnId of def.visualization.detailColumns) {
      if (!fieldOf(dataset, columnId)) errors.push({ code: "bad-field", message: `Column ${columnId} is not part of ${dataset.name}.`, fieldId: columnId })
    }
  } else {
    if (def.measures.length === 0) errors.push({ code: "no-measure", message: "Choose at least one measure, or use the record count." })
    for (const dimension of def.dimensions) {
      const field = fieldOf(dataset, dimension.fieldId)
      if (!field) errors.push({ code: "bad-field", message: `Grouping field ${dimension.fieldId} is not part of ${dataset.name}.`, fieldId: dimension.fieldId })
      else if (!field.groupable) errors.push({ code: "not-groupable", message: `${field.label} cannot be used for grouping.`, fieldId: field.id })
    }
    for (const measure of def.measures) {
      if (measure.fieldId === RECORD_COUNT_FIELD) continue
      const field = fieldOf(dataset, measure.fieldId)
      if (!field) {
        errors.push({ code: "bad-field", message: `Measure ${measure.fieldId} is not part of ${dataset.name}.`, fieldId: measure.fieldId })
        continue
      }
      if (field.kind === "dimension" && !field.identifier && measure.aggregation !== "count" && measure.aggregation !== "distinct") {
        errors.push({ code: "bad-aggregation", message: `${field.label} can only be counted.`, fieldId: field.id })
        continue
      }
      const allowed = allowedAggregations(field)
      if (!allowed.includes(measure.aggregation)) {
        const metric = field.metricId ? metricById(field.metricId) : undefined
        errors.push({
          code: "bad-aggregation",
          message: `${field.label} cannot be calculated as ${measure.aggregation}. ${metric?.definition ?? ""}`.trim(),
          fieldId: field.id,
        })
        continue
      }
      const metric = field.metricId ? metricById(field.metricId) : undefined
      if (metric?.requiresSingleYear && measure.aggregation === "sum" && !singleYearScoped(def, extras)) {
        errors.push({
          code: "single-year",
          message: `${field.label} repeats across financial years. Group by Financial year or filter to one financial year before adding it up.`,
          fieldId: field.id,
        })
      }
      if (metric?.requiresSingleMonth && measure.aggregation === "sum" && !singleMonthScoped(dataset, def, extras)) {
        errors.push({
          code: "single-month",
          message: `${field.label} is counted at a point in time, so adding months repeats it. Group by Month or filter to one month before adding it up.`,
          fieldId: field.id,
        })
      }
    }
    const stages = new Set(
      def.measures
        .map((measure) => (fieldOf(dataset, measure.fieldId)?.metricId ? metricById(fieldOf(dataset, measure.fieldId)?.metricId ?? "")?.stage : undefined))
        .filter((stage): stage is string => Boolean(stage)),
    )
    const stackedView = def.visualization.type === "stacked" || ((def.visualization.type === "area" || def.visualization.type === "column" || def.visualization.type === "bar") && def.visualization.stacked)
    if (stackedView && stages.size > 1) {
      errors.push({ code: "stage-stack", message: "These measures are separate stages of one process, such as approved and disbursed. Stacking them would add them together. Use a column chart instead." })
    }
  }

  const checkFilters = (node: FilterNode) => {
    if (node.kind === "group") {
      node.children.forEach(checkFilters)
      return
    }
    const field = fieldOf(dataset, node.fieldId)
    if (!field) errors.push({ code: "bad-field", message: `Filter field ${node.fieldId} is not part of ${dataset.name}.`, fieldId: node.fieldId })
    else if (!isFilterable(field)) errors.push({ code: "bad-filter", message: `${field.label} cannot be used in a filter.`, fieldId: field.id })
    else if (!isConditionComplete(node)) warnings.push({ code: "incomplete-filter", message: `The filter on ${field.label} has no value yet and is not applied.`, fieldId: field.id })
  }
  checkFilters(def.filters)
  return { errors, warnings }
}

// ---------------------------------------------------------------- visualization fit

export const VIZ_LABELS: Record<VizType, string> = {
  kpi: "KPI card",
  bar: "Bar chart",
  column: "Column chart",
  stacked: "Stacked bar chart",
  line: "Line chart",
  area: "Area chart",
  pie: "Pie chart",
  donut: "Donut chart",
  combo: "Combo chart",
  scatter: "Scatter plot",
  funnel: "Funnel chart",
  heatmap: "Heatmap",
  table: "Data table",
  pivot: "Pivot table",
  map: "District map",
}

export const VIZ_ORDER: VizType[] = ["column", "bar", "stacked", "line", "area", "pie", "donut", "combo", "scatter", "funnel", "heatmap", "kpi", "table", "pivot", "map"]

export function vizRequirement(type: VizType): string {
  switch (type) {
    case "kpi":
      return "One or more measures. Grouping is ignored and totals are shown."
    case "bar":
    case "column":
    case "line":
    case "area":
      return "One grouping field and one or more measures. A second grouping field splits the series."
    case "stacked":
      return "Two or more measures, or two grouping fields with one measure."
    case "pie":
    case "donut":
    case "funnel":
      return "One grouping field and one measure."
    case "combo":
      return "One grouping field and two or more measures. The first is drawn as bars and the rest as lines."
    case "scatter":
      return "Two or more measures. The first is the horizontal axis, the second the vertical axis and a third sets the dot size."
    case "heatmap":
      return "Two grouping fields and one measure."
    case "table":
      return "Any fields. Record detail needs access to individual records."
    case "pivot":
      return "One or two grouping fields and one measure."
    case "map":
      return "Grouping by District and one measure."
  }
}

export function vizIssue(def: ReportDefinition, type: VizType = def.visualization.type): string | null {
  const dims = def.dimensions.length
  const measures = def.measures.length
  switch (type) {
    case "kpi":
      return measures >= 1 ? null : "Add a measure to show a KPI card."
    case "bar":
    case "column":
    case "line":
    case "area":
      if (dims < 1) return `A ${VIZ_LABELS[type].toLowerCase()} needs one grouping field. Add one under Grouping.`
      if (dims > 2) return "Use at most two grouping fields."
      if (dims === 2 && measures > 1) return "With two grouping fields, keep one measure."
      return measures >= 1 ? null : "Add a measure to draw this chart."
    case "stacked":
      if (dims < 1) return "A stacked bar chart needs one grouping field."
      if (dims === 2) return measures === 1 ? null : "With two grouping fields, keep one measure."
      return measures >= 2 ? null : "Add a second measure, or add a second grouping field, to stack."
    case "pie":
    case "donut":
    case "funnel":
      if (dims !== 1) return `A ${VIZ_LABELS[type].toLowerCase()} needs exactly one grouping field.`
      return measures >= 1 ? null : "Add a measure to draw this chart."
    case "combo":
      if (dims < 1) return "A combo chart needs one grouping field."
      return measures >= 2 ? null : "A combo chart needs two measures, one for bars and one for the line."
    case "scatter":
      return measures >= 2 ? null : "A scatter plot needs two measures, one for each axis."
    case "heatmap":
      if (dims !== 2) return "A heatmap needs exactly two grouping fields."
      return measures >= 1 ? null : "Add a measure to colour the cells."
    case "pivot":
      if (dims < 1 || dims > 2) return "A pivot table needs one or two grouping fields."
      return measures >= 1 ? null : "Add a measure to fill the pivot table."
    case "map":
      if (dims < 1 || def.dimensions[0].fieldId !== "district") return "A district map needs District as the first grouping field."
      return measures >= 1 ? null : "Add a measure to colour the districts."
    case "table":
      return null
  }
}

export const suggestVizTypes = (def: ReportDefinition) => VIZ_ORDER.filter((type) => vizIssue(def, type) === null)

// ---------------------------------------------------------------- execution

interface MeasureState {
  sum: number
  n: number
  min: number
  max: number
  set: Set<string> | null
  num: number
  den: number
}

const freshState = (distinct: boolean): MeasureState => ({ sum: 0, n: 0, min: Infinity, max: -Infinity, set: distinct ? new Set() : null, num: 0, den: 0 })

function finish(measure: MeasureSelection, state: MeasureState, field: DatasetField | undefined, records: number): CellValue {
  if (measure.fieldId === RECORD_COUNT_FIELD) return records
  if (field?.ratio) return state.den ? (state.num / state.den) * (field.ratio.scale ?? 1) : null
  if (field?.difference) return state.num - state.den
  switch (measure.aggregation) {
    case "count":
      return state.n
    case "distinct":
      return state.set?.size ?? 0
    case "sum":
      return state.n ? state.sum : null
    case "avg":
      return state.n ? state.sum / state.n : null
    case "min":
      return state.n ? state.min : null
    case "max":
      return state.n ? state.max : null
    default:
      return null
  }
}

function compareValues(a: CellValue, b: CellValue) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "en", { numeric: true })
}

export function scopeRows(rows: Row[], dataset: Dataset, user: User): { rows: Row[]; notes: AppliedFilter[] } {
  const notes: AppliedFilter[] = []
  let scoped = rows
  if (user.districtScope && dataset.scope.district) {
    const key = dataset.scope.district
    scoped = scoped.filter((row) => row[key] === user.districtScope)
    notes.push({ label: `${user.districtScope} district only (role restriction)`, source: "role" })
  }
  if (user.departmentScope && dataset.scope.department) {
    const key = dataset.scope.department
    scoped = scoped.filter((row) => row[key] === user.departmentScope)
    notes.push({ label: `${user.departmentScope} only (role restriction)`, source: "role" })
  }
  return { rows: scoped, notes }
}

export type RunOutcome = { ok: true; result: QueryResult } | { ok: false; issues: Issue[] }

export function datasetHasField(dataset: Dataset, fieldId: string) {
  return dataset.fields.some((field) => field.id === fieldId)
}

export function runReport(def: ReportDefinition, user: User, extras: ExtraFilter[] = []): RunOutcome {
  const started = performance.now()
  const dataset = datasetById(def.datasetId)
  const validation = validateReport(def, user, extras)
  if (!dataset || validation.errors.length > 0) return { ok: false, issues: validation.errors }

  const viz = def.visualization
  const detail = viz.type === "table" && viz.detail
  const dimensions = viz.type === "kpi" ? [] : def.dimensions
  const { rows: scopedRows, notes } = scopeRows(getRows(dataset.id), dataset, user)

  const extraNode: FilterGroup = { id: "extras", kind: "group", combinator: "AND", children: extras.map((extra) => extra.condition) }
  const kept = scopedRows.filter((row) => evaluate(def.filters, row, dataset) !== false && evaluate(extraNode, row, dataset) !== false)

  const applied: AppliedFilter[] = [
    ...notes,
    ...describeFilters(def.filters, dataset).map((label) => ({ label, source: "report" as const })),
    ...extras
      .filter((extra) => isConditionComplete(extra.condition))
      .map((extra) => ({ label: conditionText(extra.condition, fieldOf(dataset, extra.condition.fieldId)), source: extra.source })),
  ]

  const warnings: string[] = []
  const metricRefs = new Map<string, MetricRef>()
  const addMetric = (metricId: string | undefined, aggregation: string) => {
    const metric = metricId ? metricById(metricId) : undefined
    if (metric && !metricRefs.has(metric.id + aggregation)) metricRefs.set(metric.id + aggregation, { id: metric.id, label: metric.label, definition: metric.definition, aggregation })
  }

  if (detail) {
    const columns: ResultColumn[] = viz.detailColumns.map((columnId) => {
      const field = fieldOf(dataset, columnId) as DatasetField
      addMetric(field.metricId, "row value")
      return { id: field.id, label: field.label, kind: field.kind === "measure" || field.kind === "calculated" ? "measure" : "dimension", fieldId: field.id, unit: field.unit ?? "text", dataType: field.dataType }
    })
    const sort = def.sort.find((entry) => columns.some((column) => column.id === entry.columnId))
    const sorted = sort ? [...kept].sort((a, b) => compareValues(a[sort.columnId], b[sort.columnId]) * (sort.direction === "asc" ? 1 : -1)) : kept
    const limited = sorted.slice(0, DETAIL_ROW_CAP)
    if (sorted.length > DETAIL_ROW_CAP) warnings.push(`Showing the first ${DETAIL_ROW_CAP.toLocaleString("en-IN")} of ${sorted.length.toLocaleString("en-IN")} records. Add filters to narrow the list.`)
    if (dataset.pii) warnings.push("Personal references are masked in this extract.")
    return {
      ok: true,
      result: {
        columns,
        rows: limited.map((row) => Object.fromEntries(columns.map((column) => [column.id, row[column.id] ?? null]))),
        totalGroups: sorted.length,
        scannedRows: kept.length,
        appliedFilters: applied,
        metrics: [...metricRefs.values()],
        warnings,
        suppressedGroups: 0,
        mode: "detail",
        executedAt: new Date().toISOString(),
        durationMs: Math.max(1, Math.round(performance.now() - started)),
        datasetId: dataset.id,
        datasetName: dataset.name,
        sourceSystem: dataset.sourceSystem,
        lastSync: dataset.lastSync,
      },
    }
  }

  const dimensionFields = dimensions.map((selection) => fieldOf(dataset, selection.fieldId) as DatasetField)
  const columns: ResultColumn[] = [
    ...dimensions.map((selection, index): ResultColumn => {
      const field = dimensionFields[index]
      return {
        id: dimensionColumnId(selection, field),
        label: field.kind === "date" ? `${field.label} (${selection.grain ?? "month"})` : field.label,
        kind: "dimension",
        fieldId: field.id,
        unit: field.unit ?? "text",
        grain: field.kind === "date" ? (selection.grain ?? "month") : undefined,
        dataType: field.dataType,
      }
    }),
    ...def.measures.map((measure): ResultColumn => {
      const field = measure.fieldId === RECORD_COUNT_FIELD ? undefined : fieldOf(dataset, measure.fieldId)
      const metricId = field?.metricId ?? (measure.fieldId === RECORD_COUNT_FIELD ? "records" : undefined)
      addMetric(metricId, measure.fieldId === RECORD_COUNT_FIELD ? "count" : measure.aggregation === "calc" ? "ratio of totals" : measure.aggregation)
      return {
        id: measure.id,
        label: measureLabel(dataset, measure),
        kind: "measure",
        fieldId: measure.fieldId,
        unit: measure.fieldId === RECORD_COUNT_FIELD ? "count" : measure.aggregation === "count" || measure.aggregation === "distinct" ? "count" : (field?.unit ?? "count"),
        aggregation: measure.aggregation,
        metricId,
        dataType: "number",
      }
    }),
  ]

  const measureFields = def.measures.map((measure) => (measure.fieldId === RECORD_COUNT_FIELD ? undefined : fieldOf(dataset, measure.fieldId)))
  interface Group {
    values: CellValue[]
    records: number
    states: MeasureState[]
  }
  const groups = new Map<string, Group>()
  for (const row of kept) {
    const values = dimensions.map((selection, index) => {
      const raw = row[selection.fieldId]
      if (raw == null) return null
      return dimensionFields[index].kind === "date" ? dateGroupValue(String(raw), selection.grain ?? "month") : raw
    })
    const key = values.join("\u0001")
    let group = groups.get(key)
    if (!group) {
      group = { values, records: 0, states: def.measures.map((measure) => freshState(measure.aggregation === "distinct")) }
      groups.set(key, group)
    }
    group.records += 1
    def.measures.forEach((_, index) => {
      const field = measureFields[index]
      const state = group.states[index]
      if (!field) return
      if (field.ratio) {
        state.num += numeric(row[field.ratio.numerator]) || 0
        state.den += numeric(row[field.ratio.denominator]) || 0
        return
      }
      if (field.difference) {
        state.num += numeric(row[field.difference.minuend]) || 0
        state.den += numeric(row[field.difference.subtrahend]) || 0
        return
      }
      const value = row[field.id]
      if (value == null) return
      state.n += 1
      if (typeof value === "number") {
        state.sum += value
        if (value < state.min) state.min = value
        if (value > state.max) state.max = value
      }
      state.set?.add(String(value))
    })
  }

  let suppressed = 0
  let table: Row[] = []
  const hideSmall = dataset.pii && !canViewRecordDetail(user, dataset)
  for (const group of groups.values()) {
    if (hideSmall && dimensions.length > 0 && group.records < SMALL_GROUP_LIMIT) {
      suppressed += 1
      continue
    }
    const row: Row = {}
    dimensions.forEach((_, index) => {
      row[columns[index].id] = group.values[index]
    })
    def.measures.forEach((measure, index) => {
      row[measure.id] = finish(measure, group.states[index], measureFields[index], group.records)
    })
    table.push(row)
  }
  if (suppressed > 0) warnings.push(`${suppressed} group${suppressed === 1 ? "" : "s"} with fewer than ${SMALL_GROUP_LIMIT} records ${suppressed === 1 ? "is" : "are"} hidden to protect personal information.`)
  if (dataset.pii) warnings.push("Personal references are masked in this extract.")

  const totalGroups = table.length
  const firstDimension = dimensions[0] ? columns[0] : null
  const timeLike = firstDimension ? firstDimension.dataType === "date" || firstDimension.fieldId === "financial_year" : false
  const sorts = def.sort.filter((entry) => columns.some((column) => column.id === entry.columnId))
  if (sorts.length > 0) {
    table.sort((a, b) => {
      for (const entry of sorts) {
        const result = compareValues(a[entry.columnId], b[entry.columnId])
        if (result !== 0) return result * (entry.direction === "asc" ? 1 : -1)
      }
      return 0
    })
  } else if (firstDimension) {
    const firstMeasure = def.measures[0]
    table.sort((a, b) => {
      for (let index = 0; index < dimensions.length; index += 1) {
        const column = columns[index]
        if (index === 0 && !timeLike && firstMeasure) {
          const result = compareValues(b[firstMeasure.id], a[firstMeasure.id])
          if (result !== 0) return result
        }
        const result = compareValues(a[column.id], b[column.id])
        if (result !== 0) return result
      }
      return 0
    })
  }

  if (firstDimension && viz.limit > 0) {
    const order: CellValue[] = []
    for (const row of table) if (!order.includes(row[firstDimension.id])) order.push(row[firstDimension.id])
    if (order.length > viz.limit) {
      const keep = new Set(timeLike && sorts.length === 0 ? order.slice(-viz.limit) : order.slice(0, viz.limit))
      table = table.filter((row) => keep.has(row[firstDimension.id]))
      warnings.push(`Showing the top ${viz.limit} of ${order.length} ${firstDimension.label.toLowerCase()} values. Raise the limit to see more.`)
    }
  }

  return {
    ok: true,
    result: {
      columns,
      rows: table,
      totalGroups,
      scannedRows: kept.length,
      appliedFilters: applied,
      metrics: [...metricRefs.values()],
      warnings,
      suppressedGroups: suppressed,
      mode: "aggregate",
      executedAt: new Date().toISOString(),
      durationMs: Math.max(1, Math.round(performance.now() - started)),
      datasetId: dataset.id,
      datasetName: dataset.name,
      sourceSystem: dataset.sourceSystem,
      lastSync: dataset.lastSync,
    },
  }
}

// ---------------------------------------------------------------- helpers shared by pages

export function distinctValues(datasetId: string, fieldId: string, limit = 200): string[] {
  const seen = new Set<string>()
  for (const row of getRows(datasetId)) {
    const value = row[fieldId]
    if (value != null) seen.add(String(value))
    if (seen.size >= limit) break
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
}

export function globalExtras(global: GlobalFilters, dataset: Dataset, source: AppliedFilter["source"] = "global"): ExtraFilter[] {
  const extras: ExtraFilter[] = []
  const push = (condition: Omit<FilterCondition, "id" | "kind">) => extras.push({ condition: { id: newId("gf"), kind: "condition", ...condition }, source })
  if (global.financialYears.length > 0 && datasetHasField(dataset, "financial_year")) push({ fieldId: "financial_year", operator: "in", list: global.financialYears })
  if ((global.from || global.to) && dataset.primaryDate) push({ fieldId: dataset.primaryDate, operator: "dateRange", value: global.from, value2: global.to })
  if (global.districts.length > 0 && datasetHasField(dataset, "district")) push({ fieldId: "district", operator: "in", list: global.districts })
  if (global.departments.length > 0 && datasetHasField(dataset, "department")) push({ fieldId: "department", operator: "in", list: global.departments })
  return extras
}

export function crossExtras(cross: CrossFilter[], dataset: Dataset, ownWidgetId?: string): ExtraFilter[] {
  return cross
    .filter((item) => item.sourceWidgetId !== ownWidgetId && datasetHasField(dataset, item.fieldId))
    .map((item) => ({ condition: { id: item.id, kind: "condition" as const, fieldId: item.fieldId, operator: "eq" as const, value: item.value }, source: "cross" as const }))
}

export function crossFiltersApplying(cross: CrossFilter[], dataset: Dataset, ownWidgetId?: string) {
  return cross.filter((item) => item.sourceWidgetId !== ownWidgetId && datasetHasField(dataset, item.fieldId))
}

/** Adds financial year as a series and limits to the two selected years. */
export function withComparison(def: ReportDefinition, years: string[]): ReportDefinition {
  const dataset = datasetById(def.datasetId)
  if (!dataset || !datasetHasField(dataset, "financial_year") || years.length < 2) return def
  const hasYear = def.dimensions.some((dimension) => dimension.fieldId === "financial_year")
  const dimensions = hasYear || def.dimensions.length >= 2 || def.visualization.type === "kpi" ? def.dimensions : [...def.dimensions, { fieldId: "financial_year" }]
  return { ...def, dimensions }
}
