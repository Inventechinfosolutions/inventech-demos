import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatLongDate } from "@/lib/format";
import { findNavItem } from "@/lib/nav";
const labels = {
    financialYear: "Financial year",
    from: "From",
    to: "To",
    districtId: "District",
    talukId: "Taluk",
    category: "Establishment category",
    projectStatus: "Project status",
    cessStatus: "Cess status",
    inspectionStatus: "Inspection status",
    membershipStatus: "Membership status",
    scheme: "Scheme",
    applicationStatus: "Application status",
    paymentStatus: "Payment status",
    departmentId: "Department",
    severity: "Accident severity",
    complianceStatus: "Compliance status",
    boilerStatus: "Boiler inspection status",
};
function present(key, value) {
    if (key === "from" || key === "to") {
        return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatLongDate(value) : value;
    }
    if (key === "financialYear")
        return value;
    return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function PlaceholderPage() {
    const location = useLocation();
    const match = findNavItem(location.pathname);
    const title = match?.item.label ?? "Dashboard";
    const params = new URLSearchParams(location.search);
    const carried = Object.keys(labels)
        .map((key) => ({ key, value: params.get(key) }))
        .filter((item) => Boolean(item.value && item.value !== "all"));
    useEffect(() => {
        document.title = `KBOCW · ${title}`;
    }, [title]);
    return (_jsxs("section", { className: "mx-auto max-w-3xl rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-6 py-8 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]", children: [_jsx("p", { className: "text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: match?.group.label ?? "Portal" }), _jsx("h1", { className: "mt-2 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: title }), _jsx("p", { className: "mt-4 text-sm leading-6 text-slate-600", children: "This view is reserved for a later dashboard. The Secretary overview, the Labour Commissionerate dashboard, the KBOCW Welfare Board dashboard, the Factories & Boilers dashboard, and the Cross-Department Intelligence dashboard are available in this build. The navigation entry is in place so the next dashboard can be connected without changing the portal shell." }), carried.length > 0 ? (_jsxs("div", { className: "mt-5", children: [_jsx("h2", { className: "text-sm font-semibold text-[color:var(--c-text-461220)]", children: "Scope carried from the previous view" }), _jsx("dl", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: carried.map((item) => (_jsxs("div", { children: [_jsx("dt", { className: "text-sm text-slate-500", children: labels[item.key] }), _jsx("dd", { className: "text-sm font-medium text-[color:var(--c-text-461220)]", children: present(item.key, item.value) })] }, item.key))) })] })) : null, _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/", className: "inline-flex h-10 items-center rounded-lg bg-[color:var(--c-bg-461220)] px-4 text-sm font-semibold text-white", children: "Open Secretary Dashboard" }), _jsx(Link, { to: `/departments/labour-commissionerate${location.search}`, className: "inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: "Open Labour Commissionerate" }), _jsx(Link, { to: `/departments/kbocw-welfare-board${location.search}`, className: "inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: "Open KBOCW Welfare Board" }), _jsx(Link, { to: `/departments/factories-boilers${location.search}`, className: "inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: "Open Factories & Boilers" }), _jsx(Link, { to: `/intelligence/cross-analytics${location.search}`, className: "inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: "Open Cross-Department Intelligence" })] })] }));
}
