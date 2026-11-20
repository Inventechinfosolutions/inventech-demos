import { setThemedOption } from "@/theme/chartTheme"
import { BarChart, LineChart } from "echarts/charts"
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { useEffect, useRef, type ReactNode } from "react"

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export interface GigChartPoint {
  category?: string
  series?: string
  index?: number
}

export function GigChart({
  title,
  subtitle,
  option,
  height = 320,
  ariaLabel,
  notAffectedBy = [],
  empty,
  footer,
  onPoint,
  className = "",
}: {
  title: string
  subtitle?: string
  option: object | null
  height?: number
  ariaLabel: string
  notAffectedBy?: string[]
  /** Shown instead of the chart when there is nothing to draw. */
  empty?: string
  footer?: ReactNode
  /** Called with the clicked point, or with nothing when "View breakdown" is used. */
  onPoint: (point?: GigChartPoint) => void
  className?: string
}) {
  const node = useRef<HTMLDivElement>(null)
  const onPointRef = useRef(onPoint)
  onPointRef.current = onPoint
  const showChart = option !== null && !empty

  useEffect(() => {
    if (!node.current || !option || empty) return
    const instance = echarts.init(node.current)
    setThemedOption(instance, option)
    const onClick = (params: unknown) => {
      const point = params as { componentType?: string; name?: string; seriesName?: string; dataIndex?: number }
      if (point.componentType !== "series") return
      onPointRef.current({ category: point.name, series: point.seriesName, index: point.dataIndex })
    }
    instance.on("click", onClick)
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(node.current)
    return () => {
      observer.disconnect()
      instance.dispose()
    }
  }, [option, empty])

  return (
    <section className={`min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-[color:var(--c-text-461220)]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
        <button type="button" className="shrink-0 text-sm font-semibold text-[color:var(--c-text-8c2f39)]" onClick={() => onPoint()}>
          View breakdown
        </button>
      </div>
      {showChart ? (
        <div ref={node} role="img" aria-label={ariaLabel} className="mt-2 w-full min-w-0" style={{ height }} />
      ) : (
        <p className="mt-8 mb-6 text-sm text-slate-500">{empty ?? "No data in the selected scope."}</p>
      )}
      {notAffectedBy.length > 0 ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">Not affected by: {notAffectedBy.join(", ")}. This view is not narrowed by those filters.</p>
      ) : null}
      {footer}
    </section>
  )
}
