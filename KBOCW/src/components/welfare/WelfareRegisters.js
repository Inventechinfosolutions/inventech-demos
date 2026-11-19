import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DataTable } from "@/components/dashboard/DataTable";
const order = ["workers", "applications", "disbursements"];
export function WelfareRegisters({ registers, onOpen, }) {
    return (_jsx("div", { className: "space-y-4", children: order.map((key) => {
            const register = registers[key];
            return (_jsxs("section", { className: "overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)]", children: [_jsxs("div", { className: "border-b border-[color:var(--c-border-ffeae1)] px-5 py-4", children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: register.title }), _jsx("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: register.caption })] }), _jsx(DataTable, { columns: register.columns, rows: register.rows, action: { label: "View details", onClick: (row) => onOpen(key, row.id) } })] }, key));
        }) }));
}
