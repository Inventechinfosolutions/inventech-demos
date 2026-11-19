import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { ExceptionRegister } from "@/components/intelligence/ExceptionRegister";
import { IntelligenceFilters } from "@/components/intelligence/IntelligenceFilters";
import { IntelligenceMap } from "@/components/intelligence/IntelligenceMap";
import { RelationshipExplorer } from "@/components/intelligence/RelationshipExplorer";
import { DEFAULT_INTELLIGENCE_FILTERS, intelligenceQuery, readIntelligenceFilters } from "@/lib/intelligenceQuery";
import { exportIntelligenceExcel, exportIntelligencePdf } from "@/lib/intelligenceExport";
import { financialYearBounds } from "@/lib/period";
import { getIntelligenceDetail, getIntelligenceOverview, loadIntelligenceOptions } from "@/services/intelligenceService";
import { useSearchParams } from "react-router-dom";
const topics = [
    { id: "projects", label: "Projects" },
    { id: "cess", label: "Cess" },
    { id: "workers", label: "Workers" },
    { id: "welfare", label: "Welfare" },
    { id: "safety", label: "Safety" },
    { id: "relationships", label: "Relationships" },
    { id: "exceptions", label: "Exceptions" },
];
export function IntelligenceDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = readIntelligenceFilters(searchParams);
    const filterKey = searchParams.toString();
    const [options, setOptions] = useState(null);
    const [overview, setOverview] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [topic, setTopic] = useState("projects");
    const [drill, setDrill] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [cases, setCases] = useState({});
    useEffect(() => {
        document.title = "KBOCW · Cross-Department Intelligence";
    }, []);
    useEffect(() => {
        let cancelled = false;
        loadIntelligenceOptions().then((next) => {
            if (!cancelled)
                setOptions(next);
        }).catch(() => {
            if (!cancelled)
                setError("The intelligence filters could not be loaded.");
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        const active = readIntelligenceFilters(searchParams);
        let cancelled = false;
        setUpdating(true);
        getIntelligenceOverview(active)
            .then((next) => {
            if (!cancelled) {
                setOverview(next);
                setError(null);
            }
        })
            .catch(() => {
            if (!cancelled)
                setError("The Cross-Department Intelligence dashboard could not be loaded.");
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
        const active = readIntelligenceFilters(searchParams);
        let cancelled = false;
        setDetailLoading(true);
        getIntelligenceDetail(drill, active)
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
        setSearchParams(intelligenceQuery(value), { replace: true });
    }
    function selectDistrict(districtId) {
        applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId });
    }
    function applyCategory(category) {
        if (!category || !options)
            return false;
        const department = options.departments.find((item) => item.name === category);
        if (department) {
            applyFilters({ ...filters, departmentId: department.id });
            return true;
        }
        const district = options.districts.find((item) => item.name === category);
        if (district) {
            selectDistrict(district.id);
            return true;
        }
        return false;
    }
    function onChart(chartId, category, series) {
        if (category && applyCategory(category))
            return;
        setDrill({ type: "chart", chartId, category, series });
    }
    function withCase(row) {
        const local = cases[row.id];
        return local ? { ...row, investigation: local.investigation, notes: local.notes, audit: local.audit } : row;
    }
    function updateCase(id, change) {
        const base = overview?.exceptions.find((row) => row.id === id);
        if (!base)
            return;
        setCases((previous) => {
            const current = previous[id] ?? { investigation: base.investigation, notes: base.notes, audit: base.audit };
            return { ...previous, [id]: change(current) };
        });
    }
    const exceptions = overview?.exceptions.map(withCase) ?? [];
    return (_jsxs("div", { className: "mx-auto max-w-[1440px]", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Cross-Department Intelligence dashboard." }), _jsx("header", { className: "border-b border-[color:var(--c-border-fed9c8)] pb-4", children: _jsxs("div", { className: "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between", children: [_jsxs("div", { className: "max-w-xl", children: [_jsx("p", { className: "text-xs font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase", children: "Illustrative intelligence workspace" }), _jsx("h1", { className: "mt-1 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: "Cross-Department Intelligence" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Unified intelligence across departments" }), _jsxs("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: ["Last data synchronization: ", overview?.lastRefreshed ?? "18 Nov 2026, 09:30 IST", ". Source: ", overview?.source ?? "Illustrative cross-department extract", "."] }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: overview?.illustrativeNote })] }), options && overview ? (_jsx(IntelligenceFilters, { options: options, value: filters, updating: updating, onChange: applyFilters, onReset: () => setSearchParams(intelligenceQuery(DEFAULT_INTELLIGENCE_FILTERS), { replace: true }), onExcel: () => { void exportIntelligenceExcel(overview); }, onPdf: () => { void exportIntelligencePdf(overview); } })) : null] }) }), error ? _jsx("p", { className: "mt-4 text-sm text-red-700", children: error }) : null, overview ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] md:grid-cols-4 xl:grid-cols-8", children: overview.kpis.map((kpi) => (_jsxs("button", { type: "button", className: `border-[color:var(--c-border-fed9c8)] border-r border-b px-3 py-3 text-left ${topic === kpi.topic ? "bg-[color:var(--c-bg-ffeee7)]" : "bg-[color:var(--c-bg-ffffff)]"}`, onClick: () => {
                                setTopic(kpi.topic);
                                setDrill({ type: "kpi", kpiId: kpi.id });
                            }, children: [_jsx("span", { className: "block text-xs leading-5 text-slate-500", children: kpi.label }), _jsx("span", { className: "mt-1 block text-lg font-semibold text-[color:var(--c-text-461220)] tabular-nums", children: kpi.displayValue })] }, kpi.id))) }), _jsxs("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: [overview.projectKpiNote, " Worker and beneficiary names are masked for this role."] }), _jsxs("div", { className: "mt-4 grid gap-4 min-w-0 lg:grid-cols-[220px_minmax(0,1fr)]", children: [_jsx("nav", { className: "flex gap-2 overflow-x-auto lg:flex-col", "aria-label": "Intelligence topics", children: topics.map((item) => (_jsx("button", { type: "button", className: `shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold lg:w-full ${topic === item.id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-461220)] ring-1 ring-[color:var(--c-border-fed9c8)]"}`, onClick: () => setTopic(item.id), children: item.label }, item.id))) }), _jsxs("div", { className: "min-w-0 space-y-4", children: [topic === "projects" ? (_jsxs(_Fragment, { children: [_jsx(ChartCard, { chart: overview.charts.projectsByDepartment, onSelect: onChart }), _jsx(ChartCard, { chart: overview.charts.projectMatch, onSelect: onChart }), _jsx(IntelligenceMap, { districts: overview.districts, selectedId: filters.districtId, boundaryNote: overview.boundaryNote, onSelect: selectDistrict }), _jsxs("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: "Projects requiring cess verification" }), _jsx("p", { className: "mt-1 mb-3 text-sm leading-6 text-slate-600", children: "A project value is not treated as cess-eligible construction cost. These rows still need a cess stage matched from the source record." }), _jsx(DataTable, { columns: [
                                                            { key: "Project", label: "Project" },
                                                            { key: "Department", label: "Department" },
                                                            { key: "District", label: "District" },
                                                            { key: "Stage", label: "Cess position" },
                                                            { key: "Status", label: "Status" },
                                                        ], rows: overview.cessReviews.map((row) => ({
                                                            Reference: row.project,
                                                            Project: row.project,
                                                            Department: row.department,
                                                            District: row.district,
                                                            Stage: row.stage,
                                                            Status: row.status,
                                                        })), action: { label: "Trace", onClick: () => setDrill({ type: "kpi", kpiId: "verification" }) } })] })] })) : null, topic === "cess" ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm leading-6 text-slate-600", children: overview.stageNote }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: overview.cessStages.map((stage) => (_jsxs("div", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3", children: [_jsx("p", { className: "text-sm text-slate-500", children: stage.label }), _jsx("p", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)] tabular-nums", children: stage.displayValue })] }, stage.label))) }), _jsx(ChartCard, { chart: overview.charts.cessStages, onSelect: onChart }), _jsxs("div", { className: "grid gap-3 lg:grid-cols-2", children: [_jsxs("article", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: "Collected but not remitted" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]", children: overview.collectedNotRemitted ?? "Not calculated" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: overview.collectedNotRemitted
                                                                    ? "This difference is a reconciliation item. It is not a fifth cess stage and it is not added to the four stages."
                                                                    : "This view does not hold both the collection record and the remittance record, so the difference is not calculated." })] }), _jsxs("article", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: "Remitted but not credited" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]", children: overview.remittedNotCredited ?? "Not calculated" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: overview.remittedNotCredited
                                                                    ? "Remittance and credit stay separate. The difference is not added to either stage."
                                                                    : "This view does not hold both the remittance record and the credit record, so the difference is not calculated." })] })] }), _jsx(ChartCard, { chart: overview.charts.cessDistrict, onSelect: onChart }), _jsx(ExceptionRegister, { rows: exceptions, domain: "cess", onTrace: (id) => setDrill({ type: "exception", exceptionId: id }), onStatus: (id, status) => updateCase(id, (current) => ({ ...current, investigation: status, audit: [...current.audit, { at: "This session", text: `Status set to ${status}.` }] })), onNote: (id, note) => updateCase(id, (current) => ({ ...current, notes: [...current.notes, note], audit: [...current.audit, { at: "This session", text: "Investigation note added." }] })) })] })) : null, topic === "workers" ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm leading-6 text-slate-600", children: overview.workerNote }), _jsx(ChartCard, { chart: overview.charts.workerComparison, onSelect: onChart }), _jsx(ChartCard, { chart: overview.charts.workerMatch, onSelect: onChart }), _jsx(ChartCard, { chart: overview.charts.workerDistrict, onSelect: onChart }), _jsx(ChartCard, { chart: overview.charts.membership, onSelect: onChart })] })) : null, topic === "welfare" ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm leading-6 text-slate-600", children: overview.welfareNote }), _jsx("div", { className: "grid gap-3 md:grid-cols-3", children: overview.funnel.map((step, index) => (_jsxs("div", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3", children: [_jsxs("p", { className: "text-xs font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase", children: ["Step ", index + 1] }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: step.label }), _jsx("p", { className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: step.displayValue })] }, step.label))) }), _jsx("div", { className: "grid gap-3 lg:grid-cols-3", children: overview.welfareCalls.map((call) => (_jsxs("article", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-base font-semibold text-[color:var(--c-text-461220)]", children: call.label }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]", children: call.displayValue }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: call.note })] }, call.label))) }), _jsx(ChartCard, { chart: overview.charts.welfareDistrict, onSelect: onChart })] })) : null, topic === "safety" ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm leading-6 text-slate-600", children: overview.jurisdictionNote }), _jsx(ChartCard, { chart: overview.charts.safetyInspections, onSelect: onChart }), _jsx(ChartCard, { chart: overview.charts.safetyViolations, onSelect: onChart }), _jsx("div", { className: "grid gap-3 lg:grid-cols-2", children: overview.safetyCalls.map((call) => (_jsxs("article", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-base font-semibold text-[color:var(--c-text-461220)]", children: call.label }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]", children: call.displayValue }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: call.note })] }, call.label))) }), _jsx(ChartCard, { chart: overview.charts.safetyAccidents, onSelect: onChart }), _jsx(ChartCard, { chart: overview.charts.safetyDistrict, onSelect: onChart })] })) : null, topic === "relationships" ? (_jsx(RelationshipExplorer, { entities: overview.entities, relationships: overview.relationships, districtId: filters.districtId, departmentId: filters.departmentId, matchNote: overview.matchNote, onOpen: (entityId) => setDrill({ type: "entity", entityId }) })) : null, topic === "exceptions" ? (_jsx(ExceptionRegister, { rows: exceptions, onTrace: (id) => setDrill({ type: "exception", exceptionId: id }), onStatus: (id, status) => updateCase(id, (current) => ({ ...current, investigation: status, audit: [...current.audit, { at: "This session", text: `Status set to ${status}.` }] })), onNote: (id, note) => updateCase(id, (current) => ({ ...current, notes: [...current.notes, note], audit: [...current.audit, { at: "This session", text: "Investigation note added." }] })) })) : null] })] })] })) : null, drill ? (_jsx(DetailDrawer, { detail: detailLoading ? null : detail, loading: detailLoading, onClose: () => {
                    setDrill(null);
                    setDetail(null);
                } })) : null] }));
}
