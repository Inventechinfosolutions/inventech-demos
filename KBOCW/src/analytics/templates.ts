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

const FY_CURRENT = condition("financial_year", "eq", { value: "2025-26" })
const FY_LATEST = condition("financial_year", "eq", { value: "2026-27" })

export const TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-district-cess-collection",
    name: "District-wise Cess Collection",
    description: "Cess collected in each district, from the Labour Commissionerate dashboard. Collection is its own stage and is not combined with cess assessed.",
    datasetId: "labour_monthly",
    definition: {
      datasetId: "labour_monthly",
      dimensions: [{ fieldId: "district" }],
      measures: [measure("cess_collected", "sum")],
      filters: group(FY_CURRENT),
      sort: [],
      visualization: defaultVisualization("bar", { limit: 15 }),
    },
  },
  {
    id: "tpl-cess-stages",
    name: "Cess Assessed and Collected by Year",
    description: "Cess assessed and cess collected for each financial year. The two stages sit side by side and are never added together.",
    datasetId: "labour_monthly",
    note: "Stages are shown side by side. A stacked chart is blocked for these measures.",
    definition: {
      datasetId: "labour_monthly",
      dimensions: [{ fieldId: "financial_year" }],
      measures: [measure("cess_assessed", "sum"), measure("cess_collected", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("column"),
    },
  },
  {
    id: "tpl-district-compliance",
    name: "District-wise Inspections and Violations",
    description: "Inspections conducted and violations identified in each district, from the Labour Commissionerate dashboard. A recorded finding is a potential exception until reviewed.",
    datasetId: "labour_monthly",
    definition: {
      datasetId: "labour_monthly",
      dimensions: [{ fieldId: "district" }],
      measures: [measure("inspections", "sum"), measure("violations", "sum")],
      filters: group(FY_CURRENT),
      sort: [],
      visualization: defaultVisualization("combo", { limit: 15 }),
    },
  },
  {
    id: "tpl-scheme-assistance",
    name: "Scheme-wise Welfare Assistance",
    description: "Assistance approved and amount disbursed under each welfare scheme in 2025-26. Approval and payment are separate stages shown side by side.",
    datasetId: "welfare_schemes",
    note: "Approved and disbursed amounts are shown side by side. A stacked chart is blocked for these measures.",
    definition: {
      datasetId: "welfare_schemes",
      dimensions: [{ fieldId: "scheme" }],
      measures: [measure("approved_rupees", "sum"), measure("disbursed_rupees", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("bar"),
    },
  },
  {
    id: "tpl-district-welfare-disbursement",
    name: "District-wise Welfare Disbursement",
    description: "Amount disbursed in each district from the KBOCW Welfare Board dashboard. Failed and returned payments are not included.",
    datasetId: "welfare_monthly",
    definition: {
      datasetId: "welfare_monthly",
      dimensions: [{ fieldId: "district" }],
      measures: [measure("assistance_disbursed", "sum")],
      filters: group(FY_CURRENT),
      sort: [],
      visualization: defaultVisualization("bar", { limit: 15 }),
    },
  },
  {
    id: "tpl-factory-inspections",
    name: "Inspections and Violations by Establishment Category",
    description: "Inspections conducted and safety violations recorded for each category on the Factories & Boilers dashboard.",
    datasetId: "factories_categories",
    definition: {
      datasetId: "factories_categories",
      dimensions: [{ fieldId: "category" }],
      measures: [measure("inspections", "sum"), measure("violations", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("combo"),
    },
  },
  {
    id: "tpl-gig-payouts-month",
    name: "Gig Worker Payouts by Month",
    description: "Payouts reported by aggregators in each month, from the Gig Workers Welfare Board dashboard.",
    datasetId: "gig_monthly",
    definition: {
      datasetId: "gig_monthly",
      dimensions: [{ fieldId: "period" }],
      measures: [measure("payouts", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("column"),
    },
  },
  {
    id: "tpl-gig-aggregator-fee",
    name: "Welfare Fee by Aggregator",
    description: "Welfare fee payable and welfare fee deposited for each aggregator from April to September 2026. Payable and deposited are separate stages.",
    datasetId: "gig_aggregators",
    note: "Payable and deposited fee are shown side by side. A stacked chart is blocked for these measures.",
    definition: {
      datasetId: "gig_aggregators",
      dimensions: [{ fieldId: "aggregator" }],
      measures: [measure("fee_payable", "sum"), measure("fee_deposited", "sum")],
      filters: group(FY_LATEST),
      sort: [],
      visualization: defaultVisualization("column", { limit: 16 }),
    },
  },
  {
    id: "tpl-ksu-registrations-month",
    name: "Registrations by Month",
    description: "New registrations received in each month, from the Unorganised Workers Social Security Board dashboard. Registrations are counted once per worker.",
    datasetId: "ksu_monthly",
    definition: {
      datasetId: "ksu_monthly",
      dimensions: [{ fieldId: "period" }],
      measures: [measure("new_registrations", "sum")],
      filters: group(),
      sort: [],
      visualization: defaultVisualization("column"),
    },
  },
  {
    id: "tpl-ksu-benefits-scheme",
    name: "Scheme-wise Benefits Approved and Disbursed",
    description: "Benefits approved and benefits disbursed under each scheme from April to September 2026. Approval is a decision and payment is a separate event.",
    datasetId: "ksu_schemes",
    note: "Approved and disbursed amounts are shown side by side. A stacked chart is blocked for these measures.",
    definition: {
      datasetId: "ksu_schemes",
      dimensions: [{ fieldId: "scheme" }],
      measures: [measure("approved", "sum"), measure("disbursed", "sum")],
      filters: group(FY_LATEST),
      sort: [],
      visualization: defaultVisualization("bar"),
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
