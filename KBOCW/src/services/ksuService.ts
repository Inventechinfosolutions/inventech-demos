import { ksuApiQuery } from "@/lib/ksuQuery"
import { buildKsuDetail } from "@/services/ksuDetails"
import { buildKsuOverview, ksuFilterOptions } from "@/services/ksuOverview"
import type { KsuDetail, KsuDrill, KsuFilterOptions, KsuFilters, KsuOverview } from "@/types/ksu"

// Static first: the dashboard reads the illustrative extract in the browser. Setting
// VITE_API_BASE_URL later points the same calls at a real service. Live integration has not
// been started, pending review of the dashboard.
const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")

// Lets the loading state paint before the figures are worked out.
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 40))

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("The KSUWSSB dashboard service did not return the requested figures.")
  return response.json() as Promise<T>
}

export async function loadKsuOptions(): Promise<KsuFilterOptions> {
  const base = apiBase()
  if (!base) return ksuFilterOptions()
  return getJson<KsuFilterOptions>(`${base}/api/ksuwssb/filters`)
}

export async function getKsuOverview(filters: KsuFilters): Promise<KsuOverview> {
  const base = apiBase()
  if (!base) {
    await settle()
    return buildKsuOverview(filters)
  }
  return getJson<KsuOverview>(`${base}/api/ksuwssb/executive-overview?${ksuApiQuery(filters)}`)
}

export async function getKsuDetail(drill: KsuDrill, filters: KsuFilters): Promise<KsuDetail> {
  const base = apiBase()
  if (!base) {
    await settle()
    return buildKsuDetail(drill, filters)
  }
  const params = ksuApiQuery(filters)
  params.set("topic", drill.type)
  if (drill.type === "kpi" || drill.type === "strip" || drill.type === "district" || drill.type === "scheme") params.set("id", drill.id)
  if (drill.type === "priority") params.set("id", drill.key)
  if (drill.type === "chart") {
    params.set("chartId", drill.chartId)
    if (drill.category) params.set("category", drill.category)
    if (drill.series) params.set("series", drill.series)
    if (drill.month !== undefined) params.set("month", String(drill.month))
  }
  return getJson<KsuDetail>(`${base}/api/ksuwssb/details?${params}`)
}

/** Mock endpoint names and the part of the overview each one returns, all from the same extract. */
export const KSU_ENDPOINTS = {
  "executive-overview": (overview: KsuOverview) => ({ kpis: overview.kpis, strip: overview.strip }),
  "registration-trend": (overview: KsuOverview) => overview.registration,
  "worker-demographics": (overview: KsuOverview) => overview.demographics,
  "district-summary": (overview: KsuOverview) => overview.districtRows,
  "scheme-summary": (overview: KsuOverview) => overview.schemes,
  "claims-summary": (overview: KsuOverview) => overview.claims,
  "financial-summary": (overview: KsuOverview) => overview.finance,
  "facilitation-summary": (overview: KsuOverview) => overview.facilitation,
  "priority-attention": (overview: KsuOverview) => overview.priority,
} as const

export type KsuEndpointName = keyof typeof KSU_ENDPOINTS

export async function getKsuEndpoint<K extends KsuEndpointName>(name: K, filters: KsuFilters): Promise<ReturnType<(typeof KSU_ENDPOINTS)[K]>> {
  const overview = await getKsuOverview(filters)
  return KSU_ENDPOINTS[name](overview) as ReturnType<(typeof KSU_ENDPOINTS)[K]>
}
