import { useLocation } from "react-router-dom"
import { useCurrentUser } from "@/analytics/session"
import { BrandMark } from "@/components/layout/BrandMark"
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
        : path === "/departments/kbocw-welfare-board"
        ? { title: "Board Secretary", office: "KBOCW Welfare Board" }
        : path === "/intelligence/cross-analytics"
          ? { title: "Intelligence analyst", office: "Cross-Department Intelligence" }
          : path === "/"
            ? { title: "Secretary", office: "KBOCW Board" }
            : { title: "Authorised officer", office: "KBOCW portal" }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff2ec)]/90 px-4 py-2 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button type="button" className="rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)] lg:hidden" onClick={onMenu}>
          Menu
        </button>
        <BrandMark className="hidden h-10 w-10 sm:block" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--c-text-461220)]">
            <span className="sm:hidden">KBOCW Portal</span>
            <span className="hidden sm:inline">KBOCW Integrated Intelligence Portal</span>
          </p>
          <p className="hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block">Government of Karnataka</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeSwitch />
        <div className="max-w-[40%] text-right">
          <p className="truncate text-sm font-semibold text-[color:var(--c-text-461220)]">{role.title}</p>
          <p className="hidden text-[13px] text-[color:var(--c-text-8c2f39)] sm:block">{role.office}</p>
        </div>
      </div>
    </header>
  )
}
