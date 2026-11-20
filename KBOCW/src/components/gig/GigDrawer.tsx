import { useEffect, useRef } from "react"
import type { GigDetail } from "@/types/gig"

const META_LABELS: [keyof GigDetail["meta"], string][] = [
  ["reference", "Reference"],
  ["source", "Source"],
  ["period", "Period"],
  ["received", "Data received"],
  ["validation", "Validation"],
  ["access", "Access"],
]

export function GigDrawer({
  detail,
  loading,
  error,
  onClose,
  onApply,
}: {
  detail: GigDetail | null
  loading: boolean
  error: string | null
  onClose: () => void
  onApply: (patch: NonNullable<GigDetail["apply"]>["patch"]) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[color:var(--c-bg-461220)]/45" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gig-detail-title"
        className="flex h-full w-full max-w-3xl flex-col bg-[color:var(--c-bg-ffffff)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--c-border-fed9c8)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Illustrative POC Data</p>
            <h2 id="gig-detail-title" className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">
              {detail?.title ?? (error ? "Detail unavailable" : "Loading detail")}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="shrink-0 rounded-full border border-[color:var(--c-border-fed4c1)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)]" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p role="alert" className="text-sm text-red-700">{error}</p>
          ) : loading || !detail ? (
            <p className="text-sm text-slate-600">Loading the selected records.</p>
          ) : (
            <>
              <p className="text-sm leading-6 text-slate-700">{detail.summary}</p>
              {detail.apply ? (
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-[color:var(--c-bg-461220)] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => onApply(detail.apply!.patch)}
                >
                  {detail.apply.label}
                </button>
              ) : null}
              <dl className="mt-4 grid gap-x-4 gap-y-2 rounded-2xl bg-[color:var(--c-bg-fff8f4)] px-4 py-3 text-sm sm:grid-cols-[130px_minmax(0,1fr)]">
                {META_LABELS.map(([key, text]) => (
                  <div key={key} className="contents">
                    <dt className="font-semibold text-[color:var(--c-text-8c2f39)]">{text}</dt>
                    <dd className="min-w-0 break-words text-[color:var(--c-text-461220)]">{detail.meta[key]}</dd>
                  </div>
                ))}
              </dl>
              <div className="relative mt-4 min-w-0 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--c-border-fed9c8)] text-[13px] text-[color:var(--c-text-8c2f39)]">
                      {detail.columns.map((column) => (
                        <th key={column.key} scope="col" className={`px-3 py-2.5 font-semibold ${column.align === "right" ? "text-right" : "text-left"}`}>
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.rows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-slate-500" colSpan={detail.columns.length}>
                          Nothing to show for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      detail.rows.map((row, index) => (
                        <tr key={`${row.Reference ?? ""}-${index}`} className="border-b border-[color:var(--c-border-ffeae1)]">
                          {detail.columns.map((column) => (
                            <td key={column.key} className={`px-3 py-2.5 text-[color:var(--c-text-461220)] ${column.align === "right" ? "text-right tabular-nums" : "text-left"}`}>
                              {row[column.key]}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">{detail.note}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
