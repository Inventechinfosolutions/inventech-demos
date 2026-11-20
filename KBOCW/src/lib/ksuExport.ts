import type { KsuOverview } from "@/types/ksu"

const cell = (value: string | number | null) => {
  const text = value === null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
const line = (values: (string | number | null)[]) => values.map(cell).join(",")

/**
 * Aggregated figures only. No worker, case or payment level records are exported, and every file
 * carries the illustrative marker.
 */
export function ksuSummaryCsv(overview: KsuOverview): string {
  const rows: string[] = [
    line(["Illustrative POC Data. Synthetic figures. Not official statistics."]),
    line([overview.title]),
    line(["Period", overview.periodLabel]),
    line(["Scope", overview.scopeLabel]),
    line(["Reporting date", overview.reportingDate]),
    "",
    line(["Key figures"]),
    line(["Indicator", "Value", "Period", "Basis"]),
    ...overview.kpis.map((kpi) => line([kpi.label, kpi.value, kpi.period, kpi.basis])),
    "",
    line(["Schemes"]),
    line(["Scheme", "Status", "Enrolments", "Cases received", "Cases approved", "Beneficiaries", "Approved amount (INR)", "Disbursed amount (INR)"]),
    ...overview.schemes.rows.map((row) => line([row.name, row.statusLabel, row.enrolments, row.received, row.approved, row.beneficiaries, row.approvedAmount, row.disbursedAmount])),
    "",
    line(["Districts"]),
    line(["District", "Registered workers", "Illustrative baseline", "Coverage (%)", "Enrolments", "Cases received", "Pending cases", "Disbursed (INR)"]),
    ...overview.districtRows.map((row) => line([row.name, row.registered, row.baseline, row.coverage, row.enrolments, row.received, row.pending, row.disbursed])),
  ]
  return rows.join("\n")
}

export function downloadKsuSummary(overview: KsuOverview) {
  const blob = new Blob([ksuSummaryCsv(overview)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `KSUWSSB-Executive-Overview-ILLUSTRATIVE-${overview.filters.financialYear}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
