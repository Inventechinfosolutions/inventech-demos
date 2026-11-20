import { canAccessDataset } from "@/analytics/access"
import { DISTRICT_NAMES, FINANCIAL_YEARS, datasetById, fieldOf, metricById } from "@/analytics/catalog"
import { distinctValues, measureLabel } from "@/analytics/engine"
import { condition, defaultVisualization, measure } from "@/analytics/templates"
import type { Dataset, DimensionSelection, FilterCondition, MeasureSelection, ReportDefinition, User, VizType } from "@/analytics/types"

// Optional natural language panel. A question is matched against a controlled list of patterns. Each
// pattern builds a structured report definition against the governed analytics layer. Free text never
// reaches the data and no SQL is accepted or produced.

export const EXAMPLE_QUESTIONS = [
  "Show district-wise cess collection for FY 2025-26",
  "Compare cess assessed and collected by year",
  "Top 10 districts by welfare disbursement",
  "Pending welfare applications by district",
  "Scheme-wise welfare disbursement",
  "Inspections and violations by district",
  "Projects by category in Mysuru",
  "Factory accidents by category",
  "Gig worker payouts by month",
  "Welfare fee by aggregator",
  "Unorganised workers registrations by month",
  "Benefits approved and disbursed by scheme",
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
  top?: number
  groupBy?: string
  viz?: VizType
}

const GROUP_WORDS: [string, RegExp][] = [
  ["district", /\bdistrict[\s-]*wise\b|\bby district\b|\beach district\b|\bdistricts\b/],
  ["financial_year", /\b(year[\s-]*wise|by (financial )?year|financial year[\s-]*wise|each year|yearly|annual)\b/],
  ["period", /\b(month[\s-]*wise|by month|each month|monthly|over time|trend)\b/],
  ["scheme", /\bscheme[\s-]*wise\b|\bby scheme\b|\beach scheme\b/],
  ["category", /\bcategor(y|ies)\b|\bcategory[\s-]*wise\b/],
  ["aggregator", /\baggregator[\s-]*wise\b|\bby aggregator\b|\beach aggregator\b/],
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
  } else if (/\b(this|current|latest) (financial )?year\b/.test(text)) entities.year = "2026-27"
  else if (/\b(last|previous) (financial )?year\b/.test(text)) entities.year = "2025-26"

  const districts = [...DISTRICT_NAMES].sort((a, b) => b.length - a.length)
  entities.district = districts.find((name) => text.includes(name.toLowerCase()))

  const top = text.match(/\btop\s+(\d{1,3})\b/)
  if (top) entities.top = Number(top[1])

  entities.groupBy = GROUP_WORDS.find(([, pattern]) => pattern.test(text))?.[0]

  if (/\bmap\b/.test(text)) entities.viz = "map"
  else if (/\b(pie|share|proportion)\b/.test(text)) entities.viz = "pie"
  else if (/\bdonut\b/.test(text)) entities.viz = "donut"
  else if (/\b(trend|over time)\b/.test(text)) entities.viz = "line"
  else if (/\btable\b/.test(text)) entities.viz = "table"
  return entities
}

interface Pattern {
  id: string
  title: string
  datasetId: string
  // Some dashboards carry a single year. A question about another year gets an explanation, not an empty chart.
  onlyYear?: string
  matches: (entities: Entities) => boolean
  build: (entities: Entities, dataset: Dataset) => { dimensions: DimensionSelection[]; measures: MeasureSelection[]; filters: FilterCondition[]; viz: VizType; groups: string[] }
}

const has = (text: string, ...words: RegExp[]) => words.every((word) => word.test(text))
const is = (text: string, word: RegExp) => word.test(text)

const GIG = /\b(gig|aggregators?|platform)\b/
const KSU = /\b(unorganised|unorganized|social security|ksu|ksuwssb)\b/
const FACTORY = /\b(factor(y|ies)|boilers?|accidents?|injur\w*|fatal\w*)\b/

function pickGroup(entities: Entities, dataset: Dataset, allowed: string[], fallback: string) {
  return entities.groupBy && allowed.includes(entities.groupBy) && fieldOf(dataset, entities.groupBy) ? entities.groupBy : fallback
}

// Cube boards cover 2025-26 as the working year. Gig and Unorganised Workers cover April to September 2026.
const defaultYear = (dataset: Dataset) => (dataset.id.startsWith("gig") || dataset.id.startsWith("ksu") ? "2026-27" : "2025-26")

function scopeFilters(entities: Entities, dataset: Dataset, group: string) {
  const filters: FilterCondition[] = []
  const timeGroup = group === "financial_year" || group === "period"
  const year = entities.year ?? (timeGroup && !entities.year ? undefined : defaultYear(dataset))
  if (year && fieldOf(dataset, "financial_year")) filters.push(condition("financial_year", "eq", { value: year }))
  if (entities.district && fieldOf(dataset, "district")) filters.push(condition("district", "eq", { value: entities.district }))
  return filters
}

function schemeIn(text: string, datasetId: string) {
  let best: { name: string; length: number } | undefined
  for (const name of distinctValues(datasetId, "scheme")) {
    for (const word of name.toLowerCase().split(/[^a-z]+/)) {
      if (word.length >= 5 && text.includes(word) && (!best || word.length > best.length)) best = { name, length: word.length }
    }
  }
  return best?.name
}

const labelOf = (dataset: Dataset, id: string) => fieldOf(dataset, id)?.label ?? id
const limitFor = (group: string) => (group === "district" ? 15 : group === "period" ? 36 : group === "aggregator" ? 20 : 30)
const vizFor = (entities: Entities, group: string) => entities.viz ?? (group === "financial_year" || group === "period" ? "column" : "bar")

const PATTERNS: Pattern[] = [
  // Gig Workers Welfare Board
  {
    id: "gig-fee",
    title: "Welfare fee by aggregator",
    datasetId: "gig_aggregators",
    matches: ({ text }) => is(text, GIG) && /\b(fee|deposit\w*|payable|shortfall)\b/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["aggregator", "period", "financial_year"], "aggregator")
      const measures = /shortfall/.test(entities.text) ? [measure("fee_shortfall", "sum")] : [measure("fee_payable", "sum"), measure("fee_deposited", "sum")]
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "gig-aggregators",
    title: "Gig aggregators",
    datasetId: "gig_aggregators",
    matches: ({ text, groupBy }) => /\baggregators?\b/.test(text) && groupBy !== "district",
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["aggregator", "period", "financial_year"], "aggregator")
      return { dimensions: [{ fieldId: group }], measures: [measure("payouts", "sum"), measure("records", "sum")], filters: scopeFilters(entities, dataset, group), viz: "combo", groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "gig-district",
    title: "Gig workers by district",
    datasetId: "gig_districts",
    matches: ({ text, groupBy }) => is(text, GIG) && (groupBy === "district" || Boolean(DISTRICT_NAMES.find((name) => text.includes(name.toLowerCase())))),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "district")
      return { dimensions: [{ fieldId: group }], measures: [measure("payouts", "sum"), measure("benefits", "sum")], filters: scopeFilters(entities, dataset, group), viz: entities.viz ?? "combo", groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "gig-monthly",
    title: "Gig worker payouts",
    datasetId: "gig_monthly",
    matches: ({ text }) => is(text, GIG),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["period", "financial_year"], "period")
      const measures = /\b(benefit|welfare)/.test(entities.text) && !/payout/.test(entities.text) ? [measure("benefits", "sum")] : [measure("payouts", "sum")]
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },

  // Unorganised Workers Social Security Board
  {
    id: "ksu-schemes",
    title: "Unorganised workers by scheme",
    datasetId: "ksu_schemes",
    matches: ({ text, groupBy }) => is(text, KSU) && (groupBy === "scheme" || Boolean(schemeIn(text, "ksu_schemes"))),
    build: (entities, dataset) => {
      const scheme = schemeIn(entities.text, "ksu_schemes")
      const group = pickGroup(entities, dataset, ["scheme", "period", "financial_year"], "scheme")
      return {
        dimensions: [{ fieldId: group }],
        measures: [measure("approved", "sum"), measure("disbursed", "sum")],
        filters: [...scopeFilters(entities, dataset, group), ...(scheme ? [condition("scheme", "eq", { value: scheme })] : [])],
        viz: vizFor(entities, group),
        groups: [labelOf(dataset, group)],
      }
    },
  },
  {
    id: "ksu-districts",
    title: "Unorganised workers by district",
    datasetId: "ksu_districts",
    matches: ({ text, groupBy }) => is(text, KSU) && (groupBy === "district" || Boolean(DISTRICT_NAMES.find((name) => text.includes(name.toLowerCase())))),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "district")
      return { dimensions: [{ fieldId: group }], measures: [measure("received", "sum"), measure("disbursed", "sum")], filters: scopeFilters(entities, dataset, group), viz: entities.viz ?? "combo", groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "ksu-monthly",
    title: "Unorganised workers by month",
    datasetId: "ksu_monthly",
    matches: ({ text }) => is(text, KSU),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["period", "financial_year"], "period")
      const money = /\b(benefit|approved|disburs\w*|paid|amount)\b/.test(entities.text)
      const measures = money ? [measure("approved", "sum"), measure("disbursed", "sum")] : /\b(claim|application|case)/.test(entities.text) ? [measure("received", "sum")] : [measure("new_registrations", "sum")]
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },

  // Factories & Boilers
  {
    id: "factories-district",
    title: "Factories by district",
    datasetId: "factories_monthly",
    matches: ({ text, groupBy }) => is(text, FACTORY) && (groupBy === "district" || groupBy === "period" || groupBy === "financial_year" || Boolean(DISTRICT_NAMES.find((name) => text.includes(name.toLowerCase())))),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "district")
      const measures = /accident|injur|fatal/.test(entities.text) ? [measure("accidents", "sum")] : [measure("inspections", "sum"), measure("violations", "sum")]
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: measures.length > 1 ? "combo" : vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "factories-category",
    title: "Factories by establishment category",
    datasetId: "factories_categories",
    onlyYear: "2025-26",
    matches: ({ text }) => is(text, FACTORY),
    build: (entities, dataset) => {
      const measures = /accident|injur|fatal/.test(entities.text) ? [measure("accidents", "sum"), measure("injuries", "sum"), measure("fatalities", "sum")] : /boiler/.test(entities.text) ? [measure("boilers", "sum"), measure("boilers_due", "sum")] : [measure("inspections", "sum"), measure("violations", "sum")]
      return { dimensions: [{ fieldId: "category" }], measures, filters: scopeFilters(entities, dataset, "category"), viz: entities.viz ?? "combo", groups: ["Establishment category"] }
    },
  },

  // Labour Commissionerate
  {
    id: "labour-projects",
    title: "Construction projects",
    datasetId: "labour_projects",
    onlyYear: "2025-26",
    matches: ({ text }) => /\bprojects?\b/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["category", "district"], "category")
      return { dimensions: [{ fieldId: group }], measures: [measure("projects", "sum")], filters: scopeFilters(entities, dataset, group), viz: entities.viz ?? "bar", groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "labour-compliance",
    title: "Inspections and violations",
    datasetId: "labour_monthly",
    matches: ({ text }) => /(inspection|violation|compliance)/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "district")
      return { dimensions: [{ fieldId: group }], measures: [measure("inspections", "sum"), measure("violations", "sum")], filters: scopeFilters(entities, dataset, group), viz: entities.viz ?? "combo", groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "cess",
    title: "Cess",
    datasetId: "labour_monthly",
    matches: ({ text }) => /\b(cess|outstanding|collection rate)\b/.test(text),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], /(compare|comparison|stages?|\bvs\b|versus)/.test(entities.text) ? "financial_year" : "district")
      const text = entities.text
      const measures: MeasureSelection[] = []
      if (/\boutstanding\b/.test(text)) measures.push(measure("outstanding_cess", "calc"))
      else if (/collection rate/.test(text)) measures.push(measure("collection_rate", "calc"))
      else {
        const assessed = /\bassess/.test(text)
        const collected = /\bcollect/.test(text)
        if (assessed || !collected) measures.push(measure("cess_assessed", "sum"))
        if (collected || !assessed) measures.push(measure("cess_collected", "sum"))
      }
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: measures.length > 1 ? "column" : vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },

  // KBOCW Welfare Board
  {
    id: "welfare-schemes",
    title: "Welfare schemes",
    datasetId: "welfare_schemes",
    onlyYear: "2025-26",
    matches: ({ text, groupBy }) => (groupBy === "scheme" || Boolean(schemeIn(text, "welfare_schemes"))) && /(welfare|scheme|assist|disburs|approved|application)/.test(text),
    build: (entities, dataset) => {
      const scheme = schemeIn(entities.text, "welfare_schemes")
      const text = entities.text
      const measures = /\bapplications?\b/.test(text) && !/disburs/.test(text) ? [measure("applications", "sum"), measure("pending", "sum"), measure("rejected", "sum")] : /\bpeople|beneficiar/.test(text) ? [measure("people_assisted", "sum")] : [measure("approved_rupees", "sum"), measure("disbursed_rupees", "sum")]
      return { dimensions: [{ fieldId: "scheme" }], measures, filters: [...scopeFilters(entities, dataset, "scheme"), ...(scheme ? [condition("scheme", "eq", { value: scheme })] : [])], viz: entities.viz ?? "bar", groups: ["Scheme"] }
    },
  },
  {
    id: "welfare-pending",
    title: "Pending welfare applications",
    datasetId: "welfare_monthly",
    matches: ({ text }) => has(text, /\b(pending|open)\b/, /(application|welfare)/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "district")
      return { dimensions: [{ fieldId: group }], measures: [measure("pending_applications", "sum")], filters: scopeFilters(entities, dataset, group), viz: vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "welfare-money",
    title: "Welfare assistance",
    datasetId: "welfare_monthly",
    matches: ({ text }) => has(text, /(welfare|scheme|assistance)/, /(disburse|approved|released|amount|assistance)/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "district")
      const disbursedOnly = /disburs|released|paid/.test(entities.text) && !/approved/.test(entities.text)
      const measures = disbursedOnly ? [measure("assistance_disbursed", "sum")] : [measure("assistance_approved", "sum"), measure("assistance_disbursed", "sum")]
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: measures.length > 1 ? "column" : vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },
  {
    id: "welfare-workers",
    title: "Registered workers",
    datasetId: "welfare_monthly",
    matches: ({ text }) => has(text, /\b(workers?|members?|memberships?|beneficiar\w*)\b/, /(regist|renew|member|beneficiar)/),
    build: (entities, dataset) => {
      const group = pickGroup(entities, dataset, ["district", "period", "financial_year"], "financial_year")
      const measures = /renew/.test(entities.text) ? [measure("renewals", "sum")] : /beneficiar/.test(entities.text) ? [measure("beneficiaries", "sum")] : [measure("workers", "sum")]
      return { dimensions: [{ fieldId: group }], measures, filters: scopeFilters(entities, dataset, group), viz: vizFor(entities, group), groups: [labelOf(dataset, group)] }
    },
  },
]

export function interpretQuestion(question: string, user: User): NlqInterpretation {
  const entities = extract(question)
  const base = { question, summary: [] as string[], suggestions: EXAMPLE_QUESTIONS.slice(0, 5) }
  if (!entities.text) return { ...base, ok: false, message: "Type a question about cess, welfare, factories, gig workers or unorganised workers." }
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
  if (pattern.onlyYear && entities.year && entities.year !== pattern.onlyYear) {
    return { ...base, ok: false, patternId: pattern.id, title: pattern.title, message: `${dataset.name} covers financial year ${pattern.onlyYear} only. Ask without a year, or for ${pattern.onlyYear}.` }
  }
  const built = pattern.build(entities, dataset)
  const limit = entities.top ?? limitFor(built.dimensions[0]?.fieldId ?? "")
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
