import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "react-router-dom";
import { useCurrentUser } from "@/analytics/session";
import { findNavItem } from "@/lib/nav";
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
            : path === "/departments/gig-workers-welfare-board"
                ? { title: "Board Chairperson", office: "Gig Workers Welfare Board" }
            : path === "/departments/ksuwssb"
                ? { title: "Board Secretary", office: "Unorganised Workers Social Security Board" }
            : path === "/departments/kbocw-welfare-board"
            ? { title: "Board Secretary", office: "KBOCW Welfare Board" }
            : path === "/intelligence/cross-analytics"
                ? { title: "Intelligence analyst", office: "Cross-Department Intelligence" }
                : path === "/"
                    ? { title: "Secretary", office: "Labour Department" }
                    : { title: "Authorised officer", office: "KBOCW portal" };
    // The heading follows the dashboard being viewed; the portal name is the fallback.
    const section = path.startsWith("/departments/") || path.startsWith("/intelligence/") ? findNavItem(path)?.item.label : undefined;
    const heading = section ?? (path === "/analytics" || path.startsWith("/analytics/") ? "Interactive Analytics" : "Labour Department Integrated Intelligence Portal");
    return (_jsxs("header", { className: "sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff2ec)]/90 px-4 backdrop-blur sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-3", children: [_jsx("button", { type: "button", className: "rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)] lg:hidden", onClick: onMenu, children: "Menu" }), _jsx("img", { src: `${import.meta.env.BASE_URL}brand/karnataka-emblem.png`, alt: "Government of Karnataka", className: "hidden h-10 w-10 shrink-0 rounded-full bg-black object-contain ring-1 ring-black/10 sm:block" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "line-clamp-2 text-sm font-semibold leading-tight text-[color:var(--c-text-461220)]", children: heading }), _jsx("p", { className: "hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block", children: "Government of Karnataka" })] })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-3", children: [_jsx(ThemeSwitch, {}), _jsxs("div", { className: "hidden max-w-[40%] text-right min-[480px]:block", children: [_jsx("p", { className: "truncate text-sm font-semibold text-[color:var(--c-text-461220)]", children: role.title }), _jsx("p", { className: "hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block", children: role.office })] })] })] }));
}
