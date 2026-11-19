import { canAccessDataset } from "@/analytics/access"
import { DISTRICT_NAMES, FINANCIAL_YEARS, SCHEMES, datasetById, fieldOf, metricById } from "@/analytics/catalog"
import { measureLabel } from "@/analytics/engine"
import { condition, defaultVisualization, measure, recordCount } from "@/analytics/templates"
import type { Dataset, DimensionSelection, FilterCondition, MeasureSelection, ReportDefinition, User, VizType } from "@/analytics/types"

// Optional natural language panel. A question is matched against a controlled list of patterns. Each
// pattern builds a structured report definition against the governed analytics layer. Free text never
// reaches the data and no SQL is accepted or produced.

export const EXAMPLE_QUESTIONS = [
  "Show district-wise cess collection for FY 2025-26",
  "Pending welfare applications by district",
  "Scheme-wise welfare disbursement for 2025-26",
  "Worker registrations by financial year",
  "Compare cess assessed, collected, remitted and credited",
  "Top 10 districts by cess assessed",
  "Inspections and violations by district",
  "Projects by status in Mysuru",
]

export interface NlqInterpretation {
  ok: boolean
  question: string
  patternId?: string
  title?: string
  summary: string[]
  def?: ReportDefinition
  message?: string
  suggestions: string[]
}

interface Entities {
  text: string
  year?: string
  yearProblem?: string
  district?: string
  scheme?: string
  top?: number
  groupBy?: string
  viz?: VizType
}

const GROUP_WORDS: [string, RegExp][] = [
  ["district", /\bdistrict[\s-]*wise\b|\bby district\b|\beach district\b|\bdistricts\b/],
  ["taluk", /\btaluk[\s-]*wise\b|\bby taluk\b/],
  ["financial_year", /\b(year[\s-]*wise|by (financial )?year|financial year[\s-]*wise|each year|yearly|annual)\b/],
  ["scheme", /\bscheme[\s-]*wise\b|\bby scheme\b|\beach scheme\b/],
  ["department", /\bdepartment[\s-]*wise\b|\bby department\b|\beach department\b/],
  ["project_type", /\b(project|work) type\b|\bby type\b|\btype[\s-]*wise\b/],
  ["status", /\bby status\b|\bstatus[\s-]*wise\b/],
  ["contractor", /\bby contractor\b|\bcontractor[\s-]*wise\b/],
  ["occupation", /\bby occupation\b|\boccupation[\s-]*wise\b/],
]

function extract(question: string): Entities {
  const text = question.toLowerCase().replace(/[?.!]+$/g, "").replace(/\s+/g, " ").trim()
  const entities: Entities = { text }
  const year = text.match(/(?:fy\s*)?(20\d{2})\s*[-–/]\s*(\d{2,4})/)
  if (year) {
    const start = year[1]
    const end = year[2].slice(-2)
    const normalised = `${start}-${end}`
    if (FINANCIAL_YEARS.includes(normalised)) entities.year = normalised
    else entities.yearProblem = `Financial year ${normalised} is not in this extract. Available years are ${FINANCIAL_YEARS.join(", ")}.`
  } else if (/\b(this|current|latest) (financial )?year\b/.test(text)) entities.year = "2025-26"
  else if (/\b(last|previous) (financial )?year\b/.test(text)) entities.year = "2024-25"

  const districts = [...DISTRICT_NAMES].sort((a, b) => b.length - a.length)
  entities.district = districts.find((name) => text.includes(name.toLowerCase()))

  const scheme = SCHEMES.find((name) => text.includes(name.split(" ")[0].toLowerCase()))
  if (scheme) entities.scheme = scheme

  const top = text.match(/\btop\s+(\d{1,3})\b/)
  if (top) entities.top = Number(top[1])

  entities.groupBy = GROUP_WORDS.find(([, pattern]) => pattern.test(text))?.[0]

  if (/\bmap\b/.test(text)) entities.viz = "map"
  else if (/\b(pie|share|proportion)\b/.test(text)) entities.viz = "pie"
  else if (/\bdonut\b/.test(text)) entities.viz = "donut"
  else if (/\b(trend|over time|monthly|by month)\b/.test(text)) entities.viz = "line"
  else if (/\btable\b/.test(text)) entities.viz = "table"
  return entities
}

interface Pattern {
  id: string
  title: string
  datasetId: string
  matches: (entities: Entities) => boolean
  build: (entities: Entities, dataset: Dataset) => { dimensions: DimensionSelection[]; measures: MeasureSelection[]; filters: FilterCondition[]; viz: VizType; groups: string[] }
}

const has = (text: string, ...words: RegExp[]) => words.every((word) => word.test(text))

function pickGroup(entities: Entities, dataset: Dataset, allowed: string[], fallback: string) {
  const wanted = entities.groupBy && allowed.includes(entities.groupBy) && fieldOf(dataset, entities.groupBy) ? entities.groupBy : fallback
  return wanted
}

const scopeFilters = (entities: Entities, dataset: Dataset) => {
  const filters: FilterCondition[] = []
  if (entities.year && fieldOf(dataset, "financial_year")) filters.push(condition("financial_year", "eq", { value: entities.year }))
  if (entities.district && fieldOf(dataset, "district")) filters.push(condition("district", "eq", { value: entities.district }))
  return filters
}

const PATTERNS: Pattern[] = [
  {
    id: "cess-stages",
    title: "Cess stages side by side",
    datasetId: "department_performance",
    matches: ({ text }) => has(text, /\bcess\b/, /(reconcil|compare|comparison|stages?|\bvs\b|versus)/) || (has(text, /\bassessed\b/, /\bcollected\b/) && /remitted|credited/.test(text)),
    build: (entities, dataset) => ({
      dimensions: [{ fieldId: "financial_year" }],
      measures: [measure("cess_assessed", "sum"), measure("cess_collected", "sum"), measure("cess_remitted", "sum"), measure("cess_credited", "sum")],
      filters: scopeFilters({ ...entities, district: undefined }, dataset),
      viz: "column",
      groups: ["Financial year"],
    }),
  },
  {
    id: "cess-collected",
    title: "Cess collected",
    datasetId: "cess_collections",
    matches: ({ text }) => has(text, /\bcess\b/, /\bcollect/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "taluk", "financial_year", "project_type", "contractor"], "district")
      return { dimensions: [{ fieldId: group }], measures: [measure("cess_collected", "sum")], filters: scopeFilters(entities, dataset), viz: entities.viz ?? (group === "financial_year" ? "column" : "bar"), groups: [fieldOf(dataset, group)?.label ?? group] }
    },
  },
  {
    id: "cess-assessed",
    title: "Cess assessed",
    datasetId: "cess_assessments",
    matches: ({ text }) => has(text, /\bcess\b/, /\bassess/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "taluk", "financial_year", "project_type", "contractor", "status"], "district")
      return { dimensions: [{ fieldId: group }], measures: [measure("cess_assessed", "sum")], filters: scopeFilters(entities, dataset), viz: entities.viz ?? (group === "financial_year" ? "column" : "bar"), groups: [fieldOf(dataset, group)?.label ?? group] }
    },
  },
  {
    id: "cess-remitted",
    title: "Cess remitted and credited",
    datasetId: "treasury_transactions",
    matches: ({ text }) => has(text, /\b(remit|remitted|remittance|credited|credit)\b/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["financial_year", "department", "status", "district"], "financial_year")
      return {
        dimensions: [{ fieldId: group }],
        measures: [measure("cess_remitted", "sum"), measure("cess_credited", "sum")],
        filters: scopeFilters(entities, dataset),
        viz: "column",
        groups: [fieldOf(dataset, group)?.label ?? group],
      }
    },
  },
  {
    id: "welfare-pending",
    title: "Pending welfare applications",
    datasetId: "welfare_applications",
    matches: ({ text }) => has(text, /\bpending\b/, /(application|welfare)/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "scheme", "taluk", "financial_year"], "district")
      return {
        dimensions: [{ fieldId: group }],
        measures: [recordCount()],
        filters: [condition("status", "eq", { value: "Pending" }), ...scopeFilters(entities, dataset), ...(entities.scheme ? [condition("scheme", "eq", { value: entities.scheme })] : [])],
        viz: entities.viz ?? "bar",
        groups: [fieldOf(dataset, group)?.label ?? group],
      }
    },
  },
  {
    id: "welfare-disbursement",
    title: "Welfare disbursement",
    datasetId: "welfare_applications",
    matches: ({ text }) => has(text, /(welfare|scheme)/, /(disburse|sanction|released|amount)/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["scheme", "district", "financial_year", "taluk"], "scheme")
      return {
        dimensions: [{ fieldId: group }],
        measures: [measure("amount_sanctioned", "sum")],
        filters: [condition("status", "eq", { value: "Sanctioned" }), ...scopeFilters(entities, dataset), ...(entities.scheme ? [condition("scheme", "eq", { value: entities.scheme })] : [])],
        viz: entities.viz ?? (group === "financial_year" ? "column" : "bar"),
        groups: [fieldOf(dataset, group)?.label ?? group],
      }
    },
  },
  {
    id: "beneficiaries",
    title: "Beneficiaries",
    datasetId: "beneficiaries",
    matches: ({ text }) => /beneficiar/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["scheme", "district", "financial_year", "occupation"], "scheme")
      return { dimensions: [{ fieldId: group }], measures: [measure("beneficiary_ref", "distinct", "People")], filters: scopeFilters(entities, dataset), viz: entities.viz ?? "bar", groups: [fieldOf(dataset, group)?.label ?? group] }
    },
  },
  {
    id: "worker-registration",
    title: "Worker registrations",
    datasetId: "worker_registrations",
    matches: ({ text }) => has(text, /\bworkers?\b/, /regist/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["financial_year", "district", "occupation", "gender", "age_band", "taluk"], "financial_year")
      return { dimensions: [{ fieldId: group }], measures: [recordCount()], filters: scopeFilters(entities, dataset), viz: entities.viz ?? (group === "financial_year" ? "column" : "bar"), groups: [fieldOf(dataset, group)?.label ?? group] }
    },
  },
  {
    id: "memberships",
    title: "KBOCW memberships",
    datasetId: "kbocw_memberships",
    matches: ({ text }) => /member/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["status", "financial_year", "district", "occupation"], "status")
      return { dimensions: [{ fieldId: group }], measures: [recordCount()], filters: scopeFilters(entities, dataset), viz: entities.viz ?? "donut", groups: [fieldOf(dataset, group)?.label ?? group] }
    },
  },
  {
    id: "inspections",
    title: "Inspections and violations",
    datasetId: "inspections",
    matches: ({ text }) => /(inspection|violation|compliance)/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "financial_year", "status", "department", "taluk"], "district")
      return {
        dimensions: [{ fieldId: group }],
        measures: [recordCount(), measure("violations_found", "sum")],
        filters: scopeFilters(entities, dataset),
        viz: entities.viz ?? "combo",
        groups: [fieldOf(dataset, group)?.label ?? group],
      }
    },
  },
  {
    id: "contractors",
    title: "Contractor performance",
    datasetId: "contractors",
    matches: ({ text }) => /contractor/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["financial_year", "status"], "financial_year")
      return {
        dimensions: [{ fieldId: group }],
        measures: [measure("projects_executed", "sum"), measure("compliance_rating", "avg")],
        filters: scopeFilters({ ...entities, district: entities.district }, dataset),
        viz: "combo",
        groups: [fieldOf(dataset, group)?.label ?? group],
      }
    },
  },
  {
    id: "department-performance",
    title: "Department performance",
    datasetId: "department_performance",
    matches: ({ text }) => has(text, /department/, /(performance|records|processing|cases)/),
    build: (entities, dataset) => ({
      dimensions: [{ fieldId: "department" }],
      measures: [measure("projects_active", "sum"), measure("avg_processing_days", "avg")],
      filters: scopeFilters({ ...entities, district: undefined }, dataset),
      viz: "combo",
      groups: ["Department"],
    }),
  },
  {
    id: "projects",
    title: "Construction projects",
    datasetId: "construction_projects",
    matches: ({ text }) => /\bprojects?\b/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "status", "project_type", "financial_year", "taluk", "contractor", "department"], "district")
      const cost = /\b(cost|value|worth)\b/.test(entities.text)
      return {
        dimensions: [{ fieldId: group }],
        measures: [cost ? measure("estimated_cost", "sum") : recordCount()],
        filters: scopeFilters(entities, dataset),
        viz: entities.viz ?? (group === "financial_year" ? "column" : "bar"),
        groups: [fieldOf(dataset, group)?.label ?? group],
      }
    },
  },
]

export function interpretQuestion(question: string, user: User): NlqInterpretation {
  const entities = extract(question)
  const base = { question, summary: [] as string[], suggestions: EXAMPLE_QUESTIONS.slice(0, 5) }
  if (!entities.text) return { ...base, ok: false, message: "Type a question about cess, welfare, workers, projects or inspections." }
  if (/\b(select|insert|update|delete|drop|alter|truncate|union)\b.*\b(from|into|table|set|where)\b/.test(entities.text) || /;|--/.test(entities.text)) {
    return { ...base, ok: false, message: "SQL is not accepted. Ask a question in plain words and the analytics layer builds a governed query." }
  }
  if (entities.yearProblem) return { ...base, ok: false, message: entities.yearProblem }

  const pattern = PATTERNS.find((item) => item.matches(entities))
  if (!pattern) {
    return { ...base, ok: false, message: "That question is outside the patterns this demonstration understands. Try one of the examples." }
  }
  const dataset = datasetById(pattern.datasetId)
  if (!dataset) return { ...base, ok: false, message: "The dataset for this question is not defined." }
  if (!canAccessDataset(user, dataset)) {
    return {
      ...base,
      ok: false,
      patternId: pattern.id,
      title: pattern.title,
      message: `This question needs ${dataset.name}, which is not available to your role. No query was run.`,
    }
  }
  const built = pattern.build(entities, dataset)
  const limit = entities.top ?? (built.dimensions[0]?.fieldId === "district" ? 15 : 30)
  const def: ReportDefinition = {
    id: "",
    name: pattern.title,
    description: `Built from the question "${question.trim()}".`,
    datasetId: dataset.id,
    dimensions: built.dimensions,
    measures: built.measures,
    filters: { id: "root", kind: "group", combinator: "AND", children: built.filters },
    sort: entities.top ? [{ columnId: built.measures[0].id, direction: "desc" }] : [],
    visualization: defaultVisualization(entities.viz === "map" && built.dimensions[0]?.fieldId !== "district" ? "bar" : built.viz, { limit }),
  }
  const summary = [
    `Dataset: ${dataset.name} (${dataset.sourceDepartment})`,
    `Measures: ${built.measures
      .map((item) => {
        const metric = metricById(fieldOf(dataset, item.fieldId)?.metricId ?? (item.fieldId === "*" ? "records" : ""))
        return `${measureLabel(dataset, item)}${metric ? ` (${item.aggregation === "calc" ? "ratio of totals" : item.aggregation})` : ""}`
      })
      .join(", ")}`,
    `Grouped by: ${built.groups.join(", ")}`,
    ...(built.filters.length ? [`Filters: ${built.filters.map((item) => `${fieldOf(dataset, item.fieldId)?.label ?? item.fieldId} equals ${item.value}`).join("; ")}`] : ["Filters: none"]),
    ...(entities.top ? [`Order: highest ${entities.top} by ${measureLabel(dataset, built.measures[0])}`] : []),
  ]
  return { ...base, ok: true, patternId: pattern.id, title: pattern.title, summary, def }
}
