import { buildLabourDetail, buildLabourOverview, localLabourOptions } from "@/services/labourAggregate"
import type { DetailModel } from "@/types/dashboard"
import type { LabourDrill, LabourFilterOptions, LabourFilters, LabourOverview } from "@/types/labour"

const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")

function query(filters: LabourFilters, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams({
    financialYear: filters.financialYear,
    from: filters.fromDate,
    to: filters.toDate,
    districtId: filters.districtId,
    talukId: filters.talukId,
    category: filters.category,
    projectStatus: filters.projectStatus,
    cessStatus: filters.cessStatus,
    inspectionStatus: filters.inspectionStatus,
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
  if (!response.ok) throw new Error("The labour dashboard service did not return the requested figures.")
  return response.json() as Promise<T>
}

export async function loadLabourOptions(): Promise<LabourFilterOptions> {
  const base = apiBase()
  if (!base) return localLabourOptions()
  return getJson<LabourFilterOptions>(`${base}/api/labour/filters`)
}

export async function getLabourOverview(filters: LabourFilters): Promise<LabourOverview> {
  const base = apiBase()
  if (!base) return buildLabourOverview(filters)
  return getJson<LabourOverview>(`${base}/api/labour/overview?${query(filters)}`)
}

export async function getLabourDetail(request: LabourDrill, filters: LabourFilters): Promise<DetailModel> {
  const base = apiBase()
  if (!base) return buildLabourDetail(request, filters)
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
  return getJson<DetailModel>(`${base}/api/labour/details?${query(filters, extra)}`)
}
