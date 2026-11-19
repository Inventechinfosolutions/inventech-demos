import type { FactoriesFilterOptions, FactoriesFilters } from "@/types/factories"

const field = "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm text-[color:var(--c-text-461220)] shadow-[0_1px_1px_rgb(var(--c-shadow-rgb)/0.03)]"

export function FactoriesFiltersBar({
  options,
  value,
  onChange,
  onReset,
}: {
  options: FactoriesFilterOptions
  value: FactoriesFilters
  onChange: (filters: FactoriesFilters) => void
  onReset: () => void
}) {
  const set = (patch: Partial<FactoriesFilters>) => onChange({ ...value, ...patch })
  const taluks = value.districtId === "all" ? [] : options.taluks.filter((taluk) => taluk.districtId === value.districtId)
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Financial year
        <select className={`${field} w-full`} value={value.financialYear} onChange={(event) => set({ financialYear: event.target.value })}>
          {options.financialYears.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        From
        <input className={`${field} w-full`} type="date" value={value.fromDate} onChange={(event) => set({ fromDate: event.target.value })} />
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        To
        <input className={`${field} w-full`} type="date" value={value.toDate} onChange={(event) => set({ toDate: event.target.value })} />
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        District
        <select className={`${field} w-full`} value={value.districtId} onChange={(event) => set({ districtId: event.target.value, talukId: "all" })}>
          <option value="all">All districts</option>
          {options.districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Taluk
        <select className={`${field} w-full`} value={value.talukId} disabled={taluks.length === 0} onChange={(event) => set({ talukId: event.target.value })}>
          <option value="all">{taluks.length === 0 ? "Select a district first" : "All taluks"}</option>
          {taluks.map((taluk) => <option key={taluk.id} value={taluk.id}>{taluk.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Category
        <select className={`${field} w-full`} value={value.category} onChange={(event) => set({ category: event.target.value })}>
          <option value="all">All categories</option>
          {options.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Inspection status
        <select className={`${field} w-full`} value={value.inspectionStatus} onChange={(event) => set({ inspectionStatus: event.target.value })}>
          <option value="all">All inspection statuses</option>
          {options.inspectionStatuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Accident severity
        <select className={`${field} w-full`} value={value.severity} onChange={(event) => set({ severity: event.target.value })}>
          <option value="all">All severities</option>
          {options.severities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Compliance status
        <select className={`${field} w-full`} value={value.complianceStatus} onChange={(event) => set({ complianceStatus: event.target.value })}>
          <option value="all">All compliance statuses</option>
          {options.complianceStatuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
        Boiler inspection status
        <select className={`${field} w-full`} value={value.boilerStatus} onChange={(event) => set({ boilerStatus: event.target.value })}>
          <option value="all">All boiler statuses</option>
          {options.boilerStatuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="flex items-end">
        <button type="button" className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 text-sm font-semibold text-[color:var(--c-text-461220)]" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </div>
  )
}
