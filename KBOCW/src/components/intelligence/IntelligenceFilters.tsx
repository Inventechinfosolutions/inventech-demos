import type { IntelligenceFilterOptions, IntelligenceFilters } from "@/types/intelligence"

const field = "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm text-[color:var(--c-text-461220)]"

export function IntelligenceFilters({
  options,
  value,
  updating,
  onChange,
  onReset,
  onExcel,
  onPdf,
}: {
  options: IntelligenceFilterOptions
  value: IntelligenceFilters
  updating: boolean
  onChange: (filters: IntelligenceFilters) => void
  onReset: () => void
  onExcel: () => void
  onPdf: () => void
}) {
  const set = (patch: Partial<IntelligenceFilters>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        <label className="text-sm text-slate-600">
          Financial year
          <select className={`${field} mt-1 w-full`} value={value.financialYear} onChange={(event) => set({ financialYear: event.target.value })}>
            {options.financialYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          From
          <input className={`${field} mt-1 w-full`} type="date" value={value.fromDate} onChange={(event) => set({ fromDate: event.target.value })} />
        </label>
        <label className="text-sm text-slate-600">
          To
          <input className={`${field} mt-1 w-full`} type="date" value={value.toDate} onChange={(event) => set({ toDate: event.target.value })} />
        </label>
        <label className="text-sm text-slate-600">
          District
          <select className={`${field} mt-1 w-full`} value={value.districtId} onChange={(event) => set({ districtId: event.target.value })}>
            <option value="all">All districts</option>
            {options.districts.map((district) => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
        </label>
        <label className="col-span-2 text-sm text-slate-600 md:col-span-1">
          Department
          <select className={`${field} mt-1 w-full`} value={value.departmentId} onChange={(event) => set({ departmentId: event.target.value })}>
            <option value="all">All departments</option>
            {options.departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm font-semibold text-[color:var(--c-text-461220)]" onClick={onReset}>
          Reset filters
        </button>
        <button type="button" className="h-10 rounded-lg border border-[color:var(--c-border-b23a48)] px-3 text-sm font-semibold text-[color:var(--c-text-8c2f39)] disabled:opacity-50" disabled={updating} onClick={onExcel}>
          Export Excel
        </button>
        <button type="button" className="h-10 rounded-lg bg-[color:var(--c-bg-461220)] px-3 text-sm font-semibold text-white disabled:opacity-50" disabled={updating} onClick={onPdf}>
          Export PDF
        </button>
      </div>
    </div>
  )
}
