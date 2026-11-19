import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { ExceptionList } from "@/components/dashboard/ExceptionList";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KarnatakaMap } from "@/components/dashboard/KarnatakaMap";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { exportExcel, exportPdf } from "@/lib/export";
import { DEFAULT_FILTERS, withFinancialYear } from "@/lib/period";
import { getSecretaryDetail, getSecretaryOverview, loadFilterOptions } from "@/services/dashboardService";
function chartById(overview, id) {
    return overview.charts.find((chart) => chart.id === id);
}
export function SecretaryDashboard() {
    const [options, setOptions] = useState(null);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [overview, setOverview] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [drill, setDrill] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [exporting, setExporting] = useState(null);
    const [exportError, setExportError] = useState(null);
    useEffect(() => {
        document.title = "KBOCW · Secretary Dashboard";
    }, []);
    useEffect(() => {
        let cancelled = false;
        loadFilterOptions()
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
        let cancelled = false;
        setUpdating(true);
        getSecretaryOverview(filters)
            .then((next) => {
            if (!cancelled) {
                setOverview(next);
                setError(null);
            }
        })
            .catch(() => {
            if (!cancelled)
                setError("The Secretary dashboard could not be loaded.");
        })
            .finally(() => {
            if (!cancelled)
                setUpdating(false);
        });
        return () => {
            cancelled = true;
        };
    }, [filters]);
    useEffect(() => {
        if (!drill)
            return;
        let cancelled = false;
        setDetailLoading(true);
        getSecretaryDetail(drill, filters)
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
    }, [drill, filters]);
    function applyFilters(next) {
        if (!next.fromDate || !next.toDate)
            return;
        if (next.financialYear !== filters.financialYear) {
            setFilters(withFinancialYear(next, next.financialYear));
            return;
        }
        if (next.fromDate > next.toDate) {
            setFilters({ ...next, fromDate: next.toDate, toDate: next.fromDate });
            return;
        }
        setFilters(next);
    }
    function selectDistrict(districtId) {
        setFilters((current) => ({ ...current, districtId: current.districtId === districtId ? "all" : districtId }));
    }
    async function runExport(kind) {
        if (!overview)
            return;
        setExporting(kind);
        setExportError(null);
        try {
            if (kind === "excel")
                await exportExcel(overview);
            else
                await exportPdf(overview);
        }
        catch {
            setExportError("The file could not be prepared.");
        }
        finally {
            setExporting(null);
        }
    }
    const construction = overview ? chartById(overview, "construction") : undefined;
    const cess = overview ? chartById(overview, "cess") : undefined;
    const welfare = overview ? chartById(overview, "welfare") : undefined;
    const schemes = overview ? chartById(overview, "schemes") : undefined;
    return (_jsxs("div", { className: "mx-auto min-w-0 max-w-[1440px] space-y-5", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Secretary dashboard." }), _jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Secretary" }), _jsx("h1", { className: "mt-2 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: "Integrated overview" }), _jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-500", children: "Construction, cess, registration and welfare across departments. Illustrative figures only. Cess stages stay separate and are not added together." })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", className: "h-10 rounded-full bg-[color:var(--c-bg-461220)] px-4 text-sm font-semibold text-[color:var(--c-text-ffeee7)] disabled:opacity-60", disabled: !overview || exporting != null, onClick: () => void runExport("excel"), children: exporting === "excel" ? "Preparing Excel…" : "Excel" }), _jsx("button", { type: "button", className: "h-10 rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-4 text-sm font-semibold text-[color:var(--c-text-461220)] disabled:opacity-60", disabled: !overview || exporting != null, onClick: () => void runExport("pdf"), children: exporting === "pdf" ? "Preparing PDF…" : "PDF" })] })] }), exportError ? _jsx("p", { className: "text-sm text-red-700", children: exportError }) : null, options ? (_jsx(FilterBar, { options: options, value: filters, updating: updating, onChange: applyFilters, onReset: () => setFilters(DEFAULT_FILTERS) })) : null, error ? _jsx("p", { className: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: error }) : null, overview ? (_jsxs(_Fragment, { children: [_jsx("section", { className: "grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4", children: overview.kpis.map((kpi) => (_jsx(KpiCard, { kpi: kpi, onSelect: (kpiId) => setDrill({ type: "kpi", kpiId }) }, kpi.id))) }), _jsxs("section", { className: "grid min-w-0 gap-5 xl:grid-cols-2", children: [construction ? _jsx(ChartCard, { chart: construction, onSelect: (category, series) => setDrill({ type: "chart", chartId: construction.id, category, series }) }) : null, welfare ? _jsx(ChartCard, { chart: welfare, onSelect: (category, series) => setDrill({ type: "chart", chartId: welfare.id, category, series }) }) : null, cess ? _jsx(ChartCard, { className: "xl:col-span-2", chart: cess, onSelect: (category, series) => setDrill({ type: "chart", chartId: cess.id, category, series }) }) : null, schemes ? _jsx(ChartCard, { className: "xl:col-span-2", chart: schemes, onSelect: (category, series) => setDrill({ type: "chart", chartId: schemes.id, category, series }) }) : null] }), _jsxs("section", { className: "grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]", children: [_jsx(KarnatakaMap, { districts: overview.districts, selectedId: filters.districtId, boundaryNote: overview.boundaryNote, onSelect: selectDistrict }), _jsx(ExceptionList, { items: overview.exceptions, onSelect: (exceptionId) => setDrill({ type: "exception", exceptionId }) })] }), _jsxs("section", { className: "overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]", children: [_jsxs("div", { className: "border-b border-[color:var(--c-border-ffeae1)] px-5 py-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: "Department performance" }), _jsx("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: "Record counts follow the selected district and dates. Integration status and last updated describe the departmental feed." })] }), _jsx(DataTable, { columns: [
                                    { key: "Department", label: "Department" },
                                    { key: "Category", label: "Data category" },
                                    { key: "Records", label: "Records received", align: "right" },
                                    { key: "Updated", label: "Last updated" },
                                    { key: "Status", label: "Integration status", kind: "status" },
                                ], rows: overview.departments.map((row) => ({
                                    id: row.id,
                                    Department: row.name,
                                    Category: row.category,
                                    Records: row.records,
                                    Updated: row.lastUpdated,
                                    Status: row.status,
                                })), action: { label: "View details", onClick: (row) => setDrill({ type: "department", departmentId: row.id }) } })] }), _jsxs("footer", { className: "pb-4 text-sm leading-6 text-slate-500", children: ["Source: ", overview.source, ". Last refreshed: ", overview.lastRefreshed, ". Scope: ", overview.scopeLabel, ". ", overview.stageNote] })] })) : !error ? (_jsx("p", { className: "text-sm text-slate-600", children: "Loading the Secretary dashboard." })) : null, drill ? _jsx(DetailDrawer, { detail: detail, loading: detailLoading, onClose: () => setDrill(null) }) : null] }));
}
