import { buildSecretaryDetail, buildSecretaryOverview, localFilterOptions } from "@/services/aggregate"
import type { DashboardFilters, DetailModel, DrillRequest, FilterOptions, SecretaryOverview } from "@/types/dashboard"

const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")

function query(filters: DashboardFilters, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams({
    financialYear: filters.financialYear,
    from: filters.fromDate,
    to: filters.toDate,
    districtId: filters.districtId,
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
  if (!response.ok) throw new Error("The dashboard service did not return the requested figures.")
  return response.json() as Promise<T>
}

export async function loadFilterOptions(): Promise<FilterOptions> {
  const base = apiBase()
  if (!base) return localFilterOptions()
  return getJson<FilterOptions>(`${base}/api/secretary/filters`)
}

export async function getSecretaryOverview(filters: DashboardFilters): Promise<SecretaryOverview> {
  const base = apiBase()
  if (!base) return buildSecretaryOverview(filters)
  return getJson<SecretaryOverview>(`${base}/api/secretary/overview?${query(filters)}`)
}

export async function getSecretaryDetail(request: DrillRequest, filters: DashboardFilters): Promise<DetailModel> {
  const base = apiBase()
  if (!base) return buildSecretaryDetail(request, filters)
  const extra: Record<string, string | undefined> = { topic: request.type }
  if (request.type === "kpi") extra.kpiId = request.kpiId
  if (request.type === "chart") {
    extra.chartId = request.chartId
    extra.category = request.category
    extra.series = request.series
  }
  if (request.type === "exception") extra.exceptionId = request.exceptionId
  if (request.type === "department") extra.departmentId = request.departmentId
  return getJson<DetailModel>(`${base}/api/secretary/details?${query(filters, extra)}`)
}
