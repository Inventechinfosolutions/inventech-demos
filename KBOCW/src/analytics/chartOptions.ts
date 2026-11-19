import { BarChart, FunnelChart, HeatmapChart, LineChart, MapChart, PieChart, ScatterChart } from "echarts/charts"
import { GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { formatGroupValue } from "@/analytics/engine"
import type { CellValue, QueryResult, ResultColumn, Unit, VizType } from "@/analytics/types"
import { formatCount } from "@/lib/format"
import { palette } from "@/lib/palette"
import { resolveCssVars } from "@/theme/chartTheme"

echarts.use([BarChart, LineChart, PieChart, ScatterChart, FunnelChart, HeatmapChart, MapChart, GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, CanvasRenderer])

export { echarts }

const SERIES_COLORS = [palette.blue, palette.teal, palette.amber, palette.indigo, palette.slate, palette.navy, "var(--c-series-69202e)", "var(--c-series-c9737c)", "var(--c-series-b8a1a6)", "var(--c-series-83606a)"]
const INK = "var(--c-text-461220)"
const MUTED = "var(--c-text-86646d)"
const GRID = "var(--c-border-fee4d8)"

// ---------------------------------------------------------------- number formatting

export function formatInrCompact(value: number) {
  const sign = value < 0 ? "-" : ""
  const absolute = Math.abs(value)
  if (absolute >= 1e7) return `${sign}₹${(absolute / 1e7).toLocaleString("en-IN", { maximumFractionDigits: absolute >= 1e9 ? 0 : 2 })} Cr`
  if (absolute >= 1e5) return `${sign}₹${(absolute / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`
  return `${sign}₹${Math.round(absolute).toLocaleString("en-IN")}`
}

export function formatByUnit(unit: Unit, value: CellValue): string {
  if (value == null || value === "") return "No data"
  if (typeof value === "string") return value
  switch (unit) {
    case "inr":
      return formatInrCompact(value)
    case "percent":
      return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`
    case "days":
      return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })} days`
    case "score":
      return value.toLocaleString("en-IN", { maximumFractionDigits: 1 })
    default:
      return Number.isInteger(value) ? formatCount(value) : value.toLocaleString("en-IN", { maximumFractionDigits: 1 })
  }
}

function axisFormat(unit: Unit) {
  return (value: number) => {
    if (unit === "inr") {
      const absolute = Math.abs(value)
      if (absolute >= 1e7) return `₹${(value / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`
      if (absolute >= 1e5) return `₹${(value / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 1 })} L`
      return `₹${value.toLocaleString("en-IN")}`
    }
    if (unit === "percent") return `${value}%`
    return value.toLocaleString("en-IN")
  }
}

// ---------------------------------------------------------------- shaping

export interface Shaped {
  categories: CellValue[]
  seriesNames: string[]
  series: { name: string; unit: Unit; values: (number | null)[]; column: ResultColumn }[]
  dimensions: ResultColumn[]
  measures: ResultColumn[]
  splitByDimension: boolean
}

const unique = (values: CellValue[]) => {
  const seen: CellValue[] = []
  for (const value of values) if (!seen.includes(value)) seen.push(value)
  return seen
}

export function shape(result: QueryResult): Shaped {
  const dimensions = result.columns.filter((column) => column.kind === "dimension")
  const measures = result.columns.filter((column) => column.kind === "measure")
  const splitByDimension = dimensions.length >= 2 && measures.length >= 1
  if (dimensions.length === 0) {
    return {
      categories: ["Total"],
      seriesNames: measures.map((measure) => measure.label),
      series: measures.map((measure) => ({ name: measure.label, unit: measure.unit, values: [typeof result.rows[0]?.[measure.id] === "number" ? (result.rows[0][measure.id] as number) : null], column: measure })),
      dimensions,
      measures,
      splitByDimension: false,
    }
  }
  const categories = unique(result.rows.map((row) => row[dimensions[0].id]))
  if (splitByDimension) {
    const measure = measures[0]
    const names = unique(result.rows.map((row) => row[dimensions[1].id])).sort((a, b) => String(a).localeCompare(String(b), "en", { numeric: true }))
    return {
      categories,
      seriesNames: names.map((name) => formatGroupValue(dimensions[1], name)),
      series: names.map((name) => ({
        name: formatGroupValue(dimensions[1], name),
        unit: measure.unit,
        values: categories.map((category) => {
          const row = result.rows.find((item) => item[dimensions[0].id] === category && item[dimensions[1].id] === name)
          const value = row?.[measure.id]
          return typeof value === "number" ? value : null
        }),
        column: measure,
      })),
      dimensions,
      measures,
      splitByDimension,
    }
  }
  return {
    categories,
    seriesNames: measures.map((measure) => measure.label),
    series: measures.map((measure) => ({
      name: measure.label,
      unit: measure.unit,
      values: categories.map((category) => {
        const row = result.rows.find((item) => item[dimensions[0].id] === category)
        const value = row?.[measure.id]
        return typeof value === "number" ? value : null
      }),
      column: measure,
    })),
    dimensions,
    measures,
    splitByDimension,
  }
}

// ---------------------------------------------------------------- click payload

/** Dimension values behind a chart element, keyed by result column id. */
export type ChartPoint = Record<string, string>

export interface ChartBuild {
  option: Record<string, unknown>
  pointFromParams: (params: unknown) => ChartPoint | null
}

export interface ChartOptions {
  showLabels: boolean
  stacked: boolean
}

function tooltipRows(unitOf: (name: string) => Unit, items: { marker?: string; seriesName?: string; value?: unknown }[]) {
  return items
    .map((item) => `${item.marker ?? ""} ${item.seriesName ?? ""}: <strong>${formatByUnit(unitOf(item.seriesName ?? ""), typeof item.value === "number" ? item.value : null)}</strong>`)
    .join("<br/>")
}

const baseText = { color: INK, fontSize: 12 }

function axisCommon() {
  return {
    axisLine: { lineStyle: { color: "var(--c-border-fed4c1)" } },
    axisTick: { show: false },
    axisLabel: { color: MUTED, fontSize: 12 },
    splitLine: { lineStyle: { color: GRID } },
  }
}

export function buildChart(type: VizType, result: QueryResult, options: ChartOptions): ChartBuild | null {
  const shaped = shape(result)
  const { dimensions, measures } = shaped
  if (measures.length === 0) return null
  const first = dimensions[0]
  const animation = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const unitByName = (name: string) => shaped.series.find((entry) => entry.name === name)?.unit ?? measures[0].unit
  const categoryLabel = (value: unknown) => (first ? formatGroupValue(first, value as CellValue) : String(value))
  const rawFromLabel = (name: string) =>
    shaped.categories.find((category) => String(category ?? "Not recorded") === name) ?? shaped.categories.find((category) => categoryLabel(category) === name)
  const rawSeries = (label: string) => {
    if (!shaped.splitByDimension) return undefined
    const column = dimensions[1]
    return unique(result.rows.map((row) => row[column.id])).find((value) => formatGroupValue(column, value) === label)
  }

  const pointFromCategorical = (params: unknown): ChartPoint | null => {
    const point = params as { name?: string; seriesName?: string }
    if (!first || point.name == null) return null
    const raw = rawFromLabel(point.name) ?? point.name
    const out: ChartPoint = { [first.id]: String(raw) }
    if (shaped.splitByDimension && point.seriesName) {
      const second = rawSeries(point.seriesName)
      if (second != null) out[dimensions[1].id] = String(second)
    }
    return out
  }

  const legend = shaped.series.length > 1 ? { top: 0, type: "scroll", itemGap: 14, itemWidth: 16, itemHeight: 10, textStyle: baseText } : undefined
  const gridTop = legend ? 40 : 16
  const labelOption = (unit: Unit) => (options.showLabels ? { show: true, fontSize: 11, color: MUTED, formatter: (item: { value?: unknown }) => formatByUnit(unit, typeof item.value === "number" ? item.value : null) } : { show: false })

  const colors = SERIES_COLORS

  if (type === "bar" || type === "column" || type === "stacked" || type === "line" || type === "area") {
    const horizontal = type === "bar"
    const stacked = type === "stacked" || ((type === "column" || type === "bar" || type === "area") && options.stacked)
    const unit = measures[0].unit
    const crowded = shaped.categories.length > 12
    const categoryAxis = {
      type: "category",
      data: shaped.categories.map((category) => String(category ?? "Not recorded")),
      inverse: horizontal,
      ...axisCommon(),
      splitLine: { show: false },
      axisLabel: {
        color: MUTED,
        fontSize: 12,
        interval: 0,
        rotate: !horizontal && crowded ? 40 : 0,
        width: horizontal ? 120 : undefined,
        overflow: "truncate",
        formatter: (value: string) => (first ? formatGroupValue(first, value) : value),
      },
    }
    const valueAxis = { type: "value", ...axisCommon(), axisLabel: { color: MUTED, fontSize: 12, formatter: axisFormat(unit) } }
    return {
      option: {
        animation,
        color: colors,
        legend,
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (items: { name?: string; marker?: string; seriesName?: string; value?: unknown }[]) => `<strong>${categoryLabel(items[0]?.name ?? "")}</strong><br/>${tooltipRows(unitByName, items)}`,
        },
        grid: { left: 8, right: horizontal ? 36 : 16, top: gridTop, bottom: 8, containLabel: true },
        xAxis: horizontal ? valueAxis : categoryAxis,
        yAxis: horizontal ? categoryAxis : valueAxis,
        series: shaped.series.map((entry, index) => ({
          name: entry.name,
          type: type === "line" || type === "area" ? "line" : "bar",
          data: entry.values,
          stack: stacked ? "total" : undefined,
          smooth: false,
          symbolSize: 6,
          areaStyle: type === "area" ? { opacity: stacked ? 0.55 : 0.22 } : undefined,
          barMaxWidth: 36,
          emphasis: { focus: "series" },
          itemStyle: { borderRadius: type === "line" || type === "area" || stacked ? 0 : horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] },
          label: labelOption(entry.unit),
          color: colors[index % colors.length],
        })),
      },
      pointFromParams: pointFromCategorical,
    }
  }

  if (type === "pie" || type === "donut" || type === "funnel") {
    const measure = measures[0]
    const data = shaped.categories.map((category, index) => ({ name: categoryLabel(category), value: shaped.series[0].values[index] ?? 0 })).filter((item) => item.value > 0 || type !== "funnel")
    const total = data.reduce((sum, item) => sum + item.value, 0)
    return {
      option: {
        animation,
        color: colors,
        tooltip: {
          trigger: "item",
          formatter: (item: { name?: string; marker?: string; value?: unknown; percent?: number }) =>
            `<strong>${item.name ?? ""}</strong><br/>${item.marker ?? ""} ${measure.label}: <strong>${formatByUnit(measure.unit, typeof item.value === "number" ? item.value : null)}</strong>${type === "funnel" ? "" : `<br/>Share: ${(item.percent ?? 0).toFixed(1)}%`}`,
        },
        legend: { bottom: 0, type: "scroll", itemGap: 12, itemWidth: 14, itemHeight: 10, textStyle: baseText },
        series:
          type === "funnel"
            ? [
                {
                  type: "funnel",
                  sort: "descending",
                  left: "8%",
                  right: "8%",
                  top: 12,
                  bottom: 44,
                  gap: 3,
                  label: { show: true, position: "inside", color: "var(--c-text-ffffff)", fontSize: 12, formatter: (item: { name?: string; value?: unknown }) => `${item.name}  ${formatByUnit(measure.unit, typeof item.value === "number" ? item.value : null)}` },
                  data,
                },
              ]
            : [
                {
                  type: "pie",
                  radius: type === "donut" ? ["46%", "70%"] : ["0%", "70%"],
                  center: ["50%", "46%"],
                  itemStyle: { borderColor: "var(--c-border-ffffff)", borderWidth: 2 },
                  label: { show: true, color: INK, fontSize: 12, formatter: (item: { name?: string; percent?: number }) => `${item.name}\n${(item.percent ?? 0).toFixed(1)}%` },
                  labelLine: { length: 8, length2: 8 },
                  data,
                },
              ],
        graphic:
          type === "donut"
            ? [{ type: "text", left: "center", top: "41%", style: { text: formatByUnit(measure.unit, total), fill: INK, fontSize: 16, fontWeight: 600, textAlign: "center" } }]
            : undefined,
      },
      pointFromParams: (params) => {
        const point = params as { name?: string }
        if (!first || point.name == null) return null
        return { [first.id]: String(rawFromLabel(point.name) ?? point.name) }
      },
    }
  }

  if (type === "combo") {
    const bars = shaped.series[0]
    const lines = shaped.series.slice(1)
    const secondUnit = lines[0]?.unit ?? bars.unit
    const sameUnit = lines.every((entry) => entry.unit === bars.unit)
    const categoryAxis = {
      type: "category",
      data: shaped.categories.map((category) => String(category ?? "Not recorded")),
      ...axisCommon(),
      splitLine: { show: false },
      axisLabel: { color: MUTED, fontSize: 12, interval: 0, rotate: shaped.categories.length > 8 ? 40 : 0, formatter: (value: string) => (first ? formatGroupValue(first, value) : value) },
    }
    return {
      option: {
        animation,
        color: colors,
        legend: { top: 0, type: "scroll", itemGap: 14, itemWidth: 16, itemHeight: 10, textStyle: baseText },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (items: { name?: string; marker?: string; seriesName?: string; value?: unknown }[]) => `<strong>${categoryLabel(items[0]?.name ?? "")}</strong><br/>${tooltipRows(unitByName, items)}`,
        },
        grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
        xAxis: categoryAxis,
        yAxis: [
          { type: "value", name: bars.name, nameTextStyle: { color: MUTED, fontSize: 11, align: "left" }, ...axisCommon(), axisLabel: { color: MUTED, fontSize: 12, formatter: axisFormat(bars.unit) } },
          { type: "value", name: sameUnit ? undefined : lines[0]?.name, nameTextStyle: { color: MUTED, fontSize: 11, align: "right" }, ...axisCommon(), splitLine: { show: false }, axisLabel: { color: MUTED, fontSize: 12, formatter: axisFormat(secondUnit) } },
        ],
        series: [
          { name: bars.name, type: "bar", data: bars.values, barMaxWidth: 36, itemStyle: { borderRadius: [3, 3, 0, 0] }, label: labelOption(bars.unit), color: colors[0] },
          ...lines.map((entry, index) => ({ name: entry.name, type: "line", yAxisIndex: sameUnit ? 0 : 1, data: entry.values, symbolSize: 7, label: labelOption(entry.unit), color: colors[(index + 1) % colors.length] })),
        ],
      },
      pointFromParams: pointFromCategorical,
    }
  }

  if (type === "scatter") {
    if (measures.length < 2) return null
    const [x, y, size] = measures
    const points = result.rows.map((row) => ({
      name: first ? formatGroupValue(first, row[first.id]) : "",
      raw: first ? String(row[first.id] ?? "") : "",
      value: [row[x.id], row[y.id], size ? row[size.id] : 12] as [CellValue, CellValue, CellValue],
    }))
    const sizes = points.map((point) => Number(point.value[2]) || 0)
    const maxSize = Math.max(...sizes, 1)
    return {
      option: {
        animation,
        color: colors,
        tooltip: {
          trigger: "item",
          formatter: (item: { data?: { name?: string; value?: CellValue[] } }) =>
            [`<strong>${item.data?.name ?? ""}</strong>`, `${x.label}: ${formatByUnit(x.unit, item.data?.value?.[0] ?? null)}`, `${y.label}: ${formatByUnit(y.unit, item.data?.value?.[1] ?? null)}`, ...(size ? [`${size.label}: ${formatByUnit(size.unit, item.data?.value?.[2] ?? null)}`] : [])].join("<br/>"),
        },
        grid: { left: 8, right: 24, top: 24, bottom: 28, containLabel: true },
        xAxis: { type: "value", name: x.label, nameLocation: "middle", nameGap: 28, nameTextStyle: { color: MUTED, fontSize: 12 }, scale: true, ...axisCommon(), axisLabel: { color: MUTED, fontSize: 12, formatter: axisFormat(x.unit) } },
        yAxis: { type: "value", name: y.label, nameTextStyle: { color: MUTED, fontSize: 12, align: "left" }, scale: true, ...axisCommon(), axisLabel: { color: MUTED, fontSize: 12, formatter: axisFormat(y.unit) } },
        series: [
          {
            type: "scatter",
            data: points.map((point) => ({ name: point.name, value: point.value, raw: point.raw })),
            symbolSize: size ? (value: CellValue[]) => 10 + (Math.sqrt(Number(value[2]) || 0) / Math.sqrt(maxSize)) * 24 : 14,
            itemStyle: { color: palette.blue, opacity: 0.78, borderColor: "var(--c-border-ffffff)", borderWidth: 1 },
            emphasis: { itemStyle: { opacity: 1 } },
          },
        ],
      },
      pointFromParams: (params) => {
        const item = params as { data?: { raw?: string } }
        return first && item.data?.raw ? { [first.id]: item.data.raw } : null
      },
    }
  }

  if (type === "heatmap") {
    if (dimensions.length < 2) return null
    const [rowsDim, colsDim] = dimensions
    const xs = unique(result.rows.map((row) => row[rowsDim.id]))
    const ys = unique(result.rows.map((row) => row[colsDim.id])).sort((a, b) => String(a).localeCompare(String(b), "en", { numeric: true }))
    const measure = measures[0]
    const data = result.rows.map((row) => [xs.indexOf(row[rowsDim.id]), ys.indexOf(row[colsDim.id]), typeof row[measure.id] === "number" ? row[measure.id] : null])
    const values = data.map((item) => Number(item[2]) || 0)
    return {
      option: {
        animation,
        tooltip: {
          position: "top",
          formatter: (item: { data?: CellValue[] }) => {
            const [xi, yi, value] = item.data ?? []
            return `<strong>${formatGroupValue(rowsDim, xs[Number(xi)])}</strong> · ${formatGroupValue(colsDim, ys[Number(yi)])}<br/>${measure.label}: <strong>${formatByUnit(measure.unit, (value as CellValue) ?? null)}</strong>`
          },
        },
        grid: { left: 8, right: 24, top: 12, bottom: 56, containLabel: true },
        xAxis: { type: "category", data: xs.map((value) => formatGroupValue(rowsDim, value)), splitArea: { show: true }, axisLabel: { color: MUTED, fontSize: 12, interval: 0, rotate: xs.length > 8 ? 40 : 0 }, axisLine: { lineStyle: { color: "var(--c-border-fed4c1)" } }, axisTick: { show: false } },
        yAxis: { type: "category", data: ys.map((value) => formatGroupValue(colsDim, value)), splitArea: { show: true }, axisLabel: { color: MUTED, fontSize: 12 }, axisLine: { lineStyle: { color: "var(--c-border-fed4c1)" } }, axisTick: { show: false } },
        visualMap: { min: 0, max: Math.max(...values, 1), calculable: false, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["var(--c-map-low)", palette.blue] }, textStyle: { color: MUTED, fontSize: 12 }, formatter: (value: number) => formatByUnit(measure.unit, value) },
        series: [{ type: "heatmap", data, itemStyle: { borderColor: "var(--c-border-ffffff)", borderWidth: 1 }, label: { show: options.showLabels, fontSize: 10, formatter: (item: { data?: CellValue[] }) => formatByUnit(measure.unit, (item.data?.[2] as CellValue) ?? null) }, emphasis: { itemStyle: { borderColor: INK, borderWidth: 1 } } }],
      },
      pointFromParams: (params) => {
        const item = params as { data?: number[] }
        if (!item.data) return null
        return { [rowsDim.id]: String(xs[item.data[0]]), [colsDim.id]: String(ys[item.data[1]]) }
      },
    }
  }

  if (type === "map") {
    if (!first || first.fieldId !== "district") return null
    const measure = measures[0]
    const data = result.rows.map((row) => ({ name: String(row[first.id]), value: typeof row[measure.id] === "number" ? row[measure.id] : null }))
    const values = data.map((item) => Number(item.value) || 0)
    return {
      option: {
        animation,
        tooltip: {
          trigger: "item",
          formatter: (item: { name?: string; value?: unknown }) => `<strong>${item.name ?? ""}</strong><br/>${measure.label}: <strong>${formatByUnit(measure.unit, typeof item.value === "number" ? item.value : null)}</strong>`,
        },
        visualMap: { min: 0, max: Math.max(...values, 1), calculable: false, left: 8, bottom: 8, inRange: { color: ["var(--c-map-low)", palette.blue] }, textStyle: { color: MUTED, fontSize: 12 }, formatter: (value: number) => formatByUnit(measure.unit, value) },
        series: [
          {
            type: "map",
            map: "karnataka",
            roam: false,
            layoutCenter: ["52%", "50%"],
            layoutSize: "104%",
            aspectScale: 1,
            selectedMode: false,
            label: { show: false },
            itemStyle: { areaColor: "var(--c-map-area)", borderColor: "var(--c-border-ffffff)", borderWidth: 1 },
            emphasis: { label: { show: false }, itemStyle: { borderColor: INK, borderWidth: 1.5 } },
            data,
          },
        ],
      },
      pointFromParams: (params) => {
        const item = params as { name?: string }
        return item.name ? { [first.id]: item.name } : null
      },
    }
  }

  return null
}

// ---------------------------------------------------------------- map loading

let mapReady: Promise<void> | null = null

export function ensureKarnatakaMap() {
  if (!mapReady) {
    mapReady = fetch(`${import.meta.env.BASE_URL}geo/karnataka-districts.geojson`)
      .then((response) => {
        if (!response.ok) throw new Error("The district map could not be loaded.")
        return response.json() as Promise<Parameters<typeof echarts.registerMap>[1]>
      })
      .then((geo) => {
        echarts.registerMap("karnataka", geo)
      })
      .catch((error) => {
        mapReady = null
        throw error
      })
  }
  return mapReady
}

const EXPORT_PAPER = "#ffffff"

/** Draws a chart off screen and returns a JPEG data URL. Used by PDF export. */
export async function renderChartImage(type: VizType, result: QueryResult, options: ChartOptions, size = { width: 900, height: 420 }): Promise<string | null> {
  if (type === "map") await ensureKarnatakaMap()
  const build = buildChart(type, result, options)
  if (!build) return null
  const host = document.createElement("div")
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${size.width}px;height:${size.height}px`
  document.body.appendChild(host)
  const instance = echarts.init(host, undefined, { width: size.width, height: size.height })
  // Exports always print on white paper, so the Bordeaux colours are used regardless of the active theme.
  instance.setOption({ ...resolveCssVars(build.option, "bordeaux"), animation: false, backgroundColor: EXPORT_PAPER })
  const url = instance.getDataURL({ type: "jpeg", pixelRatio: 2, backgroundColor: EXPORT_PAPER })
  instance.dispose()
  host.remove()
  return url
}
