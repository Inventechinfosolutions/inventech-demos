import { DEPARTMENTS, DISTRICT_NAMES, FINANCIAL_YEARS } from "@/analytics/catalog"
import { Button, Chip, MultiSelect, fieldClass, labelClass } from "@/analytics/components/ui"
import { defaultGlobalFilters } from "@/analytics/seed"
import type { CrossFilter, FilterCondition, GlobalFilters } from "@/analytics/types"

export const emptyGlobalFilters = (): GlobalFilters => ({ financialYears: [], from: "", to: "", districts: [], departments: [], compare: false })

export const hasGlobalFilters = (global: GlobalFilters) => global.financialYears.length > 0 || Boolean(global.from) || Boolean(global.to) || global.districts.length > 0 || global.departments.length > 0

interface Props {
  global: GlobalFilters
  onChange: (next: GlobalFilters) => void
  onReset: () => void
  /** Hide controls that do not apply, for example when a dataset has no department. */
  hide?: { department?: boolean; district?: boolean; year?: boolean; dates?: boolean }
  note?: string
  resetLabel?: string
}

/** Filters that apply to everything on the page: financial year with comparison, dates, district and department. */
export function RuntimeFilters({ global, onChange, onReset, hide = {}, note, resetLabel = "Reset filters" }: Props) {
  const set = (patch: Partial<GlobalFilters>) => onChange({ ...global, ...patch })
  const toggleYear = (year: string) => {
    const years = global.financialYears.includes(year) ? global.financialYears.filter((item) => item !== year) : [...global.financialYears, year].sort()
    set({ financialYears: years, compare: global.compare && years.length >= 2 })
  }
  const toggleCompare = () => {
    if (global.compare) return set({ compare: false })
    const years = global.financialYears.length >= 2 ? global.financialYears.slice(-2) : ["2024-25", "2025-26"]
    set({ compare: true, financialYears: years })
  }
  return (
    <div className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-3 shadow-[0_8px_28px_rgb(var(--c-shadow-rgb)/0.04)] sm:p-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {hide.year ? null : (
          <div className="min-w-0">
            <p className={`${labelClass} mb-1.5`}>Financial year</p>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Financial year">
              {FINANCIAL_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  aria-pressed={global.financialYears.includes(year)}
                  onClick={() => toggleYear(year)}
                  className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${global.financialYears.includes(year) ? "border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]" : "border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-663a46)] hover:border-[color:var(--c-border-b23a48)]"}`}
                >
                  {year}
                </button>
              ))}
              <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[color:var(--c-text-663a46)]">
                <input type="checkbox" className="h-4 w-4 accent-[color:var(--c-bg-461220)]" checked={global.compare} onChange={toggleCompare} />
                Compare two years
              </label>
            </div>
          </div>
        )}
        {hide.dates ? null : (
          <div className="flex items-end gap-2">
            <label className="block w-[9.5rem]">
              <span className={`${labelClass} mb-1.5 block`}>From</span>
              <input type="date" className={fieldClass} value={global.from} max={global.to || undefined} onChange={(event) => set({ from: event.target.value })} />
            </label>
            <label className="block w-[9.5rem]">
              <span className={`${labelClass} mb-1.5 block`}>To</span>
              <input type="date" className={fieldClass} value={global.to} min={global.from || undefined} onChange={(event) => set({ to: event.target.value })} />
            </label>
          </div>
        )}
        {hide.district ? null : (
          <div className="w-44">
            <p className={`${labelClass} mb-1.5`}>District</p>
            <MultiSelect label="District" searchable allLabel="All districts" options={DISTRICT_NAMES} value={global.districts} onChange={(districts) => set({ districts })} />
          </div>
        )}
        {hide.department ? null : (
          <div className="w-48">
            <p className={`${labelClass} mb-1.5`}>Department</p>
            <MultiSelect label="Department" allLabel="All departments" options={DEPARTMENTS} value={global.departments} onChange={(departments) => set({ departments })} />
          </div>
        )}
        <Button size="sm" onClick={onReset} className="ml-auto">
          {resetLabel}
        </Button>
      </div>
      {global.compare ? <p className="mt-2 text-xs text-[color:var(--c-text-8c2f39)]">Comparing FY {global.financialYears.slice(0, 2).join(" and FY ")}. Charts show one series for each year.</p> : null}
      {note ? <p className="mt-2 text-xs text-[color:var(--c-text-9d8189)]">{note}</p> : null}
    </div>
  )
}

export interface ActiveChip {
  id: string
  label: string
  kind: "global" | "cross" | "widget" | "drill"
  onRemove?: () => void
}

export function globalChips(global: GlobalFilters, onChange: (next: GlobalFilters) => void): ActiveChip[] {
  const chips: ActiveChip[] = []
  if (global.financialYears.length > 0) {
    chips.push({ id: "fy", kind: "global", label: `${global.compare ? "Comparing FY" : "FY"} ${global.financialYears.slice(0, global.compare ? 2 : undefined).join(", ")}`, onRemove: () => onChange({ ...global, financialYears: [], compare: false }) })
  }
  if (global.from || global.to) {
    chips.push({ id: "dates", kind: "global", label: global.from && global.to ? `${global.from} to ${global.to}` : global.from ? `From ${global.from}` : `Up to ${global.to}`, onRemove: () => onChange({ ...global, from: "", to: "" }) })
  }
  if (global.districts.length > 0) chips.push({ id: "districts", kind: "global", label: `District: ${global.districts.join(", ")}`, onRemove: () => onChange({ ...global, districts: [] }) })
  if (global.departments.length > 0) chips.push({ id: "departments", kind: "global", label: `Department: ${global.departments.join(", ")}`, onRemove: () => onChange({ ...global, departments: [] }) })
  return chips
}

export const crossChips = (cross: CrossFilter[], remove: (id: string) => void): ActiveChip[] => cross.map((item) => ({ id: item.id, kind: "cross", label: item.label, onRemove: () => remove(item.id) }))

export const widgetChips = (conditions: FilterCondition[], describe: (condition: FilterCondition) => string, remove: (id: string) => void): ActiveChip[] =>
  conditions.map((condition) => ({ id: condition.id, kind: "widget", label: describe(condition), onRemove: () => remove(condition.id) }))

const chipTone = { global: "brass", cross: "blue", widget: "neutral", drill: "green" } as const

export function ActiveFilterBar({ chips, onReset, emptyText = "No filters applied. Click a bar, slice or table row to filter the rest of the page." }: { chips: ActiveChip[]; onReset?: () => void; emptyText?: string }) {
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5" aria-label="Active filters">
      <span className="mr-1 text-xs font-semibold text-[color:var(--c-text-86646d)]">Active filters</span>
      {chips.length === 0 ? <span className="text-xs text-[color:var(--c-text-9d8189)]">{emptyText}</span> : null}
      {chips.map((chip) => (
        <Chip key={chip.id} tone={chipTone[chip.kind]} onRemove={chip.onRemove} title={chip.kind === "cross" ? "Cross-filter from a chart" : chip.kind === "drill" ? "Drill-down step" : chip.kind === "widget" ? "Widget filter" : "Global filter"}>
          {chip.label}
        </Chip>
      ))}
      {chips.length > 0 && onReset ? (
        <Button size="sm" variant="ghost" onClick={onReset}>
          Clear all
        </Button>
      ) : null}
    </div>
  )
}

export { defaultGlobalFilters }
