import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
export function AppShell() {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "min-h-screen bg-[color:var(--c-bg-ffebe3)] text-[color:var(--c-text-461220)]", children: [_jsx(Sidebar, { open: open, onClose: () => setOpen(false) }), _jsxs("div", { className: "min-w-0 lg:pl-64", children: [_jsx(TopBar, { onMenu: () => setOpen(true) }), _jsx("main", { className: "min-w-0 px-4 py-5 sm:px-6 lg:px-8", children: _jsx(Outlet, {}) })] })] }));
}
