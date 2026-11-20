import type { ReactNode } from "react"

/** Heading for one of the two parts of a department page: the fixed overview, or the filtered view. */
export function ScopeBand({ id, kicker, title, note, as = "h2", children }: { id?: string; kicker: string; title: string; note: string; as?: "h1" | "h2"; children?: ReactNode }) {
  const Heading = as
  return (
    <div id={id} className="scroll-mt-24 border-b border-[color:var(--c-border-fed4c1)] pb-3">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">{kicker}</p>
      <Heading className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">{title}</Heading>
      <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{note}</p>
      {children}
    </div>
  )
}
