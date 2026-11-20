import { useLocation } from "react-router-dom"
import { useCurrentUser } from "@/analytics/session"
import { BrandMark } from "@/components/layout/BrandMark"
import { findNavItem } from "@/lib/nav"
import { ThemeSwitch } from "@/theme/ThemeSwitch"

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const path = useLocation().pathname.replace(/\/$/, "") || "/"
  const analyticsUser = useCurrentUser()
  const role =
    path === "/analytics" || path.startsWith("/analytics/")
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
            : { title: "Authorised officer", office: "KBOCW portal" }

  // The heading follows the dashboard being viewed; the portal name is the fallback.
  const section = path.startsWith("/departments/") || path.startsWith("/intelligence/") ? findNavItem(path)?.item.label : undefined
  const heading = section ?? (path === "/analytics" || path.startsWith("/analytics/") ? "Interactive Analytics" : "Labour Department Integrated Intelligence Portal")

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff2ec)]/90 px-4 py-2 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button type="button" className="rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)] lg:hidden" onClick={onMenu}>
          Menu
        </button>
        <BrandMark className="hidden h-10 w-10 sm:block" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-[color:var(--c-text-461220)]">
            {heading}
          </p>
          <p className="hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block">Government of Karnataka</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeSwitch />
        <div className="hidden max-w-[40%] text-right min-[480px]:block">
          <p className="truncate text-sm font-semibold text-[color:var(--c-text-461220)]">{role.title}</p>
          <p className="hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block">{role.office}</p>
        </div>
      </div>
    </header>
  )
}
