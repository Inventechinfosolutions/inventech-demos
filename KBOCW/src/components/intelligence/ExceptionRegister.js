import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatLongDate } from "@/lib/format";
const pageSize = 8;
const statuses = [
    { id: "new", label: "New" },
    { id: "in-review", label: "In review" },
    { id: "awaiting-source", label: "Awaiting source" },
    { id: "closed", label: "Closed" },
];
function matchingLabel(value) {
    if (value === "requires-verification")
        return "Requires verification";
    if (value === "verified")
        return "Verified";
    if (value === "unmatched")
        return "Unmatched";
    return value;
}
function statusLabel(value) {
    return statuses.find((item) => item.id === value)?.label ?? value;
}
export function ExceptionRegister({ rows, domain, onTrace, onStatus, onNote, }) {
    const [query, setQuery] = useState("");
    const [priority, setPriority] = useState("all");
    const [matching, setMatching] = useState("all");
    const [investigation, setInvestigation] = useState("all");
    const [sortKey, setSortKey] = useState("created");
    const [direction, setDirection] = useState("desc");
    const [page, setPage] = useState(0);
    const [openId, setOpenId] = useState(null);
    const [draft, setDraft] = useState("");
    const filtered = useMemo(() => {
        const text = query.trim().toLowerCase();
        const priorityRank = { high: 0, medium: 1, low: 2 };
        const next = rows.filter((row) => {
            if (domain && row.domain !== domain)
                return false;
            if (priority !== "all" && row.priority !== priority)
                return false;
            if (matching !== "all" && row.matching !== matching)
                return false;
            if (investigation !== "all" && row.investigation !== investigation)
                return false;
            if (!text)
                return true;
            return [row.id, row.type, row.entity, row.district, row.sources, row.assigned].join(" ").toLowerCase().includes(text);
        });
        next.sort((a, b) => {
            const left = sortKey === "priority" ? priorityRank[a.priority] : a[sortKey];
            const right = sortKey === "priority" ? priorityRank[b.priority] : b[sortKey];
            const order = String(left).localeCompare(String(right), "en");
            return direction === "asc" ? order : -order;
        });
        return next;
    }, [direction, domain, investigation, matching, priority, query, rows, sortKey]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pageCount - 1);
    const slice = filtered.slice(current * pageSize, current * pageSize + pageSize);
    const open = rows.find((row) => row.id === openId) ?? null;
    function sortBy(key) {
        setPage(0);
        if (sortKey === key)
            setDirection((value) => (value === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setDirection(key === "created" ? "desc" : "asc");
        }
    }
    const header = (key, label) => (_jsx("th", { className: "px-3 py-3 text-left", children: _jsxs("button", { type: "button", className: "font-semibold", onClick: () => sortBy(key), children: [label, sortKey === key ? (direction === "asc" ? " ↑" : " ↓") : ""] }) }));
    return (_jsxs("section", { className: "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: domain === "cess" ? "Cess exception register" : "Intelligence exception register" }), _jsx("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: "Every row points at a source record. Notes and status changes stay in this browser session and are not written to a government system." }), _jsxs("div", { className: "mt-4 grid gap-2 md:grid-cols-4", children: [_jsx("input", { className: "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm md:col-span-1", placeholder: "Search exceptions", value: query, "aria-label": "Search exceptions", onChange: (event) => {
                            setQuery(event.target.value);
                            setPage(0);
                        } }), _jsxs("select", { className: "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm", "aria-label": "Priority", value: priority, onChange: (event) => { setPriority(event.target.value); setPage(0); }, children: [_jsx("option", { value: "all", children: "All priorities" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] }), _jsxs("select", { className: "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm", "aria-label": "Matching status", value: matching, onChange: (event) => { setMatching(event.target.value); setPage(0); }, children: [_jsx("option", { value: "all", children: "All matching statuses" }), _jsx("option", { value: "verified", children: "Verified" }), _jsx("option", { value: "requires-verification", children: "Requires verification" }), _jsx("option", { value: "unmatched", children: "Unmatched" })] }), _jsxs("select", { className: "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm", "aria-label": "Investigation status", value: investigation, onChange: (event) => { setInvestigation(event.target.value); setPage(0); }, children: [_jsx("option", { value: "all", children: "All investigation statuses" }), statuses.map((item) => _jsx("option", { value: item.id, children: item.label }, item.id))] })] }), _jsx("div", { className: "mt-4 overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[980px] border-collapse text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-slate-500", children: [header("id", "Exception ID"), header("type", "Exception type"), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Related entity" }), header("district", "District"), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Source departments" }), header("priority", "Priority"), header("matching", "Matching status"), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Assigned department" }), header("investigation", "Investigation status"), header("created", "Created date"), _jsx("th", { className: "px-3 py-3 text-right font-semibold", children: "Action" })] }) }), _jsx("tbody", { children: slice.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-3 py-6 text-slate-500", colSpan: 11, children: "No exceptions in the selected scope." }) })) : slice.map((row) => (_jsxs("tr", { className: "border-b border-[color:var(--c-border-ffeae1)]", children: [_jsx("td", { className: "px-3 py-3 font-medium", children: row.id }), _jsx("td", { className: "px-3 py-3", children: row.type }), _jsx("td", { className: "px-3 py-3", children: row.entity }), _jsx("td", { className: "px-3 py-3", children: row.district }), _jsx("td", { className: "px-3 py-3", children: row.sources }), _jsx("td", { className: "px-3 py-3", children: _jsx(StatusBadge, { value: row.priority }) }), _jsx("td", { className: "px-3 py-3", children: matchingLabel(row.matching) }), _jsx("td", { className: "px-3 py-3", children: row.assigned }), _jsx("td", { className: "px-3 py-3", children: statusLabel(row.investigation) }), _jsx("td", { className: "px-3 py-3", children: formatLongDate(row.created) }), _jsx("td", { className: "px-3 py-3 text-right", children: _jsx("button", { type: "button", className: "font-semibold text-[color:var(--c-text-8c2f39)]", onClick: () => { setOpenId(row.id); setDraft(""); }, children: "Investigate" }) })] }, row.id))) })] }) }), _jsxs("div", { className: "mt-3 flex items-center justify-between text-sm", children: [_jsxs("p", { className: "text-slate-500", children: [filtered.length, " exceptions"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 py-1.5 font-semibold disabled:opacity-40", disabled: current === 0, onClick: () => setPage(current - 1), children: "Previous" }), _jsxs("span", { className: "px-2 py-1.5", children: ["Page ", current + 1, " of ", pageCount] }), _jsx("button", { type: "button", className: "rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 py-1.5 font-semibold disabled:opacity-40", disabled: current >= pageCount - 1, onClick: () => setPage(current + 1), children: "Next" })] })] }), open ? (_jsxs("div", { className: "mt-4 rounded-lg border border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-fff7f3)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[color:var(--c-text-8c2f39)]", children: open.id }), _jsx("h4", { className: "mt-1 text-lg font-semibold text-[color:var(--c-text-461220)]", children: open.type })] }), _jsx("button", { type: "button", className: "text-sm font-semibold text-[color:var(--c-text-8c2f39)]", onClick: () => onTrace(open.id), children: "Trace source records" })] }), _jsxs("dl", { className: "mt-3 grid gap-3 text-sm sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Related entity" }), _jsx("dd", { className: "font-medium", children: open.entity })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "District" }), _jsx("dd", { className: "font-medium", children: open.district })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Source departments" }), _jsx("dd", { className: "font-medium", children: open.sources })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Assigned department" }), _jsx("dd", { className: "font-medium", children: open.assigned })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Matching status" }), _jsx("dd", { className: "font-medium", children: matchingLabel(open.matching) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Recommended action" }), _jsx("dd", { className: "font-medium", children: open.action })] })] }), _jsxs("label", { className: "mt-4 block text-sm text-slate-600", children: ["Investigation status", _jsx("select", { className: "mt-1 h-10 w-full max-w-xs rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3", value: open.investigation, onChange: (event) => onStatus(open.id, event.target.value), children: statuses.map((item) => _jsx("option", { value: item.id, children: item.label }, item.id)) })] }), _jsx("h5", { className: "mt-4 text-sm font-semibold text-[color:var(--c-text-461220)]", children: "Investigation notes" }), _jsx("ul", { className: "mt-2 space-y-1 text-sm text-[color:var(--c-text-461220)]", children: open.notes.map((note) => _jsx("li", { children: note }, note)) }), _jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [_jsx("input", { className: "h-10 flex-1 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm", value: draft, placeholder: "Add an investigation note", "aria-label": "Investigation note", onChange: (event) => setDraft(event.target.value) }), _jsx("button", { type: "button", className: "h-10 rounded-lg bg-[color:var(--c-bg-461220)] px-3 text-sm font-semibold text-white", onClick: () => {
                                    const note = draft.trim();
                                    if (!note)
                                        return;
                                    onNote(open.id, note);
                                    setDraft("");
                                }, children: "Add note" })] }), _jsx("h5", { className: "mt-4 text-sm font-semibold text-[color:var(--c-text-461220)]", children: "Audit history" }), _jsx("ol", { className: "mt-2 space-y-1 text-sm text-slate-600", children: open.audit.map((entry) => _jsxs("li", { children: [entry.at, ": ", entry.text] }, `${entry.at}-${entry.text}`)) })] })) : null] }));
}
