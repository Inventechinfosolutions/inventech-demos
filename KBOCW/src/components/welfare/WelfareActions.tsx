import { StatusBadge } from "@/components/dashboard/StatusBadge"
import type { WelfareAction } from "@/types/welfare"

export function WelfareActions({ items, onSelect }: { items: WelfareAction[]; onSelect: (id: string) => void }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-[color:var(--c-text-461220)]">{item.title}</h3>
            <StatusBadge value={item.severity} />
          </div>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Count</dt>
              <dd className="font-semibold text-[color:var(--c-text-461220)] tabular-nums">{item.countLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Source</dt>
              <dd className="font-medium text-[color:var(--c-text-461220)]">{item.source}</dd>
            </div>
          </dl>
          <button type="button" className="mt-3 self-start text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => onSelect(item.id)}>
            Open records
          </button>
        </li>
      ))}
    </ul>
  )
}
