import { financialYearBounds } from "@/lib/period"
import type { DashboardFilters, FilterOptions } from "@/types/dashboard"

export function FilterBar({
  options,
  value,
  onChange,
  onReset,
  updating,
}: {
  options: FilterOptions
  value: DashboardFilters
  onChange: (filters: DashboardFilters) => void
  onReset: () => void
  updating: boolean
}) {
  const bounds = financialYearBounds(value.financialYear)
  const field = "h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff8f4)] px-3 text-sm text-[color:var(--c-text-461220)]"

  return (
    <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto] xl:items-end">
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          Financial year
          <select
            className={field}
            value={value.financialYear}
            onChange={(event) => onChange({ ...value, financialYear: event.target.value })}
          >
            {options.financialYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          From date
          <input
            className={field}
            type="date"
            min={bounds.from}
            max={bounds.to}
            value={value.fromDate}
            onChange={(event) => onChange({ ...value, fromDate: event.target.value })}
          />
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          To date
          <input
            className={field}
            type="date"
            min={bounds.from}
            max={bounds.to}
            value={value.toDate}
            onChange={(event) => onChange({ ...value, toDate: event.target.value })}
          />
        </label>
        <label className="flex flex-col justify-end gap-1.5 text-sm font-medium text-slate-600">
          District
          <select
            className={field}
            value={value.districtId}
            onChange={(event) => onChange({ ...value, districtId: event.target.value })}
          >
            <option value="all">All districts</option>
            {options.districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onReset}
          className="h-10 rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff8f4)] px-4 text-sm font-semibold text-[color:var(--c-text-461220)]"
        >
          Reset filters
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        A month is included when it overlaps the selected dates.
        {updating ? " Updating figures." : ""}
      </p>
    </section>
  )
}
