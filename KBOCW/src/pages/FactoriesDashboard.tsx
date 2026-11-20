import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { MoreCharts } from "@/components/dashboard/MoreCharts"
import { DataTable } from "@/components/dashboard/DataTable"
import { DetailDrawer } from "@/components/dashboard/DetailDrawer"
import { FilterSummary } from "@/components/dashboard/FilterSummary"
import { ScopeBand } from "@/components/dashboard/ScopeBand"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { FactoriesFiltersBar } from "@/components/factories/FactoriesFilters"
import { FactoriesMap, type FactoriesMapMetric } from "@/components/factories/FactoriesMap"
import { DEFAULT_FACTORIES_FILTERS, FACTORIES_LINKS, factoriesQuery, factoriesScopeQuery, readFactoriesFilters } from "@/lib/factoriesQuery"
import { financialYearBounds } from "@/lib/period"
import { useBaseline } from "@/lib/useBaseline"
import { getFactoriesDetail, getFactoriesOverview, loadFactoriesOptions } from "@/services/factoriesService"
import type { DetailColumn, DetailModel } from "@/types/dashboard"
import type { FactoriesDrill, FactoriesFilterOptions, FactoriesFilters, FactoriesKpi, FactoriesOverview } from "@/types/factories"

type Focus = "inspections" | "accidents" | "compliance" | "boilers"
type Register = "factories" | "inspections" | "accidents" | "boilers"

const groups: { id: FactoriesKpi["group"]; title: string }[] = [
  { id: "establishments", title: "Establishments" },
  { id: "inspections", title: "Inspections, compliance and accidents" },
  { id: "boilers", title: "Boilers" },
]

const registerColumns: Record<Register, DetailColumn[]> = {
  factories: [
    { key: "Factory ID", label: "Factory ID" },
    { key: "Establishment Name", label: "Establishment Name" },
    { key: "District", label: "District" },
    { key: "Taluk", label: "Taluk" },
    { key: "Industry Category", label: "Industry Category" },
    { key: "Registration Number", label: "Registration Number" },
    { key: "Registration Date", label: "Registration Date" },
    { key: "Current Status", label: "Current Status" },
  ],
  inspections: [
    { key: "Inspection ID", label: "Inspection ID" },
    { key: "Factory ID", label: "Factory ID" },
    { key: "Establishment Name", label: "Establishment Name" },
    { key: "District", label: "District" },
    { key: "Inspection Date", label: "Inspection Date" },
    { key: "Inspector", label: "Inspector" },
    { key: "Inspection Category", label: "Inspection Category" },
    { key: "Findings", label: "Findings" },
    { key: "Compliance Status", label: "Compliance Status" },
  ],
  accidents: [
    { key: "Accident ID", label: "Accident ID" },
    { key: "Establishment", label: "Establishment" },
    { key: "District", label: "District" },
    { key: "Incident Date", label: "Incident Date" },
    { key: "Accident Category", label: "Accident Category" },
    { key: "Severity", label: "Severity" },
    { key: "Injuries", label: "Injuries", align: "right" },
    { key: "Fatalities", label: "Fatalities", align: "right" },
    { key: "Investigation Status", label: "Investigation Status" },
  ],
  boilers: [
    { key: "Boiler ID", label: "Boiler ID" },
    { key: "Establishment", label: "Establishment" },
    { key: "District", label: "District" },
    { key: "Boiler Category", label: "Boiler Category" },
    { key: "Last Inspection Date", label: "Last Inspection Date" },
    { key: "Next Inspection Due", label: "Next Inspection Due" },
    { key: "Certificate Status", label: "Certificate Status" },
  ],
}

export function FactoriesDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFactoriesFilters(searchParams)
  const filterKey = searchParams.toString()
  const [options, setOptions] = useState<FactoriesFilterOptions | null>(null)
  const [overview, setOverview] = useState<FactoriesOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<FactoriesMapMetric>("factories")
  const [focus, setFocus] = useState<Focus>("inspections")
  const [register, setRegister] = useState<Register>("factories")
  const [drill, setDrill] = useState<FactoriesDrill | null>(null)
  // The overview at the top always covers the default scope, so its drill-downs do too.
  const [drillOnOverview, setDrillOnOverview] = useState(false)
  const base = useBaseline(() => getFactoriesOverview(DEFAULT_FACTORIES_FILTERS))
  const [detail, setDetail] = useState<DetailModel | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    document.title = "KBOCW · Factories & Boilers"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadFactoriesOptions().then((next) => {
      if (!cancelled) setOptions(next)
    }).catch(() => {
      if (!cancelled) setError("The factories filters could not be loaded.")
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const active = readFactoriesFilters(searchParams)
    let cancelled = false
    setUpdating(true)
    getFactoriesOverview(active)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The Factories & Boilers dashboard could not be loaded.")
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
    const active = drillOnOverview ? DEFAULT_FACTORIES_FILTERS : readFactoriesFilters(searchParams)
    let cancelled = false
    setDetailLoading(true)
    getFactoriesDetail(drill, active)
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

  function applyFilters(next: FactoriesFilters) {
    if (!next.fromDate || !next.toDate) return
    let value = next
    if (value.financialYear !== filters.financialYear) {
      const bounds = financialYearBounds(value.financialYear)
      value = { ...value, fromDate: bounds.from, toDate: bounds.to }
    }
    if (value.fromDate > value.toDate) value = { ...value, fromDate: value.toDate, toDate: value.fromDate }
    const taluk = options?.taluks.find((item) => item.id === value.talukId)
    if (value.districtId === "all" || !taluk || taluk.districtId !== value.districtId) value = { ...value, talukId: "all" }
    setSearchParams(factoriesQuery(value), { replace: true })
  }

  function selectDistrict(districtId: string) {
    applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId, talukId: "all" })
  }

  function openOverview(next: FactoriesDrill) {
    setDrillOnOverview(true)
    setDrill(next)
  }

  function openFiltered(next: FactoriesDrill) {
    setDrillOnOverview(false)
    setDrill(next)
  }

  const scope = factoriesScopeQuery(filters).toString()
  const focusCharts: Record<Focus, string[]> = {
    inspections: ["planned", "trend", "inspectedCategory", "pendingCategory", "coverage"],
    accidents: ["accidentTrend", "severity", "causes", "industryAccidents", "accidentDistrict"],
    compliance: ["violationTypes", "actions"],
    boilers: ["boilerDistrict"],
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-5">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Factories & Boilers dashboard."}
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {base ? (
        <>
          <ScopeBand as="h1" kicker="Factories, Boilers, Industrial Safety and Health · Overview" title="Factories & Boilers" note={`${base.scopeLabel}. These cards and charts cover the full scope and do not change with the filters further down.`} />
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            {base.watch.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[color:var(--c-border-fedecf)] bg-[color:var(--c-bg-fff8f4)] px-3 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{item.displayValue}</p>
                <p className="mt-1 text-xs leading-4 text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-12">
            {groups.map((group) => (
              <section key={group.id} className={`rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] ${group.id === "inspections" ? "xl:col-span-6" : "xl:col-span-3"}`}>
                <h2 className="text-[11px] font-semibold tracking-[0.14em] text-[color:var(--c-text-8c2f39)] uppercase">{group.title}</h2>
                <div className={`mt-3 grid gap-2 ${group.id === "inspections" ? "sm:grid-cols-2" : ""}`}>
                  {base.kpis.filter((kpi) => kpi.group === group.id).map((kpi, index, list) => (
                    <button key={kpi.id} type="button" className={`rounded-2xl bg-[color:var(--c-bg-fff8f4)] px-3 py-3 text-left transition hover:bg-[color:var(--c-bg-ffeee7)] ${list.length % 2 === 1 && index === list.length - 1 ? "sm:col-span-2" : ""}`} onClick={() => openOverview({ type: "kpi", kpiId: kpi.id })}>
                      <span className="block text-xs leading-4 text-slate-500">{kpi.label}</span>
                      <span className="mt-1 block text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{kpi.displayValue}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] sm:p-5">
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Safety analytics">
            {([
              ["inspections", "Inspections"],
              ["accidents", "Accidents"],
              ["compliance", "Compliance"],
              ["boilers", "Boilers"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={focus === id} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${focus === id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffeee7)] text-slate-600"}`} onClick={() => setFocus(id)}>
                {label}
              </button>
            ))}
          </div>
          {focus === "accidents" ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {base.accidentCounts.map((item) => (
                <article key={item.label} className="rounded-2xl bg-[color:var(--c-bg-fff8f4)] px-4 py-3">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">{item.displayValue}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                </article>
              ))}
            </div>
          ) : null}
          {focus === "compliance" ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {base.compliance.map((item) => (
                <article key={item.label} className="rounded-2xl bg-[color:var(--c-bg-fff8f4)] px-4 py-3">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">{item.displayValue}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                </article>
              ))}
            </div>
          ) : null}
          {focus === "boilers" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {base.boilers.map((item) => (
                <article key={item.label} className="rounded-2xl bg-[color:var(--c-bg-fff8f4)] px-4 py-3">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">{item.displayValue}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                </article>
              ))}
            </div>
          ) : null}
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
            {focusCharts[focus].slice(0, 2).map((key) => (
              <ChartCard key={base.charts[key].id} className={base.charts[key].height ? "lg:col-span-2" : ""} chart={base.charts[key]} onSelect={(category, series) => openOverview({ type: "chart", chartId: base.charts[key].id, category, series })} />
            ))}
          </div>
          <div className="mt-4">
            <MoreCharts key={focus} id={`factories-${focus}-more`} count={focusCharts[focus].length - 2}>
              {focusCharts[focus].slice(2).map((key) => (
                <ChartCard key={base.charts[key].id} className={base.charts[key].height ? "lg:col-span-2" : ""} chart={base.charts[key]} onSelect={(category, series) => openOverview({ type: "chart", chartId: base.charts[key].id, category, series })} />
              ))}
            </MoreCharts>
          </div>
          </section>

        </>
      ) : null}

      <ScopeBand id="factories-filters" kicker="Filters" title="Filter the records" note="Choose a period, district, taluk or category. The figures, district map, items for review and registers below follow your choice." />
      <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-5 py-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
        {options ? <FactoriesFiltersBar options={options} value={filters} onChange={applyFilters} onReset={() => setSearchParams(factoriesQuery(DEFAULT_FACTORIES_FILTERS), { replace: true })} /> : <p className="text-sm text-slate-500">Loading filters.</p>}
      </section>

      {overview ? (
        <>
          <FilterSummary scope={overview.scopeLabel} updating={updating} items={overview.kpis.map((item) => ({ label: item.label, value: item.displayValue }))} />

          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.7fr)]">
            <FactoriesMap
              districts={overview.districts}
              selectedId={filters.districtId}
              metric={metric}
              boundaryNote={overview.boundaryNote}
              onMetric={setMetric}
              onSelect={selectDistrict}
            />
            <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
              <h2 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Items for review</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Open findings stay open until a closure is recorded. These items are for follow-up.</p>
              <div className="mt-3 space-y-2">
                {overview.exceptions.map((item) => (
                  <article key={item.id} className={`rounded-2xl border border-[color:var(--c-border-ffeae1)] border-l-4 bg-[color:var(--c-bg-fff8f4)] p-3 ${item.priority === "high" ? "border-l-[color:var(--c-border-8c2f39)]" : "border-l-[color:var(--c-border-b23a48)]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[color:var(--c-text-461220)]">{item.title}</h3>
                      <StatusBadge value={item.priority} />
                    </div>
                    <p className="mt-2 text-xl font-semibold text-[color:var(--c-text-461220)] tabular-nums">{item.countLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.reference} · {item.district}</p>
                    <button type="button" className="mt-2 text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => openFiltered({ type: "exception", exceptionId: item.id })}>
                      View details
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] sm:p-5">
            <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Registers">
              {([
                ["factories", "Factory register"],
                ["inspections", "Inspection register"],
                ["accidents", "Accident register"],
                ["boilers", "Boiler register"],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={register === id} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${register === id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffeee7)] text-slate-600"}`} onClick={() => setRegister(id)}>
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Illustrative extract for the selected filters. Summary figures are the totals for this scope. They are not the number of rows in this table. Inspector names are masked.</p>
            <div className="mt-3">
              <DataTable
                columns={registerColumns[register]}
                rows={overview.registers[register]}
                action={{ label: "View details", onClick: (row) => openFiltered({ type: "record", register, id: row.Reference ?? "" }) }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-5 py-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
            <h2 className="text-sm font-semibold text-[color:var(--c-text-461220)]">Related records</h2>
            <nav className="mt-3 flex flex-wrap gap-2" aria-label="Related records">
              {FACTORIES_LINKS.map((link) => (
                <Link key={link.to} to={`${link.to}?${scope}`} className="rounded-full border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-fff8f4)] px-3 py-1.5 text-sm font-semibold text-[color:var(--c-text-461220)] hover:border-[color:var(--c-border-b23a48)] hover:text-[color:var(--c-text-8c2f39)]">
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-4 text-sm leading-6 text-slate-500">Source: {overview.source}. Last refreshed: {overview.lastRefreshed}. Scope: {overview.scopeLabel}. {overview.stageNote}</p>
          </section>
        </>
      ) : null}

      {drill ? <DetailDrawer detail={detailLoading ? null : detail} loading={detailLoading} onClose={() => { setDrill(null); setDetail(null) }} /> : null}
    </div>
  )
}
