import { Notice, formatDateTime } from "@/analytics/components/ui"
import type { QueryResult } from "@/analytics/types"

/** Source, freshness, applied filters and metric definitions that sit under every result. */
export function ResultMeta({ result, showFilters = true }: { result: QueryResult; showFilters?: boolean }) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--c-border-fee4d8)] pt-3">
      {result.warnings.map((warning) => (
        <Notice key={warning} tone="blue">
          {warning}
        </Notice>
      ))}
      {showFilters && result.appliedFilters.length > 0 ? (
        <p className="text-xs leading-5 text-[color:var(--c-text-663a46)]">
          <span className="font-semibold text-[color:var(--c-text-8c2f39)]">Filters applied: </span>
          {result.appliedFilters.map((filter) => filter.label).join(". ")}.
        </p>
      ) : null}
      <p className="text-xs leading-5 text-[color:var(--c-text-86646d)]">
        <span className="font-semibold text-[color:var(--c-text-663a46)]">Source: </span>
        {result.datasetName}, {result.sourceSystem}. <span className="font-semibold text-[color:var(--c-text-663a46)]">Last sync: </span>
        {formatDateTime(result.lastSync)}. {result.mode === "detail" ? `${result.rows.length.toLocaleString("en-IN")} records.` : `${result.rows.length.toLocaleString("en-IN")} rows from ${result.scannedRows.toLocaleString("en-IN")} records.`} Ran in {result.durationMs} ms.
      </p>
      {result.metrics.length > 0 ? (
        <details className="group rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-[color:var(--c-text-8c2f39)]">Metric definitions ({result.metrics.length})</summary>
          <dl className="mt-2 grid gap-2">
            {result.metrics.map((metric) => (
              <div key={`${metric.id}-${metric.aggregation}`}>
                <dt className="text-xs font-semibold text-[color:var(--c-text-461220)]">
                  {metric.label} <span className="font-normal text-[color:var(--c-text-9d8189)]">({metric.aggregation})</span>
                </dt>
                <dd className="text-xs leading-5 text-[color:var(--c-text-663a46)]">{metric.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  )
}
