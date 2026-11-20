import { formatCount, formatCrore, formatLakh } from "@/lib/format"
import { palette } from "@/lib/palette"
import type {
  GigAggregatorChart,
  GigFeeChart,
  GigFundChart,
  GigGrievanceChart,
  GigPayoutChart,
  GigRegistrationChart,
  GigSafetyChart,
  GigSchemeChart,
  GigSectorChart,
} from "@/types/gig"

export type Unit = "count" | "inr"

export interface SeriesSpec {
  name: string
  values: number[]
  unit: Unit
  color: string
  type?: "bar" | "line"
  stack?: string
  /** 0 is the left (or bottom) value axis, 1 is the right axis. */
  axis?: 0 | 1
}

export function moneyShort(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 10000000) return formatCrore(value)
  if (absolute >= 100000) return `${value < 0 ? "-" : ""}₹${formatLakh(absolute)}`
  return `₹${Math.round(value).toLocaleString("en-IN")}`
}

const unitText = (unit: Unit, value: number) => (unit === "inr" ? moneyShort(value) : formatCount(value))

function axisText(unit: Unit, value: number): string {
  if (value === 0) return "0"
  if (unit === "inr") {
    const crore = value / 10000000
    if (Math.abs(crore) >= 1) return `${Number(crore.toFixed(crore >= 100 ? 0 : 1))} Cr`
    const lakh = value / 100000
    if (Math.abs(lakh) >= 1) return `${Number(lakh.toFixed(Math.abs(lakh) >= 10 ? 0 : 1))} L`
    return `${Number((value / 1000).toFixed(0))}K`
  }
  if (Math.abs(value) >= 100000) return `${Number((value / 100000).toFixed(1))} L`
  if (Math.abs(value) >= 1000) return `${Number((value / 1000).toFixed(1))}K`
  return String(value)
}

/** Shared cartesian chart. Categories on the bottom axis, or on the left when horizontal. */
export function cartesian(categories: string[], series: SeriesSpec[], options: { horizontal?: boolean; reduceMotion: boolean; labelWidth?: number }) {
  const { horizontal = false, reduceMotion, labelWidth = 150 } = options
  const leftUnit = series.find((item) => (item.axis ?? 0) === 0)?.unit ?? "count"
  const rightUnit = series.find((item) => item.axis === 1)?.unit
  const byName = new Map(series.map((item) => [item.name, item]))

  const categoryAxis = {
    type: "category" as const,
    data: categories,
    inverse: horizontal,
    axisLabel: horizontal
      ? { color: "var(--c-text-86646d)", fontSize: 12, width: labelWidth, overflow: "truncate" as const }
      : { color: "var(--c-text-86646d)", fontSize: 12, hideOverlap: true },
    axisLine: { lineStyle: { color: "var(--c-border-fed9c8)" } },
    axisTick: { show: false },
  }
  const valueAxis = (unit: Unit) => ({
    type: "value" as const,
    axisLabel: { color: "var(--c-text-86646d)", fontSize: 12, formatter: (value: number) => axisText(unit, value) },
    splitLine: { lineStyle: { color: "var(--c-border-ffeae1)" } },
  })

  const valueAxes = rightUnit && !horizontal ? [valueAxis(leftUnit), { ...valueAxis(rightUnit), splitLine: { show: false } }] : valueAxis(leftUnit)

  return {
    animation: !reduceMotion,
    textStyle: { fontFamily: "Inter, sans-serif" },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      confine: true,
      formatter: (params: unknown) => {
        const points = (Array.isArray(params) ? params : [params]) as { seriesName?: string; name?: string; value?: number; marker?: string }[]
        const lines = points.map((point) => {
          const unit = byName.get(point.seriesName ?? "")?.unit ?? "count"
          return `${point.marker ?? ""} ${point.seriesName}: ${unitText(unit, Number(point.value ?? 0))}`
        })
        return [`<strong>${points[0]?.name ?? ""}</strong>`, ...lines].join("<br/>")
      },
    },
    legend: { type: "scroll", top: 0, itemGap: 14, itemWidth: 16, itemHeight: 10, textStyle: { color: "var(--c-text-461220)", fontSize: 12 } },
    grid: { left: 8, right: rightUnit && !horizontal ? 8 : 16, top: 44, bottom: 8, containLabel: true },
    xAxis: horizontal ? valueAxis(leftUnit) : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxes,
    series: series.map((item) => {
      const type = item.type ?? "bar"
      return type === "line"
        ? {
            name: item.name,
            type: "line" as const,
            yAxisIndex: item.axis ?? 0,
            data: item.values,
            itemStyle: { color: item.color },
            lineStyle: { width: 2, color: item.color },
            symbolSize: 7,
            cursor: "pointer",
          }
        : {
            name: item.name,
            type: "bar" as const,
            yAxisIndex: horizontal ? undefined : (item.axis ?? 0),
            stack: item.stack,
            data: item.values,
            itemStyle: { color: item.color },
            barMaxWidth: horizontal ? 16 : 22,
            cursor: "pointer",
          }
    }),
  }
}

const motion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function registrationOption(chart: GigRegistrationChart) {
  return cartesian(
    chart.months,
    [
      { name: "Records received", values: chart.records, unit: "count", color: palette.blue },
      { name: "Workers separated", values: chart.separated, unit: "count", color: palette.amber },
      { name: "New Board registrations", values: chart.newlyRegistered, unit: "count", color: palette.navy, type: "line" },
    ],
    { reduceMotion: motion() },
  )
}

export function sectorOption(chart: GigSectorChart) {
  return cartesian(
    chart.rows.map((row) => row.name),
    [{ name: "Registered workers", values: chart.rows.map((row) => row.workers), unit: "count", color: palette.blue }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 170 },
  )
}

export function aggregatorOption(chart: GigAggregatorChart) {
  const rows = chart.rows.filter((row) => row.workers > 0 || row.engagements > 0)
  return {
    rows: rows.length,
    option: cartesian(
      rows.map((row) => row.name),
      [{ name: "Workers on the platform", values: rows.map((row) => row.workers), unit: "count", color: palette.blue }],
      { horizontal: true, reduceMotion: motion(), labelWidth: 110 },
    ),
  }
}

export function payoutOption(chart: GigPayoutChart) {
  return cartesian(
    chart.months,
    [
      { name: "Worker payouts", values: chart.payout, unit: "inr", color: palette.blue },
      { name: "Active workers", values: chart.activeWorkers, unit: "count", color: palette.navy, type: "line", axis: 1 },
    ],
    { reduceMotion: motion() },
  )
}

export function feeOption(chart: GigFeeChart) {
  return cartesian(
    chart.months,
    [
      { name: "Payable", values: chart.payable, unit: "inr", color: palette.slate },
      { name: "Declared", values: chart.declared, unit: "inr", color: palette.indigo },
      { name: "Deposited", values: chart.deposited, unit: "inr", color: palette.blue },
      { name: "Reconciled", values: chart.reconciled, unit: "inr", color: palette.navy },
    ],
    { reduceMotion: motion() },
  )
}

export function fundOption(chart: GigFundChart) {
  return cartesian(
    chart.months,
    [
      { name: "Receipts", values: chart.receipts, unit: "inr", color: palette.blue },
      { name: "Expenditure", values: chart.expenditure, unit: "inr", color: palette.amber },
      { name: "Closing balance", values: chart.closing, unit: "inr", color: palette.navy, type: "line" },
    ],
    { reduceMotion: motion() },
  )
}

export function schemeOption(chart: GigSchemeChart) {
  return cartesian(
    chart.pipeline.map((item) => item.label),
    [{ name: "Applications", values: chart.pipeline.map((item) => item.value), unit: "count", color: palette.blue }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 170 },
  )
}

export function grievanceOption(chart: GigGrievanceChart) {
  return cartesian(
    chart.categories.map((row) => row.name),
    [
      { name: "Resolved", values: chart.categories.map((row) => row.resolved), unit: "count", color: palette.slate, stack: "status" },
      { name: "Pending", values: chart.categories.map((row) => row.pending), unit: "count", color: palette.indigo, stack: "status" },
      { name: "Escalated", values: chart.categories.map((row) => row.escalated), unit: "count", color: palette.blue, stack: "status" },
    ],
    { horizontal: true, reduceMotion: motion(), labelWidth: 170 },
  )
}

export function grievanceTrendOption(chart: GigGrievanceChart) {
  return cartesian(
    chart.months,
    [
      { name: "Received", values: chart.received, unit: "count", color: palette.blue },
      { name: "Resolved", values: chart.resolved, unit: "count", color: palette.navy, type: "line" },
    ],
    { reduceMotion: motion() },
  )
}

export function safetyOption(chart: GigSafetyChart) {
  return cartesian(
    chart.months,
    [
      { name: "Non-fatal", values: chart.nonFatal, unit: "count", color: palette.indigo, stack: "severity" },
      { name: "Fatal", values: chart.fatal, unit: "count", color: palette.blue, stack: "severity" },
      { name: "Claims initiated", values: chart.claimsInitiated, unit: "count", color: palette.amber, type: "line" },
      { name: "Claims settled", values: chart.claimsSettled, unit: "count", color: palette.navy, type: "line" },
    ],
    { reduceMotion: motion() },
  )
}

export function safetyTypeOption(chart: GigSafetyChart) {
  return cartesian(
    chart.types.map((row) => row.name),
    [
      { name: "Non-fatal", values: chart.types.map((row) => row.nonFatal), unit: "count", color: palette.indigo, stack: "severity" },
      { name: "Fatal", values: chart.types.map((row) => row.fatal), unit: "count", color: palette.blue, stack: "severity" },
    ],
    { horizontal: true, reduceMotion: motion(), labelWidth: 170 },
  )
}

/** One sentence for people who cannot see the chart: the highest and lowest values. */
export function describeSeries(what: string, categories: string[], values: number[], unit: Unit): string {
  if (categories.length === 0 || values.length === 0) return `${what}. No data in the selected scope.`
  let high = 0
  let low = 0
  values.forEach((value, index) => {
    if (value > values[high]) high = index
    if (value < values[low]) low = index
  })
  if (categories.length === 1) return `${what}. ${categories[0]}: ${unitText(unit, values[0])}.`
  return `${what}. Highest: ${categories[high]}, ${unitText(unit, values[high])}. Lowest: ${categories[low]}, ${unitText(unit, values[low])}.`
}
