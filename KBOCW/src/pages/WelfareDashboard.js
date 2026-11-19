import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { WelfareActions } from "@/components/welfare/WelfareActions";
import { WelfareFiltersBar } from "@/components/welfare/WelfareFilters";
import { WelfareFinance } from "@/components/welfare/WelfareFinance";
import { WelfareKpis } from "@/components/welfare/WelfareKpis";
import { WelfareMap } from "@/components/welfare/WelfareMap";
import { WelfarePipeline } from "@/components/welfare/WelfarePipeline";
import { WelfareRegisters } from "@/components/welfare/WelfareRegisters";
import { financialYearBounds } from "@/lib/period";
import { DEFAULT_WELFARE_FILTERS, WELFARE_LINKS, readWelfareFilters, welfareQuery } from "@/lib/welfareQuery";
import { getWelfareDetail, getWelfareOverview, loadWelfareOptions } from "@/services/welfareService";
const workerCharts = ["registrations", "renewals", "membership", "occupation", "age"];
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
        const active = readWelfareFilters(searchParams);
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
    }, [drill, filterKey, searchParams]);
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
    const query = welfareQuery(filters).toString();
    const processing = overview?.charts.find((chart) => chart.id === "processing-days");
    const utilization = overview?.charts.find((chart) => chart.id === "utilization");
    return (_jsxs("div", { className: "mx-auto min-w-0 max-w-[1440px] space-y-5", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the KBOCW Welfare Board dashboard." }), _jsxs("header", { className: "flex flex-col gap-4 border-b border-[color:var(--c-border-fed4c1)] pb-4 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Beneficiary welfare" }), _jsx("h1", { className: "mt-1 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: "KBOCW Welfare Board" }), _jsx("p", { className: "mt-2 max-w-3xl text-sm leading-6 text-slate-600", children: "Construction Worker Registration, Welfare Schemes and Financial Assistance" }), _jsxs("p", { className: "mt-2 max-w-3xl text-sm leading-6 text-slate-600", children: [overview?.illustrativeNote ?? "Illustrative data. This demonstration is not connected to Karnataka Government systems.", " ", overview?.separationNote] })] }), _jsx("nav", { "aria-label": "Related departments", className: "max-w-md text-sm leading-6", children: WELFARE_LINKS.map((link, index) => (_jsxs("span", { children: [index > 0 ? _jsx("span", { className: "text-slate-300", children: " \u00B7 " }) : null, _jsx(Link, { to: `${link.to}?${query}`, className: "font-semibold text-[color:var(--c-text-8c2f39)] underline-offset-2 hover:underline", children: link.label })] }, link.to))) })] }), options ? _jsx(WelfareFiltersBar, { options: options, value: filters, updating: updating, onChange: applyFilters, onReset: () => setSearchParams(welfareQuery(DEFAULT_WELFARE_FILTERS), { replace: true }) }) : null, error ? _jsx("p", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: error }) : null, overview ? (_jsxs(_Fragment, { children: [_jsx(WelfareKpis, { items: overview.kpis, onSelect: (kpiId) => setDrill({ type: "kpi", kpiId }) }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Worker registration" }), _jsx("h2", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Membership and coverage of registered workers" })] }), _jsx("div", { className: "grid min-w-0 gap-4 lg:grid-cols-2", children: pick(overview.charts, workerCharts).map((chart) => (_jsx(ChartCard, { className: chart.id === "membership" ? "lg:col-span-2" : "", chart: chart, onSelect: (category, series) => setDrill({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Welfare schemes" }), _jsx("h2", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Scheme performance" }), _jsx("p", { className: "mt-1 max-w-4xl text-sm leading-6 text-slate-600", children: overview.schemeNote })] }), _jsx("div", { className: "grid min-w-0 gap-4 lg:grid-cols-2", children: pick(overview.charts, schemeCharts).map((chart) => (_jsx(ChartCard, { className: chart.id === "scheme-status" ? "lg:col-span-2" : "", chart: chart, onSelect: (category, series) => setDrill({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Application processing" }), _jsx("h2", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "From receipt to disbursement" }), _jsx("p", { className: "mt-1 max-w-4xl text-sm leading-6 text-slate-600", children: "Each stage is the current status of an application. Applications are counted apart from unique workers." })] }), _jsx(WelfarePipeline, { stages: overview.stages, activeId: filters.applicationStatus, onSelect: (stageId) => setDrill({ type: "stage", stageId }) }), processing ? _jsx(ChartCard, { chart: processing, onSelect: (category, series) => setDrill({ type: "chart", chartId: processing.id, category, series }) }) : null] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Financial assistance" }), _jsx("h2", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Fund position and utilization" })] }), _jsx(WelfareFinance, { finance: overview.finance }), utilization ? _jsx(ChartCard, { chart: utilization, onSelect: (category, series) => setDrill({ type: "chart", chartId: utilization.id, category, series }) }) : null] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "District welfare" }), _jsx("h2", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Coverage and follow-up" })] }), _jsx(WelfareMap, { districts: overview.districts, selectedId: filters.districtId, metric: metric, boundaryNote: overview.boundaryNote, onMetric: setMetric, onSelect: selectDistrict }), _jsx(WelfareActions, { items: overview.actions, onSelect: (exceptionId) => setDrill({ type: "exception", exceptionId }) })] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Registers" }), _jsx("h2", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: "Workers, applications and disbursements" })] }), _jsx(WelfareRegisters, { registers: overview.registers, onOpen: (register, id) => setDrill({ type: "record", register, id }) })] }), _jsxs("footer", { className: "pb-4 text-sm leading-6 text-slate-500", children: ["Source: ", overview.source, ". Last refreshed: ", overview.lastRefreshed, ". Scope: ", overview.scopeLabel, ". ", overview.stageNote] })] })) : !error ? (_jsx("p", { className: "text-sm text-slate-600", children: "Loading the KBOCW Welfare Board dashboard." })) : null, drill ? _jsx(DetailDrawer, { detail: detail, loading: detailLoading, onClose: () => setDrill(null) }) : null] }));
}
