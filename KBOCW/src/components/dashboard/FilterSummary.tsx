export interface FilterSummaryItem {
  label: string
  value: string
}

/** The headline figures for the current filters, shown right under the filter bar so a change is visible straight away. */
export function FilterSummary({ scope, items, updating }: { scope: string; items: FilterSummaryItem[]; updating?: boolean }) {
  return (
    <section aria-label="Figures for the current filters" className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold text-[color:var(--c-text-461220)]">Figures for the current filters</h3>
        <p className="text-xs text-slate-500">{updating ? "Updating." : scope}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 rounded-xl bg-[color:var(--c-bg-fff8f4)] px-3 py-2">
            <dt className="text-xs leading-4 text-slate-500">{item.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
