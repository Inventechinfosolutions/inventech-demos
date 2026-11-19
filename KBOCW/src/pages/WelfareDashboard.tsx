import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { DetailDrawer } from "@/components/dashboard/DetailDrawer"
import { WelfareActions } from "@/components/welfare/WelfareActions"
import { WelfareFiltersBar } from "@/components/welfare/WelfareFilters"
import { WelfareFinance } from "@/components/welfare/WelfareFinance"
import { WelfareKpis } from "@/components/welfare/WelfareKpis"
import { WelfareMap, type WelfareMapMetric } from "@/components/welfare/WelfareMap"
import { WelfarePipeline } from "@/components/welfare/WelfarePipeline"
import { WelfareRegisters } from "@/components/welfare/WelfareRegisters"
import { financialYearBounds } from "@/lib/period"
import { DEFAULT_WELFARE_FILTERS, WELFARE_LINKS, readWelfareFilters, welfareQuery } from "@/lib/welfareQuery"
import { getWelfareDetail, getWelfareOverview, loadWelfareOptions } from "@/services/welfareService"
import type { ChartModel, DetailModel } from "@/types/dashboard"
import type { WelfareDrill, WelfareFilterOptions, WelfareFilters, WelfareOverview } from "@/types/welfare"

const workerCharts = ["registrations", "renewals", "membership", "occupation", "age"]
const schemeCharts = ["scheme-status", "scheme-people", "scheme-money"]

function pick(charts: ChartModel[], ids: string[]) {
  return ids.map((id) => charts.find((chart) => chart.id === id)).filter((chart): chart is ChartModel => Boolean(chart))
}

export function WelfareDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readWelfareFilters(searchParams)
  const filterKey = searchParams.toString()
  const [options, setOptions] = useState<WelfareFilterOptions | null>(null)
  const [overview, setOverview] = useState<WelfareOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<WelfareMapMetric>("workers")
  const [drill, setDrill] = useState<WelfareDrill | null>(null)
  const [detail, setDetail] = useState<DetailModel | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    document.title = "KBOCW · Welfare Board"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadWelfareOptions()
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
    const active = readWelfareFilters(searchParams)
    let cancelled = false
    setUpdating(true)
    getWelfareOverview(active)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The KBOCW Welfare Board dashboard could not be loaded.")
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
    const active = readWelfareFilters(searchParams)
    let cancelled = false
    setDetailLoading(true)
    getWelfareDetail(drill, active)
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
  }, [drill, filterKey, searchParams])

  function applyFilters(next: WelfareFilters) {
    if (!next.fromDate || !next.toDate) return
    let value = next
    if (value.financialYear !== filters.financialYear) {
      const bounds = financialYearBounds(value.financialYear)
      value = { ...value, fromDate: bounds.from, toDate: bounds.to }
    }
    if (value.fromDate > value.toDate) value = { ...value, fromDate: value.toDate, toDate: value.fromDate }
    const taluk = options?.taluks.find((item) => item.id === value.talukId)
    if (value.districtId === "all" || !taluk || taluk.districtId !== value.districtId) value = { ...value, talukId: "all" }
    setSearchParams(welfareQuery(value), { replace: true })
  }

  function selectDistrict(districtId: string) {
    applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId, talukId: "all" })
  }

  const query = welfareQuery(filters).toString()
  const processing = overview?.charts.find((chart) => chart.id === "processing-days")
  const utilization = overview?.charts.find((chart) => chart.id === "utilization")

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-5">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the KBOCW Welfare Board dashboard."}
      </p>

      <header className="flex flex-col gap-4 border-b border-[color:var(--c-border-fed4c1)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Beneficiary welfare</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">KBOCW Welfare Board</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Construction Worker Registration, Welfare Schemes and Financial Assistance</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {overview?.illustrativeNote ?? "Illustrative data. This demonstration is not connected to Karnataka Government systems."} {overview?.separationNote}
          </p>
        </div>
        <nav aria-label="Related departments" className="max-w-md text-sm leading-6">
          {WELFARE_LINKS.map((link, index) => (
            <span key={link.to}>
              {index > 0 ? <span className="text-slate-300"> · </span> : null}
              <Link to={`${link.to}?${query}`} className="font-semibold text-[color:var(--c-text-8c2f39)] underline-offset-2 hover:underline">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </header>

      {options ? <WelfareFiltersBar options={options} value={filters} updating={updating} onChange={applyFilters} onReset={() => setSearchParams(welfareQuery(DEFAULT_WELFARE_FILTERS), { replace: true })} /> : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {overview ? (
        <>
          <WelfareKpis items={overview.kpis} onSelect={(kpiId) => setDrill({ type: "kpi", kpiId })} />

          <section className="space-y-3">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Worker registration</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">Membership and coverage of registered workers</h2>
            </div>
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              {pick(overview.charts, workerCharts).map((chart) => (
                <ChartCard key={chart.id} className={chart.id === "membership" ? "lg:col-span-2" : ""} chart={chart} onSelect={(category, series) => setDrill({ type: "chart", chartId: chart.id, category, series })} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Welfare schemes</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">Scheme performance</h2>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{overview.schemeNote}</p>
            </div>
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              {pick(overview.charts, schemeCharts).map((chart) => (
                <ChartCard key={chart.id} className={chart.id === "scheme-status" ? "lg:col-span-2" : ""} chart={chart} onSelect={(category, series) => setDrill({ type: "chart", chartId: chart.id, category, series })} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Application processing</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">From receipt to disbursement</h2>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">Each stage is the current status of an application. Applications are counted apart from unique workers.</p>
            </div>
            <WelfarePipeline stages={overview.stages} activeId={filters.applicationStatus} onSelect={(stageId) => setDrill({ type: "stage", stageId })} />
            {processing ? <ChartCard chart={processing} onSelect={(category, series) => setDrill({ type: "chart", chartId: processing.id, category, series })} /> : null}
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Financial assistance</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">Fund position and utilization</h2>
            </div>
            <WelfareFinance finance={overview.finance} />
            {utilization ? <ChartCard chart={utilization} onSelect={(category, series) => setDrill({ type: "chart", chartId: utilization.id, category, series })} /> : null}
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">District welfare</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">Coverage and follow-up</h2>
            </div>
            <WelfareMap districts={overview.districts} selectedId={filters.districtId} metric={metric} boundaryNote={overview.boundaryNote} onMetric={setMetric} onSelect={selectDistrict} />
            <WelfareActions items={overview.actions} onSelect={(exceptionId) => setDrill({ type: "exception", exceptionId })} />
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Registers</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">Workers, applications and disbursements</h2>
            </div>
            <WelfareRegisters registers={overview.registers} onOpen={(register, id) => setDrill({ type: "record", register, id })} />
          </section>

          <footer className="pb-4 text-sm leading-6 text-slate-500">
            Source: {overview.source}. Last refreshed: {overview.lastRefreshed}. Scope: {overview.scopeLabel}. {overview.stageNote}
          </footer>
        </>
      ) : !error ? (
        <p className="text-sm text-slate-600">Loading the KBOCW Welfare Board dashboard.</p>
      ) : null}

      {drill ? <DetailDrawer detail={detail} loading={detailLoading} onClose={() => setDrill(null)} /> : null}
    </div>
  )
}
