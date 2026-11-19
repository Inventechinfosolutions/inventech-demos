import { Suspense } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { ILLUSTRATIVE_NOTE } from "@/analytics/catalog"
import { Badge, ToastHost, eyebrowClass } from "@/analytics/components/ui"
import { setCurrentUserId, useCurrentUser } from "@/analytics/session"
import { logAudit } from "@/analytics/store"
import { USERS, userById } from "@/analytics/users"

const NAV = [
  { to: "/analytics", label: "Analytics Home", end: true },
  { to: "/analytics/build-report", label: "Build Report" },
  { to: "/analytics/build-dashboard", label: "Build Dashboard" },
  { to: "/analytics/datasets", label: "Dataset Explorer" },
  { to: "/analytics/reports", label: "Saved Reports" },
  { to: "/analytics/dashboards", label: "Saved Dashboards" },
  { to: "/analytics/recent", label: "Recent Analysis" },
  { to: "/analytics/templates", label: "Report Templates" },
]

export function AnalyticsLayout() {
  const user = useCurrentUser()
  const scope = [user.districtScope ? `${user.districtScope} district only` : null, user.departmentScope ? `${user.departmentScope} only` : null].filter(Boolean)
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className={eyebrowClass}>Interactive analytics</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)] sm:text-[1.7rem]">Self-service analytics workspace</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="brass" title={ILLUSTRATIVE_NOTE}>
            Illustrative data
          </Badge>
          <NavLink
            to="/analytics/help"
            aria-label="How to use analytics"
            title="How to use analytics"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-full border bg-[color:var(--c-bg-ffffff)] transition ${isActive ? "border-[color:var(--c-border-461220)] text-[color:var(--c-text-461220)]" : "border-[color:var(--c-border-fed4c1)] text-[color:var(--c-text-8c2f39)] hover:border-[color:var(--c-border-b23a48)]"}`
            }
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9.5" />
              <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" />
              <path d="M12 17h.01" />
            </svg>
          </NavLink>
          <label className="flex items-center gap-2 text-xs font-semibold text-[color:var(--c-text-86646d)]">
            Viewing as
            <select
              aria-label="Viewing as"
              className="h-9 max-w-[16rem] rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm font-medium text-[color:var(--c-text-461220)]"
              value={user.id}
              onChange={(event) => {
                const next = userById(event.target.value)
                if (!next) return
                setCurrentUserId(next.id)
                logAudit(next, "session.role-changed", "session", next.id, `Demonstration role changed to ${next.name}.`)
              }}
            >
              {USERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {scope.length > 0 ? <p className="mt-2 text-xs text-[color:var(--c-text-8c2f39)]">Role restriction: {scope.join(". ")}. Data outside this scope is never returned.</p> : null}

      <nav aria-label="Analytics sections" className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `h-9 shrink-0 rounded-full border px-3 text-[13px] leading-[2.1rem] font-semibold whitespace-nowrap transition ${isActive ? "border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]" : "border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-663a46)] hover:border-[color:var(--c-border-b23a48)]"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-5">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[color:var(--c-bg-fedfd1)]" aria-label="Loading" />}>
          <Outlet />
        </Suspense>
      </div>
      <p className="mt-8 max-w-3xl text-xs leading-5 text-[color:var(--c-text-9d8189)]">{ILLUSTRATIVE_NOTE}</p>
      <ToastHost />
    </div>
  )
}
