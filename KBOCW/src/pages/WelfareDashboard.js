import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MoreCharts } from "@/components/dashboard/MoreCharts";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { FilterSummary } from "@/components/dashboard/FilterSummary";
import { ScopeBand } from "@/components/dashboard/ScopeBand";
import { WelfareActions } from "@/components/welfare/WelfareActions";
import { WelfareFiltersBar } from "@/components/welfare/WelfareFilters";
import { WelfareFinance } from "@/components/welfare/WelfareFinance";
import { WelfareKpis } from "@/components/welfare/WelfareKpis";
import { WelfareMap } from "@/components/welfare/WelfareMap";
import { WelfarePipeline } from "@/components/welfare/WelfarePipeline";
import { WelfareRegisters } from "@/components/welfare/WelfareRegisters";
import { financialYearBounds } from "@/lib/period";
import { useBaseline } from "@/lib/useBaseline";
import { DEFAULT_WELFARE_FILTERS, readWelfareFilters, welfareQuery } from "@/lib/welfareQuery";
import { getWelfareDetail, getWelfareOverview, loadWelfareOptions } from "@/services/welfareService";
const schemeCharts = ["scheme-status", "scheme-people", "scheme-money"];
function pick(charts, ids) {
    return ids.map((id) => charts.find((chart) => chart.id === id)).filter((chart) => Boolean(chart));
}
export function WelfareDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = readWelfareFilters(searchParams);
    const filterKey = searchParams.toString();
    const [options, setOptions] = useState(null);
    const [overview, setOverview] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [metric, setMetric] = useState("workers");
    const [drill, setDrill] = useState(null);
    // The overview at the top always covers the default scope, so its drill-downs do too.
    const [drillOnOverview, setDrillOnOverview] = useState(false);
    const base = useBaseline(() => getWelfareOverview(DEFAULT_WELFARE_FILTERS));
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    useEffect(() => {
        document.title = "KBOCW · Welfare Board";
    }, []);
    useEffect(() => {
        let cancelled = false;
        loadWelfareOptions()
            .then((next) => {
            if (!cancelled)
                setOptions(next);
        })
            .catch(() => {
            if (!cancelled)
                setError("Filters could not be loaded.");
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        const active = readWelfareFilters(searchParams);
        let cancelled = false;
        setUpdating(true);
        getWelfareOverview(active)
            .then((next) => {
            if (!cancelled) {
                setOverview(next);
                setError(null);
            }
        })
            .catch(() => {
            if (!cancelled)
                setError("The KBOCW Welfare Board dashboard could not be loaded.");
        })
            .finally(() => {
            if (!cancelled)
                setUpdating(false);
        });
        return () => {
            cancelled = true;
        };
    }, [filterKey, searchParams]);
    useEffect(() => {
        if (!drill)
            return;
        const active = drillOnOverview ? DEFAULT_WELFARE_FILTERS : readWelfareFilters(searchParams);
        let cancelled = false;
        setDetailLoading(true);
        getWelfareDetail(drill, active)
            .then((next) => {
            if (!cancelled)
                setDetail(next);
        })
            .catch(() => {
            if (!cancelled)
                setDetail({ title: "Detail unavailable", summary: "The selected records could not be loaded.", note: "", columns: [], rows: [] });
        })
            .finally(() => {
            if (!cancelled)
                setDetailLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [drill, drillOnOverview, filterKey, searchParams]);
    function applyFilters(next) {
        if (!next.fromDate || !next.toDate)
            return;
        let value = next;
        if (value.financialYear !== filters.financialYear) {
            const bounds = financialYearBounds(value.financialYear);
            value = { ...value, fromDate: bounds.from, toDate: bounds.to };
        }
        if (value.fromDate > value.toDate)
            value = { ...value, fromDate: value.toDate, toDate: value.fromDate };
        const taluk = options?.taluks.find((item) => item.id === value.talukId);
        if (value.districtId === "all" || !taluk || taluk.districtId !== value.districtId)
            value = { ...value, talukId: "all" };
        setSearchParams(welfareQuery(value), { replace: true });
    }
    function selectDistrict(districtId) {
        applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId, talukId: "all" });
    }
    function openOverview(next) {
        setDrillOnOverview(true);
        setDrill(next);
    }
    function openFiltered(next) {
        setDrillOnOverview(false);
        setDrill(next);
    }
    // Everything not shown in the main view sits behind "Show more charts".
    const shownIds = new Set(["membership", ...schemeCharts]);
    const moreCharts = (base?.charts ?? []).filter((chart) => !shownIds.has(chart.id));
    return (_jsxs("div", { className: "mx-auto min-w-0 max-w-[1440px] space-y-5", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the KBOCW Welfare Board dashboard." }), error ? _jsx("p", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: error }) : null, base ? (_jsxs(_Fragment, { children: [_jsx(ScopeBand, { as: "h1", kicker: "Beneficiary welfare \u00B7 Overview", title: "KBOCW Welfare Board", note: `${base.scopeLabel}. These cards and charts cover the full scope and do not change with the filters further down.` }), _jsx(WelfareKpis, { items: base.kpis, onSelect: (kpiId) => openOverview({ type: "kpi", kpiId }) }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Worker registration" }), _jsx("h3", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Membership and coverage of registered workers" })] }), _jsx("div", { className: "grid min-w-0 gap-4 lg:grid-cols-2", children: pick(base.charts, ["membership"]).map((chart) => (_jsx(ChartCard, { className: "lg:col-span-2", chart: chart, onSelect: (category, series) => openOverview({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Welfare schemes" }), _jsx("h3", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Scheme performance" }), _jsx("p", { className: "mt-1 max-w-4xl text-sm leading-6 text-slate-600", children: base.schemeNote })] }), _jsx("div", { className: "grid min-w-0 gap-4 lg:grid-cols-2", children: pick(base.charts, schemeCharts).map((chart) => (_jsx(ChartCard, { className: chart.id === "scheme-status" ? "lg:col-span-2" : "", chart: chart, onSelect: (category, series) => openOverview({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) })] }), _jsx(MoreCharts, { id: "welfare-more", count: moreCharts.length, children: moreCharts.map((chart) => (_jsx(ChartCard, { chart: chart, onSelect: (category, series) => openOverview({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) })] })) : !error ? (_jsx("p", { className: "text-sm text-slate-600", children: "Loading the KBOCW Welfare Board dashboard." })) : null, _jsx(ScopeBand, { id: "welfare-filters", kicker: "Filters", title: "Filter the records", note: "Choose a period, district, taluk, scheme or status. The figures, application stages, fund position, district map and registers below follow your choice." }), _jsx("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-5 py-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]", children: options ? _jsx(WelfareFiltersBar, { options: options, value: filters, updating: updating, onChange: applyFilters, onReset: () => setSearchParams(welfareQuery(DEFAULT_WELFARE_FILTERS), { replace: true }) }) : _jsx("p", { className: "text-sm text-slate-500", children: "Loading filters." }) }), overview ? (_jsxs(_Fragment, { children: [_jsx(FilterSummary, { scope: overview.scopeLabel, updating: updating, items: overview.kpis.map((item) => ({ label: item.label, value: item.displayValue })) }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Application processing" }), _jsx("h3", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "From receipt to disbursement" }), _jsx("p", { className: "mt-1 max-w-4xl text-sm leading-6 text-slate-600", children: "Each stage is the current status of an application. Applications are counted apart from unique workers." })] }), _jsx(WelfarePipeline, { stages: overview.stages, activeId: filters.applicationStatus, onSelect: (stageId) => openFiltered({ type: "stage", stageId }) })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Financial assistance" }), _jsx("h3", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Fund position" })] }), _jsx(WelfareFinance, { finance: overview.finance })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "District welfare" }), _jsx("h3", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Coverage and follow-up" })] }), _jsx(WelfareMap, { districts: overview.districts, selectedId: filters.districtId, metric: metric, boundaryNote: overview.boundaryNote, onMetric: setMetric, onSelect: selectDistrict }), _jsx(WelfareActions, { items: overview.actions, onSelect: (exceptionId) => openFiltered({ type: "exception", exceptionId }) })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Registers" }), _jsx("h3", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Workers, applications and disbursements" })] }), _jsx(WelfareRegisters, { registers: overview.registers, onOpen: (register, id) => openFiltered({ type: "record", register, id }) })] }), _jsxs("footer", { className: "pb-4 text-sm leading-6 text-slate-500", children: ["Source: ", overview.source, ". Last refreshed: ", overview.lastRefreshed, ". Scope: ", overview.scopeLabel, ". ", overview.stageNote] })] })) : null, drill ? _jsx(DetailDrawer, { detail: detail, loading: detailLoading, onClose: () => setDrill(null) }) : null] }));
}
