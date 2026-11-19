import { formatCount, formatCrore, formatLakh } from "@/lib/format"
import type { SecretaryOverview } from "@/types/dashboard"

function fileBase(overview: SecretaryOverview) {
  const district = overview.filters.districtId === "all" ? "all-districts" : overview.filters.districtId
  return `KBOCW-Secretary-Overview-${overview.filters.financialYear}-${district}`
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportExcel(overview: SecretaryOverview) {
  const XLSX = await import("xlsx")
  const notes = [
    ["KBOCW Secretary – Integrated Overview"],
    [overview.illustrativeNote],
    [overview.stageNote],
    ["Scope", overview.scopeLabel],
    ["Source", overview.source],
    ["Last refreshed", overview.lastRefreshed],
  ]
  const kpis = [["Indicator", "Value", "Change vs previous year"], ...overview.kpis.map((kpi) => [kpi.label, kpi.displayValue, kpi.change == null ? "Not available" : kpi.change])]
  const districts = [
    ["District", "Projects", "Registered workers", "Cess assessed (₹)", "Cess collected (₹)", "Cess remitted (₹)", "Cess credited (₹)", "Beneficiaries", "Disbursement (₹)", "Pending applications"],
    ...overview.districts.map((district) => [
      district.name,
      district.projects,
      district.workers,
      district.cessAssessed,
      district.cessCollected,
      district.cessRemitted,
      district.cessCredited,
      district.beneficiaries,
      district.disbursement,
      district.pendingApplications,
    ]),
  ]
  const construction = overview.charts.find((chart) => chart.id === "construction")
  const cess = overview.charts.find((chart) => chart.id === "cess")
  const monthly = [
    ["Month", "Projects", "Cess assessed (₹ Cr)", "Cess collected (₹ Cr)", "Cess remitted (₹ Cr)", "Cess credited (₹ Cr)"],
    ...(construction?.categories ?? []).map((month, index) => [
      month,
      construction?.series[0]?.values[index] ?? 0,
      cess?.series[0]?.values[index] ?? 0,
      cess?.series[1]?.values[index] ?? 0,
      cess?.series[2]?.values[index] ?? 0,
      cess?.series[3]?.values[index] ?? 0,
    ]),
  ]
  const schemes = overview.charts.find((chart) => chart.id === "schemes")
  const schemeRows = [["Scheme", "Amount released (₹ Cr)"], ...(schemes?.categories ?? []).map((name, index) => [name, schemes?.series[0]?.values[index] ?? 0])]
  const departments = [["Department", "Data category", "Records received", "Last updated", "Integration status"], ...overview.departments.map((row) => [row.name, row.category, row.records, row.lastUpdated, row.status])]
  const exceptions = [["Issue", "Source department", "Priority", "Records", "Description"], ...overview.exceptions.map((row) => [row.title, row.sourceDepartment, row.priority, row.countLabel, row.description])]

  const book = XLSX.utils.book_new()
  const add = (name: string, rows: (string | number)[][]) => {
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), name)
  }
  add("Notes", notes)
  add("Indicators", kpis)
  add("Monthly", monthly)
  add("Schemes", schemeRows)
  add("Districts", districts)
  add("Departments", departments)
  add("Exceptions", exceptions)
  const output = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer
  download(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileBase(overview)}.xlsx`)
}

export async function exportPdf(overview: SecretaryOverview) {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const margin = 40
  doc.setFontSize(16)
  doc.text("KBOCW Secretary – Integrated Overview", margin, 42)
  doc.setFontSize(10)
  const intro = doc.splitTextToSize(`${overview.illustrativeNote} ${overview.stageNote}`, 760)
  doc.text(intro, margin, 64)
  doc.text(`Scope: ${overview.scopeLabel}`, margin, 96)
  doc.text(`Source: ${overview.source}. Last refreshed: ${overview.lastRefreshed}.`, margin, 112)

  autoTable(doc, {
    startY: 128,
    head: [["Indicator", "Value", "Change vs previous year"]],
    body: overview.kpis.map((kpi) => [kpi.label, kpi.displayValue, kpi.change == null ? "Not available" : `${kpi.change > 0 ? "+" : ""}${kpi.change.toFixed(1)}%`]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [26, 79, 139] },
    margin: { left: margin, right: margin },
  })

  autoTable(doc, {
    head: [["Issue", "Source", "Priority", "Records"]],
    body: overview.exceptions.map((row) => [row.title, row.sourceDepartment, row.priority, row.countLabel]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 79, 139] },
    margin: { left: margin, right: margin },
  })

  autoTable(doc, {
    head: [["Department", "Data category", "Records received", "Last updated", "Status"]],
    body: overview.departments.map((row) => [row.name, row.category, row.records, row.lastUpdated, row.status]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 79, 139] },
    margin: { left: margin, right: margin },
  })

  autoTable(doc, {
    head: [["District", "Projects", "Workers", "Cess assessed", "Cess collected", "Cess remitted", "Beneficiaries", "Pending"]],
    body: overview.districts.map((district) => [
      district.name,
      formatCount(district.projects),
      formatLakh(district.workers),
      formatCrore(district.cessAssessed),
      formatCrore(district.cessCollected),
      formatCrore(district.cessRemitted),
      formatLakh(district.beneficiaries),
      formatCount(district.pendingApplications),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [26, 79, 139] },
    margin: { left: margin, right: margin },
  })

  doc.save(`${fileBase(overview)}.pdf`)
}
