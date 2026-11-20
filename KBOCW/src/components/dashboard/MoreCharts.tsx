import { useState, type ReactNode } from "react"

/**
 * Holds the secondary charts of a section behind one control, so the main view stays short.
 * Children mount only when opened, so charts size correctly when they appear.
 */
export function MoreCharts({ count, children, id }: { count: number; children: ReactNode; id: string }) {
  const [open, setOpen] = useState(false)
  if (count <= 0) return null
  return (
    <div className="min-w-0">
      <button
        type="button"
        id={`${id}-toggle`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-5 py-3 text-left text-sm font-semibold text-[color:var(--c-text-8c2f39)] transition hover:border-[color:var(--c-border-b23a48)]"
      >
        <span>{open ? "Hide the other charts" : `Show ${count} more ${count === 1 ? "chart" : "charts"}`}</span>
        <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-toggle`} className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}
