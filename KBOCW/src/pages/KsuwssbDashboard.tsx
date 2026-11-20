import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { GigChart, type GigChartPoint } from "@/components/gig/GigChart"
import { describeSeries, moneyShort } from "@/components/gig/gigChartOptions"
import { GigKpiCard, type Freshness } from "@/components/gig/GigKpiCard"
import { KsuDrawer } from "@/components/ksu/KsuDrawer"
import { FilterSummary } from "@/components/dashboard/FilterSummary"
import { MoreCharts } from "@/components/dashboard/MoreCharts"
import { ScopeBand } from "@/components/dashboard/ScopeBand"
import { useBaseline } from "@/lib/useBaseline"
import { KsuFiltersBar } from "@/components/ksu/KsuFilters"
import { KsuMap } from "@/components/ksu/KsuMap"
import { KsuTable, type KsuColumn } from "@/components/ksu/KsuTable"
import {
  beneficiaryTrendOption,
  benefitOption,
  districtBarOption,
  enrolmentOption,
  facilitationOption,
  financeOption,
  financeTrendOption,
  funnelOption,
  paymentOption,
  pendingAgeOption,
  pipelineOption,
  processingOption,
  reasonOption,
  registrationOption,
  schemeAmountOption,
  schemeCountOption,
  statusOption,
  unpaidAgeOption,
  workersOption,
} from "@/components/ksu/ksuChartOptions"
import { KSU_AGE_GROUPS, KSU_BENEFITS, KSU_CLAIM_STAGES, KSU_DISTRICTS, KSU_GENDERS, KSU_OCCUPATIONS, KSU_REG_STATUSES, benefitLabel } from "@/data/ksuMasters"
import { formatCount, formatLongDate } from "@/lib/format"
import { downloadKsuSummary } from "@/lib/ksuExport"
import { DEFAULT_KSU_FILTERS, ksuQuery, readKsuFilters } from "@/lib/ksuQuery"
import { palette } from "@/lib/palette"
import { getKsuDetail, getKsuOverview, loadKsuOptions } from "@/services/ksuService"
import type { KsuChartId, KsuDetail, KsuDistrictRow, KsuDrill, KsuFilterKey, KsuFilterOptions, KsuFilters, KsuMapMetric, KsuOverview, KsuPriorityRow, KsuSchemeRow } from "@/types/ksu"

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

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div>
        <h2 id={id} className="text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">{title}</h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
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

const rowsHeight = (rows: number, per = 34, base = 90) => Math.max(260, rows * per + base)

function buildCharts(overview: KsuOverview, districtId: string) {
  const { demographics, schemes, claims, finance, facilitation, districtRows } = overview
  const shownDistricts = (districtId === "all" ? districtRows : districtRows.filter((row) => row.id === districtId)).filter((row) => row.received > 0 || row.disbursed > 0)
  const byReceived = [...shownDistricts].sort((a, b) => b.received - a.received).slice(0, 10)
  const byDisbursed = [...shownDistricts].sort((a, b) => b.disbursed - a.disbursed).slice(0, 10)
  return {
    registration: registrationOption(overview.registration),
    occupation: workersOption(demographics.occupations),
    gender: workersOption(demographics.genders, true, 150),
    age: workersOption(demographics.ages, true, 120),
    settlement: workersOption(demographics.settlement, true, 120),
    status: statusOption(demographics.statuses),
    districtClaims: districtBarOption(byReceived.map((row) => ({ name: row.name, values: [row.received, row.pending] })), [
      { name: "Cases received", unit: "count", color: palette.blue },
      { name: "Pending at the end", unit: "count", color: palette.amber },
    ]),
    districtClaimRows: byReceived.length,
    districtPaid: districtBarOption(byDisbursed.map((row) => ({ name: row.name, values: [row.disbursed] })), [{ name: "Benefits disbursed", unit: "inr", color: palette.blue }]),
    districtPaidRows: byDisbursed.length,
    enrolments: enrolmentOption(schemes),
    schemeCases: schemeCountOption(schemes),
    schemeAmounts: schemeAmountOption(schemes),
    funnel: funnelOption(schemes),
    pipeline: pipelineOption(schemes),
    trend: beneficiaryTrendOption(schemes),
    benefit: benefitOption(claims),
    pendingAge: pendingAgeOption(claims),
    processing: processingOption(claims),
    reasons: reasonOption(claims),
    unpaid: unpaidAgeOption(claims),
    payments: paymentOption(claims),
    finance: financeOption(finance),
    financeTrend: financeTrendOption(finance),
    facilitation: facilitationOption(facilitation),
    facilitationDistricts: workersOption(facilitation.districts.filter((row) => row.value > 0).slice(0, 10), true, 130),
  }
}

type KsuCharts = ReturnType<typeof buildCharts>

export function KsuwssbDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()
  const filters = useMemo(() => readKsuFilters(new URLSearchParams(filterKey)), [filterKey])
  const [options, setOptions] = useState<KsuFilterOptions | null>(null)
  const [overview, setOverview] = useState<KsuOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [metric, setMetric] = useState<KsuMapMetric>("registered")
  const [drill, setRawDrill] = useState<KsuDrill | null>(null)
  // The overview at the top always covers the default scope, so its drill-downs do too.
  const [drillOnOverview, setDrillOnOverview] = useState(false)
  const base = useBaseline(() => getKsuOverview(DEFAULT_KSU_FILTERS))
  const setDrill = (next: KsuDrill | null) => {
    setDrillOnOverview(false)
    setRawDrill(next)
  }
  const openOverview = (next: KsuDrill) => {
    setDrillOnOverview(true)
    setRawDrill(next)
  }
  const [detail, setDetail] = useState<KsuDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "KBOCW · KSUWSSB Executive Overview"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadKsuOptions()
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
    getKsuOverview(filters)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The KSUWSSB dashboard could not be loaded.")
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
    getKsuDetail(drill, drillOnOverview ? DEFAULT_KSU_FILTERS : filters)
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

  const applyFilters = useCallback((next: KsuFilters) => setSearchParams(ksuQuery(next), { replace: true }), [setSearchParams])
  const resetFilters = useCallback(() => setSearchParams(ksuQuery(DEFAULT_KSU_FILTERS), { replace: true }), [setSearchParams])
  const closeDrawer = useCallback(() => {
    setDrill(null)
    setDetail(null)
    setDetailError(null)
  }, [])

  const toggle = (key: KsuFilterKey, id: string | undefined) => {
    if (id) applyFilters({ ...filters, [key]: filters[key] === id ? "all" : id })
  }
  const selectDistrict = (districtId: string) => toggle("districtId", districtId)

  /** A bar that narrows the dashboard when it can, and otherwise opens the figures behind it. */
  const pick = (chartId: KsuChartId, key: KsuFilterKey | null, lookup: (point: GigChartPoint) => string | undefined, byMonth = false) => (point?: GigChartPoint) => {
    if (!point) {
      setDrill({ type: "chart", chartId })
      return
    }
    if (key) {
      const id = lookup(point)
      if (id) {
        toggle(key, id)
        return
      }
    }
    const month = byMonth && point.index !== undefined ? overview?.months[point.index]?.index : undefined
    setDrill({ type: "chart", chartId, category: byMonth ? undefined : point.category, series: point.series, month })
  }
  const monthPick = (chartId: KsuChartId) => pick(chartId, null, () => undefined, true)

  const charts = useMemo(() => (overview ? buildCharts(overview, filters.districtId) : null), [overview, filters.districtId])
  const baseCharts = useMemo(() => (base ? buildCharts(base, "all") : null), [base])

  const freshnessOf = useCallback(
    (sourceIds: string[]): Freshness => {
      const statuses = (overview?.sources ?? []).filter((source) => sourceIds.includes(source.id)).map((source) => source.status)
      return statuses.includes("stale") ? "stale" : statuses.includes("delayed") ? "delayed" : "current"
    },
    [overview],
  )
  const namesOf = useCallback((sourceIds: string[]) => (overview?.sources ?? []).filter((source) => sourceIds.includes(source.id)).map((source) => source.name).join(", "), [overview])

  const head = base ?? overview
  const staleSources = (head?.sources ?? []).filter((source) => source.status === "stale")

  const districtColumns: KsuColumn<KsuDistrictRow>[] = [
    { key: "name", label: "District", sort: (row) => row.name, render: (row) => row.name },
    { key: "registered", label: "Registered workers", align: "right", sort: (row) => row.registered, render: (row) => formatCount(row.registered) },
    { key: "baseline", label: "Illustrative baseline", align: "right", sort: (row) => row.baseline, render: (row) => formatCount(row.baseline) },
    { key: "coverage", label: "Coverage", align: "right", sort: (row) => row.coverage, render: (row) => `${row.coverage.toFixed(1)}%` },
    { key: "enrolments", label: "Enrolments", align: "right", sort: (row) => row.enrolments, render: (row) => formatCount(row.enrolments) },
    { key: "received", label: "Cases received", align: "right", sort: (row) => row.received, render: (row) => formatCount(row.received) },
    { key: "pending", label: "Pending", align: "right", sort: (row) => row.pending, render: (row) => formatCount(row.pending) },
    { key: "disbursed", label: "Disbursed", align: "right", sort: (row) => row.disbursed, render: (row) => moneyShort(row.disbursed) },
    { key: "eshram", label: "e-Shram (external)", align: "right", sort: (row) => row.eshram, render: (row) => formatCount(row.eshram) },
    {
      key: "action",
      label: "Details",
      align: "right",
      render: (row) => (
        <button type="button" className={linkButton} onClick={() => setDrill({ type: "district", id: row.id })}>
          View<span className="sr-only"> {row.name}</span>
        </button>
      ),
    },
  ]

  const schemeColumnsFor = (setDrill: (next: KsuDrill) => void): KsuColumn<KsuSchemeRow>[] => [
    {
      key: "name",
      label: "Scheme",
      sort: (row) => row.name,
      render: (row) => (
        <>
          {row.name}
          <span className="mt-0.5 block text-xs font-normal text-slate-500">{row.statusLabel}</span>
        </>
      ),
    },
    { key: "enrolments", label: "Enrolments", align: "right", sort: (row) => row.enrolments, render: (row) => formatCount(row.enrolments) },
    { key: "received", label: "Cases received", align: "right", sort: (row) => row.received, render: (row) => formatCount(row.received) },
    { key: "approved", label: "Approved", align: "right", sort: (row) => row.approved, render: (row) => formatCount(row.approved) },
    { key: "beneficiaries", label: "Beneficiaries", align: "right", sort: (row) => row.beneficiaries, render: (row) => formatCount(row.beneficiaries) },
    { key: "approvedAmount", label: "Approved amount", align: "right", sort: (row) => row.approvedAmount, render: (row) => moneyShort(row.approvedAmount) },
    { key: "disbursedAmount", label: "Disbursed amount", align: "right", sort: (row) => row.disbursedAmount, render: (row) => moneyShort(row.disbursedAmount) },
    { key: "avg", label: "Average days to decide", align: "right", sort: (row) => row.avgDays ?? -1, render: (row) => (row.avgDays === null ? "n/a" : String(row.avgDays)) },
    {
      key: "action",
      label: "Details",
      align: "right",
      render: (row) => (
        <button type="button" className={linkButton} onClick={() => setDrill({ type: "scheme", id: row.id })}>
          View<span className="sr-only"> {row.name}</span>
        </button>
      ),
    },
  ]

  const priorityColumns: KsuColumn<KsuPriorityRow>[] = [
    { key: "district", label: "District", sort: (row) => row.district, render: (row) => row.district },
    { key: "scheme", label: "Scheme", sort: (row) => row.scheme, render: (row) => row.scheme },
    { key: "pending", label: "Pending cases", align: "right", sort: (row) => row.pending, render: (row) => formatCount(row.pending) },
    {
      key: "oldest",
      label: "Oldest pending",
      align: "right",
      sort: (row) => row.oldestAge,
      render: (row) => (row.pending > 0 ? `${formatCount(row.oldestAge)} days (${row.ageBucket})` : "None pending"),
    },
    { key: "unpaid", label: "Approved, not yet paid", align: "right", sort: (row) => row.approvedUnpaid, render: (row) => `${formatCount(row.approvedUnpaid)} · ${moneyShort(row.approvedUnpaidAmount)}` },
    { key: "updated", label: "Last updated", sort: (row) => row.lastUpdated, render: (row) => formatLongDate(row.lastUpdated) },
    { key: "note", label: "Why it is listed", render: (row) => row.note },
    {
      key: "action",
      label: "Action",
      align: "right",
      render: (row) => (
        <button type="button" className={linkButton} onClick={() => setDrill({ type: "priority", key: row.key })}>
          Review cases<span className="sr-only"> in {row.district}, {row.scheme}</span>
        </button>
      ),
    },
  ]

  /** Cards, registration charts and scheme performance. They always show the default scope, so any drill-down from them does too. */
  function overviewBlock(overview: KsuOverview, charts: KsuCharts) {
    const pick = (chartId: KsuChartId, _key: KsuFilterKey | null, _lookup: (point: GigChartPoint) => string | undefined, byMonth = false) => (point?: GigChartPoint) => {
      if (!point) {
        openOverview({ type: "chart", chartId })
        return
      }
      const month = byMonth && point.index !== undefined ? overview.months[point.index]?.index : undefined
      openOverview({ type: "chart", chartId, category: byMonth ? undefined : point.category, series: point.series, month })
    }
    const monthPick = (chartId: KsuChartId) => pick(chartId, null, () => undefined, true)
    const setDrill = openOverview
    const schemeColumns = schemeColumnsFor(openOverview)
    return (
      <>
          <section aria-label="Key figures" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overview.kpis.map((kpi) => (
                <GigKpiCard key={kpi.id} kpi={kpi} freshness={freshnessOf(kpi.sourceIds)} sourceNames={namesOf(kpi.sourceIds)} onOpen={() => setDrill({ type: "kpi", id: kpi.id })} />
              ))}
            </div>
            <div className={`${card} p-4`}>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                {overview.strip.map((stat) => (
                  <li key={stat.id}>
                    <button type="button" title={stat.hint} className="h-full w-full rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2.5 text-left transition hover:bg-[color:var(--c-bg-ffeee7)]" onClick={() => setDrill({ type: "strip", id: stat.id })}>
                      <span className="block text-xs leading-4 text-slate-500">{stat.label}</span>
                      <span className="mt-1 block text-lg font-semibold text-[color:var(--c-text-461220)] tabular-nums">{stat.displayValue}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-slate-500">{overview.notes.counting} {overview.notes.payments}</p>
            </div>
          </section>

          <Section id="ksu-registration" title="Worker registration and occupations" description="Who is registered with the Board. Workers are counted once. Select a bar, or use View breakdown, for the figures behind a chart.">
            <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
              <GigChart
                title="Registrations by month"
                subtitle="Bars show new registrations received each month. The line shows valid registered workers at each month end."
                option={charts.registration}
                ariaLabel={describeSeries("New registrations by month", overview.registration.months, overview.registration.newRegistrations, "count")}
                notAffectedBy={overview.registration.notAffectedBy}
                onPoint={monthPick("registration")}
              />
              <GigChart
                title="Workers by occupation"
                subtitle={`Valid registered workers on ${overview.asOfLabel}.`}
                option={charts.occupation}
                height={rowsHeight(overview.demographics.occupations.length, 30)}
                ariaLabel={describeSeries("Registered workers by occupation", overview.demographics.occupations.map((row) => row.name), overview.demographics.occupations.map((row) => row.value), "count")}
                notAffectedBy={overview.demographics.notAffectedBy.demographics}
                empty={overview.demographics.total === 0 ? "No registered workers in the selected scope." : undefined}
                onPoint={pick("occupation", "occupationId", (point) => KSU_OCCUPATIONS.find((item) => item.name === point.category)?.id)}
                footer={<p className="mt-2 text-xs leading-5 text-slate-500">Occupation categories are a sample master until the Board supplies its notified list.</p>}
              />
            </div>
            <MoreCharts id="ksu-more-1" count={4}>
              <GigChart
                title="Workers by gender"
                option={charts.gender}
                height={220}
                ariaLabel={describeSeries("Registered workers by gender", overview.demographics.genders.map((row) => row.name), overview.demographics.genders.map((row) => row.value), "count")}
                notAffectedBy={overview.demographics.notAffectedBy.demographics}
                empty={overview.demographics.total === 0 ? "No registered workers in the selected scope." : undefined}
                onPoint={pick("gender", "gender", (point) => KSU_GENDERS.find((item) => item.name === point.category)?.id)}
              />
              <GigChart
                title="Workers by age group"
                option={charts.age}
                height={260}
                ariaLabel={describeSeries("Registered workers by age group", overview.demographics.ages.map((row) => row.name), overview.demographics.ages.map((row) => row.value), "count")}
                notAffectedBy={overview.demographics.notAffectedBy.demographics}
                empty={overview.demographics.total === 0 ? "No registered workers in the selected scope." : undefined}
                onPoint={pick("age", "ageGroup", (point) => KSU_AGE_GROUPS.find((item) => item.name === point.category)?.id)}
              />
              <GigChart
                title="Registration status"
                subtitle={`All workers registered up to ${overview.asOfLabel}, by where their registration stands.`}
                option={charts.status}
                height={260}
                ariaLabel={describeSeries("Workers by registration status", overview.demographics.statuses.map((row) => row.name), overview.demographics.statuses.map((row) => row.value), "count")}
                notAffectedBy={overview.demographics.notAffectedBy.status}
                onPoint={pick("status", "registrationStatus", (point) => KSU_REG_STATUSES.find((item) => item.name === point.category)?.id)}
              />
              <GigChart
                title="Rural and urban workers"
                subtitle="Sample classification of each worker's district. It must be validated before it is relied on."
                option={charts.settlement}
                height={200}
                ariaLabel={describeSeries("Registered workers by rural or urban class", overview.demographics.settlement.map((row) => row.name), overview.demographics.settlement.map((row) => row.value), "count")}
                notAffectedBy={overview.demographics.notAffectedBy.demographics}
                empty={overview.demographics.total === 0 ? "No registered workers in the selected scope." : undefined}
                onPoint={pick("settlement", null, () => undefined)}
              />
            </MoreCharts>
          </Section>

          <Section id="ksu-schemes" title="Scheme performance and the claims funnel" description="Each scheme is shown with its operational status label. No scheme is presented as open for applications until the Board confirms it. Enrolments can overlap between schemes, so they are not unique workers.">
            <div className={`${card} p-4 sm:p-5`}>
              <h3 className={heading}>Schemes</h3>
              <p className="mt-1 mb-3 text-sm leading-6 text-slate-600">
                {overview.schemes.enrolmentTotal === overview.schemes.uniqueEnrolled
                  ? `${formatCount(overview.schemes.enrolmentTotal)} enrolments, belonging to ${formatCount(overview.schemes.uniqueEnrolled)} unique workers.`
                  : `${formatCount(overview.schemes.enrolmentTotal)} enrolments belong to ${formatCount(overview.schemes.uniqueEnrolled)} unique workers, because a worker can be enrolled in more than one scheme.`}{" "}
                {overview.schemes.otherSchemesNote}
              </p>
              <KsuTable caption="Scheme performance" columns={schemeColumns} rows={overview.schemes.rows} rowKey={(row) => row.id} initialSort={{ key: "enrolments", direction: "desc" }} minWidth={900} />
            </div>
            <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
              <GigChart
                title="Scheme enrolments"
                subtitle="Active enrolments on the last day. Select a bar to filter by scheme. Sahaya Hasta is the Ambedkar Karmika Sahaya Hasta Scheme."
                option={charts.enrolments}
                height={220}
                ariaLabel={describeSeries("Scheme enrolments", overview.schemes.rows.map((row) => row.name), overview.schemes.rows.map((row) => row.enrolments), "count")}
                notAffectedBy={overview.schemes.notAffectedBy.enrolments}
                onPoint={pick("scheme", "schemeId", (point) => overview.schemes.rows[point.index ?? -1]?.id)}
              />
              <GigChart
                title="Cases, approvals and beneficiaries by scheme"
                option={charts.schemeCases}
                ariaLabel={describeSeries("Cases received by scheme", overview.schemes.rows.map((row) => row.name), overview.schemes.rows.map((row) => row.received), "count")}
                notAffectedBy={overview.schemes.notAffectedBy.claims}
                onPoint={pick("scheme", "schemeId", (point) => overview.schemes.rows[point.index ?? -1]?.id)}
                footer={<p className="mt-2 text-xs leading-5 text-slate-500">Beneficiaries are distinct workers per scheme. A worker approved under two schemes appears under both.</p>}
              />
            </div>
            <MoreCharts id="ksu-more-2" count={4}>
              <GigChart
                title="Applications and claims funnel"
                subtitle="How cases received in the period have moved on, as at the last day."
                option={charts.funnel}
                height={240}
                ariaLabel={describeSeries("Applications and claims funnel", overview.schemes.funnel.map((row) => row.label), overview.schemes.funnel.map((row) => row.value), "count")}
                notAffectedBy={overview.schemes.notAffectedBy.claims}
                onPoint={pick("funnel", null, () => undefined)}
                footer={<p className="mt-2 text-xs leading-5 text-slate-500">Payment initiated is not payment received. Only the last bar counts as disbursed.</p>}
              />
              <GigChart
                title="Cases by status"
                subtitle="Cases received in the period, by where they stand on the last day. They add up to the cases received."
                option={charts.pipeline}
                height={rowsHeight(overview.schemes.pipeline.length, 34, 80)}
                ariaLabel={describeSeries("Cases by status", overview.schemes.pipeline.map((row) => row.label), overview.schemes.pipeline.map((row) => row.value), "count")}
                notAffectedBy={overview.schemes.notAffectedBy.claims}
                onPoint={pick("pipeline", "claimStatus", (point) => KSU_CLAIM_STAGES.find((item) => item.name === point.category)?.id)}
              />
              <GigChart
                title="Approved and disbursed amounts by scheme"
                subtitle="Approval is a decision and disbursement is a payment. They are summed separately, on different dates."
                option={charts.schemeAmounts}
                ariaLabel={describeSeries("Disbursed amount by scheme", overview.schemes.rows.map((row) => row.name), overview.schemes.rows.map((row) => row.disbursedAmount), "inr")}
                notAffectedBy={overview.schemes.notAffectedBy.claims}
                onPoint={pick("scheme", "schemeId", (point) => overview.schemes.rows[point.index ?? -1]?.id)}
              />
              <GigChart
                title="Beneficiaries by month"
                subtitle="Distinct workers approved each month, by scheme."
                option={charts.trend}
                ariaLabel={describeSeries("Beneficiaries by month", overview.schemes.beneficiaryTrend.months, overview.schemes.beneficiaryTrend.months.map((_, index) => overview.schemes.beneficiaryTrend.series.reduce((total, item) => total + item.values[index], 0)), "count")}
                notAffectedBy={overview.schemes.notAffectedBy.claims}
                onPoint={monthPick("beneficiaryTrend")}
              />
            </MoreCharts>
          </Section>
      </>
    )
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-6">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the KSUWSSB dashboard."}
      </p>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" className="font-semibold underline" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        </div>
      ) : null}

      {!base && !error ? <Skeleton /> : null}

      {base && baseCharts ? (
        <div className="space-y-8">
          <ScopeBand as="h1" kicker="Karnataka State Unorganised Workers' Social Security Board" title="Executive Overview" note={`${base.periodLabel} · ${base.scopeLabel}. These cards and charts cover the full scope and do not change with the filters further down.`}>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="rounded-full bg-[color:var(--c-bg-ffe9e0)] px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] ring-1 ring-[color:var(--c-border-fed0bb)] ring-inset">Illustrative POC Data</span>
              <span className="text-sm text-slate-600">Data as of {base.asOfLabel}</span>
              <span className="text-xs text-slate-500">Reporting date {base.reportingDate} · Last refreshed {base.lastRefreshed}</span>
            </div>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a className={linkButton} href="#ksu-priority">Items needing attention ({(overview ?? base).priority.length})</a>
              <a className={linkButton} href="#ksu-definitions">Help and definitions</a>
              <button type="button" className={linkButton} onClick={() => downloadKsuSummary(overview ?? base)}>Export summary (CSV)</button>
            </p>
          </ScopeBand>
          {staleSources.length > 0 ? (
            <p className="rounded-2xl border border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-ffe9e0)] px-4 py-3 text-sm leading-6 text-[color:var(--c-text-8c2f39)]">
              {staleSources.map((source) => source.name).join(", ")} {staleSources.length === 1 ? "has" : "have"} not been updated within the expected interval, so figures that depend on {staleSources.length === 1 ? "it" : "them"} may be out of date. See the data sources at the end of this page.
            </p>
          ) : null}

          {overviewBlock(base, baseCharts)}
        </div>
      ) : null}

      <ScopeBand id="ksu-filters" kicker="Filters" title="Filter the records" note="Choose a period, district, scheme or occupation. The figures, district map, claims, finance, facilitation and attention tables below follow your choice." />
      <section className={`${card} px-5 py-4`}>
        <div>
          {options ? <KsuFiltersBar options={options} value={filters} onApply={applyFilters} onReset={resetFilters} /> : <p className="text-sm text-slate-500">Loading filters.</p>}
          {overview && overview.activeFilters.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
              {overview.activeFilters.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 py-1 text-sm text-[color:var(--c-text-461220)]"
                    aria-label={`Remove filter ${item.label}: ${item.value}`}
                    onClick={() => applyFilters({ ...filters, [item.key]: "all" })}
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
        <div className={updating ? "space-y-8 opacity-70 transition-opacity" : "space-y-8 transition-opacity"} aria-busy={updating}>
          {overview.empty ? (
            <div className={`${card} px-5 py-6`}>
              <h2 className={heading}>No records match these filters</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Widen the dates or remove a filter to see figures again. For example, a scheme and a benefit type that do not belong together give no results.</p>
              <button type="button" className="mt-3 rounded-lg bg-[color:var(--c-bg-461220)] px-4 py-2 text-sm font-semibold text-white" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          ) : null}

          <FilterSummary scope={overview.scopeLabel} updating={updating} items={overview.kpis.map((item) => ({ label: item.label, value: item.displayValue }))} />


          <Section id="ksu-districts" title="District intelligence" description="District is the lowest level shown on this view. Worker identities are never shown. Coverage compares valid registrations with an illustrative baseline and is indicative only.">
            <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <KsuMap districts={overview.districts} selectedId={filters.districtId} metric={metric} note={overview.notes.classification} onMetric={setMetric} onSelect={selectDistrict} />
              <div className="grid min-w-0 gap-4">
                <GigChart
                  title="Cases by district"
                  subtitle="Ten districts with the most cases received in the period."
                  option={charts.districtClaims}
                  height={rowsHeight(charts.districtClaimRows, 40, 100)}
                  ariaLabel={describeSeries("Cases received by district", overview.districtRows.map((row) => row.name), overview.districtRows.map((row) => row.received), "count")}
                  notAffectedBy={overview.claims.notAffectedBy}
                  empty={charts.districtClaimRows === 0 ? "No cases in the selected scope." : undefined}
                  onPoint={pick("districtClaims", "districtId", (point) => KSU_DISTRICTS.find((item) => item.name === point.category)?.id)}
                />
                <GigChart
                  title="Benefits disbursed by district"
                  subtitle="Successful payments only. Ten districts with the highest value."
                  option={charts.districtPaid}
                  height={rowsHeight(charts.districtPaidRows, 30, 90)}
                  ariaLabel={describeSeries("Benefits disbursed by district", overview.districtRows.map((row) => row.name), overview.districtRows.map((row) => row.disbursed), "inr")}
                  notAffectedBy={overview.claims.notAffectedBy}
                  empty={charts.districtPaidRows === 0 ? "No payments in the selected scope." : undefined}
                  onPoint={pick("districtDisbursed", "districtId", (point) => KSU_DISTRICTS.find((item) => item.name === point.category)?.id)}
                />
              </div>
            </div>
            <div className={`${card} p-4 sm:p-5`}>
              <h3 className={heading}>Districts, lowest coverage first</h3>
              <p className="mt-1 mb-3 text-sm leading-6 text-slate-600">
                Sort any column. e-Shram registrations are an external reference and are not part of any KSUWSSB figure. {overview.eshram.note}
              </p>
              <KsuTable
                caption="Districts by coverage"
                columns={districtColumns}
                rows={filters.districtId === "all" ? overview.districtRows : overview.districtRows.filter((row) => row.id === filters.districtId)}
                rowKey={(row) => row.id}
                initialSort={{ key: "coverage", direction: "asc" }}
                minWidth={980}
              />
            </div>
          </Section>


          <Section id="ksu-benefits" title="Applications, claims and benefits" description="Where cases wait, how long decisions take, why cases are returned, and approved benefits that have not yet been paid. Wording is neutral: a long wait means the case needs review, not that anyone is at fault.">
            <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
              <GigChart
                title="Cases by benefit type"
                subtitle="Cases received in the period."
                option={charts.benefit}
                height={rowsHeight(overview.claims.byBenefit.length, 36, 80)}
                ariaLabel={describeSeries("Cases by benefit type", overview.claims.byBenefit.map((row) => row.name), overview.claims.byBenefit.map((row) => row.value), "count")}
                notAffectedBy={overview.claims.notAffectedBy}
                onPoint={pick("benefit", "benefitType", (point) => KSU_BENEFITS.find((_, index) => benefitLabel(index) === point.category)?.id)}
                footer={<p className="mt-2 text-xs leading-5 text-slate-500">Benefit types and their amounts are placeholders, not notified rates.</p>}
              />
              <GigChart
                title="Pending cases by age"
                subtitle="Cases waiting on the last day, by days since receipt."
                option={charts.pendingAge}
                ariaLabel={describeSeries("Pending cases by age", overview.claims.pendingAge.buckets, overview.claims.pendingAge.verification.map((value, index) => value + overview.claims.pendingAge.returned[index]), "count")}
                notAffectedBy={overview.claims.notAffectedBy}
                onPoint={pick("pendingAge", null, () => undefined)}
                footer={<p className="mt-2 text-xs leading-5 text-slate-500">{formatCount(overview.claims.pendingAge.total)} pending in all. The service target of {overview.priorityTarget} days is a POC placeholder.</p>}
              />
            </div>
            <MoreCharts id="ksu-more-3" count={4}>
              <GigChart
                title="Processing time by scheme"
                subtitle="Days from receipt to decision, for cases decided in the period."
                option={charts.processing}
                ariaLabel={describeSeries("Average processing days by scheme", overview.claims.processing.rows.map((row) => row.name), overview.claims.processing.rows.map((row) => row.avg ?? 0), "count")}
                notAffectedBy={overview.claims.notAffectedBy}
                empty={overview.claims.processing.decided === 0 ? "No decisions in the selected scope." : undefined}
                onPoint={pick("processing", null, () => undefined)}
                footer={
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <Stat label="Cases decided" value={formatCount(overview.claims.processing.decided)} />
                    <Stat label="Average days" value={overview.claims.processing.avg === null ? "n/a" : String(overview.claims.processing.avg)} />
                    <Stat label="Median days" value={overview.claims.processing.median === null ? "n/a" : String(overview.claims.processing.median)} />
                  </dl>
                }
              />
              <GigChart
                title="Return and rejection reasons"
                subtitle="Recorded when a case was returned or rejected in the period. The reasons are a sample list."
                option={charts.reasons}
                height={rowsHeight(overview.claims.reasons.length, 36, 80)}
                ariaLabel={describeSeries("Return and rejection reasons", overview.claims.reasons.map((row) => row.name), overview.claims.reasons.map((row) => row.value), "count")}
                notAffectedBy={overview.claims.notAffectedBy}
                empty={overview.claims.reasons.every((row) => row.value === 0) ? "No returned or rejected cases in the selected scope." : undefined}
                onPoint={pick("reasons", null, () => undefined)}
              />
              <GigChart
                title="Approved, not yet paid, by age"
                subtitle="Approved cases without a successful payment, by days since approval. The line shows their value."
                option={charts.unpaid}
                ariaLabel={describeSeries("Approved cases not yet paid, by age", overview.claims.unpaidAge.buckets, overview.claims.unpaidAge.counts, "count")}
                notAffectedBy={overview.claims.notAffectedBy}
                onPoint={pick("unpaidAge", null, () => undefined)}
                footer={<p className="mt-2 text-xs leading-5 text-slate-500">{formatCount(overview.claims.unpaidAge.totalCount)} cases worth {moneyShort(overview.claims.unpaidAge.totalAmount)}. This includes payments not yet initiated, initiated but unconfirmed, and failed or returned.</p>}
              />
              <GigChart
                title="Successful payments by month"
                subtitle="Payments that completed successfully. The line shows how many."
                option={charts.payments}
                ariaLabel={describeSeries("Successful payments by month", overview.claims.payments.months, overview.claims.payments.amount, "inr")}
                notAffectedBy={overview.claims.notAffectedBy}
                onPoint={monthPick("payments")}
              />
            </MoreCharts>
          </Section>

          <Section id="ksu-finance" title="Financial summary" description="Allocation, release, approval, expenditure and disbursement are different stages. They are shown side by side and never netted. No fund balance is shown because the ledger is incomplete.">
            <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
              <GigChart
                title={`Financial year to date: ${overview.finance.yearLabel}`}
                subtitle={`As at ${overview.finance.asOf}. Select a scheme bar to filter by scheme.`}
                option={charts.finance}
                ariaLabel={describeSeries("Expenditure by scheme", overview.finance.rows.map((row) => row.name), overview.finance.rows.map((row) => row.expenditure), "inr")}
                notAffectedBy={overview.finance.notAffectedBy}
                onPoint={pick("finance", "schemeId", (point) => overview.finance.rows[point.index ?? -1]?.id)}
                footer={
                  <div className="mt-3 space-y-2">
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <Stat label="Allocation" value={moneyShort(overview.finance.totals.allocation)} />
                      <Stat label="Funds released" value={moneyShort(overview.finance.totals.released)} />
                      <Stat label="Benefits approved" value={moneyShort(overview.finance.totals.approved)} />
                      <Stat label="Benefits disbursed" value={moneyShort(overview.finance.totals.disbursed)} />
                      <Stat label="Expenditure" value={moneyShort(overview.finance.totals.expenditure)} />
                      <Stat label="Utilisation of allocation" value={overview.finance.totals.utilisation === null ? "n/a" : `${overview.finance.totals.utilisation}%`} />
                    </dl>
                    <p className="text-xs leading-5 text-slate-500">{overview.finance.note}</p>
                  </div>
                }
              />
              <GigChart
                title="Financial year trend"
                subtitle="Approved, disbursed and expenditure by financial year. The latest year covers part of the year."
                option={charts.financeTrend}
                ariaLabel={describeSeries("Benefits disbursed by financial year", overview.finance.trend.map((row) => row.label), overview.finance.trend.map((row) => row.disbursed), "inr")}
                notAffectedBy={overview.finance.notAffectedBy}
                onPoint={pick("financeTrend", null, () => undefined)}
              />
            </div>
          </Section>

          <Section id="ksu-facilitation" title="Karmika Seva Kendra and facilitation" description="Facilitation activity recorded at the Karmika Seva Kendra. Grievances and outreach are not shown, because no validated source exists for them yet.">
            <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
              <GigChart
                title="Services by month"
                subtitle="Registration support plus other services delivered."
                option={charts.facilitation}
                ariaLabel={describeSeries("Facilitation services by month", overview.facilitation.months, overview.facilitation.services, "count")}
                notAffectedBy={overview.facilitation.notAffectedBy}
                onPoint={monthPick("facilitation")}
                footer={
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <Stat label="Total services" value={formatCount(overview.facilitation.totals.services)} />
                    <Stat label="Registrations supported" value={formatCount(overview.facilitation.totals.facilitated)} />
                    <Stat label="Districts served" value={formatCount(overview.facilitation.totals.districtsServed)} />
                  </dl>
                }
              />
              <GigChart
                title="Services by district"
                subtitle="Ten districts with the most services."
                option={charts.facilitationDistricts}
                height={rowsHeight(Math.min(10, overview.facilitation.districts.filter((row) => row.value > 0).length), 30, 80)}
                ariaLabel={describeSeries("Facilitation services by district", overview.facilitation.districts.map((row) => row.name), overview.facilitation.districts.map((row) => row.value), "count")}
                notAffectedBy={overview.facilitation.notAffectedBy}
                empty={overview.facilitation.totals.services === 0 ? "No services in the selected scope." : undefined}
                onPoint={pick("facilitationDistricts", "districtId", (point) => KSU_DISTRICTS.find((item) => item.name === point.category)?.id)}
              />
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {overview.facilitation.unavailable.map((item) => (
                <li key={item.title} className={`${card} border-dashed p-4`}>
                  <h3 className="text-base font-semibold text-[color:var(--c-text-461220)]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.reason}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="ksu-priority" title="Items needing attention" description={`Districts and schemes where cases have waited beyond the ${overview.priorityTarget}-day service target, or where approved cases have not yet been paid. They are listed for review. The target is a POC placeholder.`}>
            <div className={`${card} p-4 sm:p-5`}>
              <KsuTable
                caption="Items needing attention"
                columns={priorityColumns}
                rows={overview.priority}
                rowKey={(row) => row.key}
                initialSort={{ key: "oldest", direction: "desc" }}
                minWidth={1040}
                empty="No items need attention for the selected filters."
                onClear={overview.activeFilters.length > 0 ? resetFilters : undefined}
              />
            </div>
          </Section>

          <Section id="ksu-provenance" title="Provenance" description="Published figures and synthetic figures are kept apart. Nothing in the published strip is part of a dashboard figure.">
            <div className={`${card} p-4 sm:p-5`} aria-labelledby="ksu-published">
              <h3 id="ksu-published" className={heading}>Published reference figures</h3>
              <p className="mt-1 text-sm text-slate-500">Source: {overview.published.source}, {overview.published.period}.</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {overview.published.items.map((item) => <Stat key={item.id} label={item.label} value={item.value} />)}
              </dl>
              <p className="mt-3 text-sm leading-6 text-slate-600">{overview.published.caution}</p>
            </div>

            <div className={`${card} p-4 sm:p-5`} aria-labelledby="ksu-sources">
              <h3 id="ksu-sources" className={heading}>Data sources and freshness</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {overview.source}. Source custodians and refresh schedules are to be confirmed with the Board. Each source is checked against how often it is expected to update.
              </p>
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
              <p className="mt-3 text-xs leading-5 text-slate-500">Access and audit: this POC has no sign-in. A live build would restrict this executive view to aggregated data by role and log access to every drill-down.</p>
            </div>
          </Section>

          <section id="ksu-definitions" aria-labelledby="ksu-definitions-title" className={`${card} p-4 sm:p-5`}>
            <h2 id="ksu-definitions-title" className={heading}>How the figures are defined</h2>
            <ul className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
              {[overview.notes.counting, overview.notes.payments, overview.notes.period, overview.notes.classification].map((note) => <li key={note} className="rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2">{note}</li>)}
            </ul>
            <h3 className="mt-5 text-base font-semibold text-[color:var(--c-text-461220)]">Every figure and chart</h3>
            <div className="mt-2 divide-y divide-[color:var(--c-border-ffeae1)] rounded-xl border border-[color:var(--c-border-ffeae1)]">
              {overview.definitions.map((definition) => (
                <details key={definition.code} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[color:var(--c-text-461220)]">
                    <span>{definition.name} <span className="font-normal text-slate-500">({definition.code}, {definition.kind})</span></span>
                    <span aria-hidden="true" className="text-[color:var(--c-text-8c2f39)] group-open:rotate-45">+</span>
                  </summary>
                  <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
                    {([
                      ["Definition", definition.definition],
                      ["Calculation", definition.calculation],
                      ["Date basis", definition.dateBasis],
                      ["Filters", definition.filters],
                      ["Sources", definition.sources.map((id) => overview.sources.find((source) => source.id === id)?.name ?? id).join(", ")],
                      ["Exclusions", definition.exclusions],
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
            <h3 className="mt-5 text-base font-semibold text-[color:var(--c-text-461220)]">Illustrative datasets behind the dashboard</h3>
            <div className="mt-2 divide-y divide-[color:var(--c-border-ffeae1)] rounded-xl border border-[color:var(--c-border-ffeae1)]">
              {overview.datasets.map((dataset) => (
                <details key={dataset.id} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[color:var(--c-text-461220)]">
                    <span>{dataset.name}</span>
                    <span aria-hidden="true" className="text-[color:var(--c-text-8c2f39)] group-open:rotate-45">+</span>
                  </summary>
                  <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
                    {([
                      ["Grain", dataset.grain],
                      ["Fields", dataset.fields],
                      ["Rows", dataset.rows],
                      ["Notes", dataset.notes],
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
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Filters that do not apply to a chart are named under it. Live systems are not connected. The dashboard reads a fixed synthetic extract, and live integration will start only after this layout and its interactions are reviewed and approved.
            </p>
          </section>
        </div>
      ) : null}

      {drill ? (
        <KsuDrawer
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
