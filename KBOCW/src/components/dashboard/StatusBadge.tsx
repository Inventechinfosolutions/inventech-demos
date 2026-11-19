const styles = {
  current: "bg-[color:var(--c-bg-ffe9e0)] text-[color:var(--c-text-8c2f39)] ring-[color:var(--c-border-fed0bb)]",
  partial: "bg-[color:var(--c-bg-ffede5)] text-[color:var(--c-text-8c2f39)] ring-[color:var(--c-border-fed0bb)]",
  delayed: "bg-[color:var(--c-bg-ffe9df)] text-[color:var(--c-text-8c2f39)] ring-[color:var(--c-border-fed0bb)]",
  high: "bg-[color:var(--c-bg-ffe9df)] text-[color:var(--c-text-8c2f39)] ring-[color:var(--c-border-fed0bb)]",
  medium: "bg-[color:var(--c-bg-ffede5)] text-[color:var(--c-text-8c2f39)] ring-[color:var(--c-border-fed0bb)]",
  low: "bg-[color:var(--c-bg-ffece3)] text-[color:var(--c-text-76505a)] ring-[color:var(--c-border-fed5c3)]",
} as const

const labels = {
  current: "Current",
  partial: "Partial",
  delayed: "Delayed",
  high: "High",
  medium: "Medium",
  low: "Low",
} as const

export function StatusBadge({ value }: { value: keyof typeof labels }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold ring-1 ring-inset ${styles[value]}`}>
      {labels[value]}
    </span>
  )
}
