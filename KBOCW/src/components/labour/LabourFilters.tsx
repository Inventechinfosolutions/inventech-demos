import { financialYearBounds } from "@/lib/period"
import type { LabourFilterOptions, LabourFilters } from "@/types/labour"

export function LabourFiltersBar({
  options,
  value,
  updating,
  onChange,
  onReset,
}: {
  options: LabourFilterOptions
  value: LabourFilters
  updating: boolean
  onChange: (filters: LabourFilters) => void
  onReset: () => void
}) {
  const bounds = financialYearBounds(value.financialYear)
  const field = "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm text-[color:var(--c-text-461220)]"
  const taluks = options.taluks.filter((taluk) => taluk.districtId === value.districtId)
  const talukReady = value.districtId !== "all"

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Financial year
          <select className={field} value={value.financialYear} onChange={(event) => onChange({ ...value, financialYear: event.target.value })}>
            {options.financialYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          From date
          <input className={field} type="date" min={bounds.from} max={bounds.to} value={value.fromDate} onChange={(event) => onChange({ ...value, fromDate: event.target.value })} />
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          To date
          <input className={field} type="date" min={bounds.from} max={bounds.to} value={value.toDate} onChange={(event) => onChange({ ...value, toDate: event.target.value })} />
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          District
          <select className={field} value={value.districtId} onChange={(event) => onChange({ ...value, districtId: event.target.value })}>
            <option value="all">All districts</option>
            {options.districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Taluk
          <select className={field} value={talukReady ? value.talukId : "all"} disabled={!talukReady} onChange={(event) => onChange({ ...value, talukId: event.target.value })}>
            <option value="all">{talukReady ? "All taluks" : "Select a district first"}</option>
            {taluks.map((taluk) => (
              <option key={taluk.id} value={taluk.id}>
                {taluk.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Establishment category
          <select className={field} value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
            <option value="all">All categories</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Project status
          <select className={field} value={value.projectStatus} onChange={(event) => onChange({ ...value, projectStatus: event.target.value })}>
            <option value="all">All project statuses</option>
            {options.projectStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Cess status
          <select className={field} value={value.cessStatus} onChange={(event) => onChange({ ...value, cessStatus: event.target.value })}>
            <option value="all">All cess statuses</option>
            {options.cessStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Inspection status
          <select className={field} value={value.inspectionStatus} onChange={(event) => onChange({ ...value, inspectionStatus: event.target.value })}>
            <option value="all">All inspection statuses</option>
            {options.inspectionStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onReset} className="h-10 self-end rounded-lg border border-[color:var(--c-border-fed4c1)] px-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]">
          Reset filters
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        A month is included when it overlaps the selected dates. Taluk names in this extract are illustrative.
        {updating ? " Updating figures." : ""}
      </p>
    </div>
  )
}
