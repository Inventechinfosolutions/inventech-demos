import { gigApiQuery } from "@/lib/gigQuery"
import { buildGigDetail } from "@/services/gigDetails"
import { buildGigOverview, gigFilterOptions } from "@/services/gigOverview"
import type { GigDetail, GigDrill, GigFilterOptions, GigFilters, GigOverview } from "@/types/gig"

const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")

// Lets the loading state paint before the figures are worked out in the browser.
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 40))

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("The gig workers dashboard service did not return the requested figures.")
  return response.json() as Promise<T>
}

export async function loadGigOptions(): Promise<GigFilterOptions> {
  const base = apiBase()
  if (!base) return gigFilterOptions()
  return getJson<GigFilterOptions>(`${base}/api/gig-workers/filters`)
}

export async function getGigOverview(filters: GigFilters): Promise<GigOverview> {
  const base = apiBase()
  if (!base) {
    await settle()
    return buildGigOverview(filters)
  }
  return getJson<GigOverview>(`${base}/api/gig-workers/executive-overview?${gigApiQuery(filters)}`)
}

export async function getGigDetail(drill: GigDrill, filters: GigFilters): Promise<GigDetail> {
  const base = apiBase()
  if (!base) {
    await settle()
    return buildGigDetail(drill, filters)
  }
  const params = gigApiQuery(filters)
  params.set("topic", drill.type)
  if (drill.type === "kpi" || drill.type === "strip" || drill.type === "district" || drill.type === "exception") params.set("id", drill.id)
  if (drill.type === "aggregator") {
    params.set("id", drill.id)
    params.set("view", drill.view)
  }
  if (drill.type === "chart") {
    params.set("chartId", drill.chartId)
    if (drill.category) params.set("category", drill.category)
    if (drill.series) params.set("series", drill.series)
    if (drill.month !== undefined) params.set("month", String(drill.month))
  }
  return getJson<GigDetail>(`${base}/api/gig-workers/details?${params}`)
}

/**
 * Endpoint names from the specification and the part of the overview each one returns.
 * Each is served from the same illustrative extract, so every view reconciles with the others.
 */
export const GIG_ENDPOINTS = {
  "executive-overview": (overview: GigOverview) => ({ kpis: overview.kpis, strip: overview.strip }),
  "worker-registration-trend": (overview: GigOverview) => overview.registration,
  "worker-sector-distribution": (overview: GigOverview) => overview.sector,
  "aggregator-distribution": (overview: GigOverview) => overview.aggregators,
  "district-distribution": (overview: GigOverview) => overview.districts,
  "payout-trend": (overview: GigOverview) => overview.payout,
  "welfare-fee-summary": (overview: GigOverview) => overview.fee,
  "welfare-fund-summary": (overview: GigOverview) => overview.fund,
  "scheme-delivery-summary": (overview: GigOverview) => overview.schemes,
  "grievance-summary": (overview: GigOverview) => overview.grievances,
  "safety-summary": (overview: GigOverview) => overview.safety,
  "aggregator-reporting-summary": (overview: GigOverview) => overview.aggregatorTable,
  "priority-exceptions": (overview: GigOverview) => ({ items: overview.exceptions, total: overview.exceptionCount }),
} as const

export type GigEndpointName = keyof typeof GIG_ENDPOINTS

export async function getGigEndpoint<K extends GigEndpointName>(name: K, filters: GigFilters): Promise<ReturnType<(typeof GIG_ENDPOINTS)[K]>> {
  const overview = await getGigOverview(filters)
  return GIG_ENDPOINTS[name](overview) as ReturnType<(typeof GIG_ENDPOINTS)[K]>
}
