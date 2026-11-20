import { useEffect, useState } from "react"
import { GIG_FINANCIAL_YEARS, GIG_QUARTERS, gigQuarterOf, gigYearBounds, sameGigFilters } from "@/lib/gigQuery"
import type { GigFilterOptions, GigFilters } from "@/types/gig"

const field = "h-10 w-full rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm text-[color:var(--c-text-461220)] shadow-[0_1px_1px_rgb(var(--c-shadow-rgb)/0.03)]"
const label = "flex min-w-0 flex-col justify-end gap-1.5 text-sm font-medium text-slate-600"

export function GigFiltersBar({
  options,
  value,
  onApply,
  onReset,
}: {
  options: GigFilterOptions
  value: GigFilters
  onApply: (filters: GigFilters) => void
  onReset: () => void
}) {
  const [draft, setDraft] = useState(value)
  const [more, setMore] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    setDraft(value)
    setProblem(null)
  }, [value])

  const set = (patch: Partial<GigFilters>) => {
    setProblem(null)
    setDraft((current) => ({ ...current, ...patch }))
  }
  const changed = !sameGigFilters(draft, value)
  const cities = draft.districtId === "all" ? options.cities : options.cities.filter((city) => city.districtId === draft.districtId)
  const quarters = options.quarters.filter((quarter) => quarter.financialYear === draft.financialYear)

  function apply() {
    if (!draft.fromDate || !draft.toDate) {
      setProblem("Enter both a start date and an end date.")
      return
    }
    if (draft.fromDate > draft.toDate) {
      setProblem("The start date must not be after the end date.")
      return
    }
    onApply(draft)
  }

  return (
    <form
      className="space-y-3"
      aria-label="Dashboard filters"
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <label className={label}>
          Financial year
          <select
            className={field}
            value={draft.financialYear}
            onChange={(event) => {
              const bounds = gigYearBounds(event.target.value)
              set({ financialYear: event.target.value, fromDate: bounds.from, toDate: bounds.to })
            }}
          >
            {GIG_FINANCIAL_YEARS.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
          </select>
        </label>
        <label className={label}>
          Quarter
          <select
            className={field}
            value={gigQuarterOf(draft)}
            onChange={(event) => {
              const quarter = GIG_QUARTERS.find((item) => item.id === event.target.value)
              if (quarter) set({ financialYear: quarter.financialYear, fromDate: quarter.from, toDate: quarter.to })
              else {
                const bounds = gigYearBounds(draft.financialYear)
                set({ fromDate: bounds.from, toDate: bounds.to })
              }
            }}
          >
            <option value="">Whole year or custom dates</option>
            {quarters.map((quarter) => <option key={quarter.id} value={quarter.id}>{quarter.label}</option>)}
          </select>
        </label>
        <label className={label}>
          From
          <input className={field} type="date" value={draft.fromDate} min="2025-10-01" max="2026-09-30" onChange={(event) => set({ fromDate: event.target.value })} />
        </label>
        <label className={label}>
          To
          <input className={field} type="date" value={draft.toDate} min="2025-10-01" max="2026-09-30" onChange={(event) => set({ toDate: event.target.value })} />
        </label>
        <label className={label}>
          District
          <select
            className={field}
            value={draft.districtId}
            onChange={(event) => set({ districtId: event.target.value, cityId: "all" })}
          >
            <option value="all">All districts</option>
            {options.districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
          </select>
        </label>
        <label className={label}>
          Aggregator
          <select
            className={field}
            value={draft.aggregatorId}
            onChange={(event) => set({ aggregatorId: event.target.value, sectorId: "all" })}
          >
            <option value="all">All aggregators</option>
            {options.aggregators.map((aggregator) => <option key={aggregator.id} value={aggregator.id}>{aggregator.name}</option>)}
          </select>
        </label>
      </div>

      {more ? (
        <div id="gig-more-filters" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <label className={label}>
            City
            <select
              className={field}
              value={draft.cityId}
              onChange={(event) => {
                const city = options.cities.find((item) => item.id === event.target.value)
                set({ cityId: event.target.value, districtId: city ? city.districtId : draft.districtId })
              }}
            >
              <option value="all">All cities</option>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </label>
          <label className={label}>
            Sector
            <select
              className={field}
              value={draft.sectorId}
              onChange={(event) => {
                const mismatch = draft.aggregatorId !== "all" && options.aggregators.find((item) => item.id === draft.aggregatorId)?.sectorId !== event.target.value
                set({ sectorId: event.target.value, aggregatorId: event.target.value === "all" || mismatch ? "all" : draft.aggregatorId })
              }}
            >
              <option value="all">All sectors</option>
              {options.sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
            </select>
          </label>
          <label className={label}>
            Worker activity
            <select className={field} value={draft.activity} onChange={(event) => set({ activity: event.target.value })}>
              <option value="all">All workers</option>
              {options.activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={label}>
            Gender
            <select className={field} value={draft.gender} onChange={(event) => set({ gender: event.target.value })}>
              <option value="all">All genders</option>
              {options.genders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={label}>
            Age group
            <select className={field} value={draft.ageGroup} onChange={(event) => set({ ageGroup: event.target.value })}>
              <option value="all">All age groups</option>
              {options.ageGroups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={label}>
            Welfare scheme
            <select className={field} value={draft.schemeId} onChange={(event) => set({ schemeId: event.target.value })}>
              <option value="all">All schemes</option>
              {options.schemes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.operational ? "" : " (not yet notified)"}</option>)}
            </select>
          </label>
          <label className={label}>
            Grievance category
            <select className={field} value={draft.grievanceCategory} onChange={(event) => set({ grievanceCategory: event.target.value })}>
              <option value="all">All categories</option>
              {options.grievanceCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={`${label} md:col-span-2`}>
            Reporting or reconciliation status
            <select className={field} value={draft.status} onChange={(event) => set({ status: event.target.value })}>
              <option value="all">All statuses</option>
              {options.statusGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={!changed} className="h-10 rounded-lg bg-[color:var(--c-bg-461220)] px-4 text-sm font-semibold text-white disabled:opacity-50">
          Apply filters
        </button>
        <button type="button" className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-4 text-sm font-semibold text-[color:var(--c-text-461220)]" onClick={onReset}>
          Reset filters
        </button>
        <button
          type="button"
          className="h-10 rounded-lg px-3 text-sm font-semibold text-[color:var(--c-text-8c2f39)]"
          aria-expanded={more}
          aria-controls="gig-more-filters"
          onClick={() => setMore((current) => !current)}
        >
          {more ? "Fewer filters" : "More filters"}
        </button>
        {changed && !problem ? <span className="text-sm text-slate-500">Changes are not applied yet.</span> : null}
        {problem ? <span role="alert" className="text-sm font-semibold text-red-700">{problem}</span> : null}
      </div>
    </form>
  )
}
