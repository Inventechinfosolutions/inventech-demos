import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { NAV } from "@/lib/nav";
// Sections and links hidden from the sidebar for now. Their routes still work.
const HIDDEN_NAV_GROUPS = ["Cross-Department Intelligence"];
const HIDDEN_NAV_ITEMS = [
    "/departments/construction-infrastructure",
    "/departments/cess-financial",
    "/departments/health-social-security",
    "/departments/esis",
    "/departments/groundwater-environmental",
    "/departments/skill-development",
];
const VISIBLE_NAV = NAV.filter((group) => !HIDDEN_NAV_GROUPS.includes(group.label)).map((group) => ({
    ...group,
    items: group.items.filter((item) => !HIDDEN_NAV_ITEMS.includes(item.to)),
}));
export function Sidebar({ open, onClose }) {
    return (_jsxs(_Fragment, { children: [open ? _jsx("button", { type: "button", "aria-label": "Close navigation", className: "fixed inset-0 z-30 bg-[color:var(--app-scrim)]/50 lg:hidden", onClick: onClose }) : null, _jsxs("aside", { className: `fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[color:var(--app-sidebar)] text-[color:var(--c-text-ffeee7)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`, children: [_jsxs("div", { className: "flex items-center gap-3 border-b border-[color:var(--c-border-b23a48)]/30 px-4 py-4", children: [_jsx("img", { src: `${import.meta.env.BASE_URL}brand/karnataka-emblem.png`, alt: "Government of Karnataka", className: "h-14 w-14 shrink-0 rounded-full bg-black object-contain ring-1 ring-[color:var(--c-border-b23a48)]/40" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[11px] font-semibold tracking-[0.18em] text-[color:var(--app-sidebar-accent)] uppercase", children: "Karnataka" }), _jsx("p", { className: "mt-0.5 text-base font-semibold leading-5", children: "Labour Department" }), _jsx("p", { className: "text-xs leading-4 text-[color:var(--c-text-c1b0b5)]", children: "Intelligence Portal" })] })] }), _jsx("nav", { className: "nav-scroll flex-1 overflow-y-auto px-3 py-4", "aria-label": "Dashboards", children: VISIBLE_NAV.map((group) => (_jsxs("div", { className: "mb-5", children: [_jsx("p", { className: "px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-a0868d)] uppercase", children: group.label }), _jsx("ul", { className: "space-y-0.5", children: group.items.map((item) => (_jsx("li", { children: _jsx(NavLink, { to: item.to, end: item.to === "/", onClick: onClose, title: item.label, className: ({ isActive }) => `flex min-h-9 items-center rounded-lg px-3 py-2 text-sm leading-5 ${isActive ? "bg-[color:var(--c-bg-b23a48)]/15 font-semibold text-[color:var(--c-text-ffe8de)]" : "text-[color:var(--c-text-d9cfd2)] hover:bg-white/5"}`, children: item.short ?? item.label }) }, item.to))) })] }, group.label))) })] })] }));
}
