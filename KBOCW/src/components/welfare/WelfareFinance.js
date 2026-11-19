import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const items = [
    { key: "available", label: "Available funds" },
    { key: "allocated", label: "Allocated funds" },
    { key: "approved", label: "Approved assistance" },
    { key: "disbursed", label: "Disbursed assistance" },
    { key: "remaining", label: "Remaining balance" },
];
export function WelfareFinance({ finance }) {
    return (_jsxs("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-fff8f4)] px-4 py-4", children: [_jsx("dl", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-5", children: items.map((item) => (_jsxs("div", { children: [_jsx("dt", { className: "text-[12px] font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase", children: item.label }), _jsx("dd", { className: "mt-1 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums", children: finance[item.key] })] }, item.key))) }), _jsx("p", { className: "mt-4 max-w-4xl text-sm leading-6 text-[color:var(--c-text-86646d)]", children: finance.definition })] }));
}
