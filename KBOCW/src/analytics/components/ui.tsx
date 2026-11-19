import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"

// Small building blocks shared by every analytics screen.

export const cardClass = "rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)]"
export const fieldClass = "h-9 w-full min-w-0 rounded-lg border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] px-2.5 text-sm text-[color:var(--c-text-461220)] disabled:bg-[color:var(--c-bg-ffeee7)] disabled:text-[color:var(--c-text-9d8189)]"
export const labelClass = "text-xs font-semibold text-[color:var(--c-text-86646d)]"
export const eyebrowClass = "text-[11px] font-semibold tracking-[0.14em] text-[color:var(--c-text-8c2f39)] uppercase"

type Variant = "primary" | "secondary" | "ghost" | "danger"

const variants: Record<Variant, string> = {
  primary: "border border-[color:var(--c-border-461220)] bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)] hover:bg-[color:var(--c-bg-481422)] disabled:border-[color:var(--c-border-d4c8cb)] disabled:bg-[color:var(--c-bg-d4c8cb)]",
  secondary: "border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-461220)] hover:border-[color:var(--c-border-b23a48)] disabled:text-[color:var(--c-text-b19ba1)] disabled:hover:border-[color:var(--c-border-fed4c1)]",
  ghost: "border border-transparent bg-transparent text-[color:var(--c-text-8c2f39)] hover:bg-[color:var(--c-bg-ffeee7)] disabled:text-[color:var(--c-text-b19ba1)]",
  danger: "border border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-8c2f39)] hover:bg-[color:var(--c-bg-ffe9df)] disabled:text-[color:var(--c-text-d89ca3)]",
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition disabled:cursor-not-allowed ${size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"} ${variants[variant]} ${className}`}
    />
  )
}

const tones = {
  neutral: "bg-[color:var(--c-bg-ffece3)] text-[color:var(--c-text-76505a)]",
  brass: "bg-[color:var(--c-bg-ffede5)] text-[color:var(--c-text-8c2f39)]",
  green: "bg-[color:var(--c-bg-ffe9e0)] text-[color:var(--c-text-8c2f39)]",
  red: "bg-[color:var(--c-bg-ffe9df)] text-[color:var(--c-text-8c2f39)]",
  ink: "bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]",
  blue: "bg-[color:var(--c-bg-ffe8de)] text-[color:var(--c-text-8c2f39)]",
}

export function Badge({ tone = "neutral", children, title }: { tone?: keyof typeof tones; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Chip({ children, onRemove, tone = "neutral", title }: { children: ReactNode; onRemove?: () => void; tone?: keyof typeof tones; title?: string }) {
  return (
    <span title={title} className={`inline-flex max-w-full items-center gap-1 rounded-full py-1 pr-1 pl-2.5 text-xs font-medium ${tones[tone]} ${onRemove ? "" : "pr-2.5"}`}>
      <span className="truncate">{children}</span>
      {onRemove ? (
        <button type="button" aria-label="Remove" onClick={onRemove} className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-sm leading-none hover:bg-black/10">
          ×
        </button>
      ) : null}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={eyebrowClass}>{children}</p>
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--c-border-e9c6ca)] bg-[color:var(--c-bg-fff8f4)] px-6 py-10 text-center">
      <p className="text-sm font-semibold text-[color:var(--c-text-461220)]">{title}</p>
      {children ? <div className="mt-1 max-w-md text-sm leading-6 text-[color:var(--c-text-86646d)]">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Notice({ tone = "brass", children, title }: { tone?: "brass" | "red" | "green" | "blue"; children: ReactNode; title?: string }) {
  const styles = {
    brass: "border-[color:var(--c-border-fed8c6)] bg-[color:var(--c-bg-fff4ef)] text-[color:var(--c-text-8c2f39)]",
    red: "border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-ffede5)] text-[color:var(--c-text-8c2f39)]",
    green: "border-[color:var(--c-border-fed6c3)] bg-[color:var(--c-bg-fff1eb)] text-[color:var(--c-text-8c2f39)]",
    blue: "border-[color:var(--c-border-fed1bc)] bg-[color:var(--c-bg-fff0e9)] text-[color:var(--c-text-8c2f39)]",
  }
  return (
    <div role={tone === "red" ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-sm leading-5 ${styles[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  width = "max-w-lg",
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  const titleId = useId()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color:var(--app-scrim)]/55 px-4 py-10">
      <button type="button" aria-label="Close dialog" className="fixed inset-0 cursor-default" onClick={onClose} tabIndex={-1} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`relative w-full ${width} rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] shadow-[0_24px_80px_rgb(var(--c-shadow-rgb)/0.28)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--c-border-fee4d8)] px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-[color:var(--c-text-461220)]">
            {title}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-[color:var(--c-text-86646d)] hover:bg-[color:var(--c-bg-ffeee7)]">
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--c-border-fee4d8)] px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-6 text-[color:var(--c-text-663a46)]">{children}</div>
    </Modal>
  )
}

export function Popover({
  label,
  children,
  align = "left",
  className = "",
  buttonClassName,
  disabled,
  variant = "secondary",
  size = "md",
}: {
  label: ReactNode
  children: (close: () => void) => ReactNode
  align?: "left" | "right"
  className?: string
  buttonClassName?: string
  disabled?: boolean
  variant?: Variant
  size?: "sm" | "md"
}) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<CSSProperties>({})
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element
      if (root.current?.contains(target) || menu.current?.contains(target) || target.closest?.("[data-popover-menu]")) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const onScroll = (event: Event) => {
      const target = event.target as Element
      if (!menu.current?.contains(target) && !target.closest?.("[data-popover-menu]")) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
    }
  }, [open])
  // The menu is positioned against the viewport so scrolling tables and cards never clip it.
  const toggle = () => {
    if (open) return setOpen(false)
    const rect = root.current?.getBoundingClientRect()
    if (rect) {
      const below = window.innerHeight - rect.bottom
      const flip = below < 300 && rect.top > below
      setPlacement({
        position: "fixed",
        ...(flip ? { bottom: window.innerHeight - rect.top + 6, maxHeight: rect.top - 16 } : { top: rect.bottom + 6, maxHeight: below - 16 }),
        ...(align === "right" ? { right: Math.max(8, window.innerWidth - rect.right) } : { left: Math.max(8, Math.min(rect.left, window.innerWidth - 344)) }),
      })
    }
    setOpen(true)
  }
  return (
    <div ref={root} className={`relative ${className}`}>
      <Button variant={variant} size={size} disabled={disabled} className={buttonClassName} aria-expanded={open} aria-haspopup="true" onClick={toggle}>
        {label}
      </Button>
      {open
        ? createPortal(
            <div ref={menu} data-popover-menu style={placement} className="z-[65] min-w-[200px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-1.5 shadow-[0_16px_48px_rgb(var(--c-shadow-rgb)/0.16)]">
              {children(() => setOpen(false))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export function MenuItem({ children, onClick, disabled, danger, title }: { children: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button
      type="button"
      role="menuitem"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition hover:bg-[color:var(--c-bg-ffeee7)] disabled:cursor-not-allowed disabled:text-[color:var(--c-text-bfadb2)] disabled:hover:bg-transparent ${danger ? "text-[color:var(--c-text-8c2f39)]" : "text-[color:var(--c-text-461220)]"}`}
    >
      {children}
    </button>
  )
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  searchable,
  allLabel,
  className,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  searchable?: boolean
  allLabel: string
  className?: string
}) {
  const [query, setQuery] = useState("")
  const shown = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()))
  const summary = value.length === 0 ? allLabel : value.length === 1 ? value[0] : `${value.length} selected`
  return (
    <Popover
      className={className}
      buttonClassName="!h-9 !w-full !justify-between !rounded-lg !px-2.5 !text-sm !font-normal"
      label={
        <span className="flex w-full min-w-0 items-center justify-between gap-2">
          <span className="truncate">{summary}</span>
          <span aria-hidden className="text-[color:var(--c-text-9d8189)]">
            ▾
          </span>
        </span>
      }
    >
      {() => (
        <div className="w-64" role="group" aria-label={label}>
          {searchable ? <input className={`${fieldClass} mb-1.5`} placeholder={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /> : null}
          <div className="max-h-60 overflow-y-auto">
            {shown.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[color:var(--c-bg-ffeee7)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[color:var(--c-bg-461220)]"
                  checked={value.includes(option)}
                  onChange={(event) => onChange(event.target.checked ? [...value, option] : value.filter((item) => item !== option))}
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
            {shown.length === 0 ? <p className="px-2 py-2 text-sm text-[color:var(--c-text-86646d)]">No match.</p> : null}
          </div>
          <div className="mt-1.5 flex justify-between border-t border-[color:var(--c-border-fee4d8)] pt-1.5">
            <Button size="sm" variant="ghost" onClick={() => onChange([])} disabled={value.length === 0}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </Popover>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (value: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffeee7)] p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`h-7 rounded-full px-3 text-xs font-semibold transition ${value === option.id ? "bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]" : "text-[color:var(--c-text-86646d)] hover:text-[color:var(--c-text-461220)]"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Section({
  index,
  title,
  hint,
  open,
  onToggle,
  children,
  right,
}: {
  index?: number
  title: string
  hint?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
  right?: ReactNode
}) {
  const id = useId()
  return (
    <section className="border-b border-[color:var(--c-border-fee4d8)] last:border-b-0">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-center gap-2.5 px-4 py-3 text-left">
          {index != null ? <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--c-bg-ffede5)] text-[11px] font-semibold text-[color:var(--c-text-8c2f39)]">{index}</span> : null}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[color:var(--c-text-461220)]">{title}</span>
            {hint ? <span className="block truncate text-xs text-[color:var(--c-text-9d8189)]">{hint}</span> : null}
          </span>
          {right}
          <span aria-hidden className={`text-[color:var(--c-text-9d8189)] transition ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
      </h3>
      {open ? (
        <div id={id} className="px-4 pb-4">
          {children}
        </div>
      ) : null}
    </section>
  )
}

// ---------------------------------------------------------------- toasts

interface ToastItem {
  id: number
  message: string
  tone: "green" | "red" | "brass"
}

let toastItems: ToastItem[] = []
let toastCounter = 0
const toastListeners = new Set<() => void>()

export function notify(message: string, tone: ToastItem["tone"] = "green") {
  toastCounter += 1
  const item = { id: toastCounter, message, tone }
  toastItems = [...toastItems, item]
  toastListeners.forEach((listener) => listener())
  window.setTimeout(() => {
    toastItems = toastItems.filter((entry) => entry.id !== item.id)
    toastListeners.forEach((listener) => listener())
  }, 4200)
}

export function ToastHost() {
  const [, force] = useState(0)
  useEffect(() => {
    const listener = () => force((value) => value + 1)
    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
    }
  }, [])
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      {toastItems.map((item) => (
        <div key={item.id} className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-[0_12px_32px_rgb(var(--c-shadow-rgb)/0.18)] ${item.tone === "red" ? "border-[color:var(--c-border-fed0bb)] bg-[color:var(--c-bg-ffede5)] text-[color:var(--c-text-8c2f39)]" : item.tone === "brass" ? "border-[color:var(--c-border-fed8c6)] bg-[color:var(--c-bg-fff4ef)] text-[color:var(--c-text-8c2f39)]" : "border-[color:var(--c-border-fed6c3)] bg-[color:var(--c-bg-fff1eb)] text-[color:var(--c-text-8c2f39)]"}`}>
          {item.message}
        </div>
      ))}
    </div>
  )
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days} d ago` : formatDay(iso)
}
