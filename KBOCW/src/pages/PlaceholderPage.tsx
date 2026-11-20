import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { formatLongDate } from "@/lib/format"
import { findNavItem } from "@/lib/nav"

const labels: Record<string, string> = {
  financialYear: "Financial year",
  from: "From",
  to: "To",
  districtId: "District",
  talukId: "Taluk",
  category: "Establishment category",
  projectStatus: "Project status",
  cessStatus: "Cess status",
  inspectionStatus: "Inspection status",
  membershipStatus: "Membership status",
  scheme: "Scheme",
  applicationStatus: "Application status",
  paymentStatus: "Payment status",
  departmentId: "Department",
  severity: "Accident severity",
  complianceStatus: "Compliance status",
  boilerStatus: "Boiler inspection status",
}

function present(key: string, value: string) {
  if (key === "from" || key === "to") {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatLongDate(value) : value
  }
  if (key === "financialYear") return value
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function PlaceholderPage() {
  const location = useLocation()
  const match = findNavItem(location.pathname)
  const title = match?.item.label ?? "Dashboard"
  const params = new URLSearchParams(location.search)
  const carried = Object.keys(labels)
    .map((key) => ({ key, value: params.get(key) }))
    .filter((item): item is { key: string; value: string } => Boolean(item.value && item.value !== "all"))

  useEffect(() => {
    document.title = `KBOCW · ${title}`
  }, [title])

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-6 py-8 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
      <p className="text-sm font-semibold text-[color:var(--c-text-8c2f39)]">{match?.group.label ?? "Portal"}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">{title}</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        This view is reserved for a later dashboard. The Secretary overview, the Labour Commissionerate dashboard, the KBOCW Welfare Board dashboard, the Factories & Boilers dashboard, the Gig Workers Welfare Board dashboard, the Unorganised Workers Social Security Board dashboard, and the Cross-Department Intelligence dashboard are available in this build. The navigation entry is in place so the next dashboard can be connected without changing the portal shell.
      </p>
      {carried.length > 0 ? (
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-[color:var(--c-text-461220)]">Scope carried from the previous view</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {carried.map((item) => (
              <div key={item.key}>
                <dt className="text-sm text-slate-500">{labels[item.key]}</dt>
                <dd className="text-sm font-medium text-[color:var(--c-text-461220)]">{present(item.key, item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className="inline-flex h-10 items-center rounded-lg bg-[color:var(--c-bg-461220)] px-4 text-sm font-semibold text-white">
          Open Secretary Dashboard
        </Link>
        <Link to={`/departments/labour-commissionerate${location.search}`} className="inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]">
          Open Labour Commissionerate
        </Link>
        <Link to={`/departments/kbocw-welfare-board${location.search}`} className="inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]">
          Open KBOCW Welfare Board
        </Link>
        <Link to={`/departments/factories-boilers${location.search}`} className="inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]">
          Open Factories & Boilers
        </Link>
        <Link to={`/intelligence/cross-analytics${location.search}`} className="inline-flex h-10 items-center rounded-lg border border-[color:var(--c-border-b23a48)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]">
          Open Cross-Department Intelligence
        </Link>
      </div>
    </section>
  )
}
