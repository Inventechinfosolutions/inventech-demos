import { useSyncExternalStore } from "react"

export type ThemeId = "bordeaux" | "carbon" | "light"

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "bordeaux", label: "Bordeaux" },
  { id: "carbon", label: "Carbon" },
  { id: "light", label: "Light" },
]

const STORAGE_KEY = "kbocw.theme"
const listeners = new Set<() => void>()

function isThemeId(value: unknown): value is ThemeId {
  return value === "bordeaux" || value === "carbon" || value === "light"
}

function readStored(): ThemeId {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (isThemeId(value)) return value
  } catch {
    // Storage can be blocked; fall back to the default theme.
  }
  return "bordeaux"
}

let current: ThemeId = readStored()
document.documentElement.dataset.theme = current

export function getTheme(): ThemeId {
  return current
}

export function setTheme(next: ThemeId) {
  if (next === current) return
  current = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // The choice still applies for this page view.
  }
  document.documentElement.dataset.theme = next
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme(): ThemeId {
  return useSyncExternalStore(subscribeTheme, getTheme, getTheme)
}
