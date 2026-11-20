import { NavLink } from "react-router-dom"
import { BrandMark } from "@/components/layout/BrandMark"
import { NAV } from "@/lib/nav"

// Sections and links hidden from the sidebar for now. Their routes still work.
const HIDDEN_NAV_GROUPS = ["Cross-Department Intelligence"]
const HIDDEN_NAV_ITEMS = [
  "/departments/construction-infrastructure",
  "/departments/cess-financial",
  "/departments/health-social-security",
  "/departments/esis",
  "/departments/groundwater-environmental",
  "/departments/skill-development",
]
const VISIBLE_NAV = NAV.filter((group) => !HIDDEN_NAV_GROUPS.includes(group.label)).map((group) => ({
  ...group,
  items: group.items.filter((item) => !HIDDEN_NAV_ITEMS.includes(item.to)),
}))

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open ? <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-[color:var(--app-scrim)]/50 lg:hidden" onClick={onClose} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[color:var(--app-sidebar)] text-[color:var(--c-text-ffeee7)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-[color:var(--c-border-b23a48)]/30 px-4 py-4">
          <BrandMark className="h-14 w-14 ring-[color:var(--c-border-b23a48)]/40" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[color:var(--app-sidebar-accent)] uppercase">Karnataka</p>
            <p className="mt-0.5 text-base font-semibold leading-5">Labour Department</p>
            <p className="text-xs leading-4 text-[color:var(--c-text-c1b0b5)]">Intelligence Portal</p>
          </div>
        </div>
        <nav className="nav-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboards">
          {VISIBLE_NAV.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-a0868d)] uppercase">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onClose}
                      title={item.label}
                      className={({ isActive }) =>
                        `flex min-h-9 items-center rounded-lg px-3 py-2 text-sm leading-5 ${isActive ? "bg-[color:var(--c-bg-b23a48)]/15 font-semibold text-[color:var(--c-text-ffe8de)]" : "text-[color:var(--c-text-d9cfd2)] hover:bg-white/5"}`
                      }
                    >
                      {item.short ?? item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
