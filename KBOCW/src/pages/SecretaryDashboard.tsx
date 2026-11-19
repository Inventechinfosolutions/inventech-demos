import { useEffect, useState } from "react"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { DataTable } from "@/components/dashboard/DataTable"
import { DetailDrawer } from "@/components/dashboard/DetailDrawer"
import { ExceptionList } from "@/components/dashboard/ExceptionList"
import { FilterBar } from "@/components/dashboard/FilterBar"
import { KarnatakaMap } from "@/components/dashboard/KarnatakaMap"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { exportExcel, exportPdf } from "@/lib/export"
import { DEFAULT_FILTERS, withFinancialYear } from "@/lib/period"
import { getSecretaryDetail, getSecretaryOverview, loadFilterOptions } from "@/services/dashboardService"
import type { DashboardFilters, DetailModel, DrillRequest, FilterOptions, SecretaryOverview } from "@/types/dashboard"

function chartById(overview: SecretaryOverview, id: string) {
  return overview.charts.find((chart) => chart.id === id)
}

export function SecretaryDashboard() {
  const [options, setOptions] = useState<FilterOptions | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)
  const [overview, setOverview] = useState<SecretaryOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drill, setDrill] = useState<DrillRequest | null>(null)
  const [detail, setDetail] = useState<DetailModel | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "KBOCW · Secretary Dashboard"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadFilterOptions()
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
    let cancelled = false
    setUpdating(true)
    getSecretaryOverview(filters)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The Secretary dashboard could not be loaded.")
      })
      .finally(() => {
        if (!cancelled) setUpdating(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters])

  useEffect(() => {
    if (!drill) return
    let cancelled = false
    setDetailLoading(true)
    getSecretaryDetail(drill, filters)
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
  }, [drill, filters])

  function applyFilters(next: DashboardFilters) {
    if (!next.fromDate || !next.toDate) return
    if (next.financialYear !== filters.financialYear) {
      setFilters(withFinancialYear(next, next.financialYear))
      return
    }
    if (next.fromDate > next.toDate) {
      setFilters({ ...next, fromDate: next.toDate, toDate: next.fromDate })
      return
    }
    setFilters(next)
  }

  function selectDistrict(districtId: string) {
    setFilters((current) => ({ ...current, districtId: current.districtId === districtId ? "all" : districtId }))
  }

  async function runExport(kind: "excel" | "pdf") {
    if (!overview) return
    setExporting(kind)
    setExportError(null)
    try {
      if (kind === "excel") await exportExcel(overview)
      else await exportPdf(overview)
    } catch {
      setExportError("The file could not be prepared.")
    } finally {
      setExporting(null)
    }
  }

  const construction = overview ? chartById(overview, "construction") : undefined
  const cess = overview ? chartById(overview, "cess") : undefined
  const welfare = overview ? chartById(overview, "welfare") : undefined
  const schemes = overview ? chartById(overview, "schemes") : undefined

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-5">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Secretary dashboard."}
      </p>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Secretary</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">Integrated overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Construction, cess, registration and welfare across departments. Illustrative figures only. Cess stages stay separate and are not added together.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="h-10 rounded-full bg-[color:var(--c-bg-461220)] px-4 text-sm font-semibold text-[color:var(--c-text-ffeee7)] disabled:opacity-60" disabled={!overview || exporting != null} onClick={() => void runExport("excel")}>
            {exporting === "excel" ? "Preparing Excel…" : "Excel"}
          </button>
          <button type="button" className="h-10 rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-4 text-sm font-semibold text-[color:var(--c-text-461220)] disabled:opacity-60" disabled={!overview || exporting != null} onClick={() => void runExport("pdf")}>
            {exporting === "pdf" ? "Preparing PDF…" : "PDF"}
          </button>
        </div>
      </div>
      {exportError ? <p className="text-sm text-red-700">{exportError}</p> : null}

      {options ? (
        <FilterBar options={options} value={filters} updating={updating} onChange={applyFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {overview ? (
        <>
          <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
            {overview.kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} onSelect={(kpiId) => setDrill({ type: "kpi", kpiId })} />
            ))}
          </section>

          <section className="grid min-w-0 gap-5 xl:grid-cols-2">
            {construction ? <ChartCard chart={construction} onSelect={(category, series) => setDrill({ type: "chart", chartId: construction.id, category, series })} /> : null}
            {welfare ? <ChartCard chart={welfare} onSelect={(category, series) => setDrill({ type: "chart", chartId: welfare.id, category, series })} /> : null}
            {cess ? <ChartCard className="xl:col-span-2" chart={cess} onSelect={(category, series) => setDrill({ type: "chart", chartId: cess.id, category, series })} /> : null}
            {schemes ? <ChartCard className="xl:col-span-2" chart={schemes} onSelect={(category, series) => setDrill({ type: "chart", chartId: schemes.id, category, series })} /> : null}
          </section>

          <section className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <KarnatakaMap
              districts={overview.districts}
              selectedId={filters.districtId}
              boundaryNote={overview.boundaryNote}
              onSelect={selectDistrict}
            />
            <ExceptionList items={overview.exceptions} onSelect={(exceptionId) => setDrill({ type: "exception", exceptionId })} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
            <div className="border-b border-[color:var(--c-border-ffeae1)] px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--c-text-461220)]">Department performance</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Record counts follow the selected district and dates. Integration status and last updated describe the departmental feed.
              </p>
            </div>
            <DataTable
              columns={[
                { key: "Department", label: "Department" },
                { key: "Category", label: "Data category" },
                { key: "Records", label: "Records received", align: "right" },
                { key: "Updated", label: "Last updated" },
                { key: "Status", label: "Integration status", kind: "status" },
              ]}
              rows={overview.departments.map((row) => ({
                id: row.id,
                Department: row.name,
                Category: row.category,
                Records: row.records,
                Updated: row.lastUpdated,
                Status: row.status,
              }))}
              action={{ label: "View details", onClick: (row) => setDrill({ type: "department", departmentId: row.id }) }}
            />
          </section>

          <footer className="pb-4 text-sm leading-6 text-slate-500">
            Source: {overview.source}. Last refreshed: {overview.lastRefreshed}. Scope: {overview.scopeLabel}. {overview.stageNote}
          </footer>
        </>
      ) : !error ? (
        <p className="text-sm text-slate-600">Loading the Secretary dashboard.</p>
      ) : null}

      {drill ? <DetailDrawer detail={detail} loading={detailLoading} onClose={() => setDrill(null)} /> : null}
    </div>
  )
}
