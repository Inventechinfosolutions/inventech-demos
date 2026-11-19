import { useMemo, useState } from "react"
import type { IntelligenceEntity, IntelligenceRelationship } from "@/types/intelligence"

const confidence = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "requires-verification": "border-dashed border-amber-300 bg-amber-50 text-amber-950",
} as const

function statusLabel(status: string) {
  if (status === "verified") return "Verified"
  if (status === "requires-verification") return "Requires verification"
  return status
}

export function RelationshipExplorer({
  entities,
  relationships,
  districtId,
  departmentId,
  matchNote,
  onOpen,
}: {
  entities: IntelligenceEntity[]
  relationships: IntelligenceRelationship[]
  districtId: string
  departmentId: string
  matchNote: string
  onOpen: (entityId: string) => void
}) {
  const visible = useMemo(
    () => entities.filter((entity) => (districtId === "all" || entity.districtId === districtId) && (departmentId === "all" || entity.departmentId === departmentId)),
    [departmentId, districtId, entities],
  )
  const [selectedId, setSelectedId] = useState("project")
  const selected = entities.find((entity) => entity.id === selectedId) ?? visible[0]
  const links = relationships.filter((link) => link.source === selected?.id || link.target === selected?.id)

  return (
    <section className="rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4">
      <h3 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Relationship explorer</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{matchNote}</p>
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex min-w-0 gap-2 overflow-x-auto lg:block lg:space-y-2">
          {(visible.length ? visible : entities).map((entity) => (
            <button
              key={entity.id}
              type="button"
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm lg:block lg:w-full ${entity.id === selected?.id ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffeee7)] text-[color:var(--c-text-461220)]"}`}
              onClick={() => setSelectedId(entity.id)}
            >
              <span className="block font-semibold">{entity.label}</span>
              <span className={`block text-xs ${entity.id === selected?.id ? "text-[color:var(--c-text-ffe8de)]" : "text-slate-500"}`}>{entity.type}</span>
            </button>
          ))}
        </div>
        {selected ? (
          <div>
            <div className="rounded-lg border border-[color:var(--c-border-fed9c8)] p-4">
              <p className="text-sm font-semibold text-[color:var(--c-text-8c2f39)]">{selected.type}</p>
              <h4 className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">{selected.label}</h4>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">Source department</dt>
                  <dd className="text-sm font-medium text-[color:var(--c-text-461220)]">{selected.department}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Source record ID</dt>
                  <dd className="text-sm font-medium text-[color:var(--c-text-461220)]">{selected.sourceRecordId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Source system</dt>
                  <dd className="text-sm font-medium text-[color:var(--c-text-461220)]">{selected.system}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Record date</dt>
                  <dd className="text-sm font-medium text-[color:var(--c-text-461220)]">{selected.recordDate}</dd>
                </div>
              </dl>
              <button type="button" className="mt-4 text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => onOpen(selected.id)}>
                View source record
              </button>
            </div>
            <h4 className="mt-4 text-sm font-semibold text-[color:var(--c-text-461220)]">Connected records</h4>
            <div className="mt-2 space-y-2">
              {links.length === 0 ? <p className="text-sm text-slate-500">No connected records in this extract.</p> : null}
              {links.map((link) => {
                const otherId = link.source === selected.id ? link.target : link.source
                const other = entities.find((entity) => entity.id === otherId)
                const tone = link.verificationStatus === "verified" ? confidence.verified : confidence["requires-verification"]
                return (
                  <article key={link.id} className={`rounded-lg border p-3 ${tone}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold">{other?.label ?? otherId}</p>
                      <span className="text-xs font-semibold tracking-wide uppercase">{statusLabel(link.verificationStatus)}</span>
                    </div>
                    <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-600">Relationship</dt>
                        <dd>{link.relationshipType}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-600">Matching confidence</dt>
                        <dd>{link.matchingConfidence}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-600">Matching method</dt>
                        <dd>{link.matchingMethod}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-600">Source department</dt>
                        <dd>{other?.department}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-600">Source record ID</dt>
                        <dd>{other?.sourceRecordId}</dd>
                      </div>
                    </dl>
                    {other ? (
                      <button type="button" className="mt-3 text-sm font-semibold underline" onClick={() => setSelectedId(other.id)}>
                        Open linked record
                      </button>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No entities fall in the selected scope.</p>
        )}
      </div>
    </section>
  )
}
