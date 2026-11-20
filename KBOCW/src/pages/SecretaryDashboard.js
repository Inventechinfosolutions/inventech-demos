import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ScopeBand } from "@/components/dashboard/ScopeBand";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { GigChart } from "@/components/gig/GigChart";
import { describeSeries, payoutOption, registrationOption as gigRegistrationOption } from "@/components/gig/gigChartOptions";
import { pendingAgeOption, registrationOption as ksuRegistrationOption } from "@/components/ksu/ksuChartOptions";
import { DEFAULT_FACTORIES_FILTERS } from "@/lib/factoriesQuery";
import { DEFAULT_GIG_FILTERS } from "@/lib/gigQuery";
import { DEFAULT_KSU_FILTERS } from "@/lib/ksuQuery";
import { DEFAULT_LABOUR_FILTERS } from "@/lib/labourQuery";
import { DEFAULT_WELFARE_FILTERS } from "@/lib/welfareQuery";
import { getFactoriesOverview } from "@/services/factoriesService";
import { getGigOverview } from "@/services/gigService";
import { getKsuOverview } from "@/services/ksuService";
import { getLabourOverview } from "@/services/labourService";
import { getWelfareOverview } from "@/services/welfareService";
const SHOWN_ITEMS = 3;
// Compact board sections: every chart on this page is this tall, so five boards fit on a screen or two.
const CHART_HEIGHT = 200;
const compactChart = (chart) => ({ ...chart, height: CHART_HEIGHT });
function formatChange(comparison) {
    if (!comparison || comparison.change === null || comparison.change === undefined)
        return undefined;
    const value = comparison.change;
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}${Math.abs(value).toFixed(1)}% against ${comparison.label}`;
}
/** Every card the board's dashboard shows in its overview, in the same order. */
function allStats(kpis) {
    return kpis.map((kpi) => ({
        label: kpi.label,
        value: kpi.displayValue,
        hint: kpi.hint ?? kpi.basis,
        change: formatChange(kpi.comparison),
    }));
}
function sourceSummary(sources) {
    const current = sources.filter((source) => source.status === "current").length;
    return `${current} of ${sources.length} data sources up to date`;
}
async function loadSummaries() {
    const [labour, welfare, factories, gig, ksu] = await Promise.all([
        getLabourOverview(DEFAULT_LABOUR_FILTERS),
        getWelfareOverview(DEFAULT_WELFARE_FILTERS),
        getFactoriesOverview(DEFAULT_FACTORIES_FILTERS),
        getGigOverview(DEFAULT_GIG_FILTERS),
        getKsuOverview(DEFAULT_KSU_FILTERS),
    ]);
    const labourCharts = ["cess-monthly", "inspection-status"].flatMap((id) => labour.charts.find((chart) => chart.id === id) ?? []).map(compactChart);
    const welfareCharts = ["scheme-money", "membership"].flatMap((id) => welfare.charts.find((chart) => chart.id === id) ?? []).map(compactChart);
    const factoriesCharts = [factories.charts.trend, factories.charts.accidentTrend].flatMap((chart) => chart ?? []).map(compactChart);
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
            charts: labourCharts.map((chart) => (go) => _jsx(ChartCard, { chart: chart, onSelect: go }, chart.id)),
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
            charts: welfareCharts.map((chart) => (go) => _jsx(ChartCard, { chart: chart, onSelect: go }, chart.id)),
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
            charts: factoriesCharts.map((chart) => (go) => _jsx(ChartCard, { chart: chart, onSelect: go }, chart.id)),
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
                (go) => (_jsx(GigChart, { height: CHART_HEIGHT, title: "Records received by month", subtitle: "Records are not unique workers. The line shows workers newly registered with the Board each month.", option: gigRegistrationOption(gig.registration), ariaLabel: describeSeries("Records received by month", gig.registration.months, gig.registration.records, "count"), onPoint: go }, "registration")),
                (go) => (_jsx(GigChart, { height: CHART_HEIGHT, title: "Worker payouts by month", subtitle: "Payouts reported by aggregators.", option: payoutOption(gig.payout), ariaLabel: describeSeries("Worker payouts by month", gig.payout.months, gig.payout.payout, "inr"), onPoint: go }, "payout")),
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
                (go) => (_jsx(GigChart, { height: CHART_HEIGHT, title: "Registrations by month", subtitle: "Bars show new registrations each month. The line shows valid registered workers at each month end.", option: ksuRegistrationOption(ksu.registration), ariaLabel: describeSeries("New registrations by month", ksu.registration.months, ksu.registration.newRegistrations, "count"), onPoint: go }, "registration")),
                (go) => (_jsx(GigChart, { height: CHART_HEIGHT, title: "Pending cases by age", subtitle: "Cases waiting on the last day, by days since receipt.", option: pendingAgeOption(ksu.claims), ariaLabel: describeSeries("Pending cases by age", ksu.claims.pendingAge.buckets, ksu.claims.pendingAge.verification.map((value, index) => value + ksu.claims.pendingAge.returned[index]), "count"), onPoint: go }, "pending-age")),
            ],
            notes: [ksu.notes.counting, ksu.notes.payments],
        },
    ];
}
function StatTile({ stat, large = true }) {
    return (_jsxs("div", { className: "min-w-0 rounded-lg border border-[color:var(--c-border-fed9c8)] px-3 py-2", title: [stat.hint, stat.change].filter(Boolean).join(" · ") || undefined, children: [_jsx("dt", { className: "truncate text-xs text-slate-600", children: stat.label }), _jsx("dd", { className: `font-semibold leading-tight text-[color:var(--c-text-461220)] ${large ? "text-lg" : "text-base"}`, children: stat.value }), stat.hint ? _jsx("p", { className: "truncate text-[11px] leading-4 text-slate-500", children: stat.hint }) : null, stat.change ? _jsx("p", { className: "truncate text-[11px] leading-4 text-slate-600", children: stat.change }) : null] }));
}
function BoardSection({ summary }) {
    const navigate = useNavigate();
    const go = () => navigate(summary.to);
    const notes = summary.notes.filter((note) => note.trim().length > 0);
    return (_jsxs("section", { id: `secretary-${summary.id}`, "aria-labelledby": `secretary-${summary.id}-title`, className: "scroll-mt-24 space-y-3 rounded-xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3 shadow-[0_6px_20px_rgb(var(--c-shadow-rgb)/0.04)]", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { id: `secretary-${summary.id}-title`, className: "text-base font-semibold text-[color:var(--c-text-461220)]", children: summary.name }), _jsxs("p", { className: "text-[13px] text-slate-600", children: [summary.scope, " \u00B7 Data refreshed ", summary.refreshed, summary.sources ? ` · ${summary.sources}` : ""] })] }), _jsx(Link, { to: summary.to, className: "inline-flex h-8 shrink-0 items-center rounded-lg bg-[color:var(--c-bg-461220)] px-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-text-8c2f39)]", children: "Open dashboard" })] }), _jsx("dl", { className: "grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4", children: summary.stats.map((stat) => (_jsx(StatTile, { stat: stat }, stat.label))) }), summary.extra.length > 0 ? (_jsxs("div", { children: [_jsx("h3", { className: "text-[13px] font-semibold text-[color:var(--c-text-461220)]", children: summary.extraTitle }), _jsx("dl", { className: "mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4", children: summary.extra.map((stat) => (_jsx(StatTile, { stat: stat, large: false }, stat.label))) })] })) : null, _jsx("div", { className: "grid items-stretch gap-3 lg:grid-cols-2", children: summary.charts.map((chart, index) => (_jsx("div", { className: "min-w-0 [&>section]:h-full", children: chart(go) }, index))) }), _jsxs("div", { className: "grid gap-3 lg:grid-cols-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("h3", { className: "text-[13px] font-semibold text-[color:var(--c-text-461220)]", children: [summary.attentionTotal, " ", summary.attentionNote] }), summary.attention.length > 0 ? (_jsx("ul", { className: "mt-2 divide-y divide-[color:var(--c-border-fed9c8)] rounded-xl border border-[color:var(--c-border-fed9c8)]", children: summary.attention.map((item) => (_jsxs("li", { className: "flex items-start justify-between gap-3 px-3 py-1.5", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[13px] font-medium text-slate-800", children: item.title }), _jsx("p", { className: "text-xs text-slate-600", children: item.detail })] }), item.level ? _jsx(StatusBadge, { value: item.level }) : null] }, `${item.title}-${item.detail}`))) })) : null, summary.attentionTotal > summary.attention.length ? (_jsxs("p", { className: "mt-2 text-[13px] text-slate-600", children: ["Showing the first ", summary.attention.length, ".", " ", _jsx(Link, { to: summary.to, className: "font-semibold text-[color:var(--c-text-8c2f39)] underline", children: "See all on the dashboard" }), "."] })) : null] }), notes.length > 0 ? (_jsxs("details", { className: "min-w-0 text-[13px]", children: [_jsx("summary", { className: "cursor-pointer font-semibold text-[color:var(--c-text-461220)]", children: "How these figures are counted" }), _jsx("ul", { className: "mt-2 list-disc space-y-1.5 pl-5 leading-5 text-slate-700", children: notes.map((note) => (_jsx("li", { children: note }, note))) })] })) : null] })] }));
}
export function SecretaryDashboard() {
    const [summaries, setSummaries] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        loadSummaries()
            .then((items) => {
            if (active)
                setSummaries(items);
        })
            .catch((reason) => {
            if (active)
                setError(reason instanceof Error ? reason.message : "The dashboard figures could not be loaded.");
        });
        return () => {
            active = false;
        };
    }, []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(ScopeBand, { as: "h1", kicker: "Labour Department \u00B7 Secretary", title: "Secretary Dashboard", note: "One section for each board or office, taken from its own dashboard and shown for that dashboard's default period. The figures are not added together, because the boards count different things and a worker can be registered with more than one." }), error ? _jsx("p", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: error }) : null, !summaries && !error ? _jsx("p", { role: "status", className: "text-sm text-slate-600", children: "Loading the five dashboards\u2026" }) : null, summaries ? (_jsxs(_Fragment, { children: [_jsx("nav", { "aria-label": "Items needing attention by board", className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-5", children: summaries.map((summary) => (_jsxs("a", { href: `#secretary-${summary.id}`, className: "rounded-xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--c-text-8c2f39)]", children: [_jsx("span", { className: "block text-[13px] text-slate-600", children: summary.name }), _jsx("span", { className: "mt-1 block text-xl font-semibold text-[color:var(--c-text-461220)]", children: summary.attentionTotal }), _jsx("span", { className: "block text-[13px] text-slate-600", children: summary.attentionNote })] }, summary.id))) }), summaries.map((summary) => (_jsx(BoardSection, { summary: summary }, summary.id)))] })) : null] }));
}
