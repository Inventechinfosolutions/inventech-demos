import { useMemo, useState } from "react"
import { metricById } from "@/analytics/catalog"
import { buildChart, formatByUnit } from "@/analytics/chartOptions"
import type { ChartPoint } from "@/analytics/chartOptions"
import type { ExecuteResult } from "@/analytics/api"
import { EChart } from "@/analytics/components/EChart"
import type { ClickAnchor } from "@/analytics/components/EChart"
import { Button, EmptyState } from "@/analytics/components/ui"
import { VIZ_LABELS, formatGroupValue } from "@/analytics/engine"
import type { CellValue, QueryResult, ResultColumn, Row, VizType } from "@/analytics/types"

export interface VizProps {
  result: QueryResult
  type: VizType
  showLabels: boolean
  stacked: boolean
  comparison?: ExecuteResult["comparison"]
  onPoint?: (point: ChartPoint, anchor: ClickAnchor) => void
  height?: number | string
  /** Dashboard widget mode: tighter tables and cards. */
  compact?: boolean
}

const cellText = (column: ResultColumn, value: CellValue) => (column.kind === "dimension" ? formatGroupValue(column, value) : formatByUnit(column.unit, value))

function NoRows({ result }: { result: QueryResult }) {
  return (
    <EmptyState title="No records match these filters">
      {result.suppressedGroups > 0
        ? `${result.suppressedGroups} group${result.suppressedGroups === 1 ? " is" : "s are"} hidden because they hold fewer than five records.`
        : "Widen the date range or remove a filter to see figures."}
    </EmptyState>
  )
}

// ---------------------------------------------------------------- KPI

function KpiView({ result, comparison, compact }: Pick<VizProps, "result" | "comparison" | "compact">) {
  const row = result.rows[0]
  const measures = result.columns.filter((column) => column.kind === "measure")
  if (!row) return <NoRows result={result} />
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"}`}>
      {measures.map((column) => {
        const values = comparison?.results.map((outcome) => (outcome.ok ? (outcome.result.rows[0]?.[column.id] ?? null) : null))
        const first = values?.[0]
        const second = values?.[1]
        const change = typeof first === "number" && typeof second === "number" && first !== 0 ? ((second - first) / Math.abs(first)) * 100 : null
        return (
          <div key={column.id} className={compact ? "px-1 py-0.5" : "rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] px-4 py-4"}>
            <p className="text-xs font-semibold text-[color:var(--c-text-86646d)]">{column.label}</p>
            {comparison && values ? (
              <>
                <div className="mt-2 space-y-1">
                  {comparison.years.map((year, index) => (
                    <div key={year} className="flex items-baseline justify-between gap-3">
                      <span className="text-xs text-[color:var(--c-text-9d8189)]">FY {year}</span>
                      <span className={`font-semibold tabular-nums ${index === 1 ? "text-xl text-[color:var(--c-text-461220)]" : "text-base text-[color:var(--c-text-86646d)]"}`}>{formatByUnit(column.unit, values[index])}</span>
                    </div>
                  ))}
                </div>
                {change != null ? (
                  <p className={`mt-2 text-xs font-semibold ${change >= 0 ? "text-[color:var(--c-text-8c2f39)]" : "text-[color:var(--c-text-8c2f39)]"}`}>
                    {change >= 0 ? "Up" : "Down"} {Math.abs(change).toLocaleString("en-IN", { maximumFractionDigits: 1 })}% on FY {comparison.years[0]}
                  </p>
                ) : null}
              </>
            ) : (
              <p className={`mt-1.5 font-semibold tracking-tight text-[color:var(--c-text-461220)] tabular-nums ${compact ? "text-2xl" : "text-3xl"}`}>{formatByUnit(column.unit, row[column.id])}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- data table

export function ResultTable({ result, compact, onPoint, pageSize = 12 }: { result: QueryResult; compact?: boolean; onPoint?: VizProps["onPoint"]; pageSize?: number }) {
  const [sort, setSort] = useState<{ id: string; direction: "asc" | "desc" } | null>(null)
  const [page, setPage] = useState(0)
  const rows = useMemo(() => {
    if (!sort) return result.rows
    const sign = sort.direction === "asc" ? 1 : -1
    return [...result.rows].sort((a, b) => {
      const left = a[sort.id]
      const right = b[sort.id]
      if (left == null) return 1
      if (right == null) return -1
      return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "en", { numeric: true })) * sign
    })
  }, [result.rows, sort])
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages - 1)
  const shown = compact ? rows : rows.slice(current * pageSize, (current + 1) * pageSize)
  if (result.rows.length === 0) return <NoRows result={result} />
  const interactive = Boolean(onPoint) && result.mode === "aggregate"
  const click = (event: React.MouseEvent, row: Row) => {
    if (!onPoint) return
    const point: ChartPoint = {}
    for (const column of result.columns) if (column.kind === "dimension") point[column.id] = String(row[column.id] ?? "")
    onPoint(point, { x: event.clientX, y: event.clientY })
  }
  return (
    <div>
      <div className={`overflow-auto rounded-xl border border-[color:var(--c-border-fee2d5)] ${compact ? "max-h-full" : "max-h-[460px]"}`}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[color:var(--c-bg-ffeee7)]">
            <tr>
              {result.columns.map((column) => (
                <th key={column.id} scope="col" aria-sort={sort?.id === column.id ? (sort.direction === "asc" ? "ascending" : "descending") : "none"} className={`border-b border-[color:var(--c-border-fed9c8)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[color:var(--c-text-663a46)] ${column.kind === "measure" ? "text-right" : "text-left"}`}>
                  <button type="button" onClick={() => setSort((value) => (value?.id === column.id ? (value.direction === "asc" ? { id: column.id, direction: "desc" } : null) : { id: column.id, direction: "asc" }))} className="inline-flex items-center gap-1 hover:text-[color:var(--c-text-8c2f39)]">
                    {column.label}
                    <span aria-hidden className="text-[10px] text-[color:var(--c-text-b19ba1)]">
                      {sort?.id === column.id ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={index} className={`border-b border-[color:var(--c-border-ffeae1)] last:border-b-0 ${interactive ? "cursor-pointer hover:bg-[color:var(--c-bg-fff4ef)]" : "hover:bg-[color:var(--c-bg-fff8f4)]"}`} onClick={interactive ? (event) => click(event, row) : undefined}>
                {result.columns.map((column) => (
                  <td key={column.id} className={`px-3 py-2 whitespace-nowrap tabular-nums ${column.kind === "measure" ? "text-right text-[color:var(--c-text-461220)]" : "text-left text-[color:var(--c-text-52212e)]"}`}>
                    {cellText(column, row[column.id] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && pages > 1 ? (
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[color:var(--c-text-86646d)]">
          <span>
            Rows {current * pageSize + 1} to {Math.min(rows.length, (current + 1) * pageSize)} of {rows.length.toLocaleString("en-IN")}
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------- pivot

const canTotal = (column: ResultColumn) => {
  const metric = column.metricId ? metricById(column.metricId) : undefined
  if (column.aggregation === "count") return true
  if (column.aggregation !== "sum") return false
  return metric ? metric.additive && !metric.requiresSingleYear : false
}

function PivotView({ result, compact, onPoint }: Pick<VizProps, "result" | "compact" | "onPoint">) {
  const dimensions = result.columns.filter((column) => column.kind === "dimension")
  const measures = result.columns.filter((column) => column.kind === "measure")
  if (result.rows.length === 0) return <NoRows result={result} />
  const rowColumn = dimensions[0]
  const colColumn = dimensions[1]
  const unique = (id: string) => {
    const seen: CellValue[] = []
    for (const row of result.rows) if (!seen.includes(row[id])) seen.push(row[id])
    return seen
  }
  const rowKeys = rowColumn ? unique(rowColumn.id) : []
  const colKeys = colColumn ? unique(colColumn.id).sort((a, b) => String(a).localeCompare(String(b), "en", { numeric: true })) : []
  const measure = measures[0]
  const lookup = (rowKey: CellValue, colKey: CellValue) => result.rows.find((row) => row[rowColumn.id] === rowKey && (!colColumn || row[colColumn.id] === colKey))?.[measure.id] ?? null

  const click = (event: React.MouseEvent, rowKey: CellValue, colKey?: CellValue) => {
    if (!onPoint) return
    const point: ChartPoint = { [rowColumn.id]: String(rowKey ?? "") }
    if (colColumn && colKey !== undefined) point[colColumn.id] = String(colKey ?? "")
    onPoint(point, { x: event.clientX, y: event.clientY })
  }

  const totals = canTotal(measure)
  const numbers = result.rows.map((row) => row[measure.id]).filter((value): value is number => typeof value === "number")
  const max = Math.max(1, ...numbers.map((value) => Math.abs(value)))
  const shade = (value: CellValue) => (typeof value === "number" ? `rgba(198,161,90,${0.08 + (Math.abs(value) / max) * 0.4})` : undefined)

  if (!colColumn) {
    return (
      <div className={`overflow-auto rounded-xl border border-[color:var(--c-border-fee2d5)] ${compact ? "max-h-full" : "max-h-[460px]"}`}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-[color:var(--c-bg-ffeee7)]">
            <tr>
              <th className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2 text-left text-xs font-semibold text-[color:var(--c-text-663a46)]">{rowColumn?.label ?? ""}</th>
              {measures.map((column) => (
                <th key={column.id} className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2 text-right text-xs font-semibold text-[color:var(--c-text-663a46)]">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((rowKey) => {
              const row = result.rows.find((item) => item[rowColumn.id] === rowKey) as Row
              return (
                <tr key={String(rowKey)} className={`border-b border-[color:var(--c-border-ffeae1)] ${onPoint ? "cursor-pointer hover:bg-[color:var(--c-bg-fff4ef)]" : ""}`} onClick={onPoint ? (event) => click(event, rowKey) : undefined}>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-[color:var(--c-text-52212e)]">
                    {formatGroupValue(rowColumn, rowKey)}
                  </th>
                  {measures.map((column) => (
                    <td key={column.id} className="px-3 py-2 text-right tabular-nums" style={{ background: shade(row[column.id]) }}>
                      {formatByUnit(column.unit, row[column.id])}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          {measures.every(canTotal) ? (
            <tfoot>
              <tr className="bg-[color:var(--c-bg-ffeee7)] font-semibold">
                <th scope="row" className="px-3 py-2 text-left">
                  Total
                </th>
                {measures.map((column) => (
                  <td key={column.id} className="px-3 py-2 text-right tabular-nums">
                    {formatByUnit(column.unit, result.rows.reduce((sum, row) => sum + (typeof row[column.id] === "number" ? (row[column.id] as number) : 0), 0))}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    )
  }

  const rowTotal = (rowKey: CellValue) => colKeys.reduce<number>((sum, colKey) => sum + (Number(lookup(rowKey, colKey)) || 0), 0)
  const colTotal = (colKey: CellValue) => rowKeys.reduce<number>((sum, rowKey) => sum + (Number(lookup(rowKey, colKey)) || 0), 0)
  return (
    <div>
      <div className={`overflow-auto rounded-xl border border-[color:var(--c-border-fee2d5)] ${compact ? "max-h-full" : "max-h-[460px]"}`}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-[color:var(--c-bg-ffeee7)]">
            <tr>
              <th className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-[color:var(--c-text-663a46)]">
                {rowColumn.label} by {colColumn.label.toLowerCase()}
              </th>
              {colKeys.map((colKey) => (
                <th key={String(colKey)} className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2 text-right text-xs font-semibold whitespace-nowrap text-[color:var(--c-text-663a46)]">
                  {formatGroupValue(colColumn, colKey)}
                </th>
              ))}
              {totals ? <th className="border-b border-[color:var(--c-border-fed9c8)] px-3 py-2 text-right text-xs font-semibold text-[color:var(--c-text-8c2f39)]">Total</th> : null}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((rowKey) => (
              <tr key={String(rowKey)} className="border-b border-[color:var(--c-border-ffeae1)]">
                <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap text-[color:var(--c-text-52212e)]">
                  {formatGroupValue(rowColumn, rowKey)}
                </th>
                {colKeys.map((colKey) => {
                  const value = lookup(rowKey, colKey)
                  return (
                    <td key={String(colKey)} onClick={onPoint ? (event) => click(event, rowKey, colKey) : undefined} className={`px-3 py-2 text-right whitespace-nowrap tabular-nums ${onPoint ? "cursor-pointer hover:outline hover:outline-1 hover:outline-[color:var(--c-border-b23a48)]" : ""}`} style={{ background: shade(value) }}>
                      {value == null ? "" : formatByUnit(measure.unit, value)}
                    </td>
                  )
                })}
                {totals ? <td className="px-3 py-2 text-right font-semibold whitespace-nowrap tabular-nums">{formatByUnit(measure.unit, rowTotal(rowKey))}</td> : null}
              </tr>
            ))}
          </tbody>
          {totals ? (
            <tfoot>
              <tr className="bg-[color:var(--c-bg-ffeee7)] font-semibold">
                <th scope="row" className="px-3 py-2 text-left">
                  Total
                </th>
                {colKeys.map((colKey) => (
                  <td key={String(colKey)} className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                    {formatByUnit(measure.unit, colTotal(colKey))}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums">{formatByUnit(measure.unit, rowKeys.reduce<number>((sum, rowKey) => sum + rowTotal(rowKey), 0))}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {!totals ? <p className="mt-2 text-xs text-[color:var(--c-text-9d8189)]">Totals are not shown because {measure.label.toLowerCase()} cannot be added across these groups.</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------- entry point

export function VizRenderer({ result, type, showLabels, stacked, comparison, onPoint, height = 380, compact }: VizProps) {
  const isChart = type !== "kpi" && type !== "table" && type !== "pivot"
  const build = useMemo(() => (isChart ? buildChart(type, result, { showLabels, stacked }) : null), [isChart, type, result, showLabels, stacked])
  if (type === "kpi") return <KpiView result={result} comparison={comparison} compact={compact} />
  if (type === "table") return <ResultTable result={result} compact={compact} onPoint={onPoint} />
  if (type === "pivot") return <PivotView result={result} compact={compact} onPoint={onPoint} />
  if (result.rows.length === 0) return <NoRows result={result} />
  if (!build) return <EmptyState title="Nothing to draw yet">Add a measure to draw this {VIZ_LABELS[type].toLowerCase()}.</EmptyState>
  return <EChart build={build} needsMap={type === "map"} height={height} label={`${VIZ_LABELS[type]} of ${result.datasetName}`} onPoint={onPoint} />
}
