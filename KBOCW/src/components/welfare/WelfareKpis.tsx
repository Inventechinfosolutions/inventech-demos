import type { WelfareKpi } from "@/types/welfare"

const groups = [
  { id: "membership", title: "Membership", rule: "border-[color:var(--c-border-b23a48)]" },
  { id: "coverage", title: "Coverage and applications", rule: "border-[color:var(--c-border-8c2f39)]" },
  { id: "assistance", title: "Financial assistance", rule: "border-[color:var(--c-border-b23a48)]" },
] as const

export function WelfareKpis({ items, onSelect }: { items: WelfareKpi[]; onSelect: (id: string) => void }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {groups.map((group) => (
        <section key={group.id} className={`overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] border-l-4 bg-[color:var(--c-bg-ffffff)] ${group.rule}`}>
          <h2 className="border-b border-[color:var(--c-border-ffeae1)] px-4 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">{group.title}</h2>
          <ul>
            {items
              .filter((item) => item.group === group.id)
              .map((item) => (
                <li key={item.id} className="border-b border-[color:var(--c-border-ffeae1)] last:border-b-0">
                  <button type="button" onClick={() => onSelect(item.id)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[color:var(--c-bg-fff8f4)]">
                    <span>
                      <span className="block text-sm font-medium text-[color:var(--c-text-461220)]">{item.label}</span>
                      <span className="mt-0.5 block text-[13px] text-slate-500">{item.hint}</span>
                    </span>
                    <span className="shrink-0 text-right text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{item.displayValue}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </section>
  )
}
