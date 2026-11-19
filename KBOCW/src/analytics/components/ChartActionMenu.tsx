import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/analytics/components/ui"

export interface ChartAction {
  id: string
  label: string
  hint?: string
  disabled?: boolean
  onSelect: () => void
}

/** Floating menu shown where a chart element was clicked: filter, cross-filter or drill down. */
export function ChartActionMenu({ anchor, heading, actions, onClose }: { anchor: { x: number; y: number }; heading: string; actions: ChartAction[]; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: anchor.x, top: anchor.y })

  useLayoutEffect(() => {
    const node = root.current
    if (!node) return
    const { width, height } = node.getBoundingClientRect()
    setPosition({
      left: Math.max(8, Math.min(anchor.x + 8, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(anchor.y + 8, window.innerHeight - height - 8)),
    })
  }, [anchor])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return createPortal(
    <div ref={root} role="menu" aria-label={heading} style={position} className="fixed z-[70] w-72 max-w-[calc(100vw-16px)] rounded-xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-2 shadow-[0_18px_56px_rgb(var(--c-shadow-rgb)/0.22)]">
      <p className="truncate px-2 pt-1 pb-2 text-xs font-semibold text-[color:var(--c-text-8c2f39)]">{heading}</p>
      <div className="flex flex-col gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            onClick={() => {
              action.onSelect()
              onClose()
            }}
            className="rounded-lg px-2.5 py-2 text-left transition hover:bg-[color:var(--c-bg-ffeee7)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <span className="block text-sm font-medium text-[color:var(--c-text-461220)]">{action.label}</span>
            {action.hint ? <span className="block text-xs leading-4 text-[color:var(--c-text-9d8189)]">{action.hint}</span> : null}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-end border-t border-[color:var(--c-border-fee4d8)] pt-1.5">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>,
    document.body,
  )
}
