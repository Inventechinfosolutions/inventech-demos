import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { accessReason, canAccessDataset, canViewRecordDetail, scopeSummary } from "@/analytics/access"
import { AGGREGATION_LABELS, DATASETS, metricById } from "@/analytics/catalog"
import { ResultTable } from "@/analytics/components/VizRenderer"
import { Badge, Button, EmptyState, Notice, cardClass, eyebrowClass, fieldClass, formatDateTime } from "@/analytics/components/ui"
import { runReport } from "@/analytics/engine"
import { getRows } from "@/analytics/seedData"
import { useCurrentUser } from "@/analytics/session"
import { TEMPLATES, blankReport, defaultVisualization } from "@/analytics/templates"
import { ROLE_LABEL } from "@/analytics/users"
import type { Dataset, DatasetField, User } from "@/analytics/types"

const GROUPS: { kind: DatasetField["kind"]; title: string }[] = [
  { kind: "dimension", title: "Dimensions" },
  { kind: "measure", title: "Measures" },
  { kind: "date", title: "Dates" },
  { kind: "calculated", title: "Calculated" },
]

function accessBadge(user: User, dataset: Dataset) {
  if (!canAccessDataset(user, dataset)) return <Badge tone="red">No access</Badge>
  if (dataset.pii && !canViewRecordDetail(user, dataset)) return <Badge tone="brass">Aggregated only</Badge>
  return <Badge tone="green">Available</Badge>
}

export default function DatasetExplorerPage() {
  const user = useCurrentUser()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState("")
  const departments = [...new Set(DATASETS.map((dataset) => dataset.sourceDepartment))]
  const list = DATASETS.filter((dataset) => (!department || dataset.sourceDepartment === department) && `${dataset.name} ${dataset.description}`.toLowerCase().includes(query.toLowerCase()))
  const selected = DATASETS.find((dataset) => dataset.id === params.get("dataset")) ?? list[0] ?? null

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className={`${cardClass} p-4`} aria-label="Dataset catalogue">
        <p className={eyebrowClass}>Catalogue</p>
        <h2 className="mt-1 text-base font-semibold">{DATASETS.length} datasets</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input aria-label="Search datasets" className={fieldClass} placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="Source department" className={fieldClass} value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-3 flex max-h-[70vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {list.map((dataset) => (
            <li key={dataset.id}>
              <button
                type="button"
                aria-current={selected?.id === dataset.id}
                onClick={() => setParams({ dataset: dataset.id })}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${selected?.id === dataset.id ? "border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-fff4ef)]" : "border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-ffffff)] hover:border-[color:var(--c-border-b23a48)]"}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-sm font-semibold text-[color:var(--c-text-461220)]">{dataset.name}</span>
                  {accessBadge(user, dataset)}
                </span>
                <span className="mt-0.5 block text-xs text-[color:var(--c-text-86646d)]">{dataset.sourceDepartment}</span>
                <span className="mt-1 block text-xs text-[color:var(--c-text-9d8189)]">
                  {dataset.fields.length} fields. {dataset.freshness}. Synced {formatDateTime(dataset.lastSync)}
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 ? <EmptyState title="No dataset matches">Clear the search or choose another department.</EmptyState> : null}
        </ul>
      </section>

      {selected ? <DatasetDetail key={selected.id} dataset={selected} user={user} /> : null}
    </div>
  )
}

function DatasetDetail({ dataset, user }: { dataset: Dataset; user: User }) {
  const allowed = canAccessDataset(user, dataset)
  const detail = canViewRecordDetail(user, dataset)
  const records = useMemo(() => getRows(dataset.id).length, [dataset.id])
  const scope = scopeSummary(user, dataset)
  const metricIds = [...new Set(dataset.fields.map((field) => field.metricId).filter((value): value is string => Boolean(value)))]
  const sample = useMemo(() => {
    if (!allowed || !detail) return null
    const columns = dataset.fields.filter((field) => !field.identifier && field.kind !== "calculated").slice(0, 7).map((field) => field.id)
    const outcome = runReport({ ...blankReport("", dataset.id), visualization: defaultVisualization("table", { detail: true, detailColumns: columns }) }, user)
    return outcome.ok ? { ...outcome.result, rows: outcome.result.rows.slice(0, 40) } : null
  }, [allowed, detail, dataset, user])
  const templates = TEMPLATES.filter((template) => template.datasetId === dataset.id)

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-label={dataset.name}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={eyebrowClass}>{dataset.sourceDepartment}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">{dataset.name}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--c-text-663a46)]">{dataset.description}</p>
        </div>
        {allowed ? (
          <Link to={`/analytics/build-report?dataset=${dataset.id}`}>
            <Button variant="primary">Build a report</Button>
          </Link>
        ) : (
          <Button disabled>Build a report</Button>
        )}
      </div>

      <div className="mt-4">
        <Notice tone={allowed ? (detail || !dataset.pii ? "green" : "brass") : "red"} title={allowed ? "Your access" : "Access restricted"}>
          {accessReason(user, dataset)}
          {scope.length > 0 ? ` Scope: ${scope.join(". ")}.` : ""}
        </Notice>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Source system", dataset.sourceSystem],
          ["Refresh", dataset.freshness],
          ["Last sync", formatDateTime(dataset.lastSync)],
          ["One row is", dataset.grain],
          ["Records in the extract", records.toLocaleString("en-IN")],
          ["Personal information", dataset.pii ? "Yes. References are masked at source." : "None"],
          ["Roles with access", dataset.access.roles.map((role) => ROLE_LABEL[role]).join(", ")],
          ["Roles that can list records", dataset.access.recordDetail.length ? dataset.access.recordDetail.map((role) => ROLE_LABEL[role]).join(", ") : "None. Grouped figures only."],
          ["Restrictions", [dataset.scope.district ? "District officers see their own district" : "", dataset.scope.department ? "Department roles see their own department" : ""].filter(Boolean).join(". ") || "None"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold text-[color:var(--c-text-86646d)]">{label}</dt>
            <dd className="mt-0.5 text-sm leading-5 text-[color:var(--c-text-461220)]">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-7 text-sm font-semibold text-[color:var(--c-text-461220)]">Fields</h3>
      <div className="mt-2 flex flex-col gap-4">
        {GROUPS.map((group) => {
          const fields = dataset.fields.filter((field) => field.kind === group.kind)
          if (fields.length === 0) return null
          return (
            <div key={group.kind}>
              <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--c-text-8c2f39)] uppercase">
                {group.title} ({fields.length})
              </p>
              <div className="overflow-x-auto rounded-xl border border-[color:var(--c-border-fee2d5)]">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <tbody>
                    {fields.map((field) => {
                      const metric = field.metricId ? metricById(field.metricId) : undefined
                      return (
                        <tr key={field.id} className="border-b border-[color:var(--c-border-ffeae1)] last:border-b-0">
                          <th scope="row" className="w-[28%] px-3 py-2 text-left align-top font-medium text-[color:var(--c-text-461220)]">
                            {field.label}
                          </th>
                          <td className="px-3 py-2 align-top text-xs leading-5 text-[color:var(--c-text-663a46)]">
                            {field.description}
                            {field.ratio ? ` Ratio of ${field.ratio.numerator.replace(/_/g, " ")} to ${field.ratio.denominator.replace(/_/g, " ")}, calculated from totals.` : ""}
                            {field.difference ? ` ${field.difference.minuend.replace(/_/g, " ")} minus ${field.difference.subtrahend.replace(/_/g, " ")}, calculated from totals.` : ""}
                            {metric ? <span className="mt-0.5 block text-[color:var(--c-text-9d8189)]">Allowed: {metric.allowed.map((aggregation) => AGGREGATION_LABELS[aggregation].toLowerCase()).join(", ")}.</span> : null}
                          </td>
                          <td className="w-[24%] px-3 py-2 text-right align-top">
                            <span className="inline-flex flex-wrap justify-end gap-1">
                              {field.sensitive ? <Badge tone="red">Masked</Badge> : null}
                              {field.identifier ? <Badge>Identifier</Badge> : null}
                              {field.conformed ? <Badge tone="blue">Shared field</Badge> : null}
                              {!field.sensitive && !field.identifier && !field.conformed ? <Badge>{field.unit === "inr" ? "Rupees" : field.dataType === "date" ? "Date" : field.dataType === "number" ? "Number" : "Text"}</Badge> : null}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {metricIds.length > 0 ? (
        <>
          <h3 className="mt-7 text-sm font-semibold text-[color:var(--c-text-461220)]">Governed metrics</h3>
          <dl className="mt-2 grid gap-3 md:grid-cols-2">
            {metricIds.map((id) => {
              const metric = metricById(id)
              return metric ? (
                <div key={id} className="rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] px-3 py-2.5">
                  <dt className="text-sm font-semibold text-[color:var(--c-text-461220)]">{metric.label}</dt>
                  <dd className="mt-0.5 text-xs leading-5 text-[color:var(--c-text-663a46)]">{metric.definition}</dd>
                  <dd className="mt-1 text-xs text-[color:var(--c-text-9d8189)]">Owner: {metric.owner}. Default: {AGGREGATION_LABELS[metric.defaultAggregation].toLowerCase()}.</dd>
                </div>
              ) : null
            })}
          </dl>
        </>
      ) : null}

      <h3 className="mt-7 text-sm font-semibold text-[color:var(--c-text-461220)]">Sample records</h3>
      <div className="mt-2">
        {sample ? (
          <ResultTable result={sample} pageSize={8} />
        ) : (
          <EmptyState title={allowed ? "Records are not listed for your role" : "Dataset not available to your role"}>
            {allowed ? "You can group and total this dataset. Individual records stay hidden to protect personal information." : "Switch the viewing role at the top of the page to see how access changes."}
          </EmptyState>
        )}
      </div>

      {templates.length > 0 ? (
        <p className="mt-5 text-sm text-[color:var(--c-text-663a46)]">
          Templates on this dataset:{" "}
          {templates.map((template, index) => (
            <span key={template.id}>
              {index > 0 ? ", " : ""}
              <Link to={`/analytics/build-report?template=${template.id}`} className="font-semibold text-[color:var(--c-text-8c2f39)] hover:underline">
                {template.name}
              </Link>
            </span>
          ))}
          .
        </p>
      ) : null}
    </section>
  )
}
