import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
export function DetailDrawer({ detail, loading, onClose }) {
    const closeRef = useRef(null);
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();
        const onKey = (event) => {
            if (event.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);
    return (_jsx("div", { className: "fixed inset-0 z-40 flex justify-end bg-[color:var(--c-bg-461220)]/45", role: "presentation", onClick: onClose, children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "detail-title", className: "flex h-full w-full max-w-xl flex-col bg-[color:var(--c-bg-ffffff)] shadow-xl", onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "flex items-start justify-between gap-4 border-b border-[color:var(--c-border-fed9c8)] px-5 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase", children: "Illustrative detail" }), _jsx("h2", { id: "detail-title", className: "mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]", children: detail?.title ?? "Loading detail" })] }), _jsx("button", { ref: closeRef, type: "button", className: "rounded-full border border-[color:var(--c-border-fed4c1)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)]", onClick: onClose, children: "Close" })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-5 py-4", children: loading || !detail ? (_jsx("p", { className: "text-sm text-slate-600", children: "Loading the selected records." })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm leading-6 text-slate-700", children: detail.summary }), _jsx("div", { className: "mt-4", children: _jsx(DataTable, { columns: detail.columns, rows: detail.rows }) }), _jsx("p", { className: "mt-4 text-sm leading-6 text-slate-500", children: detail.note })] })) })] }) }));
}
