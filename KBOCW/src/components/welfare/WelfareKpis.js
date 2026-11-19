import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const groups = [
    { id: "membership", title: "Membership", rule: "border-[color:var(--c-border-b23a48)]" },
    { id: "coverage", title: "Coverage and applications", rule: "border-[color:var(--c-border-8c2f39)]" },
    { id: "assistance", title: "Financial assistance", rule: "border-[color:var(--c-border-b23a48)]" },
];
export function WelfareKpis({ items, onSelect }) {
    return (_jsx("section", { className: "grid gap-4 lg:grid-cols-3", children: groups.map((group) => (_jsxs("section", { className: `overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] border-l-4 bg-[color:var(--c-bg-ffffff)] ${group.rule}`, children: [_jsx("h2", { className: "border-b border-[color:var(--c-border-ffeae1)] px-4 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: group.title }), _jsx("ul", { children: items
                        .filter((item) => item.group === group.id)
                        .map((item) => (_jsx("li", { className: "border-b border-[color:var(--c-border-ffeae1)] last:border-b-0", children: _jsxs("button", { type: "button", onClick: () => onSelect(item.id), className: "flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[color:var(--c-bg-fff8f4)]", children: [_jsxs("span", { children: [_jsx("span", { className: "block text-sm font-medium text-[color:var(--c-text-461220)]", children: item.label }), _jsx("span", { className: "mt-0.5 block text-[13px] text-slate-500", children: item.hint })] }), _jsx("span", { className: "shrink-0 text-right text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums", children: item.displayValue })] }) }, item.id))) })] }, group.id))) }));
}
