import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceDashboard } from "@/pages/IntelligenceDashboard";
import { LabourDashboard } from "@/pages/LabourDashboard";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { SecretaryDashboard } from "@/pages/SecretaryDashboard";
import { WelfareDashboard } from "@/pages/WelfareDashboard";
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
export default function App() {
    return (_jsx(BrowserRouter, { basename: basename, children: _jsx(Routes, { children: _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { index: true, element: _jsx(SecretaryDashboard, {}) }), _jsx(Route, { path: "departments/labour-commissionerate", element: _jsx(LabourDashboard, {}) }), _jsx(Route, { path: "departments/kbocw-welfare-board", element: _jsx(WelfareDashboard, {}) }), _jsx(Route, { path: "departments/:slug", element: _jsx(PlaceholderPage, {}) }), _jsx(Route, { path: "intelligence/cross-analytics", element: _jsx(IntelligenceDashboard, {}) }), _jsx(Route, { path: "intelligence/:slug", element: _jsx(PlaceholderPage, {}) }), _jsx(Route, { path: "analytics", element: _jsx(PlaceholderPage, {}) }), _jsx(Route, { path: "integration", element: _jsx(PlaceholderPage, {}) })] }) }) }));
}
