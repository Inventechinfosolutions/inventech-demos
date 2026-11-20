import { useEffect, useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { ScopeBand } from "@/components/dashboard/ScopeBand"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { GigChart } from "@/components/gig/GigChart"
import { describeSeries, payoutOption, registrationOption as gigRegistrationOption } from "@/components/gig/gigChartOptions"
import { pendingAgeOption, registrationOption as ksuRegistrationOption } from "@/components/ksu/ksuChartOptions"
import type { ChartModel } from "@/types/dashboard"
import { DEFAULT_FACTORIES_FILTERS } from "@/lib/factoriesQuery"
import { DEFAULT_GIG_FILTERS } from "@/lib/gigQuery"
import { DEFAULT_KSU_FILTERS } from "@/lib/ksuQuery"
import { DEFAULT_LABOUR_FILTERS } from "@/lib/labourQuery"
import { DEFAULT_WELFARE_FILTERS } from "@/lib/welfareQuery"
import { getFactoriesOverview } from "@/services/factoriesService"
import { getGigOverview } from "@/services/gigService"
import { getKsuOverview } from "@/services/ksuService"
import { getLabourOverview } from "@/services/labourService"
import { getWelfareOverview } from "@/services/welfareService"

interface Stat {
  label: string
  value: string
  /** What the figure counts. */
  hint?: string
  /** Change against the board's own comparison period, where the dashboard gives one. */
  change?: string
}

interface Attention {
  title: string
  detail: string
  level?: "high" | "medium" | "low"
}

/** One board or office, reduced to the same pieces so that all five read alike. */
interface Summary {
  id: string
  name: string
  to: string
  scope: string
  refreshed: string
  /** Data sources that are up to date, for boards that report them. */
  sources?: string
  stats: Stat[]
  extraTitle: string
  extra: Stat[]
  attention: Attention[]
  attentionTotal: number
  attentionNote: string
  charts: ((go: () => void) => ReactNode)[]
  /** How the board's own figures are counted, so they are not misread. */
  notes: string[]
}

const SHOWN_ITEMS = 3
// Compact board sections: every chart on this page is this tall, so five boards fit on a screen or two.
const CHART_HEIGHT = 200
const compactChart = (chart: ChartModel): ChartModel => ({ ...chart, height: CHART_HEIGHT })

interface KpiLike {
  id: string
  label: string
  displayValue: string
  hint?: string
  basis?: string
  comparison?: { label: string; change: number | null } | null
}

function formatChange(comparison: KpiLike["comparison"]): string | undefined {
  if (!comparison || comparison.change === null || comparison.change === undefined) return undefined
  const value = comparison.change
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${Math.abs(value).toFixed(1)}% against ${comparison.label}`
}

/** Every card the board's dashboard shows in its overview, in the same order. */
function allStats(kpis: KpiLike[]): Stat[] {
  return kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.displayValue,
    hint: kpi.hint ?? kpi.basis,
    change: formatChange(kpi.comparison),
  }))
}

function sourceSummary(sources: { status: string }[]): string {
  const current = sources.filter((source) => source.status === "current").length
  return `${current} of ${sources.length} data sources up to date`
}

async function loadSummaries(): Promise<Summary[]> {
  const [labour, welfare, factories, gig, ksu] = await Promise.all([
    getLabourOverview(DEFAULT_LABOUR_FILTERS),
    getWelfareOverview(DEFAULT_WELFARE_FILTERS),
    getFactoriesOverview(DEFAULT_FACTORIES_FILTERS),
    getGigOverview(DEFAULT_GIG_FILTERS),
    getKsuOverview(DEFAULT_KSU_FILTERS),
  ])

  const labourCharts = ["cess-monthly", "inspection-status"].flatMap((id) => labour.charts.find((chart) => chart.id === id) ?? []).map(compactChart)
  const welfareCharts = ["scheme-money", "membership"].flatMap((id) => welfare.charts.find((chart) => chart.id === id) ?? []).map(compactChart)
  const factoriesCharts = [factories.charts.trend, factories.charts.accidentTrend].flatMap((chart) => chart ?? []).map(compactChart)

  return [
    {
      id: "labour",
      name: "Labour Commissionerate",
      to: "/departments/labour-commissionerate",
      scope: labour.scopeLabel,
      refreshed: labour.lastRefreshed,
      stats: allStats(labour.kpis),
      extraTitle: "",
      extra: [],
      attention: labour.queue.slice(0, SHOWN_ITEMS).map((item) => ({ title: item.title, detail: `${item.countLabel} · ${item.source}`, level: item.severity })),
      attentionTotal: labour.queue.length,
      attentionNote: "items to review",
      charts: labourCharts.map((chart) => (go) => <ChartCard key={chart.id} chart={chart} onSelect={go} />),
      notes: [labour.separationNote],
    },
    {
      id: "welfare",
      name: "KBOCW Welfare Board",
      to: "/departments/kbocw-welfare-board",
      scope: welfare.scopeLabel,
      refreshed: welfare.lastRefreshed,
      stats: allStats(welfare.kpis),
      extraTitle: "Fund position",
      extra: [
        { label: "Available funds", value: welfare.finance.available },
        { label: "Allocated to schemes", value: welfare.finance.allocated },
        { label: "Remaining balance", value: welfare.finance.remaining },
      ],
      attention: welfare.actions.slice(0, SHOWN_ITEMS).map((item) => ({ title: item.title, detail: `${item.countLabel} · ${item.source}`, level: item.severity })),
      attentionTotal: welfare.actions.length,
      attentionNote: "items needing action",
      charts: welfareCharts.map((chart) => (go) => <ChartCard key={chart.id} chart={chart} onSelect={go} />),
      notes: [welfare.separationNote, welfare.finance.definition],
    },
    {
      id: "factories",
      name: "Factories & Boilers",
      to: "/departments/factories-boilers",
      scope: factories.scopeLabel,
      refreshed: factories.lastRefreshed,
      stats: allStats(factories.kpis),
      extraTitle: "To follow up",
      extra: factories.watch.map((item) => ({ label: item.label, value: item.displayValue, hint: item.note })),
      attention: factories.exceptions
        .slice(0, SHOWN_ITEMS)
        .map((item) => ({ title: item.title, detail: `${item.countLabel} · ${item.district}`, level: item.priority })),
      attentionTotal: factories.exceptions.length,
      attentionNote: "items for review",
      charts: factoriesCharts.map((chart) => (go) => <ChartCard key={chart.id} chart={chart} onSelect={go} />),
      notes: [factories.separationNote, factories.establishmentNote],
    },
    {
      id: "gig",
      name: "Gig Workers Welfare Board",
      to: "/departments/gig-workers-welfare-board",
      scope: `${gig.periodLabel} · ${gig.scopeLabel}`,
      refreshed: gig.lastRefreshed,
      sources: sourceSummary(gig.sources),
      stats: allStats(gig.kpis),
      extraTitle: "Supporting figures",
      extra: gig.strip.map((item) => ({ label: item.label, value: item.displayValue, hint: item.hint })),
      attention: gig.exceptions.slice(0, SHOWN_ITEMS).map((item) => ({ title: item.category, detail: `${item.scope} · ${item.measure}`, level: item.priority })),
      attentionTotal: gig.exceptionCount,
      attentionNote: "items needing follow-up",
      charts: [
        (go) => (
          <GigChart
            key="registration"
            height={CHART_HEIGHT}
            title="Records received by month"
            subtitle="Records are not unique workers. The line shows workers newly registered with the Board each month."
            option={gigRegistrationOption(gig.registration)}
            ariaLabel={describeSeries("Records received by month", gig.registration.months, gig.registration.records, "count")}
            onPoint={go}
          />
        ),
        (go) => (
          <GigChart
            key="payout"
            height={CHART_HEIGHT}
            title="Worker payouts by month"
            subtitle="Payouts reported by aggregators."
            option={payoutOption(gig.payout)}
            ariaLabel={describeSeries("Worker payouts by month", gig.payout.months, gig.payout.payout, "inr")}
            onPoint={go}
          />
        ),
      ],
      notes: gig.kpis.flatMap((kpi) => (kpi.id === "records" || kpi.id === "unique" ? [kpi.definition] : [])),
    },
    {
      id: "ksu",
      name: "Unorganised Workers Social Security Board",
      to: "/departments/ksuwssb",
      scope: `${ksu.periodLabel} · ${ksu.scopeLabel}`,
      refreshed: ksu.lastRefreshed,
      sources: sourceSummary(ksu.sources),
      stats: allStats(ksu.kpis),
      extraTitle: "Supporting figures",
      extra: ksu.strip.map((item) => ({ label: item.label, value: item.displayValue, hint: item.hint })),
      attention: ksu.priority.slice(0, SHOWN_ITEMS).map((row) => ({
        title: `${row.district} · ${row.scheme}`,
        detail: `${row.pending} pending, oldest ${row.oldestAge} days${row.approvedUnpaid > 0 ? `, ${row.approvedUnpaid} approved but not yet paid` : ""}`,
      })),
      attentionTotal: ksu.priority.length,
      attentionNote: "district and scheme combinations with pending claims",
      charts: [
        (go) => (
          <GigChart
            key="registration"
            height={CHART_HEIGHT}
            title="Registrations by month"
            subtitle="Bars show new registrations each month. The line shows valid registered workers at each month end."
            option={ksuRegistrationOption(ksu.registration)}
            ariaLabel={describeSeries("New registrations by month", ksu.registration.months, ksu.registration.newRegistrations, "count")}
            onPoint={go}
          />
        ),
        (go) => (
          <GigChart
            key="pending-age"
            height={CHART_HEIGHT}
            title="Pending cases by age"
            subtitle="Cases waiting on the last day, by days since receipt."
            option={pendingAgeOption(ksu.claims)}
            ariaLabel={describeSeries(
              "Pending cases by age",
              ksu.claims.pendingAge.buckets,
              ksu.claims.pendingAge.verification.map((value, index) => value + ksu.claims.pendingAge.returned[index]),
              "count",
            )}
            onPoint={go}
          />
        ),
      ],
      notes: [ksu.notes.counting, ksu.notes.payments],
    },
  ]
}

function StatTile({ stat, large = true }: { stat: Stat; large?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-[color:var(--c-border-fed9c8)] px-3 py-2" title={[stat.hint, stat.change].filter(Boolean).join(" · ") || undefined}>
      <dt className="truncate text-xs text-slate-600">{stat.label}</dt>
      <dd className={`font-semibold leading-tight text-[color:var(--c-text-461220)] ${large ? "text-lg" : "text-base"}`}>{stat.value}</dd>
      {stat.hint ? <p className="truncate text-[11px] leading-4 text-slate-500">{stat.hint}</p> : null}
      {stat.change ? <p className="truncate text-[11px] leading-4 text-slate-600">{stat.change}</p> : null}
    </div>
  )
}

function BoardSection({ summary }: { summary: Summary }) {
  const navigate = useNavigate()
  const go = () => navigate(summary.to)
  const notes = summary.notes.filter((note) => note.trim().length > 0)
  return (
    <section
      id={`secretary-${summary.id}`}
      aria-labelledby={`secretary-${summary.id}-title`}
      className="scroll-mt-24 space-y-3 rounded-xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3 shadow-[0_6px_20px_rgb(var(--c-shadow-rgb)/0.04)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h2 id={`secretary-${summary.id}-title`} className="text-base font-semibold text-[color:var(--c-text-461220)]">
            {summary.name}
          </h2>
          <p className="text-[13px] text-slate-600">
            {summary.scope} · Data refreshed {summary.refreshed}
            {summary.sources ? ` · ${summary.sources}` : ""}
          </p>
        </div>
        <Link
          to={summary.to}
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[color:var(--c-bg-461220)] px-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-text-8c2f39)]"
        >
          Open dashboard
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
        {summary.stats.map((stat) => (
          <StatTile key={stat.label} stat={stat} />
        ))}
      </dl>

      {summary.extra.length > 0 ? (
        <div>
          <h3 className="text-[13px] font-semibold text-[color:var(--c-text-461220)]">{summary.extraTitle}</h3>
          <dl className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {summary.extra.map((stat) => (
              <StatTile key={stat.label} stat={stat} large={false} />
            ))}
          </dl>
        </div>
      ) : null}

      <div className="grid items-stretch gap-3 lg:grid-cols-2">
        {summary.charts.map((chart, index) => (
          <div key={index} className="min-w-0 [&>section]:h-full">
            {chart(go)}
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-[color:var(--c-text-461220)]">
            {summary.attentionTotal} {summary.attentionNote}
          </h3>
          {summary.attention.length > 0 ? (
            <ul className="mt-2 divide-y divide-[color:var(--c-border-fed9c8)] rounded-xl border border-[color:var(--c-border-fed9c8)]">
              {summary.attention.map((item) => (
                <li key={`${item.title}-${item.detail}`} className="flex items-start justify-between gap-3 px-3 py-1.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-600">{item.detail}</p>
                  </div>
                  {item.level ? <StatusBadge value={item.level} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {summary.attentionTotal > summary.attention.length ? (
            <p className="mt-2 text-[13px] text-slate-600">
              Showing the first {summary.attention.length}.{" "}
              <Link to={summary.to} className="font-semibold text-[color:var(--c-text-8c2f39)] underline">
                See all on the dashboard
              </Link>
              .
            </p>
          ) : null}
        </div>
        {notes.length > 0 ? (
          <details className="min-w-0 text-[13px]">
            <summary className="cursor-pointer font-semibold text-[color:var(--c-text-461220)]">How these figures are counted</summary>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-5 text-slate-700">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  )
}

export function SecretaryDashboard() {
  const [summaries, setSummaries] = useState<Summary[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    loadSummaries()
      .then((items) => {
        if (active) setSummaries(items)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "The dashboard figures could not be loaded.")
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <ScopeBand
        as="h1"
        kicker="Labour Department · Secretary"
        title="Secretary Dashboard"
        note="One section for each board or office, taken from its own dashboard and shown for that dashboard's default period. The figures are not added together, because the boards count different things and a worker can be registered with more than one."
      />

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {!summaries && !error ? <p role="status" className="text-sm text-slate-600">Loading the five dashboards…</p> : null}

      {summaries ? (
        <>
          <nav aria-label="Items needing attention by board" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summaries.map((summary) => (
              <a
                key={summary.id}
                href={`#secretary-${summary.id}`}
                className="rounded-xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-text-8c2f39)]"
              >
                <span className="block text-[13px] text-slate-600">{summary.name}</span>
                <span className="mt-1 block text-xl font-semibold text-[color:var(--c-text-461220)]">{summary.attentionTotal}</span>
                <span className="block text-[13px] text-slate-600">{summary.attentionNote}</span>
              </a>
            ))}
          </nav>
          {summaries.map((summary) => (
            <BoardSection key={summary.id} summary={summary} />
          ))}
        </>
      ) : null}
    </div>
  )
}
