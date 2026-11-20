import { useState } from "react"
import type { GigKpi } from "@/types/gig"

export type Freshness = "current" | "delayed" | "stale"

const FRESHNESS_TEXT: Record<Freshness, string> = {
  current: "Source current",
  delayed: "Source delayed",
  stale: "Source not up to date",
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${26 - ((value - min) / span) * 22}`).join(" ")
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full text-[color:var(--c-series-b23a48)]" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function GigKpiCard({ kpi, freshness, sourceNames, onOpen }: { kpi: GigKpi; freshness: Freshness; sourceNames: string; onOpen: () => void }) {
  const [showDefinition, setShowDefinition] = useState(false)
  const change = kpi.comparison.change
  const arrow = change === null ? "" : change > 0 ? "▲" : change < 0 ? "▼" : "■"
  const changeText = change === null ? "No earlier period to compare" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <h3 className="text-sm font-semibold leading-5 text-[color:var(--c-text-461220)]">{kpi.label}</h3>
        <button
          type="button"
          className="h-6 w-6 shrink-0 rounded-full border border-[color:var(--c-border-fed4c1)] text-xs font-semibold text-[color:var(--c-text-8c2f39)]"
          aria-expanded={showDefinition}
          aria-label={`${showDefinition ? "Hide" : "Show"} definition of ${kpi.label}`}
          onClick={() => setShowDefinition((value) => !value)}
        >
          i
        </button>
      </div>
      {showDefinition ? (
        <div className="mx-4 mt-2 rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2 text-xs leading-5 text-slate-600">
          <p>{kpi.definition}</p>
          <p className="mt-1 font-semibold text-[color:var(--c-text-461220)]">{kpi.basis}</p>
          <p className="mt-1">Source: {sourceNames}</p>
        </div>
      ) : null}
      <button type="button" className="mt-1 flex flex-1 flex-col px-4 pb-3 text-left" onClick={onOpen} aria-label={`${kpi.label}: ${kpi.displayValue}. Open the breakdown`}>
        <span className="text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{kpi.displayValue}</span>
        <span className="mt-1 text-xs text-slate-500">{kpi.period}</span>
        <span className="mt-2 text-sm text-[color:var(--c-text-461220)]" title={kpi.comparison.note}>
          {change === null ? (
            <span className="text-slate-500">{changeText}</span>
          ) : (
            <>
              <span aria-hidden="true">{arrow} </span>
              <span className="font-semibold tabular-nums">{changeText}</span>
              <span className="sr-only">{change > 0 ? " increase" : change < 0 ? " decrease" : " no change"}</span>
              <span className="text-slate-500"> vs {kpi.comparison.label}</span>
            </>
          )}
        </span>
        <span className="mt-2 block">
          <Spark values={kpi.spark} />
        </span>
      </button>
      <div className="border-t border-[color:var(--c-border-ffeae1)] px-4 py-2 text-xs leading-5 text-slate-500">
        <p className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${freshness === "current" ? "bg-[color:var(--c-bg-8c2f39)]" : freshness === "delayed" ? "bg-[color:var(--c-bg-ffffff)] ring-2 ring-[color:var(--c-border-b23a48)]" : "bg-[color:var(--c-bg-ffeee7)] ring-2 ring-[color:var(--c-border-8c2f39)]"}`} />
          {FRESHNESS_TEXT[freshness]}
        </p>
        {kpi.notAffectedBy.length > 0 ? <p>Not affected by: {kpi.notAffectedBy.join(", ")}</p> : null}
      </div>
    </article>
  )
}
