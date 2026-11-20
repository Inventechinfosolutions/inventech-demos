import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { GigChart, type GigChartPoint } from "@/components/gig/GigChart"
import {
  aggregatorOption,
  describeSeries,
  feeOption,
  fundOption,
  grievanceOption,
  grievanceTrendOption,
  moneyShort,
  payoutOption,
  registrationOption,
  safetyOption,
  safetyTypeOption,
  schemeOption,
  sectorOption,
} from "@/components/gig/gigChartOptions"
import { GigDrawer } from "@/components/gig/GigDrawer"
import { FilterSummary } from "@/components/dashboard/FilterSummary"
import { MoreCharts } from "@/components/dashboard/MoreCharts"
import { ScopeBand } from "@/components/dashboard/ScopeBand"
import { useBaseline } from "@/lib/useBaseline"
import { GigFiltersBar } from "@/components/gig/GigFilters"
import { GigKpiCard, type Freshness } from "@/components/gig/GigKpiCard"
import { GigMap } from "@/components/gig/GigMap"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { formatCount, formatLongDate } from "@/lib/format"
import { DEFAULT_GIG_FILTERS, gigQuery, readGigFilters } from "@/lib/gigQuery"
import { getGigDetail, getGigOverview, loadGigOptions } from "@/services/gigService"
import type { GigChartId, GigDetail, GigDrill, GigFilterOptions, GigFilters, GigMapMetric, GigOverview } from "@/types/gig"

const card = "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]"
const heading = "text-lg font-semibold tracking-tight text-[color:var(--c-text-461220)]"
const linkButton = "text-sm font-semibold text-[color:var(--c-text-8c2f39)]"

const stamp = (value: string) => `${formatLongDate(value.slice(0, 10))}, ${value.slice(11, 16)} IST`

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2">
      <dt className="text-xs leading-4 text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-[color:var(--c-text-461220)] tabular-nums">{value}</dd>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className={`${card} h-44 animate-pulse`} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className={`${card} h-80 animate-pulse`} />)}
      </div>
    </div>
  )
}

function buildCharts(overview: GigOverview) {
  const { registration, sector, aggregators, payout, fee, fund, schemes, grievances, safety } = overview
  const aggregatorChart = aggregatorOption(aggregators)
  return {
    registration: registrationOption(registration),
    sector: sectorOption(sector),
    aggregators: aggregatorChart.option,
    aggregatorRows: aggregatorChart.rows,
    payout: payoutOption(payout),
    fee: feeOption(fee),
    fund: fundOption(fund),
    schemes: schemeOption(schemes),
    grievances: grievanceOption(grievances),
    grievanceTrend: grievanceTrendOption(grievances),
    safety: safetyOption(safety),
    safetyTypes: safetyTypeOption(safety),
  }
}

type GigCharts = ReturnType<typeof buildCharts>

export function GigWorkersDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()
  const filters = useMemo(() => readGigFilters(new URLSearchParams(filterKey)), [filterKey])
  const [options, setOptions] = useState<GigFilterOptions | null>(null)
  const [overview, setOverview] = useState<GigOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [metric, setMetric] = useState<GigMapMetric>("unique")
  const [drill, setRawDrill] = useState<GigDrill | null>(null)
  // The overview at the top always covers the default scope, so its drill-downs do too.
  const [drillOnOverview, setDrillOnOverview] = useState(false)
  const base = useBaseline(() => getGigOverview(DEFAULT_GIG_FILTERS))
  const setDrill = (next: GigDrill | null) => {
    setDrillOnOverview(false)
    setRawDrill(next)
  }
  const [detail, setDetail] = useState<GigDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "KBOCW · Gig Workers Welfare Board"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadGigOptions()
      .then((next) => {
        if (!cancelled) setOptions(next)
      })
      .catch(() => {
        if (!cancelled) setError("The filters could not be loaded.")
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    let cancelled = false
    setUpdating(true)
    getGigOverview(filters)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The Gig Workers Welfare Board dashboard could not be loaded.")
      })
      .finally(() => {
        if (!cancelled) setUpdating(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters, attempt])

  useEffect(() => {
    if (!drill) return
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    getGigDetail(drill, drillOnOverview ? DEFAULT_GIG_FILTERS : filters)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch(() => {
        if (!cancelled) setDetailError("The selected records could not be loaded.")
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [drill, drillOnOverview, filters])

  const applyFilters = useCallback((next: GigFilters) => setSearchParams(gigQuery(next), { replace: true }), [setSearchParams])
  function openOverview(next: GigDrill) {
    setDrillOnOverview(true)
    setRawDrill(next)
  }

  const closeDrawer = useCallback(() => {
    setDrill(null)
    setDetail(null)
    setDetailError(null)
  }, [])

  const selectDistrict = (districtId: string) => applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId, cityId: "all" })

  const charts = useMemo(() => (overview ? buildCharts(overview) : null), [overview])
  const baseCharts = useMemo(() => (base ? buildCharts(base) : null), [base])

  const freshnessOf = useCallback(
    (sourceIds: string[]): Freshness => {
      const statuses = (overview?.sources ?? []).filter((source) => sourceIds.includes(source.id)).map((source) => source.status)
      return statuses.includes("stale") ? "stale" : statuses.includes("delayed") ? "delayed" : "current"
    },
    [overview],
  )
  const namesOf = useCallback((sourceIds: string[]) => (overview?.sources ?? []).filter((source) => sourceIds.includes(source.id)).map((source) => source.name).join(", "), [overview])

  /** Cards and charts. They always show the default scope, so any drill-down from them does too. */
  function overviewBlock(overview: GigOverview, charts: GigCharts) {
    const open = (chartId: GigChartId, byMonth: boolean) => (point?: GigChartPoint) => {
      const month = byMonth && point?.index !== undefined ? overview.months[point.index]?.index : undefined
      openOverview({ type: "chart", chartId, category: byMonth ? undefined : point?.category, series: point?.series, month })
    }
    const setDrill = openOverview
    return (
      <>
          <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overview.kpis.map((kpi) => (
            <GigKpiCard key={kpi.id} kpi={kpi} freshness={freshnessOf(kpi.sourceIds)} sourceNames={namesOf(kpi.sourceIds)} onOpen={() => setDrill({ type: "kpi", id: kpi.id })} />
          ))}
        </section>

        <section aria-label="Supporting figures" className={`${card} p-4`}>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {overview.strip.map((stat) => (
              <li key={stat.id}>
                <button
                  type="button"
                  title={stat.hint}
                  className="h-full w-full rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2.5 text-left transition hover:bg-[color:var(--c-bg-ffeee7)]"
                  onClick={() => setDrill({ type: "strip", id: stat.id })}
                >
                  <span className="block text-xs leading-4 text-slate-500">{stat.label}</span>
                  <span className="mt-1 block text-lg font-semibold text-[color:var(--c-text-461220)] tabular-nums">{stat.displayValue}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
          <GigChart
            title="Records received by month"
            subtitle="Records are not unique workers. The line shows workers newly registered with the Board each month."
            option={charts.registration}
            ariaLabel={describeSeries("Records received by month", overview.registration.months, overview.registration.records, "count")}
            notAffectedBy={overview.registration.notAffectedBy}
            onPoint={open("registration", true)}
          />
          <GigChart
            title="Workers by sector"
            subtitle="Registered workers at the end of the period. Each worker is counted once."
            option={charts.sector}
            ariaLabel={describeSeries("Registered workers by sector", overview.sector.rows.map((row) => row.name), overview.sector.rows.map((row) => row.workers), "count")}
            height={Math.max(320, overview.sector.rows.length * 32 + 80)}
            empty={overview.sector.rows.length === 0 ? "No workers in the selected scope." : undefined}
            notAffectedBy={overview.sector.notAffectedBy}
            onPoint={open("sector", false)}
          />
          <GigChart
            title="Workers by aggregator"
            subtitle="Registered workers on each platform. A worker on several platforms appears on each."
            option={charts.aggregators}
            ariaLabel={describeSeries("Unique workers by aggregator", overview.aggregators.rows.filter((row) => row.workers > 0).map((row) => row.name), overview.aggregators.rows.filter((row) => row.workers > 0).map((row) => row.workers), "count")}
            height={Math.max(320, charts.aggregatorRows * 34 + 90)}
            empty={charts.aggregatorRows === 0 ? "No aggregator has records in the selected scope." : undefined}
            notAffectedBy={overview.aggregators.notAffectedBy}
            onPoint={open("aggregators", false)}
            footer={
              <p className="mt-2 text-xs leading-5 text-slate-500">
                The bars add up to {formatCount(overview.aggregators.engagementTotal)} platform engagements. They belong to {formatCount(overview.aggregators.uniqueTotal)} unique workers, because some workers work with more than one platform.
                {overview.aggregators.rows.length > charts.aggregatorRows ? ` ${overview.aggregators.rows.length - charts.aggregatorRows} registered aggregators have not started reporting.` : ""}
              </p>
            }
          />
          <GigChart
            title="Worker payouts by month"
            subtitle="Total payouts reported by aggregators. The line shows workers with at least one payout."
            option={charts.payout}
            ariaLabel={describeSeries("Worker payouts by month", overview.payout.months, overview.payout.payout, "inr")}
            notAffectedBy={overview.payout.notAffectedBy}
            onPoint={open("payout", true)}
            footer={
              overview.payout.avgPerActive !== null ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">Average payout per active worker over the period: {moneyShort(overview.payout.avgPerActive)}.</p>
              ) : null
            }
          />
        </div>
        <MoreCharts id="gig-more" count={7}>
            <GigChart
              title="Welfare fee: payable, declared, deposited and reconciled"
              subtitle="Fee due on payouts at the configured sector rates, and how much has moved through each stage."
              option={charts.fee}
              ariaLabel={describeSeries("Welfare fee deposited by month", overview.fee.months, overview.fee.deposited, "inr")}
              notAffectedBy={overview.fee.notAffectedBy}
              onPoint={open("fee", true)}
              footer={
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Shortfall against the fee payable: {moneyShort(overview.fee.shortfall)}. Deposited above the fee payable: {moneyShort(overview.fee.excess)}. {overview.feeNote}
                </p>
              }
            />
            <GigChart
              title="Welfare fund: receipts, expenditure and balance"
              subtitle="Monthly ledger of the whole welfare fund."
              option={charts.fund}
              ariaLabel={describeSeries("Welfare fund closing balance by month", overview.fund.months, overview.fund.closing, "inr")}
              notAffectedBy={overview.fund.notAffectedBy}
              onPoint={open("fund", true)}
              footer={
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <Stat label="Opening balance" value={moneyShort(overview.fund.summary.opening)} />
                  <Stat label={`Closing balance, ${overview.fund.summary.asOf}`} value={moneyShort(overview.fund.summary.closing)} />
                  {overview.fund.summary.receipts.map((item) => <Stat key={item.label} label={item.label} value={moneyShort(item.value)} />)}
                  {overview.fund.summary.expenditure.map((item) => <Stat key={item.label} label={item.label} value={moneyShort(item.value)} />)}
                  <Stat label="Adjustments and refunds" value={moneyShort(overview.fund.summary.adjustments)} />
                </dl>
              }
            />
            <GigChart
              title="Welfare scheme applications"
              subtitle="Where applications received in the period stand."
              option={charts.schemes}
              ariaLabel={describeSeries("Welfare scheme applications by stage", overview.schemes.pipeline.map((item) => item.label), overview.schemes.pipeline.map((item) => item.value), "count")}
              height={Math.max(300, overview.schemes.pipeline.length * 36 + 80)}
              notAffectedBy={overview.schemes.notAffectedBy}
              onPoint={open("schemes", false)}
              footer={
                <div className="relative mt-3 min-w-0 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-[color:var(--c-text-8c2f39)]">
                        <th scope="col" className="px-2 py-2 font-semibold">Scheme</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Applications</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Beneficiaries</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Disbursed</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold"><span className="sr-only">Action</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.schemes.rows.map((row) => (
                        <tr key={row.id} className="border-b border-[color:var(--c-border-ffeae1)]">
                          <th scope="row" className="px-2 py-2 font-normal text-[color:var(--c-text-461220)]">
                            {row.name}
                            {row.operational ? null : <span className="block text-xs text-slate-500">Not yet notified</span>}
                          </th>
                          <td className="px-2 py-2 text-right tabular-nums">{formatCount(row.applications)}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{formatCount(row.beneficiaries)}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{moneyShort(row.amount)}</td>
                          <td className="px-2 py-2 text-right">
                            <button type="button" className={linkButton} onClick={() => setDrill({ type: "chart", chartId: "schemes", category: row.name })}>
                              Details<span className="sr-only"> for {row.name}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{overview.schemeNote}</p>
                </div>
              }
            />
            <GigChart
              title="Grievances by category"
              subtitle={`Received in the period. The resolution target is ${overview.grievances.targetDays} days, a POC placeholder.`}
              option={charts.grievances}
              ariaLabel={describeSeries("Grievances received by category", overview.grievances.categories.map((row) => row.name), overview.grievances.categories.map((row) => row.resolved + row.pending + row.escalated), "count")}
              height={Math.max(320, overview.grievances.categories.length * 40 + 90)}
              notAffectedBy={overview.grievances.notAffectedBy}
              onPoint={open("grievances", false)}
              footer={
                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Stat label="Received" value={formatCount(overview.grievances.totals.received)} />
                  <Stat label="Resolved" value={formatCount(overview.grievances.totals.resolved)} />
                  <Stat label="Pending" value={formatCount(overview.grievances.totals.pending)} />
                  <Stat label="Escalated to the Board" value={formatCount(overview.grievances.totals.escalated)} />
                  <Stat label="Appeals received" value={formatCount(overview.grievances.totals.appealsReceived)} />
                  <Stat label={`Open beyond ${overview.grievances.targetDays} days`} value={formatCount(overview.grievances.totals.beyondTarget)} />
                </dl>
              }
            />
            <GigChart
              title="Grievances received and resolved by month"
              option={charts.grievanceTrend}
              ariaLabel={describeSeries("Grievances received by month", overview.grievances.months, overview.grievances.received, "count")}
              notAffectedBy={overview.grievances.notAffectedBy}
              onPoint={open("grievanceTrend", true)}
            />
            <GigChart
              title="Accidents and claims by month"
              subtitle="Accidents reported, split by severity, with claims started and settled."
              option={charts.safety}
              ariaLabel={describeSeries("Accidents reported by month", overview.safety.months, overview.safety.fatal.map((value, index) => value + overview.safety.nonFatal[index]), "count")}
              notAffectedBy={overview.safety.notAffectedBy}
              onPoint={open("safety", true)}
              footer={
                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Stat label="Accidents" value={formatCount(overview.safety.totals.accidents)} />
                  <Stat label="Fatal" value={formatCount(overview.safety.totals.fatal)} />
                  <Stat label="Claims initiated" value={formatCount(overview.safety.totals.claimsInitiated)} />
                  <Stat label="Claims settled" value={formatCount(overview.safety.totals.claimsSettled)} />
                  <Stat label="Workers trained" value={formatCount(overview.safety.totals.trainees)} />
                </dl>
              }
            />
            <GigChart
              title="Accidents by type"
              option={charts.safetyTypes}
              ariaLabel={describeSeries("Accidents by type", overview.safety.types.map((row) => row.name), overview.safety.types.map((row) => row.fatal + row.nonFatal), "count")}
              height={Math.max(300, overview.safety.types.length * 40 + 90)}
              notAffectedBy={overview.safety.notAffectedBy}
              onPoint={open("safetyTypes", false)}
            />
        </MoreCharts>

      </>
    )
  }

  const head = base ?? overview
  const staleSources = (head?.sources ?? []).filter((source) => source.status === "stale")

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-5">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Gig Workers Welfare Board dashboard."}
      </p>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" className="font-semibold underline" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        </div>
      ) : null}

      {!base && !error ? <Skeleton /> : null}

      {base && baseCharts ? (
        <div className="space-y-5">
          <ScopeBand as="h1" kicker="Karnataka Platform-Based Gig Workers Welfare Board" title="Executive Overview" note={`${base.periodLabel} · ${base.scopeLabel}. These cards and charts cover the full scope and do not change with the filters further down.`}>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="rounded-full bg-[color:var(--c-bg-ffe9e0)] px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] ring-1 ring-[color:var(--c-border-fed0bb)] ring-inset">Illustrative POC Data</span>
              <span className="text-sm text-slate-600">Data as of {base.asOfLabel}</span>
              <span className="text-xs text-slate-500">Reporting date {base.reportingDate} · Last refreshed {base.lastRefreshed}</span>
            </div>
          </ScopeBand>
          {staleSources.length > 0 ? (
            <p className="rounded-2xl border border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-ffe9e0)] px-4 py-3 text-sm leading-6 text-[color:var(--c-text-8c2f39)]">
              {staleSources.map((source) => source.name).join(", ")} {staleSources.length === 1 ? "has" : "have"} not been updated within the expected interval, so figures that depend on {staleSources.length === 1 ? "it" : "them"} may be out of date. See the data sources at the end of this page.
            </p>
          ) : null}

          {overviewBlock(base, baseCharts)}
        </div>
      ) : null}

      <ScopeBand id="gig-filters" kicker="Filters" title="Filter the records" note="Choose a period, district, city, sector or aggregator. The figures, district map, priority exceptions and tables below follow your choice." />
      <section className={`${card} px-5 py-4`}>
        <div>
          {options ? (
            <GigFiltersBar options={options} value={filters} onApply={applyFilters} onReset={() => setSearchParams(gigQuery(DEFAULT_GIG_FILTERS), { replace: true })} />
          ) : (
            <p className="text-sm text-slate-500">Loading filters.</p>
          )}
          {overview && overview.activeFilters.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
              {overview.activeFilters.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 py-1 text-sm text-[color:var(--c-text-461220)]"
                    aria-label={`Remove filter ${item.label}: ${item.value}`}
                    onClick={() => applyFilters({ ...filters, [item.key]: "all", ...(item.key === "districtId" ? { cityId: "all" } : {}) })}
                  >
                    <span className="text-slate-500">{item.label}:</span> <span className="font-semibold">{item.value}</span> <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {overview && charts ? (
        <div className={updating ? "space-y-5 opacity-70 transition-opacity" : "space-y-5 transition-opacity"} aria-busy={updating}>
          {overview.empty ? (
            <div className={`${card} px-5 py-6`}>
              <h2 className={heading}>No gig worker records match these filters</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Widen the dates or remove a filter to see figures again. For example, a city and a district that do not match give no results.</p>
              <button type="button" className="mt-3 rounded-lg bg-[color:var(--c-bg-461220)] px-4 py-2 text-sm font-semibold text-white" onClick={() => setSearchParams(gigQuery(DEFAULT_GIG_FILTERS), { replace: true })}>
                Reset filters
              </button>
            </div>
          ) : null}

          <FilterSummary scope={overview.scopeLabel} updating={updating} items={overview.kpis.map((item) => ({ label: item.label, value: item.displayValue }))} />

          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <GigMap districts={overview.districts} selectedId={filters.districtId} metric={metric} note={overview.locationNote} onMetric={setMetric} onSelect={selectDistrict} />
            <section className={`${card} p-4 sm:p-5`} aria-labelledby="gig-exceptions">
              <h2 id="gig-exceptions" className={heading}>Priority exceptions</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Showing {overview.exceptions.length} of {overview.exceptionCount}, highest priority first. The thresholds are POC placeholders.
              </p>
              {overview.exceptions.length === 0 ? <p className="mt-4 text-sm text-slate-500">No exceptions for the selected scope.</p> : null}
              <ul className="mt-3 space-y-2">
                {overview.exceptions.map((item) => (
                  <li key={item.id} className={`rounded-2xl border border-[color:var(--c-border-ffeae1)] border-l-4 bg-[color:var(--c-bg-fff8f4)] p-3 ${item.priority === "high" ? "border-l-[color:var(--c-border-8c2f39)]" : "border-l-[color:var(--c-border-b23a48)]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[color:var(--c-text-461220)]">{item.category}</h3>
                      <StatusBadge value={item.priority} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.scope}</p>
                    <p className="mt-1 text-lg font-semibold text-[color:var(--c-text-461220)] tabular-nums">{item.measure}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.status} · Due {item.due} · {item.unit}</p>
                    <button type="button" className={`mt-2 ${linkButton}`} onClick={() => setDrill({ type: "exception", id: item.id })}>
                      View details<span className="sr-only"> for {item.category}, {item.scope}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className={`${card} p-4 sm:p-5`} aria-labelledby="gig-aggregators">
            <h2 id="gig-aggregators" className={heading}>Aggregator reporting</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Returns and fee position for each registered aggregator in {overview.periodLabel}. Unique workers are counted once per aggregator, so they do not add up to the total.
            </p>
            <div className="relative mt-3 min-w-0 overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-[color:var(--c-text-8c2f39)]">
                    <th scope="col" className="px-3 py-3 font-semibold">Aggregator</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Sector</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Records</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Unique workers</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Payouts</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Fee payable</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Fee deposited</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Return status</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Last return</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.aggregatorTable.map((row) => (
                    <tr key={row.id} className="border-b border-[color:var(--c-border-ffeae1)]">
                      <th scope="row" className="px-3 py-3 font-semibold text-[color:var(--c-text-461220)]">{row.name}</th>
                      <td className="px-3 py-3 text-[color:var(--c-text-461220)]">{row.sector}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCount(row.records)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.unique === null ? "No records yet" : formatCount(row.unique)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{moneyShort(row.payout)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{moneyShort(row.payable)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{moneyShort(row.deposited)}</td>
                      <td className="px-3 py-3 text-[color:var(--c-text-461220)]">{row.returnStatus}</td>
                      <td className="px-3 py-3 text-[color:var(--c-text-461220)]">{row.lastSubmission}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {(["profile", "history", "outstanding"] as const).map((view) => (
                          <button key={view} type="button" className={`ml-3 ${linkButton}`} onClick={() => setDrill({ type: "aggregator", id: row.id, view })}>
                            {view === "profile" ? "Profile" : view === "history" ? "History" : "Outstanding"}
                            <span className="sr-only"> for {row.name}</span>
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${card} p-4 sm:p-5`} aria-labelledby="gig-sources">
            <h2 id="gig-sources" className={heading}>Data sources and freshness</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{overview.source}. Each source is checked against how often it is expected to update.</p>
            <div className="relative mt-3 min-w-0 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-[color:var(--c-text-8c2f39)]">
                    <th scope="col" className="px-3 py-2.5 font-semibold">Source</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Last updated</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Expected every</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.sources.map((source) => (
                    <tr key={source.id} className="border-b border-[color:var(--c-border-ffeae1)]">
                      <th scope="row" className="px-3 py-2.5 font-normal text-[color:var(--c-text-461220)]">{source.name}</th>
                      <td className="px-3 py-2.5">{stamp(source.updated)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{source.cadenceDays} {source.cadenceDays === 1 ? "day" : "days"}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-[color:var(--c-text-461220)]">{source.status === "current" ? "Current" : source.status === "delayed" ? "Delayed" : "Not up to date"}</span>
                        <span className="text-slate-500"> · {source.ageDays} {source.ageDays === 1 ? "day" : "days"} old</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${card} p-4 sm:p-5`} aria-labelledby="gig-benchmark">
            <h2 id="gig-benchmark" className={heading}>Public benchmark</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{overview.benchmark.text}</p>
            <p className="mt-1 text-sm text-slate-500">
              Source: {overview.benchmark.source}, {overview.benchmark.date}. This is public reporting, shown on its own. It is not part of the dashboard figures and the records it mentions are not unique workers.
            </p>
          </section>

          <section className={`${card} p-4 sm:p-5`} aria-labelledby="gig-definitions">
            <h2 id="gig-definitions" className={heading}>How the figures are defined</h2>
            <ul className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
              {[overview.boundaryNote, overview.locationNote, overview.activityRuleNote, overview.feeNote, overview.schemeNote].map((note) => <li key={note} className="rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2">{note}</li>)}
            </ul>
            <div className="mt-4 divide-y divide-[color:var(--c-border-ffeae1)] rounded-xl border border-[color:var(--c-border-ffeae1)]">
              {overview.definitions.map((definition) => (
                <details key={definition.code} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[color:var(--c-text-461220)]">
                    <span>{definition.name} <span className="font-normal text-slate-500">({definition.code})</span></span>
                    <span aria-hidden="true" className="text-[color:var(--c-text-8c2f39)] group-open:rotate-45">+</span>
                  </summary>
                  <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
                    {([
                      ["Definition", definition.definition],
                      ["Calculation", definition.calculation],
                      ["Aggregation", definition.aggregation],
                      ["Date basis", definition.dateBasis],
                      ["Sources", definition.sources.join(", ")],
                      ["Exclusions", definition.exclusions],
                      ["Owner", definition.owner],
                      ["Effective date", definition.effectiveDate],
                      ["Version", definition.version],
                    ] as [string, ReactNode][]).map(([term, text]) => (
                      <div key={term} className="contents">
                        <dt className="font-semibold text-[color:var(--c-text-8c2f39)]">{term}</dt>
                        <dd className="min-w-0 break-words text-slate-700">{text}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {drill ? (
        <GigDrawer
          detail={detailLoading ? null : detail}
          loading={detailLoading}
          error={detailError}
          onClose={closeDrawer}
          onApply={(patch) => {
            applyFilters({ ...filters, ...patch })
            closeDrawer()
          }}
        />
      ) : null}
    </div>
  )
}
