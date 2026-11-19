import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react"
import { GRID_COLUMNS, MIN_SIZE, layoutBottom, moveItem, resizeItem } from "@/analytics/layout"
import type { DashboardWidget } from "@/analytics/types"

const GAP = 12

export interface HandleProps {
  onPointerDown: (event: ReactPointerEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
  tabIndex: number
  role: "button"
  "aria-label": string
  title: string
  style: CSSProperties
}

interface Props {
  widgets: DashboardWidget[]
  editable: boolean
  onChange?: (widgets: DashboardWidget[]) => void
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  render: (widget: DashboardWidget, context: { handle: HandleProps | null; selected: boolean }) => ReactNode
  rowHeight?: number
}

interface Session {
  id: string
  mode: "move" | "resize"
  left: number
  top: number
  width: number
  height: number
  layout: DashboardWidget[]
}

/**
 * Twelve column canvas. Widgets can be dragged by their title bar and resized from the bottom right corner.
 * Arrow keys on the title bar move a widget and Shift with arrows resizes it. Below 640 px widgets stack in one column.
 */
export function DashboardCanvas({ widgets, editable, onChange, selectedId, onSelect, render, rowHeight = 72 }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const widgetsRef = useRef(widgets)
  const cleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    widgetsRef.current = widgets
  })

  useLayoutEffect(() => {
    const node = root.current
    if (!node) return
    setWidth(node.clientWidth)
    const observer = new ResizeObserver(() => setWidth(node.clientWidth))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => cleanup.current?.(), [])

  const stack = width > 0 && width < 640
  const columnWidth = (width - GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  const stepX = columnWidth + GAP
  const stepY = rowHeight + GAP

  const begin = (id: string, mode: "move" | "resize", event: ReactPointerEvent) => {
    const origin = widgetsRef.current.find((item) => item.id === id)
    if (!origin) return
    const startX = event.clientX
    const startY = event.clientY
    const minimum = MIN_SIZE[origin.kind]
    const move = (pointer: PointerEvent) => {
      const dx = pointer.clientX - startX
      const dy = pointer.clientY - startY
      const base = widgetsRef.current
      let next: Session
      if (mode === "move") {
        const left = origin.x * stepX + dx
        const top = origin.y * stepY + dy
        next = { id, mode, left, top, width: origin.w * stepX - GAP, height: origin.h * stepY - GAP, layout: moveItem(base, id, Math.round(left / stepX), Math.round(top / stepY)) }
      } else {
        const pixelWidth = origin.w * stepX - GAP + dx
        const pixelHeight = origin.h * stepY - GAP + dy
        next = {
          id,
          mode,
          left: origin.x * stepX,
          top: origin.y * stepY,
          width: Math.max(minimum.w * stepX - GAP, Math.min(pixelWidth, (GRID_COLUMNS - origin.x) * stepX - GAP)),
          height: Math.max(minimum.h * stepY - GAP, pixelHeight),
          layout: resizeItem(base, id, Math.round((pixelWidth + GAP) / stepX), Math.round((pixelHeight + GAP) / stepY), minimum),
        }
      }
      sessionRef.current = next
      setSession(next)
    }
    const finish = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", finish)
      window.removeEventListener("pointercancel", finish)
      cleanup.current = null
      const final = sessionRef.current
      sessionRef.current = null
      setSession(null)
      if (final) onChange?.(final.layout)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
    cleanup.current = finish
  }

  const keyboard = (widget: DashboardWidget, event: KeyboardEvent, forceResize = false) => {
    const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[] | undefined>)[event.key]
    if (!delta) return
    event.preventDefault()
    if (event.shiftKey || forceResize) onChange?.(resizeItem(widgets, widget.id, widget.w + delta[0], widget.h + delta[1], MIN_SIZE[widget.kind]))
    else onChange?.(moveItem(widgets, widget.id, widget.x + delta[0], widget.y + delta[1]))
  }

  const handleFor = (widget: DashboardWidget): HandleProps | null =>
    editable && !stack
      ? {
          onPointerDown: (event) => {
            if (event.button !== 0) return
            event.preventDefault()
            onSelect?.(widget.id)
            begin(widget.id, "move", event)
          },
          onKeyDown: (event) => keyboard(widget, event),
          tabIndex: 0,
          role: "button",
          "aria-label": `Move ${widget.title}. Arrow keys move it. Shift with arrow keys resizes it.`,
          title: "Drag to move",
          style: { touchAction: "none", cursor: "grab" },
        }
      : null

  if (widgets.length === 0) return <div ref={root} />
  const layout = session?.layout ?? widgets

  if (stack) {
    const ordered = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x)
    return (
      <div ref={root} className="flex flex-col gap-3">
        {ordered.map((widget) => (
          <div key={widget.id} style={{ height: Math.max(240, widget.h * stepY - GAP) }} onClick={editable ? () => onSelect?.(widget.id) : undefined}>
            {render(widget, { handle: null, selected: selectedId === widget.id })}
          </div>
        ))}
      </div>
    )
  }

  const heightPx = Math.max(220, layoutBottom(layout) * stepY - GAP)
  return (
    <div ref={root} className="relative" style={{ height: width ? heightPx : 220 }}>
      {width > 0
        ? widgets.map((widget) => {
            const placed = layout.find((item) => item.id === widget.id) ?? widget
            const live = session?.id === widget.id ? session : null
            const style: CSSProperties = live
              ? { transform: `translate(${live.left}px, ${live.top}px)`, width: live.width, height: live.height, zIndex: 30, transition: "none" }
              : { transform: `translate(${placed.x * stepX}px, ${placed.y * stepY}px)`, width: placed.w * stepX - GAP, height: placed.h * stepY - GAP, transition: session ? "transform 160ms ease, width 160ms ease, height 160ms ease" : "none" }
            return (
              <div key={widget.id} className={`absolute top-0 left-0 ${live ? "drop-shadow-[0_18px_36px_rgb(var(--c-shadow-rgb)/0.25)]" : ""}`} style={style} onClick={editable ? () => onSelect?.(widget.id) : undefined}>
                {render(widget, { handle: handleFor(widget), selected: selectedId === widget.id })}
                {editable ? (
                  <button
                    type="button"
                    aria-label={`Resize ${widget.title}`}
                    title="Drag to resize"
                    onPointerDown={(event) => {
                      if (event.button !== 0) return
                      event.preventDefault()
                      event.stopPropagation()
                      onSelect?.(widget.id)
                      begin(widget.id, "resize", event)
                    }}
                    onKeyDown={(event) => keyboard(widget, event, true)}
                    style={{ touchAction: "none" }}
                    className="absolute right-1 bottom-1 z-10 grid h-6 w-6 cursor-nwse-resize place-items-center rounded-md text-[color:var(--c-text-8c2f39)] hover:bg-[color:var(--c-bg-ffede5)]"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M10 3L3 10M10 7l-3 3" />
                    </svg>
                  </button>
                ) : null}
              </div>
            )
          })
        : null}
      {session && session.mode === "move" ? (
        <div
          aria-hidden
          className="absolute top-0 left-0 rounded-2xl border-2 border-dashed border-[color:var(--c-border-b23a48)] bg-[color:var(--c-bg-fff4ef)]/70"
          style={(() => {
            const target = session.layout.find((item) => item.id === session.id)
            return target ? { transform: `translate(${target.x * stepX}px, ${target.y * stepY}px)`, width: target.w * stepX - GAP, height: target.h * stepY - GAP, zIndex: 0 } : { display: "none" }
          })()}
        />
      ) : null}
    </div>
  )
}
