import { useState } from "react"
import { DataTable } from "@/components/dashboard/DataTable"
import type { LabourRegister, LabourRegisterKey } from "@/types/labour"

const tabs: { id: LabourRegisterKey; label: string }[] = [
  { id: "establishments", label: "Construction establishments" },
  { id: "assessments", label: "Cess assessments" },
  { id: "inspections", label: "Inspections" },
]

export function LabourRegisters({
  registers,
  onOpen,
}: {
  registers: Record<LabourRegisterKey, LabourRegister>
  onOpen: (register: LabourRegisterKey, id: string) => void
}) {
  const [tab, setTab] = useState<LabourRegisterKey>("establishments")
  const current = registers[tab]

  return (
    <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
      <div className="border-b border-[color:var(--c-border-ffeae1)] px-5 py-4">
        <h2 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Operational registers</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{current.caption}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Registers">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === item.id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffeee7)] text-[color:var(--c-text-461220)]"}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <DataTable columns={current.columns} rows={current.rows} action={{ label: "View details", onClick: (row) => onOpen(tab, row.id) }} />
    </section>
  )
}
