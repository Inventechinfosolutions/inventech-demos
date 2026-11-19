import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { LabourFiltersBar } from "@/components/labour/LabourFilters";
import { LabourKpis } from "@/components/labour/LabourKpis";
import { LabourMap } from "@/components/labour/LabourMap";
import { LabourQueue } from "@/components/labour/LabourQueue";
import { LabourRegisters } from "@/components/labour/LabourRegisters";
import { DEFAULT_LABOUR_FILTERS, LABOUR_LINKS, labourQuery, readLabourFilters } from "@/lib/labourQuery";
import { financialYearBounds } from "@/lib/period";
import { getLabourDetail, getLabourOverview, loadLabourOptions } from "@/services/labourService";
const wideCharts = new Set(["projects-category", "cess-monthly"]);
export function LabourDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = readLabourFilters(searchParams);
    const filterKey = searchParams.toString();
    const [options, setOptions] = useState(null);
    const [overview, setOverview] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [metric, setMetric] = useState("projects");
    const [drill, setDrill] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    useEffect(() => {
        document.title = "KBOCW · Labour Commissionerate";
    }, []);
    useEffect(() => {
        let cancelled = false;
        loadLabourOptions()
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
        const active = readLabourFilters(searchParams);
        let cancelled = false;
        setUpdating(true);
        getLabourOverview(active)
            .then((next) => {
            if (!cancelled) {
                setOverview(next);
                setError(null);
            }
        })
            .catch(() => {
            if (!cancelled)
                setError("The Labour Commissionerate dashboard could not be loaded.");
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
        const active = readLabourFilters(searchParams);
        let cancelled = false;
        setDetailLoading(true);
        getLabourDetail(drill, active)
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
        setSearchParams(labourQuery(value), { replace: true });
    }
    function selectDistrict(districtId) {
        applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId, talukId: "all" });
    }
    const query = labourQuery(filters).toString();
    return (_jsxs("div", { className: "mx-auto min-w-0 max-w-[1440px] space-y-4", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Labour Commissionerate dashboard." }), _jsxs("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] border-l-4 border-l-[color:var(--c-border-b23a48)] bg-[color:var(--c-bg-ffffff)] px-5 py-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]", children: [_jsx("p", { className: "text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: "Labour Department" }), _jsx("h1", { className: "mt-1 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: "Labour Commissionerate" }), _jsx("p", { className: "mt-2 max-w-4xl text-sm leading-6 text-slate-600", children: "Construction Labour Administration, Cess Monitoring and Regulatory Compliance" }), _jsxs("p", { className: "mt-3 max-w-4xl text-sm leading-6 text-slate-600", children: [overview?.illustrativeNote ?? "Illustrative data. This demonstration is not connected to Karnataka Government systems.", " ", overview?.separationNote] }), _jsx("nav", { className: "-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0", "aria-label": "Related records", children: LABOUR_LINKS.map((link) => (_jsx(Link, { to: `${link.to}?${query}`, className: "shrink-0 rounded-full bg-[color:var(--c-bg-ffeee7)] px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-[color:var(--c-text-8c2f39)]", children: link.label }, link.to))) }), _jsx("div", { className: "mt-4 border-t border-[color:var(--c-border-fed9c8)] pt-4", children: options ? _jsx(LabourFiltersBar, { options: options, value: filters, updating: updating, onChange: applyFilters, onReset: () => setSearchParams(labourQuery(DEFAULT_LABOUR_FILTERS), { replace: true }) }) : null })] }), error ? _jsx("p", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: error }) : null, overview ? (_jsxs(_Fragment, { children: [_jsx(LabourKpis, { items: overview.kpis, onSelect: (kpiId) => setDrill({ type: "kpi", kpiId }) }), _jsxs("section", { className: "grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.8fr)]", children: [_jsx(LabourMap, { districts: overview.districts, selectedId: filters.districtId, metric: metric, boundaryNote: overview.boundaryNote, onMetric: setMetric, onSelect: selectDistrict }), _jsx("div", { className: "min-h-0 xl:relative", children: _jsx(LabourQueue, { items: overview.queue, onSelect: (exceptionId) => setDrill({ type: "exception", exceptionId }) }) })] }), _jsx("section", { className: "grid min-w-0 gap-4 lg:grid-cols-2", children: overview.charts.map((chart) => (_jsx(ChartCard, { className: wideCharts.has(chart.id) ? "lg:col-span-2" : "", chart: chart, onSelect: (category, series) => setDrill({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) }), _jsx(LabourRegisters, { registers: overview.registers, onOpen: (register, id) => setDrill({ type: "record", register, id }) }), _jsxs("footer", { className: "pb-4 text-sm leading-6 text-slate-500", children: ["Source: ", overview.source, ". Last refreshed: ", overview.lastRefreshed, ". Scope: ", overview.scopeLabel, ". ", overview.stageNote] })] })) : !error ? (_jsx("p", { className: "text-sm text-slate-600", children: "Loading the Labour Commissionerate dashboard." })) : null, drill ? _jsx(DetailDrawer, { detail: detail, loading: detailLoading, onClose: () => setDrill(null) }) : null] }));
}
