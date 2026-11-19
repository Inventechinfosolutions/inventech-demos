import type { WelfareFinance } from "@/types/welfare"

const items = [
  { key: "available", label: "Available funds" },
  { key: "allocated", label: "Allocated funds" },
  { key: "approved", label: "Approved assistance" },
  { key: "disbursed", label: "Disbursed assistance" },
  { key: "remaining", label: "Remaining balance" },
] as const

export function WelfareFinance({ finance }: { finance: WelfareFinance }) {
  return (
    <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-fff8f4)] px-4 py-4">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.key}>
            <dt className="text-[12px] font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums">{finance[item.key]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-4xl text-sm leading-6 text-[color:var(--c-text-86646d)]">{finance.definition}</p>
    </section>
  )
}
