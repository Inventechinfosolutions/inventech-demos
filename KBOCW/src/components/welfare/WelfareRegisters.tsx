import { DataTable } from "@/components/dashboard/DataTable"
import type { WelfareRegister, WelfareRegisterKey } from "@/types/welfare"

const order: WelfareRegisterKey[] = ["workers", "applications", "disbursements"]

export function WelfareRegisters({
  registers,
  onOpen,
}: {
  registers: Record<WelfareRegisterKey, WelfareRegister>
  onOpen: (register: WelfareRegisterKey, id: string) => void
}) {
  return (
    <div className="space-y-4">
      {order.map((key) => {
        const register = registers[key]
        return (
          <section key={key} className="overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)]">
            <div className="border-b border-[color:var(--c-border-ffeae1)] px-5 py-4">
              <h3 className="text-lg font-semibold text-[color:var(--c-text-461220)]">{register.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{register.caption}</p>
            </div>
            <DataTable columns={register.columns} rows={register.rows} action={{ label: "View details", onClick: (row) => onOpen(key, row.id) }} />
          </section>
        )
      })}
    </div>
  )
}
