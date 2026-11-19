import { useCallback, useState } from "react"
import type { DrillStep } from "@/analytics/runtime"
import type { CrossFilter, FilterCondition, GlobalFilters, SavedView } from "@/analytics/types"

/** Everything a viewer changes while exploring a dashboard. None of it is written to the saved dashboard. */
export function useDashboardState(initial: GlobalFilters) {
  const [global, setGlobal] = useState<GlobalFilters>(initial)
  const [cross, setCross] = useState<CrossFilter[]>([])
  const [drill, setDrill] = useState<Record<string, DrillStep[]>>({})
  const [temp, setTemp] = useState<Record<string, FilterCondition[]>>({})

  const reset = useCallback(
    (base: GlobalFilters) => {
      setGlobal(base)
      setCross([])
      setDrill({})
      setTemp({})
    },
    [],
  )

  const restore = useCallback((view: Pick<SavedView, "globalFilters" | "crossFilters">) => {
    setGlobal(view.globalFilters)
    setCross(view.crossFilters)
    setDrill({})
    setTemp({})
  }, [])

  return {
    global,
    setGlobal,
    cross,
    setCross,
    drill,
    setDrillFor: (widgetId: string, steps: DrillStep[]) => setDrill((current) => ({ ...current, [widgetId]: steps })),
    temp,
    setTempFor: (widgetId: string, conditions: FilterCondition[]) => setTemp((current) => ({ ...current, [widgetId]: conditions })),
    reset,
    restore,
  }
}

export type DashboardState = ReturnType<typeof useDashboardState>
