import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
const tabs = [
    { id: "establishments", label: "Construction establishments" },
    { id: "assessments", label: "Cess assessments" },
    { id: "inspections", label: "Inspections" },
];
export function LabourRegisters({ registers, onOpen, }) {
    const [tab, setTab] = useState("establishments");
    const current = registers[tab];
    return (_jsxs("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]", children: [_jsxs("div", { className: "border-b border-[color:var(--c-border-ffeae1)] px-5 py-4", children: [_jsx("h2", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: "Operational registers" }), _jsx("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: current.caption }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", role: "tablist", "aria-label": "Registers", children: tabs.map((item) => (_jsx("button", { type: "button", role: "tab", "aria-selected": tab === item.id, className: `rounded-full px-3 py-1.5 text-sm font-semibold ${tab === item.id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffeee7)] text-[color:var(--c-text-461220)]"}`, onClick: () => setTab(item.id), children: item.label }, item.id))) })] }), _jsx(DataTable, { columns: current.columns, rows: current.rows, action: { label: "View details", onClick: (row) => onOpen(tab, row.id) } })] }));
}
