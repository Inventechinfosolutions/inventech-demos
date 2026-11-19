import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const accent = {
    register: "border-t-[color:var(--c-border-461220)]",
    finance: "border-t-[color:var(--c-border-8c2f39)]",
    compliance: "border-t-[color:var(--c-border-b23a48)]",
};
export function LabourKpis({ items, onSelect }) {
    return (_jsx("section", { className: "grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8", children: items.map((item) => (_jsxs("button", { type: "button", onClick: () => onSelect(item.id), className: `flex h-full min-w-0 flex-col rounded-lg border border-[color:var(--c-border-fed9c8)] border-t-4 bg-[color:var(--c-bg-ffffff)] px-3 py-3 text-left shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] transition hover:border-[color:var(--c-border-b23a48)] ${accent[item.group]}`, children: [_jsx("span", { className: "text-[13px] font-medium text-[color:var(--c-text-8c2f39)]", children: item.label }), _jsx("span", { className: "mt-2 text-[1.35rem] leading-none font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: item.displayValue }), _jsx("span", { className: "mt-2 text-[13px] leading-5 text-slate-600", children: item.hint })] }, item.id))) }));
}
