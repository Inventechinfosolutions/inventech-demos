import type { ReactNode } from "react"
import { VIZ_LABELS, VIZ_ORDER, vizIssue, vizRequirement } from "@/analytics/engine"
import type { ReportDefinition, VizType } from "@/analytics/types"

const SHORT: Record<VizType, string> = {
  kpi: "KPI card",
  bar: "Bar",
  column: "Column",
  stacked: "Stacked bar",
  line: "Line",
  area: "Area",
  pie: "Pie",
  donut: "Donut",
  combo: "Combo",
  scatter: "Scatter",
  funnel: "Funnel",
  heatmap: "Heatmap",
  table: "Data table",
  pivot: "Pivot table",
  map: "District map",
}

const ICONS: Record<VizType, ReactNode> = {
  kpi: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M7 14.5h6M7 10h3" />
    </>
  ),
  bar: <path d="M4 6h11M4 12h15M4 18h7" strokeWidth="3" />,
  column: <path d="M6 20v-8M12 20V5M18 20v-5" strokeWidth="3" />,
  stacked: (
    <>
      <path d="M4 7h14M4 13h9M4 19h12" strokeWidth="3" />
      <path d="M18 7h2M13 13h4M16 19h3" strokeWidth="3" opacity=".45" />
    </>
  ),
  line: <path d="M3.5 17l5-6 5 3 7-9" />,
  area: (
    <>
      <path d="M3.5 17l5-6 5 3 7-9V20h-17z" fill="currentColor" fillOpacity=".18" stroke="none" />
      <path d="M3.5 17l5-6 5 3 7-9" />
    </>
  ),
  pie: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12V3.5M12 12l6.5 5.5" />
    </>
  ),
  donut: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  combo: (
    <>
      <path d="M6 20v-6M12 20V9M18 20v-4" strokeWidth="3" opacity=".5" />
      <path d="M4 10l5-4 5 3 6-5" />
    </>
  ),
  scatter: (
    <>
      <circle cx="7" cy="16" r="1.6" />
      <circle cx="11" cy="10" r="1.6" />
      <circle cx="16" cy="14" r="1.6" />
      <circle cx="18" cy="6.5" r="1.6" />
    </>
  ),
  funnel: <path d="M4 5h16l-5.5 7v6.5l-5-2.5V12z" />,
  heatmap: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" fill="currentColor" fillOpacity=".7" />
      <rect x="13" y="4" width="7" height="7" rx="1" fill="currentColor" fillOpacity=".25" />
      <rect x="4" y="13" width="7" height="7" rx="1" fill="currentColor" fillOpacity=".3" />
      <rect x="13" y="13" width="7" height="7" rx="1" fill="currentColor" fillOpacity=".55" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M3.5 10h17M9.5 5v14M15 5v14" />
    </>
  ),
  pivot: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M3.5 10h17M9 10v9" />
      <path d="M3.5 5h17v5h-17z" fill="currentColor" fillOpacity=".18" stroke="none" />
    </>
  ),
  map: <path d="M4.5 6.5l5-2.5 5 2.5 5-2.5v13.5l-5 2.5-5-2.5-5 2.5z M9.5 4v13.5M14.5 6.5V20" />,
}

export function VizIcon({ type, className = "h-5 w-5" }: { type: VizType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[type]}
    </svg>
  )
}

export function VizPicker({ def, onChange }: { def: ReportDefinition; onChange: (type: VizType) => void }) {
  const current = def.visualization.type
  return (
    <div role="group" aria-label="Visualization type" className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
      {VIZ_ORDER.map((type) => {
        const issue = vizIssue(def, type)
        const selected = current === type
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            title={issue ?? `${VIZ_LABELS[type]}. ${vizRequirement(type)}`}
            onClick={() => onChange(type)}
            className={`relative flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-semibold transition ${
              selected ? "border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]" : issue ? "border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] text-[color:var(--c-text-b19ba1)] hover:border-[color:var(--c-border-e9c6ca)]" : "border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-52212e)] hover:border-[color:var(--c-border-b23a48)]"
            }`}
          >
            <VizIcon type={type} />
            <span className="leading-3 whitespace-nowrap">{SHORT[type]}</span>
            {issue && !selected ? <span aria-hidden className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--c-bg-deabb1)]" /> : null}
          </button>
        )
      })}
    </div>
  )
}
