import { financialYearBounds } from "@/lib/period"
import type { WelfareFilterOptions, WelfareFilters } from "@/types/welfare"

export function WelfareFiltersBar({
  options,
  value,
  updating,
  onChange,
  onReset,
}: {
  options: WelfareFilterOptions
  value: WelfareFilters
  updating: boolean
  onChange: (filters: WelfareFilters) => void
  onReset: () => void
}) {
  const bounds = financialYearBounds(value.financialYear)
  const field = "h-9 rounded-md border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff8f4)] px-2.5 text-sm text-[color:var(--c-text-461220)]"
  const taluks = options.taluks.filter((taluk) => taluk.districtId === value.districtId)
  const talukReady = value.districtId !== "all"

  return (
    <section className="rounded-2xl border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-4 py-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          Financial year
          <select className={field} value={value.financialYear} onChange={(event) => onChange({ ...value, financialYear: event.target.value })}>
            {options.financialYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          From date
          <input className={field} type="date" min={bounds.from} max={bounds.to} value={value.fromDate} onChange={(event) => onChange({ ...value, fromDate: event.target.value })} />
        </label>
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          To date
          <input className={field} type="date" min={bounds.from} max={bounds.to} value={value.toDate} onChange={(event) => onChange({ ...value, toDate: event.target.value })} />
        </label>
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
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
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
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
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          Membership status
          <select className={field} value={value.membershipStatus} onChange={(event) => onChange({ ...value, membershipStatus: event.target.value })}>
            <option value="all">All membership statuses</option>
            {options.membershipStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          Scheme
          <select className={field} value={value.scheme} onChange={(event) => onChange({ ...value, scheme: event.target.value })}>
            <option value="all">All schemes</option>
            {options.schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          Application status
          <select className={field} value={value.applicationStatus} onChange={(event) => onChange({ ...value, applicationStatus: event.target.value })}>
            <option value="all">All application statuses</option>
            {options.applicationStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col justify-end gap-1 text-[13px] font-medium text-slate-600">
          Payment status
          <select className={field} value={value.paymentStatus} onChange={(event) => onChange({ ...value, paymentStatus: event.target.value })}>
            <option value="all">All payment statuses</option>
            {options.paymentStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onReset} className="h-9 self-end rounded-md border border-[color:var(--c-border-b23a48)] px-3 text-sm font-semibold text-[color:var(--c-text-8c2f39)]">
          Reset
        </button>
      </div>
      <p className="mt-2 text-[13px] text-slate-500">
        A month is included when it overlaps the selected dates. Taluk names in this extract are illustrative.
        {updating ? " Updating figures." : ""}
      </p>
    </section>
  )
}
