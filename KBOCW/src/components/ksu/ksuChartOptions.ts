import { cartesian } from "@/components/gig/gigChartOptions"
import { KSU_SCHEMES } from "@/data/ksuMasters"
import { palette } from "@/lib/palette"
import type { KsuCategoryRow, KsuClaimsSection, KsuFacilitationSection, KsuFinanceSection, KsuRegistrationChart, KsuSchemeSection } from "@/types/ksu"

const motion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
/** Short scheme label for chart axes, where the full name would not fit. */
const tagOf = (id: string) => KSU_SCHEMES.find((scheme) => scheme.id === id)?.tag ?? id
const schemeColors = [palette.blue, palette.teal, palette.amber]

export function registrationOption(chart: KsuRegistrationChart) {
  return cartesian(
    chart.months,
    [
      { name: "New registrations", values: chart.newRegistrations, unit: "count", color: palette.blue },
      { name: "Valid registered workers at month end", values: chart.validStock, unit: "count", color: palette.navy, type: "line", axis: 1 },
    ],
    { reduceMotion: motion() },
  )
}

export function workersOption(rows: KsuCategoryRow[], horizontal = true, labelWidth = 190) {
  return cartesian(
    rows.map((row) => row.name),
    [{ name: "Workers", values: rows.map((row) => row.value), unit: "count", color: palette.blue }],
    { horizontal, reduceMotion: motion(), labelWidth },
  )
}

export function statusOption(rows: KsuCategoryRow[]) {
  return workersOption(rows, true, 170)
}

/** Top districts by one measure, drawn as horizontal bars. */
export function districtBarOption(rows: { name: string; values: number[] }[], series: { name: string; unit: "count" | "inr"; color: string; stack?: string }[]) {
  return cartesian(
    rows.map((row) => row.name),
    series.map((item, index) => ({ ...item, values: rows.map((row) => row.values[index]) })),
    { horizontal: true, reduceMotion: motion(), labelWidth: 120 },
  )
}

export function funnelOption(section: KsuSchemeSection) {
  return cartesian(
    section.funnel.map((item) => item.label),
    [{ name: "Cases received in the period", values: section.funnel.map((item) => item.value), unit: "count", color: palette.blue }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 150 },
  )
}

export function pipelineOption(section: KsuSchemeSection) {
  return cartesian(
    section.pipeline.map((item) => item.label),
    [{ name: "Cases", values: section.pipeline.map((item) => item.value), unit: "count", color: palette.teal }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 210 },
  )
}

export function schemeAmountOption(section: KsuSchemeSection) {
  return cartesian(
    section.rows.map((row) => tagOf(row.id)),
    [
      { name: "Approved", values: section.rows.map((row) => row.approvedAmount), unit: "inr", color: palette.slate },
      { name: "Disbursed", values: section.rows.map((row) => row.disbursedAmount), unit: "inr", color: palette.blue },
    ],
    { reduceMotion: motion() },
  )
}

export function schemeCountOption(section: KsuSchemeSection) {
  return cartesian(
    section.rows.map((row) => tagOf(row.id)),
    [
      { name: "Cases received", values: section.rows.map((row) => row.received), unit: "count", color: palette.blue },
      { name: "Cases approved", values: section.rows.map((row) => row.approved), unit: "count", color: palette.teal },
      { name: "Beneficiaries", values: section.rows.map((row) => row.beneficiaries), unit: "count", color: palette.navy },
    ],
    { reduceMotion: motion() },
  )
}

export function enrolmentOption(section: KsuSchemeSection) {
  return cartesian(
    section.rows.map((row) => tagOf(row.id)),
    [{ name: "Enrolments", values: section.rows.map((row) => row.enrolments), unit: "count", color: palette.blue }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 190 },
  )
}

export function beneficiaryTrendOption(section: KsuSchemeSection) {
  const trend = section.beneficiaryTrend
  return cartesian(
    trend.months,
    trend.series.map((item, index) => ({ name: tagOf(item.id), values: item.values, unit: "count" as const, color: schemeColors[index % schemeColors.length], stack: "beneficiaries" })),
    { reduceMotion: motion() },
  )
}

export function benefitOption(claims: KsuClaimsSection) {
  return cartesian(
    claims.byBenefit.map((item) => item.name),
    [{ name: "Cases received", values: claims.byBenefit.map((item) => item.value), unit: "count", color: palette.blue }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 230 },
  )
}

export function pendingAgeOption(claims: KsuClaimsSection) {
  return cartesian(
    claims.pendingAge.buckets,
    [
      { name: "Under verification", values: claims.pendingAge.verification, unit: "count", color: palette.blue, stack: "pending" },
      { name: "Returned for correction", values: claims.pendingAge.returned, unit: "count", color: palette.amber, stack: "pending" },
    ],
    { reduceMotion: motion() },
  )
}

export function processingOption(claims: KsuClaimsSection) {
  return cartesian(
    claims.processing.rows.map((row) => tagOf(row.id)),
    [
      { name: "Average days", values: claims.processing.rows.map((row) => row.avg ?? 0), unit: "count", color: palette.blue },
      { name: "Median days", values: claims.processing.rows.map((row) => row.median ?? 0), unit: "count", color: palette.navy },
    ],
    { reduceMotion: motion() },
  )
}

export function reasonOption(claims: KsuClaimsSection) {
  return cartesian(
    claims.reasons.map((row) => row.name),
    [{ name: "Cases", values: claims.reasons.map((row) => row.value), unit: "count", color: palette.amber }],
    { horizontal: true, reduceMotion: motion(), labelWidth: 220 },
  )
}

export function unpaidAgeOption(claims: KsuClaimsSection) {
  return cartesian(
    claims.unpaidAge.buckets,
    [
      { name: "Cases", values: claims.unpaidAge.counts, unit: "count", color: palette.blue },
      { name: "Amount", values: claims.unpaidAge.amounts, unit: "inr", color: palette.navy, type: "line", axis: 1 },
    ],
    { reduceMotion: motion() },
  )
}

export function paymentOption(claims: KsuClaimsSection) {
  return cartesian(
    claims.payments.months,
    [
      { name: "Amount paid", values: claims.payments.amount, unit: "inr", color: palette.blue },
      { name: "Payments", values: claims.payments.count, unit: "count", color: palette.navy, type: "line", axis: 1 },
    ],
    { reduceMotion: motion() },
  )
}

export function financeOption(finance: KsuFinanceSection) {
  return cartesian(
    finance.rows.map((row) => tagOf(row.id)),
    [
      { name: "Allocation", values: finance.rows.map((row) => row.allocation), unit: "inr", color: palette.slate },
      { name: "Funds released", values: finance.rows.map((row) => row.released), unit: "inr", color: palette.indigo },
      { name: "Benefits approved", values: finance.rows.map((row) => row.approved), unit: "inr", color: palette.amber },
      { name: "Benefits disbursed", values: finance.rows.map((row) => row.disbursed), unit: "inr", color: palette.blue },
      { name: "Expenditure", values: finance.rows.map((row) => row.expenditure), unit: "inr", color: palette.navy },
    ],
    { reduceMotion: motion() },
  )
}

export function financeTrendOption(finance: KsuFinanceSection) {
  return cartesian(
    finance.trend.map((row) => row.label),
    [
      { name: "Benefits approved", values: finance.trend.map((row) => row.approved), unit: "inr", color: palette.amber },
      { name: "Benefits disbursed", values: finance.trend.map((row) => row.disbursed), unit: "inr", color: palette.blue },
      { name: "Expenditure", values: finance.trend.map((row) => row.expenditure), unit: "inr", color: palette.navy },
    ],
    { reduceMotion: motion() },
  )
}

export function facilitationOption(section: KsuFacilitationSection) {
  return cartesian(
    section.months,
    [
      { name: "Registrations supported", values: section.facilitated, unit: "count", color: palette.blue, stack: "services" },
      { name: "Other services", values: section.services.map((value, index) => value - section.facilitated[index]), unit: "count", color: palette.slate, stack: "services" },
    ],
    { reduceMotion: motion() },
  )
}
