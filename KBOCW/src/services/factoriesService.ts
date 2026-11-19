import { buildFactoriesDetail, buildFactoriesOverview, localFactoriesOptions } from "@/services/factoriesAggregate"
import type { DetailModel } from "@/types/dashboard"
import type { FactoriesDrill, FactoriesFilterOptions, FactoriesFilters, FactoriesOverview } from "@/types/factories"

const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")

function query(filters: FactoriesFilters, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams({
    financialYear: filters.financialYear,
    from: filters.fromDate,
    to: filters.toDate,
    districtId: filters.districtId,
    talukId: filters.talukId,
    category: filters.category,
    inspectionStatus: filters.inspectionStatus,
    severity: filters.severity,
    complianceStatus: filters.complianceStatus,
    boilerStatus: filters.boilerStatus,
  })
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value)
    }
  }
  return params
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("The factories dashboard service did not return the requested figures.")
  return response.json() as Promise<T>
}

export async function loadFactoriesOptions(): Promise<FactoriesFilterOptions> {
  const base = apiBase()
  if (!base) return localFactoriesOptions()
  return getJson<FactoriesFilterOptions>(`${base}/api/factories/filters`)
}

export async function getFactoriesOverview(filters: FactoriesFilters): Promise<FactoriesOverview> {
  const base = apiBase()
  if (!base) return buildFactoriesOverview(filters)
  return getJson<FactoriesOverview>(`${base}/api/factories/overview?${query(filters)}`)
}

export async function getFactoriesDetail(request: FactoriesDrill, filters: FactoriesFilters): Promise<DetailModel> {
  const base = apiBase()
  if (!base) return buildFactoriesDetail(request, filters)
  const extra: Record<string, string | undefined> = { topic: request.type }
  if (request.type === "kpi") extra.kpiId = request.kpiId
  if (request.type === "chart") {
    extra.chartId = request.chartId
    extra.category = request.category
    extra.series = request.series
  }
  if (request.type === "exception") extra.exceptionId = request.exceptionId
  if (request.type === "record") {
    extra.register = request.register
    extra.recordId = request.id
  }
  return getJson<DetailModel>(`${base}/api/factories/details?${query(filters, extra)}`)
}
