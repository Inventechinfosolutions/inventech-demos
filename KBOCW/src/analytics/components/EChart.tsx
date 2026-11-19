import { useEffect, useRef, useState } from "react"
import { echarts, ensureKarnatakaMap } from "@/analytics/chartOptions"
import type { ChartBuild, ChartPoint } from "@/analytics/chartOptions"
import { setThemedOption } from "@/theme/chartTheme"

export interface ClickAnchor {
  x: number
  y: number
}

interface Props {
  build: ChartBuild
  needsMap?: boolean
  height: number | string
  label: string
  onPoint?: (point: ChartPoint, anchor: ClickAnchor) => void
}

export function EChart({ build, needsMap, height, label, onPoint }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const instance = useRef<ReturnType<typeof echarts.init> | null>(null)
  const latestBuild = useRef(build)
  const latestOnPoint = useRef(onPoint)
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">(needsMap ? "loading" : "ready")

  useEffect(() => {
    latestBuild.current = build
    latestOnPoint.current = onPoint
  })

  useEffect(() => {
    if (!needsMap) return
    let cancelled = false
    ensureKarnatakaMap().then(
      () => !cancelled && setMapState("ready"),
      () => !cancelled && setMapState("error"),
    )
    return () => {
      cancelled = true
    }
  }, [needsMap])

  const ready = !needsMap || mapState === "ready"

  useEffect(() => {
    const node = host.current
    if (!node || !ready) return
    const chart = echarts.init(node)
    instance.current = chart
    chart.on("click", (params: unknown) => {
      const point = latestBuild.current.pointFromParams(params)
      if (!point || !latestOnPoint.current) return
      const native = (params as { event?: { event?: MouseEvent } }).event?.event
      const rect = node.getBoundingClientRect()
      chart.dispatchAction({ type: "hideTip" })
      latestOnPoint.current(point, { x: native?.clientX ?? rect.left + rect.width / 2, y: native?.clientY ?? rect.top + rect.height / 2 })
    })
    setThemedOption(chart, latestBuild.current.option, true)
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(node)
    return () => {
      observer.disconnect()
      chart.dispose()
      instance.current = null
    }
  }, [ready])

  useEffect(() => {
    if (instance.current) setThemedOption(instance.current, build.option, true)
  }, [build])

  if (needsMap && mapState === "error") {
    return (
      <div style={{ height }} className="grid place-items-center rounded-xl bg-[color:var(--c-bg-fff8f4)] px-6 text-center text-sm text-[color:var(--c-text-86646d)]">
        The district map could not be loaded. Switch to a column chart or reload the page.
      </div>
    )
  }
  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      style={{ height }}
      className={`w-full ${onPoint ? "cursor-pointer" : ""} ${ready ? "" : "animate-pulse rounded-xl bg-[color:var(--c-bg-ffeee7)]"}`}
    />
  )
}
