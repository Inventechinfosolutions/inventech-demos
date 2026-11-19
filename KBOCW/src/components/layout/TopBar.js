import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "react-router-dom";
import { useCurrentUser } from "@/analytics/session";
import { ThemeSwitch } from "@/theme/ThemeSwitch";
export function TopBar({ onMenu }) {
    const path = useLocation().pathname.replace(/\/$/, "") || "/";
    const analyticsUser = useCurrentUser();
    const role = path === "/analytics" || path.startsWith("/analytics/")
        ? { title: analyticsUser.title, office: analyticsUser.department }
        : path === "/departments/labour-commissionerate"
        ? { title: "Labour Commissioner", office: "Labour Department" }
        : path === "/departments/factories-boilers"
            ? { title: "Director", office: "Factories & Boilers" }
            : path === "/departments/kbocw-welfare-board"
            ? { title: "Board Secretary", office: "KBOCW Welfare Board" }
            : path === "/intelligence/cross-analytics"
                ? { title: "Intelligence analyst", office: "Cross-Department Intelligence" }
                : path === "/"
                    ? { title: "Secretary", office: "KBOCW Board" }
                    : { title: "Authorised officer", office: "KBOCW portal" };
    return (_jsxs("header", { className: "sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff2ec)]/90 px-4 backdrop-blur sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-3", children: [_jsx("button", { type: "button", className: "rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)] lg:hidden", onClick: onMenu, children: "Menu" }), _jsx("img", { src: `${import.meta.env.BASE_URL}brand/karnataka-emblem.png`, alt: "Government of Karnataka", className: "hidden h-10 w-10 shrink-0 rounded-full bg-black object-contain ring-1 ring-black/10 sm:block" }), _jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "truncate text-sm font-semibold text-[color:var(--c-text-461220)]", children: [_jsx("span", { className: "sm:hidden", children: "KBOCW Portal" }), _jsx("span", { className: "hidden sm:inline", children: "KBOCW Integrated Intelligence Portal" })] }), _jsx("p", { className: "hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block", children: "Government of Karnataka" })] })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-3", children: [_jsx(ThemeSwitch, {}), _jsxs("div", { className: "max-w-[40%] text-right", children: [_jsx("p", { className: "truncate text-sm font-semibold text-[color:var(--c-text-461220)]", children: role.title }), _jsx("p", { className: "hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block", children: role.office })] })] })] }));
}
