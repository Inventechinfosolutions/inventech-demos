import { Link } from "react-router-dom"
import { canAccessDataset } from "@/analytics/access"
import { datasetById, fieldOf } from "@/analytics/catalog"
import { VizIcon } from "@/analytics/components/VizPicker"
import { Badge, Button, cardClass } from "@/analytics/components/ui"
import { VIZ_LABELS, measureLabel } from "@/analytics/engine"
import { useCurrentUser } from "@/analytics/session"
import { TEMPLATES } from "@/analytics/templates"

export default function TemplatesPage() {
  const user = useCurrentUser()
  return (
    <section aria-label="Report templates">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[color:var(--c-text-461220)]">Report templates</h2>
        <p className="text-xs text-[color:var(--c-text-9d8189)]">Each template opens in the builder as an unsaved report. Change any field, filter or chart, then save it as your own.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((template) => {
          const dataset = datasetById(template.datasetId)
          const allowed = dataset ? canAccessDataset(user, dataset) : false
          const dimensions = template.definition.dimensions.map((dimension) => (dataset ? (fieldOf(dataset, dimension.fieldId)?.label ?? dimension.fieldId) : dimension.fieldId))
          const measures = dataset ? template.definition.measures.map((measure) => measureLabel(dataset, measure)) : []
          return (
            <article key={template.id} className={`${cardClass} flex flex-col p-5`}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--c-bg-ffede5)] text-[color:var(--c-text-8c2f39)]">
                  <VizIcon type={template.definition.visualization.type} className="h-5 w-5" />
                </span>
                {allowed ? <Badge tone="green">Available</Badge> : <Badge tone="red">No access</Badge>}
              </div>
              <h3 className="mt-3 text-base font-semibold text-[color:var(--c-text-461220)]">{template.name}</h3>
              <p className="mt-1 text-sm leading-6 text-[color:var(--c-text-663a46)]">{template.description}</p>
              <dl className="mt-3 grid gap-1 text-xs leading-5 text-[color:var(--c-text-86646d)]">
                <div>
                  <dt className="inline font-semibold text-[color:var(--c-text-663a46)]">Dataset: </dt>
                  <dd className="inline">{dataset?.name}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-[color:var(--c-text-663a46)]">Groups by: </dt>
                  <dd className="inline">{dimensions.length ? dimensions.join(", ") : "Totals only"}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-[color:var(--c-text-663a46)]">Measures: </dt>
                  <dd className="inline">{measures.join(", ")}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-[color:var(--c-text-663a46)]">Chart: </dt>
                  <dd className="inline">{VIZ_LABELS[template.definition.visualization.type]}</dd>
                </div>
              </dl>
              {template.note ? <p className="mt-2 text-xs leading-5 text-[color:var(--c-text-8c2f39)]">{template.note}</p> : null}
              <div className="mt-auto pt-4">
                {allowed ? (
                  <Link to={`/analytics/build-report?template=${template.id}`}>
                    <Button variant="primary" size="sm">
                      Use template
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled title="Your role cannot open this dataset">
                    Use template
                  </Button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
