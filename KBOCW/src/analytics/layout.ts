import type { DashboardWidget } from "@/analytics/types"

// Pure grid maths for the dashboard canvas. Widgets sit on a 12 column grid and are pulled upwards
// until they touch another widget, so a layout never has gaps that cannot be filled.

export const GRID_COLUMNS = 12

type Box = Pick<DashboardWidget, "x" | "y" | "w" | "h">

export const MIN_SIZE: Record<DashboardWidget["kind"], { w: number; h: number }> = {
  kpi: { w: 2, h: 2 },
  chart: { w: 3, h: 3 },
  report: { w: 3, h: 3 },
  table: { w: 3, h: 3 },
  map: { w: 3, h: 4 },
}

export const DEFAULT_SIZE: Record<DashboardWidget["kind"], { w: number; h: number }> = {
  kpi: { w: 3, h: 2 },
  chart: { w: 6, h: 5 },
  report: { w: 6, h: 5 },
  table: { w: 6, h: 5 },
  map: { w: 6, h: 6 },
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const byPosition = <T extends Box>(items: T[]) => [...items].sort((a, b) => a.y - b.y || a.x - b.x)

function clampBox<T extends Box>(item: T, columns: number): T {
  const w = Math.max(1, Math.min(columns, item.w))
  const x = Math.max(0, Math.min(columns - w, item.x))
  return { ...item, x, w, y: Math.max(0, item.y), h: Math.max(1, item.h) }
}

export function compact<T extends Box & { id: string }>(items: T[], columns = GRID_COLUMNS): T[] {
  const placed: T[] = []
  for (const source of byPosition(items.map((item) => clampBox(item, columns)))) {
    const item = { ...source }
    while (placed.some((other) => overlaps(item, other))) item.y += 1
    while (item.y > 0 && !placed.some((other) => overlaps({ ...item, y: item.y - 1 }, other))) item.y -= 1
    placed.push(item)
  }
  return items.map((original) => placed.find((item) => item.id === original.id) as T)
}

function settle<T extends Box & { id: string }>(items: T[], fixed: T, columns: number): T[] {
  const placed: T[] = [fixed]
  for (const other of byPosition(items.filter((item) => item.id !== fixed.id))) {
    const next = { ...other }
    while (placed.some((candidate) => overlaps(next, candidate))) next.y += 1
    placed.push(next)
  }
  return compact(items.map((item) => placed.find((candidate) => candidate.id === item.id) as T), columns)
}

export function moveItem<T extends Box & { id: string }>(items: T[], id: string, x: number, y: number, columns = GRID_COLUMNS): T[] {
  const current = items.find((item) => item.id === id)
  if (!current) return items
  return settle(items, clampBox({ ...current, x, y }, columns), columns)
}

export function resizeItem<T extends Box & { id: string }>(items: T[], id: string, w: number, h: number, minimum: { w: number; h: number }, columns = GRID_COLUMNS): T[] {
  const current = items.find((item) => item.id === id)
  if (!current) return items
  const width = Math.max(minimum.w, Math.min(columns - current.x, w))
  return settle(items, { ...current, w: width, h: Math.max(minimum.h, h) }, columns)
}

export const layoutBottom = (items: Box[]) => items.reduce((max, item) => Math.max(max, item.y + item.h), 0)

export function placeNew(items: Box[], size: { w: number; h: number }): Box {
  return { x: 0, y: layoutBottom(items), w: size.w, h: size.h }
}
