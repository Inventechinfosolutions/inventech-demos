import { Link } from "react-router-dom"
import { canAccessDataset } from "@/analytics/access"
import { datasetById } from "@/analytics/catalog"
import { NlqPanel } from "@/analytics/components/NlqPanel"
import { Badge, EmptyState, cardClass, eyebrowClass, timeAgo } from "@/analytics/components/ui"
import { useCurrentUser } from "@/analytics/session"
import { defaultDashboardId, useDb, visibleDashboards, visibleReports } from "@/analytics/store"
import { datasetsFor } from "@/analytics/access"
import { userById } from "@/analytics/users"

const ACTIONS = [
  { to: "/analytics/build-report", title: "Build a report", text: "Pick a dataset, fields and filters, then choose a chart." },
  { to: "/analytics/build-dashboard", title: "Build a dashboard", text: "Arrange saved reports on a grid with shared filters." },
  { to: "/analytics/templates", title: "Start from a template", text: "Ten ready-made reports you can edit." },
  { to: "/analytics/datasets", title: "Explore datasets", text: "Fields, freshness, sources and who can use them." },
]

export default function AnalyticsHomePage() {
  const user = useCurrentUser()
  const db = useDb()
  const reports = visibleReports(user, db)
  const dashboards = visibleDashboards(user, db)
  const defaultId = defaultDashboardId(user.id, db)
  const orderedDashboards = [...dashboards].sort((a, b) => Number(b.id === defaultId) - Number(a.id === defaultId))

  const mine = db.analytics_execution_history.filter((item) => item.userId === user.id)
  const recent: { key: string; reportId: string | null; name: string; datasetId: string; at: string }[] = []
  for (const item of mine) {
    if (item.kind === "preview" && !item.reportId) continue
    const key = item.reportId ?? `${item.kind}:${item.reportName}`
    if (recent.some((entry) => entry.key === key)) continue
    recent.push({ key, reportId: item.reportId, name: item.reportName, datasetId: item.datasetId, at: item.executedAt })
    if (recent.length === 5) break
  }

  const usage = new Map<string, number>()
  for (const item of db.analytics_execution_history) usage.set(item.datasetId, (usage.get(item.datasetId) ?? 0) + 1)
  const common = [...usage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const weekAgo = Date.now() - 7 * 86_400_000
  const stats = [
    { label: "Reports you can open", value: reports.length },
    { label: "Dashboards you can open", value: dashboards.length },
    { label: "Datasets for your role", value: datasetsFor(user).length },
    { label: "Runs in the last 7 days", value: mine.filter((item) => Date.parse(item.executedAt) > weekAgo).length },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3.5">
            <p className="text-xs font-semibold text-[color:var(--c-text-86646d)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} className="group rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 transition hover:border-[color:var(--c-border-b23a48)] hover:shadow-[0_12px_32px_rgb(var(--c-shadow-rgb)/0.07)]">
            <p className="text-sm font-semibold text-[color:var(--c-text-461220)]">
              {action.title} <span aria-hidden className="text-[color:var(--c-text-b23a48)] transition group-hover:translate-x-0.5">→</span>
            </p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--c-text-86646d)]">{action.text}</p>
          </Link>
        ))}
      </div>

      <NlqPanel />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className={`${cardClass} p-5`}>
          <p className={eyebrowClass}>Recently used</p>
          <h2 className="mt-1 text-base font-semibold">Reports and questions</h2>
          {recent.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Nothing yet">Reports you open or run appear here.</EmptyState>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--c-border-ffeae1)]">
              {recent.map((item) => {
                const exists = item.reportId ? reports.some((report) => report.id === item.reportId) : false
                return (
                  <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      {exists ? (
                        <Link to={`/analytics/reports/${item.reportId}`} className="block truncate text-sm font-medium text-[color:var(--c-text-461220)] hover:text-[color:var(--c-text-8c2f39)]">
                          {item.name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium text-[color:var(--c-text-461220)]">{item.name}</p>
                      )}
                      <p className="truncate text-xs text-[color:var(--c-text-9d8189)]">{datasetById(item.datasetId)?.name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[color:var(--c-text-9d8189)]">{timeAgo(item.at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/analytics/recent" className="mt-3 inline-block text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">
            See all recent analysis
          </Link>
        </section>

        <section className={`${cardClass} p-5`}>
          <p className={eyebrowClass}>Saved dashboards</p>
          <h2 className="mt-1 text-base font-semibold">Open a dashboard</h2>
          {orderedDashboards.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No dashboards yet" action={<Link to="/analytics/build-dashboard" className="text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">Build one</Link>} />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--c-border-ffeae1)]">
              {orderedDashboards.slice(0, 4).map((dashboard) => (
                <li key={dashboard.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Link to={`/analytics/dashboards/${dashboard.id}`} className="min-w-0 truncate text-sm font-medium text-[color:var(--c-text-461220)] hover:text-[color:var(--c-text-8c2f39)]">
                      {dashboard.name}
                    </Link>
                    {dashboard.id === defaultId ? <Badge tone="green">Default</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-[color:var(--c-text-9d8189)]">
                    {userById(dashboard.createdBy)?.name}. {db.analytics_dashboard_widgets.filter((widget) => widget.dashboardId === dashboard.id).length} widgets
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/analytics/dashboards" className="mt-3 inline-block text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">
            All saved dashboards
          </Link>
        </section>

        <section className={`${cardClass} p-5`}>
          <p className={eyebrowClass}>Commonly used datasets</p>
          <h2 className="mt-1 text-base font-semibold">Where analysis starts</h2>
          <ul className="mt-3 divide-y divide-[color:var(--c-border-ffeae1)]">
            {common.map(([datasetId, count]) => {
              const dataset = datasetById(datasetId)
              if (!dataset) return null
              const allowed = canAccessDataset(user, dataset)
              return (
                <li key={datasetId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link to={`/analytics/datasets?dataset=${datasetId}`} className="block truncate text-sm font-medium text-[color:var(--c-text-461220)] hover:text-[color:var(--c-text-8c2f39)]">
                      {dataset.name}
                    </Link>
                    <p className="truncate text-xs text-[color:var(--c-text-9d8189)]">{dataset.sourceDepartment}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {allowed ? null : <Badge tone="red">No access</Badge>}
                    <span className="text-xs text-[color:var(--c-text-9d8189)]">{count} runs</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <Link to="/analytics/datasets" className="mt-3 inline-block text-sm font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">
            Open the dataset explorer
          </Link>
        </section>
      </div>
    </div>
  )
}
