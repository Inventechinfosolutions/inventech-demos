import { formatChange } from "@/lib/format"
import type { KpiModel } from "@/types/dashboard"

export function KpiCard({ kpi, onSelect }: { kpi: KpiModel; onSelect: (id: string) => void }) {
  const improved = kpi.change == null ? null : kpi.lowerIsBetter ? kpi.change < 0 : kpi.change > 0
  const tone = kpi.change == null || kpi.change === 0 ? "text-slate-500" : improved ? "text-emerald-700" : "text-red-700"

  return (
    <button
      type="button"
      onClick={() => onSelect(kpi.id)}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-4 text-left shadow-[0_10px_30px_rgb(var(--c-shadow-rgb)/0.05)] transition hover:-translate-y-0.5 hover:border-[color:var(--c-border-b23a48)] hover:shadow-[0_16px_40px_rgb(var(--c-shadow-rgb)/0.08)]"
    >
      <span className="text-[13px] font-medium text-[color:var(--c-text-8c2f39)]">{kpi.label}</span>
      <span className="mt-3 text-2xl leading-none font-semibold tracking-tight text-[color:var(--c-text-461220)] sm:text-3xl">{kpi.displayValue}</span>
      <span className="mt-2 text-sm leading-5 text-slate-500">{kpi.hint}</span>
      <span className={`mt-auto pt-4 text-xs font-semibold ${tone}`}>
        {kpi.change == null ? "No earlier year in this extract" : `${formatChange(kpi.change)} vs previous year`}
      </span>
    </button>
  )
}
