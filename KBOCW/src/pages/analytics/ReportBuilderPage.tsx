import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { accessReason, canAccessDataset, canEditReport } from "@/analytics/access"
import { DATASETS, datasetById } from "@/analytics/catalog"
import { addDefaultMeasure, FieldPicker, GroupingPanel, MeasurePanel, SortPanel } from "@/analytics/components/BuilderPanels"
import { FilterBuilder } from "@/analytics/components/FilterBuilder"
import { JsonDialog, SaveReportDialog } from "@/analytics/components/dialogs"
import { ReportExplorer } from "@/analytics/components/ReportExplorer"
import { Badge, Button, ConfirmDialog, EmptyState, Notice, Section, cardClass, fieldClass, labelClass, notify, Segmented } from "@/analytics/components/ui"
import { VizPicker } from "@/analytics/components/VizPicker"
import { normalize } from "@/analytics/builderModel"
import { validateReport } from "@/analytics/engine"
import { useCurrentUser } from "@/analytics/session"
import { reportDefinition, reportRecord, useDb } from "@/analytics/store"
import { blankReport, definitionFromTemplate, templateById } from "@/analytics/templates"
import type { Dataset, ReportDefinition, VizType } from "@/analytics/types"

export default function ReportBuilderPage() {
  const { reportId } = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const nonce = (location.state as { nonce?: number } | null)?.nonce ?? ""
  return <Builder key={`${reportId ?? "new"}|${search.toString()}|${nonce}`} reportId={reportId} />
}

function startFor(def: ReportDefinition, dataset: Dataset): ReportDefinition {
  const withDimension: ReportDefinition = dataset.defaultDimension ? { ...def, dimensions: [{ fieldId: dataset.defaultDimension }] } : def
  return addDefaultMeasure(withDimension, dataset)
}

function Builder({ reportId }: { reportId?: string }) {
  const user = useCurrentUser()
  const db = useDb()
  const navigate = useNavigate()
  const location = useLocation()
  const [search] = useSearchParams()
  const record = reportId ? reportRecord(reportId, db) : undefined
  const templateId = search.get("template") ?? undefined

  const initial = useMemo<ReportDefinition | null>(() => {
    if (reportId) return reportDefinition(reportId, db)
    const fromState = (location.state as { definition?: ReportDefinition } | null)?.definition
    if (fromState) return { ...fromState, id: "" }
    const template = templateId ? templateById(templateId) : undefined
    if (template) return definitionFromTemplate(template, "")
    const dataset = datasetById(search.get("dataset") ?? "")
    return dataset ? startFor(blankReport("", dataset.id), dataset) : blankReport("")
    // The builder is keyed on its route, so the starting definition is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [def, setDef] = useState<ReportDefinition | null>(initial)
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial))
  const [open, setOpen] = useState({ dataset: true, fields: true, filters: false, grouping: true, measures: true, sorting: false })
  const [dialog, setDialog] = useState<"save" | "json" | "dataset" | null>(null)
  const [pendingDataset, setPendingDataset] = useState<string | null>(null)
  const [tab, setTab] = useState<"configure" | "preview">("configure")

  const dirty = JSON.stringify(def) !== savedJson
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  if (reportId && !record) {
    return (
      <EmptyState title="This report no longer exists" action={<Link to="/analytics/reports"><Button>Back to saved reports</Button></Link>}>
        It may have been deleted. Saved reports are listed under Saved Reports.
      </EmptyState>
    )
  }
  if (reportId && record && !canEditReport(user, record, db.analytics_report_permissions)) {
    return (
      <EmptyState
        title="You can view this report but not edit it"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to={`/analytics/reports/${record.id}`}>
              <Button variant="primary">Open report</Button>
            </Link>
            <Button onClick={() => navigate("/analytics/build-report", { state: { definition: reportDefinition(record.id, db), nonce: Date.now() } })}>Edit a copy</Button>
          </div>
        }
      >
        Only the owner and named editors can change {record.id}. A copy keeps the same fields and filters and belongs to you.
      </EmptyState>
    )
  }
  if (!def) return null

  const dataset = datasetById(def.datasetId)
  const validation = dataset ? validateReport(def, user) : { errors: [], warnings: [] }
  const update = (next: ReportDefinition) => setDef(normalize(next))
  const choose = (datasetId: string) => {
    const next = datasetById(datasetId)
    if (!next || !canAccessDataset(user, next)) return
    const reset = startFor({ ...blankReport(def.id, datasetId), name: def.name, description: def.description, visualization: { ...def.visualization, detail: false, detailColumns: [] } }, next)
    setDef(reset)
  }
  const requestDataset = (datasetId: string) => {
    if (datasetId === def.datasetId) return
    if (dataset && (def.measures.length > 0 || def.dimensions.length > 0 || def.filters.children.length > 0)) setPendingDataset(datasetId)
    else choose(datasetId)
  }
  const changeViz = (type: VizType) => setDef({ ...def, visualization: { ...def.visualization, type } })

  const grouped = [...new Set(DATASETS.map((item) => item.sourceDepartment))].map((department) => ({ department, items: DATASETS.filter((item) => item.sourceDepartment === department) }))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className="block">
            <span className="sr-only">Report name</span>
            <input
              className="w-full max-w-xl rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)] hover:border-[color:var(--c-border-fed4c1)] focus:border-[color:var(--c-border-b23a48)] focus:bg-[color:var(--c-bg-ffffff)]"
              value={def.name}
              placeholder="Untitled report"
              onChange={(event) => setDef({ ...def, name: event.target.value })}
            />
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2 px-1 text-xs text-[color:var(--c-text-86646d)]">
            {record ? (
              <>
                <Badge tone="brass">{record.id}</Badge>
                <Badge tone={record.status === "published" ? "green" : "neutral"}>{record.status === "published" ? "Published" : "Draft"}</Badge>
              </>
            ) : (
              <Badge>New report</Badge>
            )}
            {dirty ? <Badge tone="red">Unsaved changes</Badge> : record ? <span>All changes saved</span> : null}
            {templateId && !record ? <span>Started from a template. Change anything you like.</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {record ? (
            <Link to={`/analytics/reports/${record.id}`}>
              <Button>View report</Button>
            </Link>
          ) : null}
          <Button onClick={() => setDialog("json")}>Definition</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!dataset) return notify("Choose a dataset before saving.", "red")
              if (validation.errors.length > 0) return notify("Fix the highlighted issues before saving.", "red")
              setDialog("save")
            }}
          >
            Save report
          </Button>
        </div>
      </div>

      <div className="mb-3 xl:hidden">
        <Segmented label="Builder view" value={tab} onChange={setTab} options={[{ id: "configure", label: "Configure" }, { id: "preview", label: "Preview" }]} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className={`${cardClass} overflow-hidden ${tab === "configure" ? "" : "hidden xl:block"}`}>
          <Section index={1} title="Dataset" hint={dataset?.name ?? "Choose where the data comes from"} open={open.dataset} onToggle={() => setOpen({ ...open, dataset: !open.dataset })}>
            <label className="block">
              <span className="sr-only">Dataset</span>
              <select className={fieldClass} value={def.datasetId} onChange={(event) => requestDataset(event.target.value)}>
                {def.datasetId ? null : <option value="">Choose a dataset</option>}
                {grouped.map((group) => (
                  <optgroup key={group.department} label={group.department}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id} disabled={!canAccessDataset(user, item)}>
                        {item.name}
                        {canAccessDataset(user, item) ? "" : " (no access)"}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {dataset ? (
              <div className="mt-3 rounded-xl bg-[color:var(--c-bg-ffeee7)] px-3 py-2.5 text-xs leading-5 text-[color:var(--c-text-663a46)]">
                <p>{dataset.description}</p>
                <p className="mt-1.5 text-[color:var(--c-text-86646d)]">
                  <span className="font-semibold text-[color:var(--c-text-663a46)]">Source:</span> {dataset.sourceSystem}. <span className="font-semibold text-[color:var(--c-text-663a46)]">Refresh:</span> {dataset.freshness}.
                </p>
                <p className="mt-1.5 text-[color:var(--c-text-8c2f39)]">{accessReason(user, dataset)}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[color:var(--c-text-86646d)]">Datasets your role cannot open are listed but cannot be chosen. See the Dataset Explorer for details.</p>
            )}
          </Section>

          {dataset ? (
            <>
              <Section index={2} title="Fields" hint="Dimensions, measures, dates and calculated measures" open={open.fields} onToggle={() => setOpen({ ...open, fields: !open.fields })}>
                <FieldPicker def={def} dataset={dataset} onChange={update} onMessage={(message) => notify(message, "brass")} />
              </Section>
              <Section index={3} title="Filters" hint={def.filters.children.length ? `${def.filters.children.length} at top level` : "None yet"} open={open.filters} onToggle={() => setOpen({ ...open, filters: !open.filters })}>
                <FilterBuilder dataset={dataset} value={def.filters} onChange={(filters) => setDef({ ...def, filters })} />
              </Section>
              <Section index={4} title="Grouping" hint={def.dimensions.length ? `${def.dimensions.length} field${def.dimensions.length === 1 ? "" : "s"}` : "Totals only"} open={open.grouping} onToggle={() => setOpen({ ...open, grouping: !open.grouping })}>
                <GroupingPanel def={def} dataset={dataset} onChange={update} onMessage={(message) => notify(message, "brass")} />
              </Section>
              <Section index={5} title="Measures and aggregation" hint={def.measures.length ? `${def.measures.length} selected` : "Choose at least one"} open={open.measures} onToggle={() => setOpen({ ...open, measures: !open.measures })}>
                <MeasurePanel def={def} dataset={dataset} onChange={update} issues={validation.errors} />
              </Section>
              <Section index={6} title="Sorting and display" open={open.sorting} onToggle={() => setOpen({ ...open, sorting: !open.sorting })}>
                <SortPanel def={def} dataset={dataset} user={user} onChange={update} />
              </Section>
            </>
          ) : null}
        </div>

        <div className={`flex min-w-0 flex-col gap-3 ${tab === "preview" ? "" : "hidden xl:flex"}`}>
          {dataset ? (
            <>
              <div className={`${cardClass} p-4`}>
                <p className={`${labelClass} mb-2`}>Visualization. Switching keeps your fields and filters.</p>
                <VizPicker def={def} onChange={changeViz} />
              </div>
              {validation.warnings.map((warning) => (
                <Notice key={warning.code + (warning.fieldId ?? "")} tone="brass">
                  {warning.message}
                </Notice>
              ))}
              <ReportExplorer def={def} logKind="preview" onVizChange={changeViz} />
            </>
          ) : (
            <EmptyState title="Choose a dataset to start">The preview appears here as soon as you pick a dataset and a measure. Start from a template if you want a ready-made report.</EmptyState>
          )}
        </div>
      </div>

      {dialog === "save" ? (
        <SaveReportDialog
          def={def}
          record={record}
          user={user}
          templateId={templateId}
          onClose={() => setDialog(null)}
          onSaved={(id) => {
            setDialog(null)
            setSavedJson(JSON.stringify(def))
            navigate(`/analytics/build-report/${id}`, { replace: true, state: { nonce: Date.now() } })
          }}
        />
      ) : null}
      {dialog === "json" ? (
        <JsonDialog
          def={def}
          canImport
          onClose={() => setDialog(null)}
          onImport={(imported) => {
            const target = datasetById(imported.datasetId)
            if (!target) throw new Error(`The dataset ${imported.datasetId} does not exist.`)
            if (!canAccessDataset(user, target)) throw new Error(`Your role does not have access to ${target.name}.`)
            setDef(normalize({ ...imported, id: def.id }))
          }}
        />
      ) : null}
      {pendingDataset ? (
        <ConfirmDialog
          title="Change dataset?"
          confirmLabel="Change dataset"
          onClose={() => setPendingDataset(null)}
          onConfirm={() => {
            choose(pendingDataset)
            setPendingDataset(null)
          }}
        >
          Fields, filters and sorting belong to the current dataset, so they will be cleared. The name, description and chart type stay.
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
