import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { MoreCharts } from "@/components/dashboard/MoreCharts"
import { DetailDrawer } from "@/components/dashboard/DetailDrawer"
import { FilterSummary } from "@/components/dashboard/FilterSummary"
import { ScopeBand } from "@/components/dashboard/ScopeBand"
import { LabourFiltersBar } from "@/components/labour/LabourFilters"
import { LabourKpis } from "@/components/labour/LabourKpis"
import { LabourMap, type LabourMapMetric } from "@/components/labour/LabourMap"
import { LabourQueue } from "@/components/labour/LabourQueue"
import { LabourRegisters } from "@/components/labour/LabourRegisters"
import { DEFAULT_LABOUR_FILTERS, labourQuery, readLabourFilters } from "@/lib/labourQuery"
import { financialYearBounds } from "@/lib/period"
import { useBaseline } from "@/lib/useBaseline"
import { getLabourDetail, getLabourOverview, loadLabourOptions } from "@/services/labourService"
import type { DetailModel } from "@/types/dashboard"
import type { LabourDrill, LabourFilterOptions, LabourFilters, LabourOverview } from "@/types/labour"

const wideCharts = new Set(["projects-category", "cess-monthly"])
// Charts shown before the rest are placed behind "Show more charts".
const KEY_CHARTS = 4

export function LabourDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readLabourFilters(searchParams)
  const filterKey = searchParams.toString()
  const [options, setOptions] = useState<LabourFilterOptions | null>(null)
  const [overview, setOverview] = useState<LabourOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<LabourMapMetric>("projects")
  const [drill, setDrill] = useState<LabourDrill | null>(null)
  // The overview at the top always covers the default scope, so its drill-downs do too.
  const [drillOnOverview, setDrillOnOverview] = useState(false)
  const base = useBaseline(() => getLabourOverview(DEFAULT_LABOUR_FILTERS))
  const [detail, setDetail] = useState<DetailModel | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    document.title = "KBOCW · Labour Commissionerate"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadLabourOptions()
      .then((next) => {
        if (!cancelled) setOptions(next)
      })
      .catch(() => {
        if (!cancelled) setError("Filters could not be loaded.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const active = readLabourFilters(searchParams)
    let cancelled = false
    setUpdating(true)
    getLabourOverview(active)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The Labour Commissionerate dashboard could not be loaded.")
      })
      .finally(() => {
        if (!cancelled) setUpdating(false)
      })
    return () => {
      cancelled = true
    }
  }, [filterKey, searchParams])

  useEffect(() => {
    if (!drill) return
    const active = drillOnOverview ? DEFAULT_LABOUR_FILTERS : readLabourFilters(searchParams)
    let cancelled = false
    setDetailLoading(true)
    getLabourDetail(drill, active)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch(() => {
        if (!cancelled) setDetail({ title: "Detail unavailable", summary: "The selected records could not be loaded.", note: "", columns: [], rows: [] })
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [drill, drillOnOverview, filterKey, searchParams])

  function applyFilters(next: LabourFilters) {
    if (!next.fromDate || !next.toDate) return
    let value = next
    if (value.financialYear !== filters.financialYear) {
      const bounds = financialYearBounds(value.financialYear)
      value = { ...value, fromDate: bounds.from, toDate: bounds.to }
    }
    if (value.fromDate > value.toDate) value = { ...value, fromDate: value.toDate, toDate: value.fromDate }
    const taluk = options?.taluks.find((item) => item.id === value.talukId)
    if (value.districtId === "all" || !taluk || taluk.districtId !== value.districtId) value = { ...value, talukId: "all" }
    setSearchParams(labourQuery(value), { replace: true })
  }

  function selectDistrict(districtId: string) {
    applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId, talukId: "all" })
  }

  function openOverview(next: LabourDrill) {
    setDrillOnOverview(true)
    setDrill(next)
  }

  function openFiltered(next: LabourDrill) {
    setDrillOnOverview(false)
    setDrill(next)
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-4">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Labour Commissionerate dashboard."}
      </p>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {base ? (
        <>
          <ScopeBand as="h1" kicker="Labour Department · Overview" title="Labour Commissionerate" note={`${base.scopeLabel}. These cards and charts cover the full scope and do not change with the filters further down.`} />
          <LabourKpis items={base.kpis} onSelect={(kpiId) => openOverview({ type: "kpi", kpiId })} />

          <section className="grid min-w-0 gap-4 lg:grid-cols-2">
            {base.charts.slice(0, KEY_CHARTS).map((chart) => (
              <ChartCard
                key={chart.id}
                className={wideCharts.has(chart.id) ? "lg:col-span-2" : ""}
                chart={chart}
                onSelect={(category, series) => openOverview({ type: "chart", chartId: chart.id, category, series })}
              />
            ))}
          </section>
          <MoreCharts id="labour-more" count={base.charts.length - KEY_CHARTS}>
            {base.charts.slice(KEY_CHARTS).map((chart) => (
              <ChartCard
                key={chart.id}
                className={wideCharts.has(chart.id) ? "lg:col-span-2" : ""}
                chart={chart}
                onSelect={(category, series) => openOverview({ type: "chart", chartId: chart.id, category, series })}
              />
            ))}
          </MoreCharts>
        </>
      ) : !error ? (
        <p className="text-sm text-slate-600">Loading the Labour Commissionerate dashboard.</p>
      ) : null}

      <ScopeBand id="labour-filters" kicker="Filters" title="Filter the records" note="Choose a period, district, taluk or category. The figures, district map, review queue and registers below follow your choice." />
      <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-5 py-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
        {options ? <LabourFiltersBar options={options} value={filters} updating={updating} onChange={applyFilters} onReset={() => setSearchParams(labourQuery(DEFAULT_LABOUR_FILTERS), { replace: true })} /> : <p className="text-sm text-slate-500">Loading filters.</p>}
      </section>

      {overview ? (
        <>
          <FilterSummary scope={overview.scopeLabel} updating={updating} items={overview.kpis.map((item) => ({ label: item.label, value: item.displayValue }))} />

          <section className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.8fr)]">
            <LabourMap
              districts={overview.districts}
              selectedId={filters.districtId}
              metric={metric}
              boundaryNote={overview.boundaryNote}
              onMetric={setMetric}
              onSelect={selectDistrict}
            />
            <div className="min-h-0 xl:relative">
              <LabourQueue items={overview.queue} onSelect={(exceptionId) => openFiltered({ type: "exception", exceptionId })} />
            </div>
          </section>

          <LabourRegisters registers={overview.registers} onOpen={(register, id) => openFiltered({ type: "record", register, id })} />

          <footer className="pb-4 text-sm leading-6 text-slate-500">
            Source: {overview.source}. Last refreshed: {overview.lastRefreshed}. Scope: {overview.scopeLabel}. {overview.stageNote}
          </footer>
        </>
      ) : null}

      {drill ? <DetailDrawer detail={detail} loading={detailLoading} onClose={() => setDrill(null)} /> : null}
    </div>
  )
}
