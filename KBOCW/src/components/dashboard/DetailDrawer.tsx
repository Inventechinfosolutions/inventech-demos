import { useEffect, useRef } from "react"
import { DataTable } from "@/components/dashboard/DataTable"
import type { DetailModel } from "@/types/dashboard"

export function DetailDrawer({ detail, loading, onClose }: { detail: DetailModel | null; loading: boolean; onClose: () => void }) {
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
        aria-labelledby="detail-title"
        className="flex h-full w-full max-w-xl flex-col bg-[color:var(--c-bg-ffffff)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--c-border-fed9c8)] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--c-text-8c2f39)] uppercase">Illustrative detail</p>
            <h2 id="detail-title" className="mt-1 text-xl font-semibold text-[color:var(--c-text-461220)]">
              {detail?.title ?? "Loading detail"}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="rounded-full border border-[color:var(--c-border-fed4c1)] px-3 py-2 text-sm font-semibold text-[color:var(--c-text-461220)]" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading || !detail ? (
            <p className="text-sm text-slate-600">Loading the selected records.</p>
          ) : (
            <>
              <p className="text-sm leading-6 text-slate-700">{detail.summary}</p>
              <div className="mt-4">
                <DataTable columns={detail.columns} rows={detail.rows} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">{detail.note}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
