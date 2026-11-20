import { setThemedOption } from "@/theme/chartTheme"
import { MapChart } from "echarts/charts"
import { TooltipComponent, VisualMapComponent } from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { useEffect, useRef, useState } from "react"
import { loadKarnatakaMap } from "@/components/dashboard/KarnatakaMap"
import { moneyShort } from "@/components/gig/gigChartOptions"
import { formatCount } from "@/lib/format"
import type { GigMapDistrict, GigMapMetric } from "@/types/gig"

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer])

const METRICS: { id: GigMapMetric; label: string; money?: boolean }[] = [
  { id: "unique", label: "Registered workers" },
  { id: "active", label: "Active workers" },
  { id: "payout", label: "Worker payouts", money: true },
  { id: "benefits", label: "Benefits disbursed", money: true },
  { id: "grievances", label: "Grievances received" },
]

export function GigMap({
  districts,
  selectedId,
  metric,
  note,
  onMetric,
  onSelect,
}: {
  districts: GigMapDistrict[]
  selectedId: string
  metric: GigMapMetric
  note: string
  onMetric: (metric: GigMapMetric) => void
  onSelect: (districtId: string) => void
}) {
  const node = useRef<HTMLDivElement>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = METRICS.find((item) => item.id === metric) ?? METRICS[0]
  const format = (value: number) => (active.money ? moneyShort(value) : formatCount(value))
  const undrawn = districts.filter((district) => !district.drawn)

  useEffect(() => {
    let cancelled = false
    loadKarnatakaMap()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) setError("The district map could not be loaded.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || !node.current) return
    const drawn = districts.filter((district) => district.drawn)
    const instance = echarts.init(node.current)
    const max = Math.max(...drawn.map((district) => district[metric]), 1)
    setThemedOption(instance, {
      animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: unknown) => {
          const district = (params as { data?: GigMapDistrict }).data
          if (!district?.name) return ""
          return [
            `<strong>${district.name}</strong>`,
            `Registered workers: ${formatCount(district.unique)}`,
            `Active workers: ${formatCount(district.active)}`,
            `Worker payouts: ${moneyShort(district.payout)}`,
            `Benefits disbursed: ${moneyShort(district.benefits)}`,
            `Grievances received: ${formatCount(district.grievances)}`,
          ].join("<br/>")
        },
      },
      visualMap: {
        min: 0,
        max,
        text: ["Higher", "Lower"],
        calculable: false,
        inRange: { color: ["var(--c-map-low)", "var(--c-bg-8c2f39)"] },
        left: 8,
        bottom: 8,
        textStyle: { color: "var(--c-text-744d57)", fontSize: 12 },
        formatter: (value: number) => format(value),
      },
      series: [
        {
          type: "map",
          map: "karnataka",
          roam: false,
          layoutCenter: ["50%", "46%"],
          layoutSize: "112%",
          selectedMode: false,
          label: { show: false },
          emphasis: { label: { show: false } },
          data: drawn.map((district) => {
            const shown = selectedId === "all" || selectedId === district.id
            return {
              ...district,
              name: district.name,
              value: shown ? district[metric] : null,
              itemStyle: shown
                ? { borderColor: selectedId === district.id ? "var(--c-border-461220)" : "var(--c-border-ffffff)", borderWidth: selectedId === district.id ? 2 : 1 }
                : { areaColor: "var(--c-map-area)", borderColor: "var(--c-border-ffffff)" },
            }
          }),
        },
      ],
    })
    const onClick = (params: unknown) => {
      const point = params as { name?: string }
      const district = drawn.find((item) => item.name === point.name)
      if (district) onSelectRef.current(district.id)
    }
    instance.on("click", onClick)
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(node.current)
    return () => {
      observer.disconnect()
      instance.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts, metric, ready, selectedId])

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] sm:p-5">
      <h2 className="text-lg font-semibold text-[color:var(--c-text-461220)]">Gig workers by district</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">Colour shows {active.label.toLowerCase()}. Select a district to update the dashboard. Select it again to clear the district.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Map layer">
        {METRICS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === metric}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${item.id === metric ? "bg-[color:var(--c-bg-461220)] text-white" : "bg-[color:var(--c-bg-ffeee7)] text-[color:var(--c-text-461220)]"}`}
            onClick={() => onMetric(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : <div ref={node} role="img" aria-label={`Map of Karnataka districts coloured by ${active.label.toLowerCase()}`} className="mt-2 h-[360px] w-full min-w-0 sm:h-[460px]" />}
      {undrawn.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Not drawn on the map:</span>
          {undrawn.map((district) => (
            <button
              key={district.id}
              type="button"
              aria-pressed={selectedId === district.id}
              className="rounded-full border border-[color:var(--c-border-fed4c1)] px-3 py-1 font-semibold text-[color:var(--c-text-461220)]"
              onClick={() => onSelect(district.id)}
            >
              {district.name}: {format(district[metric])}
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </section>
  )
}
