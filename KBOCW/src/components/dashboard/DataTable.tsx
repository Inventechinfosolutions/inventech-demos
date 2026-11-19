import { StatusBadge } from "@/components/dashboard/StatusBadge"
import type { DetailColumn } from "@/types/dashboard"

export function DataTable({
  columns,
  rows,
  action,
}: {
  columns: DetailColumn[]
  rows: Record<string, string>[]
  action?: { label: string; onClick: (row: Record<string, string>) => void }
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-[color:var(--c-text-8c2f39)]">
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 font-semibold ${column.align === "right" ? "text-right" : "text-left"}`}>
                {column.label}
              </th>
            ))}
            {action ? <th className="px-4 py-3 text-right font-semibold">Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-slate-500" colSpan={columns.length + (action ? 1 : 0)}>
                No rows in the selected scope.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.Reference ?? row.District ?? row.Department ?? index}`} className="border-b border-[color:var(--c-border-ffeae1)]">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-[color:var(--c-text-461220)] ${column.align === "right" ? "text-right tabular-nums" : "text-left"}`}>
                    {column.kind === "status" || column.kind === "priority" ? (
                      <StatusBadge value={row[column.key] as "current"} />
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
                {action ? (
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => action.onClick(row)}>
                      {action.label}
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
