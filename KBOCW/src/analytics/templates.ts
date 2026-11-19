import { RECORD_COUNT_FIELD } from "@/analytics/catalog"
import { emptyGroup } from "@/analytics/engine"
import type { Aggregation, FilterCondition, MeasureSelection, ReportDefinition, ReportTemplate, VisualizationConfig, VizType } from "@/analytics/types"

export function defaultVisualization(type: VizType, extra: Partial<VisualizationConfig> = {}): VisualizationConfig {
  return { type, limit: 30, showLabels: false, stacked: false, detail: false, detailColumns: [], ...extra }
}

export const measure = (fieldId: string, aggregation: Aggregation | "calc", label?: string): MeasureSelection => ({
  id: `${aggregation}:${fieldId}`,
  fieldId,
  aggregation,
  label,
})

export const recordCount = (): MeasureSelection => measure(RECORD_COUNT_FIELD, "count")

export const condition = (fieldId: string, operator: FilterCondition["operator"], extra: Partial<FilterCondition> = {}): FilterCondition => ({
  id: `c-${fieldId}-${operator}-${extra.value ?? extra.list?.join("|") ?? ""}`,
  kind: "condition",
  fieldId,
  operator,
  ...extra,
})

const group = (...children: FilterCondition[]) => ({ ...emptyGroup("AND"), id: "root", children })

export const TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-district-cess-collection",
    name: "District-wise Cess Collection",
    description: "Cess collected in each district. Collection is its own stage and is not combined with assessed, remitted or credited cess.",
    datasetId: "cess_collections",
    definition: {
      datasetId: "cess_collections",
      dimensions: [{ fieldId: "district" }],
      measures: [measure("cess_collected", "sum")],
      filters: group(condition("financial_year", "eq", { value: "2025-26" })),
      sort: [],
      visualization: defaultVisualization("bar", { limit: 15 }),
    },
  },
  {
    id: "tpl-fy-worker-registration",
    name: "Financial Year-wise Worker Registration",
    description: "Workers registered with the Board in each financial year.",
    datasetId: "worker_registrations",
    definition: {
      datasetId: "worker_registrations",
      dimensions: [{ fieldId: "financial_year" }],
      measures: [recordCount()],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("column"),
    },
  },
  {
    id: "tpl-scheme-welfare-disbursement",
    name: "Scheme-wise Welfare Disbursement",
    description: "Amount sanctioned under each welfare scheme. Disbursement is not a cess stage.",
    datasetId: "welfare_applications",
    definition: {
      datasetId: "welfare_applications",
      dimensions: [{ fieldId: "scheme" }],
      measures: [measure("amount_sanctioned", "sum")],
      filters: group(condition("status", "eq", { value: "Sanctioned" })),
      sort: [],
      visualization: defaultVisualization("bar"),
    },
  },
  {
    id: "tpl-department-project-performance",
    name: "Department-wise Project Performance",
    description: "Projects recorded by each department, with the average days taken to close a case drawn as a line on its own scale.",
    datasetId: "department_performance",
    definition: {
      datasetId: "department_performance",
      dimensions: [{ fieldId: "department" }],
      measures: [measure("projects_active", "sum"), measure("avg_processing_days", "avg")],
      filters: group(condition("financial_year", "eq", { value: "2025-26" })),
      sort: [],
      visualization: defaultVisualization("combo"),
    },
  },
  {
    id: "tpl-pending-welfare-applications",
    name: "Pending Welfare Applications",
    description: "Welfare applications awaiting a decision, by district. Groups of fewer than five records are hidden.",
    datasetId: "welfare_applications",
    definition: {
      datasetId: "welfare_applications",
      dimensions: [{ fieldId: "district" }],
      measures: [recordCount()],
      filters: group(condition("status", "eq", { value: "Pending" })),
      sort: [],
      visualization: defaultVisualization("bar", { limit: 15 }),
    },
  },
  {
    id: "tpl-district-compliance",
    name: "District-wise Compliance Analysis",
    description: "Inspections carried out and violations recorded in each district. A recorded item is a potential exception until reviewed.",
    datasetId: "inspections",
    definition: {
      datasetId: "inspections",
      dimensions: [{ fieldId: "district" }],
      measures: [recordCount(), measure("violations_found", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("combo", { limit: 15 }),
    },
  },
  {
    id: "tpl-cess-reconciliation",
    name: "Cess Reconciliation Summary",
    description: "Assessed, collected, remitted and credited cess for each financial year. The stages sit side by side and are never added together.",
    datasetId: "department_performance",
    note: "Stages are shown side by side. A stacked chart is blocked for these measures.",
    definition: {
      datasetId: "department_performance",
      dimensions: [{ fieldId: "financial_year" }],
      measures: [measure("cess_assessed", "sum"), measure("cess_collected", "sum"), measure("cess_remitted", "sum"), measure("cess_credited", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("column"),
    },
  },
]

export const templateById = (id: string) => TEMPLATES.find((template) => template.id === id)

export function definitionFromTemplate(template: ReportTemplate, id: string, name?: string): ReportDefinition {
  const copy = JSON.parse(JSON.stringify(template.definition)) as ReportTemplate["definition"]
  return { id, name: name ?? template.name, description: template.description, ...copy }
}

export function blankReport(id: string, datasetId = ""): ReportDefinition {
  return {
    id,
    name: "Untitled report",
    description: "",
    datasetId,
    dimensions: [],
    measures: [],
    filters: { ...emptyGroup("AND") },
    sort: [],
    visualization: defaultVisualization("column"),
  }
}
