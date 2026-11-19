import { getTheme, subscribeTheme, type ThemeId } from "@/theme/theme"

// ECharts reads colours as plain strings and cannot resolve CSS variables,
// so chart options are resolved from the token values before each setOption.

type Chart = {
  setOption: (option: unknown, notMerge?: boolean) => void
  isDisposed: () => boolean
}

type Entry = { option: unknown; notMerge: boolean }

const live = new Map<Chart, Entry>()
const cache = new Map<string, string>()
const VAR = /var\((--c-[\w-]+)\)/g

function tokenValue(name: string, theme: ThemeId): string {
  const key = `${theme}|${name}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const probe = document.createElement("div")
  probe.dataset.theme = theme
  probe.style.display = "none"
  document.body.appendChild(probe)
  const value = getComputedStyle(probe).getPropertyValue(name).trim()
  probe.remove()
  cache.set(key, value)
  return value
}

function walk(value: unknown, theme: ThemeId): unknown {
  if (typeof value === "string") {
    return value.includes("var(--c-") ? value.replace(VAR, (_match, name: string) => tokenValue(name, theme)) : value
  }
  if (Array.isArray(value)) return value.map((item) => walk(item, theme))
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) out[key] = walk(item, theme)
    return out
  }
  return value
}

/** Replaces var(--c-…) strings with the colour for the given theme. Functions and class instances pass through. */
export function resolveCssVars<T>(value: T, theme: ThemeId = getTheme()): T {
  return walk(value, theme) as T
}

function pruneDisposed() {
  for (const chart of live.keys()) {
    if (chart.isDisposed()) live.delete(chart)
  }
}

/** Applies a chart option now and re-applies it whenever the theme changes. */
export function setThemedOption(chart: Chart, option: unknown, notMerge = false) {
  pruneDisposed()
  live.set(chart, { option, notMerge })
  chart.setOption(resolveCssVars(option), notMerge)
}

subscribeTheme(() => {
  const theme = getTheme()
  pruneDisposed()
  for (const [chart, entry] of live) {
    chart.setOption(resolveCssVars(entry.option, theme), entry.notMerge)
  }
})
