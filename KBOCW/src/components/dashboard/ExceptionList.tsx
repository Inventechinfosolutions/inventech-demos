import { StatusBadge } from "@/components/dashboard/StatusBadge"
import type { ExceptionRow } from "@/types/dashboard"

export function ExceptionList({ items, onSelect }: { items: ExceptionRow[]; onSelect: (id: string) => void }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[color:var(--c-text-461220)]">Needs attention</h2>
          <p className="mt-1 text-sm leading-5 text-[color:var(--c-text-86646d)]">Items for review. None of these is a confirmed violation.</p>
        </div>
        <span className="rounded-full bg-[color:var(--c-bg-ffeee7)] px-2.5 py-1 text-xs font-semibold text-[color:var(--c-text-8c2f39)] tabular-nums">{items.length}</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="border-t border-[color:var(--c-border-ffeae1)] px-5 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[color:var(--c-text-461220)]">{item.title}</h3>
              <StatusBadge value={item.priority} />
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[color:var(--c-text-86646d)]">{item.description}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-[color:var(--c-text-86646d)]">
                {item.sourceDepartment}
                <span className="px-1.5 text-[color:var(--c-text-b23a48)]">·</span>
                <span className="font-medium text-[color:var(--c-text-461220)] tabular-nums">{item.countLabel}</span>
              </p>
              <button type="button" className="shrink-0 text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => onSelect(item.id)}>
                View
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
