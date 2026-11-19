import { StatusBadge } from "@/components/dashboard/StatusBadge"
import type { LabourQueueItem } from "@/types/labour"

export function LabourQueue({ items, onSelect }: { items: LabourQueueItem[]; onSelect: (id: string) => void }) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] xl:absolute xl:inset-0">
      <div className="border-b border-[color:var(--c-border-ffeae1)] px-5 py-4">
        <h2 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Work queue</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Exceptions for follow-up. An unmatched record stays an item for review. It is not recorded as a confirmed violation.
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="border-b border-[color:var(--c-border-ffeae1)] px-5 py-3 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[color:var(--c-text-461220)]">{item.title}</h3>
              <StatusBadge value={item.severity} />
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-slate-500">Source reference</dt>
                <dd className="font-medium">{item.source}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Count</dt>
                <dd className="font-medium tabular-nums">{item.countLabel}</dd>
              </div>
            </dl>
            <button type="button" className="mt-2 text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => onSelect(item.id)}>
              Open records
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
