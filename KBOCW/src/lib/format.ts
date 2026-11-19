export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-IN")
}

export function formatLakh(value: number): string {
  const lakh = value / 100000
  const digits = Math.abs(lakh) >= 10 ? 1 : 2
  return `${lakh.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} lakh`
}

export function formatCrore(rupees: number): string {
  return formatCroreNumber(rupees / 10000000)
}

export function formatCroreNumber(crore: number): string {
  const absolute = Math.abs(crore)
  const maxDigits = absolute >= 10 ? 1 : 2
  const whole = absolute >= 100 && Math.abs(crore - Math.round(crore)) < 0.05
  const rounded = Number(crore.toFixed(whole ? 0 : maxDigits))
  const digits = Number.isInteger(rounded) ? 0 : maxDigits
  return `₹${rounded.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} Cr`
}

export function formatInr(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`
}

export function formatChange(value: number): string {
  const rounded = Number(value.toFixed(1))
  const sign = rounded > 0 ? "+" : ""
  return `${sign}${rounded.toFixed(1)}%`
}

export function formatShare(value: number, total: number): string {
  if (total === 0) return "0%"
  return `${((value / total) * 100).toFixed(1)}%`
}

export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${day} ${names[month - 1]} ${year}`
}

export function croreValue(rupees: number): number {
  return rupees / 10000000
}
