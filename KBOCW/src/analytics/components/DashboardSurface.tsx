import { useMemo } from "react"
import { DashboardCanvas } from "@/analytics/components/DashboardCanvas"
import { DashboardWidgetView } from "@/analytics/components/DashboardWidgetView"
import { ActiveFilterBar, RuntimeFilters, crossChips, emptyGlobalFilters, globalChips } from "@/analytics/components/RuntimeFilters"
import type { DashboardState } from "@/analytics/dashboardState"
import { reportDefinition, useDb } from "@/analytics/store"
import type { DashboardWidget, GlobalFilters } from "@/analytics/types"

interface Props {
  widgets: DashboardWidget[]
  state: DashboardState
  /** Filters the dashboard opens with. The reset button returns to these. */
  defaults: GlobalFilters
  editable: boolean
  onLayoutChange?: (widgets: DashboardWidget[]) => void
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onDuplicate?: (id: string) => void
  onRemove?: (id: string) => void
}

/** Global filters, active filter chips and the widget grid. Shared by the dashboard viewer and the builder. */
export function DashboardSurface({ widgets, state, defaults, editable, onLayoutChange, selectedId, onSelect, onDuplicate, onRemove }: Props) {
  const db = useDb()
  const reportIds = widgets.map((widget) => widget.reportId).join("|")
  // Reports are looked up again when the store changes, for example after a report is renamed.
  const definitions = useMemo(
    () => Object.fromEntries([...new Set(reportIds.split("|").filter(Boolean))].map((id) => [id, reportDefinition(id, db)])),
    [reportIds, db],
  )
  const chips = [...globalChips(state.global, state.setGlobal), ...crossChips(state.cross, (id) => state.setCross(state.cross.filter((item) => item.id !== id)))]
  const hasWidgetState = Object.values(state.drill).some((steps) => steps.length > 0) || Object.values(state.temp).some((list) => list.length > 0)

  return (
    <div className="flex flex-col gap-3">
      <RuntimeFilters global={state.global} onChange={state.setGlobal} onReset={() => state.reset(defaults)} resetLabel="Reset to defaults" note="Filters apply to every widget that has the field. A district filter skips widgets built on datasets without districts." />
      <ActiveFilterBar
        chips={chips}
        onReset={() => state.reset(emptyGlobalFilters())}
        emptyText={editable ? "None. Switch to Preview to try clicking a chart." : "None. Click a bar, slice or row in a widget to filter the rest of the dashboard."}
      />
      {hasWidgetState && !editable ? <p className="-mt-1 text-xs text-[color:var(--c-text-9d8189)]">Some widgets are drilled down or filtered on their own. Use Up in a widget, or reset to defaults, to go back.</p> : null}
      <DashboardCanvas
        widgets={widgets}
        editable={editable}
        onChange={onLayoutChange}
        selectedId={selectedId}
        onSelect={onSelect}
        render={(widget, context) => (
          <DashboardWidgetView
            widget={widget}
            base={definitions[widget.reportId] ?? null}
            state={state}
            editable={editable}
            handle={context.handle}
            selected={context.selected}
            onDuplicate={() => onDuplicate?.(widget.id)}
            onRemove={() => onRemove?.(widget.id)}
          />
        )}
      />
    </div>
  )
}
