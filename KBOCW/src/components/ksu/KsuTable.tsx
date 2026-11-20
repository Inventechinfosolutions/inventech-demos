import { useEffect, useMemo, useState, type ReactNode } from "react"

export interface KsuColumn<Row> {
  key: string
  label: string
  align?: "left" | "right"
  /** Value used for sorting. Omit to make the column unsortable. */
  sort?: (row: Row) => number | string
  render: (row: Row) => ReactNode
}

/** Sortable, paginated table. Sorting is announced through aria-sort. */
export function KsuTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  initialSort,
  pageSize = 10,
  minWidth = 760,
  empty = "Nothing to show for the selected filters.",
  onClear,
}: {
  caption: string
  columns: KsuColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  initialSort: { key: string; direction: "asc" | "desc" }
  pageSize?: number
  minWidth?: number
  empty?: string
  onClear?: () => void
}) {
  const [sort, setSort] = useState(initialSort)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sort) return rows
    const read = column.sort
    const factor = sort.direction === "asc" ? 1 : -1
    return [...rows].sort((left, right) => {
      const a = read(left)
      const b = read(right)
      if (typeof a === "number" && typeof b === "number") return (a - b) * factor
      return String(a).localeCompare(String(b)) * factor
    })
  }, [columns, rows, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  useEffect(() => {
    setPage((current) => Math.min(current, pages - 1))
  }, [pages])
  const shown = sorted.slice(page * pageSize, page * pageSize + pageSize)

  const toggle = (key: string) => {
    setPage(0)
    setSort((current) => (current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }))
  }

  return (
    <div className="min-w-0">
      <div className="relative min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-[color:var(--c-text-8c2f39)]">
              {columns.map((column) => {
                const active = sort.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : column.sort ? "none" : undefined}
                    className={`px-3 py-3 font-semibold ${column.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {column.sort ? (
                      <button type="button" className="inline-flex items-center gap-1 font-semibold" onClick={() => toggle(column.key)}>
                        {column.label}
                        <span aria-hidden="true" className={active ? "" : "opacity-30"}>{active ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}</span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={columns.length}>
                  {empty}
                  {onClear ? (
                    <button type="button" className="ml-3 font-semibold text-[color:var(--c-text-8c2f39)]" onClick={onClear}>
                      Clear filters
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : (
              shown.map((row) => (
                <tr key={rowKey(row)} className="border-b border-[color:var(--c-border-ffeae1)]">
                  {columns.map((column, index) =>
                    index === 0 ? (
                      <th key={column.key} scope="row" className="px-3 py-3 font-semibold text-[color:var(--c-text-461220)]">{column.render(row)}</th>
                    ) : (
                      <td key={column.key} className={`px-3 py-3 text-[color:var(--c-text-461220)] ${column.align === "right" ? "text-right tabular-nums" : ""}`}>{column.render(row)}</td>
                    ),
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize ? (
        <nav className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600" aria-label={`${caption} pages`}>
          <span>
            Showing {page * pageSize + 1} to {Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}
          </span>
          <span className="flex gap-2">
            <button type="button" disabled={page === 0} className="rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 py-1.5 font-semibold text-[color:var(--c-text-461220)] disabled:opacity-40" onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <button type="button" disabled={page >= pages - 1} className="rounded-lg border border-[color:var(--c-border-fed4c1)] px-3 py-1.5 font-semibold text-[color:var(--c-text-461220)] disabled:opacity-40" onClick={() => setPage(page + 1)}>
              Next
            </button>
          </span>
        </nav>
      ) : null}
    </div>
  )
}
