import { useEffect, useState } from "react"
import { KSU_DATA_END, KSU_DATA_START, KSU_FINANCIAL_YEARS, KSU_QUARTERS } from "@/data/ksuMasters"
import { ksuQuarterOf, ksuYearBounds, sameKsuFilters } from "@/lib/ksuQuery"
import type { KsuFilterOptions, KsuFilters } from "@/types/ksu"

const field = "h-10 w-full rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-3 text-sm text-[color:var(--c-text-461220)] shadow-[0_1px_1px_rgb(var(--c-shadow-rgb)/0.03)]"
const label = "flex min-w-0 flex-col justify-end gap-1.5 text-sm font-medium text-slate-600"

export function KsuFiltersBar({ options, value, onApply, onReset }: { options: KsuFilterOptions; value: KsuFilters; onApply: (filters: KsuFilters) => void; onReset: () => void }) {
  const [draft, setDraft] = useState(value)
  const [more, setMore] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    setDraft(value)
    setProblem(null)
  }, [value])

  const set = (patch: Partial<KsuFilters>) => {
    setProblem(null)
    setDraft((current) => ({ ...current, ...patch }))
  }
  const changed = !sameKsuFilters(draft, value)
  const quarters = KSU_QUARTERS.filter((quarter) => quarter.financialYear === draft.financialYear)
  const benefits = draft.schemeId === "all" ? options.benefitTypes : options.benefitTypes.filter((item) => item.schemeId === draft.schemeId)

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
              const bounds = ksuYearBounds(event.target.value)
              set({ financialYear: event.target.value, fromDate: bounds.from, toDate: bounds.to })
            }}
          >
            {KSU_FINANCIAL_YEARS.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
          </select>
        </label>
        <label className={label}>
          Quarter
          <select
            className={field}
            value={ksuQuarterOf(draft)}
            onChange={(event) => {
              const quarter = KSU_QUARTERS.find((item) => item.id === event.target.value)
              if (quarter) set({ financialYear: quarter.financialYear, fromDate: quarter.from, toDate: quarter.to })
              else {
                const bounds = ksuYearBounds(draft.financialYear)
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
          <input className={field} type="date" value={draft.fromDate} min={KSU_DATA_START} max={KSU_DATA_END} onChange={(event) => set({ fromDate: event.target.value })} />
        </label>
        <label className={label}>
          To
          <input className={field} type="date" value={draft.toDate} min={KSU_DATA_START} max={KSU_DATA_END} onChange={(event) => set({ toDate: event.target.value })} />
        </label>
        <label className={label}>
          District
          <select className={field} value={draft.districtId} onChange={(event) => set({ districtId: event.target.value })}>
            <option value="all">All districts</option>
            {options.districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
          </select>
        </label>
        <label className={label}>
          Scheme
          <select
            className={field}
            value={draft.schemeId}
            onChange={(event) => {
              const mismatch = draft.benefitType !== "all" && options.benefitTypes.find((item) => item.id === draft.benefitType)?.schemeId !== event.target.value
              set({ schemeId: event.target.value, benefitType: event.target.value === "all" || mismatch ? "all" : draft.benefitType })
            }}
          >
            <option value="all">All schemes</option>
            {options.schemes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>

      {more ? (
        <div id="ksu-more-filters" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <label className={`${label} md:col-span-2`}>
            Occupational category
            <select className={field} value={draft.occupationId} onChange={(event) => set({ occupationId: event.target.value })}>
              <option value="all">All occupations</option>
              {options.occupations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={label}>
            Registration status
            <select className={field} value={draft.registrationStatus} onChange={(event) => set({ registrationStatus: event.target.value })}>
              <option value="all">All statuses</option>
              {options.registrationStatuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={`${label} md:col-span-2`}>
            Application or claim status
            <select className={field} value={draft.claimStatus} onChange={(event) => set({ claimStatus: event.target.value })}>
              <option value="all">All statuses</option>
              {options.claimStatuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={`${label} md:col-span-2`}>
            Benefit type
            <select className={field} value={draft.benefitType} onChange={(event) => set({ benefitType: event.target.value })}>
              <option value="all">All benefit types</option>
              {benefits.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.schemeName})</option>)}
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
          <p className="col-span-full text-xs leading-5 text-slate-500">
            Gender and age group are shown only where the Board approves those fields for the executive view. Dates are applied to whole calendar months.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={!changed} className="h-10 rounded-lg bg-[color:var(--c-bg-461220)] px-4 text-sm font-semibold text-white disabled:opacity-50">
          Apply filters
        </button>
        <button type="button" className="h-10 rounded-lg border border-[color:var(--c-border-fed4c1)] px-4 text-sm font-semibold text-[color:var(--c-text-461220)]" onClick={onReset}>
          Reset filters
        </button>
        <button type="button" className="h-10 rounded-lg px-3 text-sm font-semibold text-[color:var(--c-text-8c2f39)]" aria-expanded={more} aria-controls="ksu-more-filters" onClick={() => setMore((current) => !current)}>
          {more ? "Fewer filters" : "More filters"}
        </button>
        {changed && !problem ? <span className="text-sm text-slate-500">Changes are not applied yet.</span> : null}
        {problem ? <span role="alert" className="text-sm font-semibold text-red-700">{problem}</span> : null}
      </div>
    </form>
  )
}
