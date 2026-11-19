import { useEffect, useState } from "react"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { DataTable } from "@/components/dashboard/DataTable"
import { DetailDrawer } from "@/components/dashboard/DetailDrawer"
import { ExceptionRegister } from "@/components/intelligence/ExceptionRegister"
import { IntelligenceFilters as IntelligenceFiltersBar } from "@/components/intelligence/IntelligenceFilters"
import { IntelligenceMap } from "@/components/intelligence/IntelligenceMap"
import { RelationshipExplorer } from "@/components/intelligence/RelationshipExplorer"
import { DEFAULT_INTELLIGENCE_FILTERS, intelligenceQuery, readIntelligenceFilters } from "@/lib/intelligenceQuery"
import { exportIntelligenceExcel, exportIntelligencePdf } from "@/lib/intelligenceExport"
import { financialYearBounds } from "@/lib/period"
import { getIntelligenceDetail, getIntelligenceOverview, loadIntelligenceOptions } from "@/services/intelligenceService"
import type { DetailModel } from "@/types/dashboard"
import type { IntelligenceDrill, IntelligenceException, IntelligenceFilterOptions, IntelligenceFilters, IntelligenceOverview, IntelligenceTopic } from "@/types/intelligence"
import { useSearchParams } from "react-router-dom"

const topics: { id: IntelligenceTopic; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "cess", label: "Cess" },
  { id: "workers", label: "Workers" },
  { id: "welfare", label: "Welfare" },
  { id: "safety", label: "Safety" },
  { id: "relationships", label: "Relationships" },
  { id: "exceptions", label: "Exceptions" },
]

interface CaseState {
  investigation: string
  notes: string[]
  audit: { at: string; text: string }[]
}

export function IntelligenceDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readIntelligenceFilters(searchParams)
  const filterKey = searchParams.toString()
  const [options, setOptions] = useState<IntelligenceFilterOptions | null>(null)
  const [overview, setOverview] = useState<IntelligenceOverview | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState<IntelligenceTopic>("projects")
  const [drill, setDrill] = useState<IntelligenceDrill | null>(null)
  const [detail, setDetail] = useState<DetailModel | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cases, setCases] = useState<Record<string, CaseState>>({})

  useEffect(() => {
    document.title = "KBOCW · Cross-Department Intelligence"
  }, [])

  useEffect(() => {
    let cancelled = false
    loadIntelligenceOptions().then((next) => {
      if (!cancelled) setOptions(next)
    }).catch(() => {
      if (!cancelled) setError("The intelligence filters could not be loaded.")
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const active = readIntelligenceFilters(searchParams)
    let cancelled = false
    setUpdating(true)
    getIntelligenceOverview(active)
      .then((next) => {
        if (!cancelled) {
          setOverview(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("The Cross-Department Intelligence dashboard could not be loaded.")
      })
      .finally(() => {
        if (!cancelled) setUpdating(false)
      })
    return () => {
      cancelled = true
    }
  }, [filterKey, searchParams])

  useEffect(() => {
    if (!drill) return
    const active = readIntelligenceFilters(searchParams)
    let cancelled = false
    setDetailLoading(true)
    getIntelligenceDetail(drill, active)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch(() => {
        if (!cancelled) setDetail({ title: "Detail unavailable", summary: "The selected records could not be loaded.", note: "", columns: [], rows: [] })
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [drill, filterKey, searchParams])

  function applyFilters(next: IntelligenceFilters) {
    if (!next.fromDate || !next.toDate) return
    let value = next
    if (value.financialYear !== filters.financialYear) {
      const bounds = financialYearBounds(value.financialYear)
      value = { ...value, fromDate: bounds.from, toDate: bounds.to }
    }
    if (value.fromDate > value.toDate) value = { ...value, fromDate: value.toDate, toDate: value.fromDate }
    setSearchParams(intelligenceQuery(value), { replace: true })
  }

  function selectDistrict(districtId: string) {
    applyFilters({ ...filters, districtId: filters.districtId === districtId ? "all" : districtId })
  }

  function applyCategory(category?: string) {
    if (!category || !options) return false
    const department = options.departments.find((item) => item.name === category)
    if (department) {
      applyFilters({ ...filters, departmentId: department.id })
      return true
    }
    const district = options.districts.find((item) => item.name === category)
    if (district) {
      selectDistrict(district.id)
      return true
    }
    return false
  }

  function onChart(chartId: string) {
    return (category?: string, series?: string) => {
      if (category && applyCategory(category)) return
      setDrill({ type: "chart", chartId, category, series })
    }
  }

  function withCase(row: IntelligenceException): IntelligenceException {
    const local = cases[row.id]
    return local ? { ...row, investigation: local.investigation, notes: local.notes, audit: local.audit } : row
  }

  function updateCase(id: string, change: (current: CaseState) => CaseState) {
    const base = overview?.exceptions.find((row) => row.id === id)
    if (!base) return
    setCases((previous) => {
      const current = previous[id] ?? { investigation: base.investigation, notes: base.notes, audit: base.audit }
      return { ...previous, [id]: change(current) }
    })
  }

  const exceptions = overview?.exceptions.map(withCase) ?? []

  return (
    <div className="mx-auto min-w-0 max-w-[1440px]">
      <p className="sr-only" aria-live="polite">
        {updating ? "Updating figures." : overview ? `Showing ${overview.scopeLabel}.` : "Loading the Cross-Department Intelligence dashboard."}
      </p>
      <header className="border-b border-[color:var(--c-border-fed9c8)] pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase">Illustrative intelligence workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">Cross-Department Intelligence</h1>
            <p className="mt-1 text-sm text-slate-600">Unified intelligence across departments</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Last data synchronization: {overview?.lastRefreshed ?? "18 Nov 2026, 09:30 IST"}. Source: {overview?.source ?? "Illustrative cross-department extract"}.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{overview?.illustrativeNote}</p>
          </div>
          {options && overview ? (
            <IntelligenceFiltersBar
              options={options}
              value={filters}
              updating={updating}
              onChange={applyFilters}
              onReset={() => setSearchParams(intelligenceQuery(DEFAULT_INTELLIGENCE_FILTERS), { replace: true })}
              onExcel={() => { void exportIntelligenceExcel(overview) }}
              onPdf={() => { void exportIntelligencePdf(overview) }}
            />
          ) : null}
        </div>
      </header>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {overview ? (
        <>
          <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] md:grid-cols-4 xl:grid-cols-8">
            {overview.kpis.map((kpi) => (
              <button
                key={kpi.id}
                type="button"
                className={`border-[color:var(--c-border-fed9c8)] border-r border-b px-3 py-3 text-left ${topic === kpi.topic ? "bg-[color:var(--c-bg-ffeee7)]" : "bg-[color:var(--c-bg-ffffff)]"}`}
                onClick={() => {
                  setTopic(kpi.topic)
                  setDrill({ type: "kpi", kpiId: kpi.id })
                }}
              >
                <span className="block text-xs leading-5 text-slate-500">{kpi.label}</span>
                <span className="mt-1 block text-lg font-semibold text-[color:var(--c-text-461220)] tabular-nums">{kpi.displayValue}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{overview.projectKpiNote} Worker and beneficiary names are masked for this role.</p>

          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav className="flex min-w-0 gap-2 overflow-x-auto lg:flex-col" aria-label="Intelligence topics">
              {topics.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold lg:w-full ${topic === item.id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-461220)] ring-1 ring-[color:var(--c-border-fed9c8)]"}`}
                  onClick={() => setTopic(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="min-w-0 space-y-4">
              {topic === "projects" ? (
                <>
                  <ChartCard chart={overview.charts.projectsByDepartment} onSelect={onChart(overview.charts.projectsByDepartment.id)} />
                  <ChartCard chart={overview.charts.projectMatch} onSelect={onChart(overview.charts.projectMatch.id)} />
                  <IntelligenceMap districts={overview.districts} selectedId={filters.districtId} boundaryNote={overview.boundaryNote} onSelect={selectDistrict} />
                  <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
                    <h3 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Projects requiring cess verification</h3>
                    <p className="mt-1 mb-3 text-sm leading-6 text-slate-600">A project value is not treated as cess-eligible construction cost. These rows still need a cess stage matched from the source record.</p>
                    <DataTable
                      columns={[
                        { key: "Project", label: "Project" },
                        { key: "Department", label: "Department" },
                        { key: "District", label: "District" },
                        { key: "Stage", label: "Cess position" },
                        { key: "Status", label: "Status" },
                      ]}
                      rows={overview.cessReviews.map((row) => ({
                        Reference: row.project,
                        Project: row.project,
                        Department: row.department,
                        District: row.district,
                        Stage: row.stage,
                        Status: row.status,
                      }))}
                      action={{ label: "Trace", onClick: () => setDrill({ type: "kpi", kpiId: "verification" }) }}
                    />
                  </section>
                </>
              ) : null}

              {topic === "cess" ? (
                <>
                  <p className="text-sm leading-6 text-slate-600">{overview.stageNote}</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {overview.cessStages.map((stage) => (
                      <div key={stage.label} className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3">
                        <p className="text-sm text-slate-500">{stage.label}</p>
                        <p className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)] tabular-nums">{stage.displayValue}</p>
                      </div>
                    ))}
                  </div>
                  <ChartCard chart={overview.charts.cessStages} onSelect={onChart(overview.charts.cessStages.id)} />
                  <div className="grid gap-3 lg:grid-cols-2">
                    <article className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
                      <h3 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Collected but not remitted</h3>
                      <p className="mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]">{overview.collectedNotRemitted ?? "Not calculated"}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {overview.collectedNotRemitted
                          ? "This difference is a reconciliation item. It is not a fifth cess stage and it is not added to the four stages."
                          : "This view does not hold both the collection record and the remittance record, so the difference is not calculated."}
                      </p>
                    </article>
                    <article className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
                      <h3 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Remitted but not credited</h3>
                      <p className="mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]">{overview.remittedNotCredited ?? "Not calculated"}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {overview.remittedNotCredited
                          ? "Remittance and credit stay separate. The difference is not added to either stage."
                          : "This view does not hold both the remittance record and the credit record, so the difference is not calculated."}
                      </p>
                    </article>
                  </div>
                  <ChartCard chart={overview.charts.cessDistrict} onSelect={onChart(overview.charts.cessDistrict.id)} />
                  <ExceptionRegister
                    rows={exceptions}
                    domain="cess"
                    onTrace={(id) => setDrill({ type: "exception", exceptionId: id })}
                    onStatus={(id, status) => updateCase(id, (current) => ({ ...current, investigation: status, audit: [...current.audit, { at: "This session", text: `Status set to ${status}.` }] }))}
                    onNote={(id, note) => updateCase(id, (current) => ({ ...current, notes: [...current.notes, note], audit: [...current.audit, { at: "This session", text: "Investigation note added." }] }))}
                  />
                </>
              ) : null}

              {topic === "workers" ? (
                <>
                  <p className="text-sm leading-6 text-slate-600">{overview.workerNote}</p>
                  <ChartCard chart={overview.charts.workerComparison} onSelect={onChart(overview.charts.workerComparison.id)} />
                  <ChartCard chart={overview.charts.workerMatch} onSelect={onChart(overview.charts.workerMatch.id)} />
                  <ChartCard chart={overview.charts.workerDistrict} onSelect={onChart(overview.charts.workerDistrict.id)} />
                  <ChartCard chart={overview.charts.membership} onSelect={onChart(overview.charts.membership.id)} />
                </>
              ) : null}

              {topic === "welfare" ? (
                <>
                  <p className="text-sm leading-6 text-slate-600">{overview.welfareNote}</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {overview.funnel.map((step, index) => (
                      <div key={step.label} className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] px-4 py-3">
                        <p className="text-xs font-semibold tracking-wide text-[color:var(--c-text-8c2f39)] uppercase">Step {index + 1}</p>
                        <p className="mt-1 text-sm text-slate-500">{step.label}</p>
                        <p className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">{step.displayValue}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {overview.welfareCalls.map((call) => (
                      <article key={call.label} className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
                        <h3 className="text-base font-semibold text-[color:var(--c-text-461220)]">{call.label}</h3>
                        <p className="mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]">{call.displayValue}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{call.note}</p>
                      </article>
                    ))}
                  </div>
                  <ChartCard chart={overview.charts.welfareDistrict} onSelect={onChart(overview.charts.welfareDistrict.id)} />
                </>
              ) : null}

              {topic === "safety" ? (
                <>
                  <p className="text-sm leading-6 text-slate-600">{overview.jurisdictionNote}</p>
                  <ChartCard chart={overview.charts.safetyInspections} onSelect={onChart(overview.charts.safetyInspections.id)} />
                  <ChartCard chart={overview.charts.safetyViolations} onSelect={onChart(overview.charts.safetyViolations.id)} />
                  <div className="grid gap-3 lg:grid-cols-2">
                    {overview.safetyCalls.map((call) => (
                      <article key={call.label} className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
                        <h3 className="text-base font-semibold text-[color:var(--c-text-461220)]">{call.label}</h3>
                        <p className="mt-2 text-2xl font-semibold text-[color:var(--c-text-461220)]">{call.displayValue}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{call.note}</p>
                      </article>
                    ))}
                  </div>
                  <ChartCard chart={overview.charts.safetyAccidents} onSelect={onChart(overview.charts.safetyAccidents.id)} />
                  <ChartCard chart={overview.charts.safetyDistrict} onSelect={onChart(overview.charts.safetyDistrict.id)} />
                </>
              ) : null}

              {topic === "relationships" ? (
                <RelationshipExplorer
                  entities={overview.entities}
                  relationships={overview.relationships}
                  districtId={filters.districtId}
                  departmentId={filters.departmentId}
                  matchNote={overview.matchNote}
                  onOpen={(entityId) => setDrill({ type: "entity", entityId })}
                />
              ) : null}

              {topic === "exceptions" ? (
                <ExceptionRegister
                  rows={exceptions}
                  onTrace={(id) => setDrill({ type: "exception", exceptionId: id })}
                  onStatus={(id, status) => updateCase(id, (current) => ({ ...current, investigation: status, audit: [...current.audit, { at: "This session", text: `Status set to ${status}.` }] }))}
                  onNote={(id, note) => updateCase(id, (current) => ({ ...current, notes: [...current.notes, note], audit: [...current.audit, { at: "This session", text: "Investigation note added." }] }))}
                />
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {drill ? (
        <DetailDrawer
          detail={detailLoading ? null : detail}
          loading={detailLoading}
          onClose={() => {
            setDrill(null)
            setDetail(null)
          }}
        />
      ) : null}
    </div>
  )
}
