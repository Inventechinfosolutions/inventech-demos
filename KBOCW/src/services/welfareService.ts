import { buildWelfareDetail, buildWelfareOverview, localWelfareOptions } from "@/services/welfareAggregate"
import type { DetailModel } from "@/types/dashboard"
import type { WelfareDrill, WelfareFilterOptions, WelfareFilters, WelfareOverview } from "@/types/welfare"

const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")

function query(filters: WelfareFilters, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams({
    financialYear: filters.financialYear,
    from: filters.fromDate,
    to: filters.toDate,
    districtId: filters.districtId,
    talukId: filters.talukId,
    membershipStatus: filters.membershipStatus,
    scheme: filters.scheme,
    applicationStatus: filters.applicationStatus,
    paymentStatus: filters.paymentStatus,
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
  if (!response.ok) throw new Error("The welfare dashboard service did not return the requested figures.")
  return response.json() as Promise<T>
}

export async function loadWelfareOptions(): Promise<WelfareFilterOptions> {
  const base = apiBase()
  if (!base) return localWelfareOptions()
  return getJson<WelfareFilterOptions>(`${base}/api/welfare/filters`)
}

export async function getWelfareOverview(filters: WelfareFilters): Promise<WelfareOverview> {
  const base = apiBase()
  if (!base) return buildWelfareOverview(filters)
  return getJson<WelfareOverview>(`${base}/api/welfare/overview?${query(filters)}`)
}

export async function getWelfareDetail(request: WelfareDrill, filters: WelfareFilters): Promise<DetailModel> {
  const base = apiBase()
  if (!base) return buildWelfareDetail(request, filters)
  const extra: Record<string, string | undefined> = { topic: request.type }
  if (request.type === "kpi") extra.kpiId = request.kpiId
  if (request.type === "chart") {
    extra.chartId = request.chartId
    extra.category = request.category
    extra.series = request.series
  }
  if (request.type === "stage") extra.stageId = request.stageId
  if (request.type === "exception") extra.exceptionId = request.exceptionId
  if (request.type === "record") {
    extra.register = request.register
    extra.recordId = request.id
  }
  return getJson<DetailModel>(`${base}/api/welfare/details?${query(filters, extra)}`)
}
