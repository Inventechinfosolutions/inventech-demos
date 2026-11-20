import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MoreCharts } from "@/components/dashboard/MoreCharts";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { FilterSummary } from "@/components/dashboard/FilterSummary";
import { ScopeBand } from "@/components/dashboard/ScopeBand";
import { LabourFiltersBar } from "@/components/labour/LabourFilters";
import { LabourKpis } from "@/components/labour/LabourKpis";
import { LabourMap } from "@/components/labour/LabourMap";
import { LabourQueue } from "@/components/labour/LabourQueue";
import { LabourRegisters } from "@/components/labour/LabourRegisters";
import { DEFAULT_LABOUR_FILTERS, labourQuery, readLabourFilters } from "@/lib/labourQuery";
import { financialYearBounds } from "@/lib/period";
import { useBaseline } from "@/lib/useBaseline";
import { getLabourDetail, getLabourOverview, loadLabourOptions } from "@/services/labourService";
const wideCharts = new Set(["projects-category", "cess-monthly"]);
// Charts shown before the rest are placed behind "Show more charts".
const KEY_CHARTS = 4;
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
    // The overview at the top always covers the default scope, so its drill-downs do too.
    const [drillOnOverview, setDrillOnOverview] = useState(false);
    const base = useBaseline(() => getLabourOverview(DEFAULT_LABOUR_FILTERS));
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
        const active = drillOnOverview ? DEFAULT_LABOUR_FILTERS : readLabourFilters(searchParams);
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
        setSearchParams(labourQuery(value), { replace: true });
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
    return (_jsxs("div", { className: "mx-auto min-w-0 max-w-[1440px] space-y-4", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Labour Commissionerate dashboard." }), error ? _jsx("p", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: error }) : null, base ? (_jsxs(_Fragment, { children: [_jsx(ScopeBand, { as: "h1", kicker: "Labour Department \u00B7 Overview", title: "Labour Commissionerate", note: `${base.scopeLabel}. These cards and charts cover the full scope and do not change with the filters further down.` }), _jsx(LabourKpis, { items: base.kpis, onSelect: (kpiId) => openOverview({ type: "kpi", kpiId }) }), _jsx("section", { className: "grid min-w-0 gap-4 lg:grid-cols-2", children: base.charts.slice(0, KEY_CHARTS).map((chart) => (_jsx(ChartCard, { className: wideCharts.has(chart.id) ? "lg:col-span-2" : "", chart: chart, onSelect: (category, series) => openOverview({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) }), _jsx(MoreCharts, { id: "labour-more", count: base.charts.length - KEY_CHARTS, children: base.charts.slice(KEY_CHARTS).map((chart) => (_jsx(ChartCard, { className: wideCharts.has(chart.id) ? "lg:col-span-2" : "", chart: chart, onSelect: (category, series) => openOverview({ type: "chart", chartId: chart.id, category, series }) }, chart.id))) })] })) : !error ? (_jsx("p", { className: "text-sm text-slate-600", children: "Loading the Labour Commissionerate dashboard." })) : null, _jsx(ScopeBand, { id: "labour-filters", kicker: "Filters", title: "Filter the records", note: "Choose a period, district, taluk or category. The figures, district map, review queue and registers below follow your choice." }), _jsx("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-5 py-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]", children: options ? _jsx(LabourFiltersBar, { options: options, value: filters, updating: updating, onChange: applyFilters, onReset: () => setSearchParams(labourQuery(DEFAULT_LABOUR_FILTERS), { replace: true }) }) : _jsx("p", { className: "text-sm text-slate-500", children: "Loading filters." }) }), overview ? (_jsxs(_Fragment, { children: [_jsx(FilterSummary, { scope: overview.scopeLabel, updating: updating, items: overview.kpis.map((item) => ({ label: item.label, value: item.displayValue })) }), _jsxs("section", { className: "grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.8fr)]", children: [_jsx(LabourMap, { districts: overview.districts, selectedId: filters.districtId, metric: metric, boundaryNote: overview.boundaryNote, onMetric: setMetric, onSelect: selectDistrict }), _jsx("div", { className: "min-h-0 xl:relative", children: _jsx(LabourQueue, { items: overview.queue, onSelect: (exceptionId) => openFiltered({ type: "exception", exceptionId }) }) })] }), _jsx(LabourRegisters, { registers: overview.registers, onOpen: (register, id) => openFiltered({ type: "record", register, id }) }), _jsxs("footer", { className: "pb-4 text-sm leading-6 text-slate-500", children: ["Source: ", overview.source, ". Last refreshed: ", overview.lastRefreshed, ". Scope: ", overview.scopeLabel, ". ", overview.stageNote] })] })) : null, drill ? _jsx(DetailDrawer, { detail: detail, loading: detailLoading, onClose: () => setDrill(null) }) : null] }));
}
