import raw from "@/data/factories-boilers.json" with { type: "json" }
import { formatCount, formatLongDate } from "@/lib/format"
import { palette } from "@/lib/palette"
import type { ChartModel, DetailColumn, DetailModel } from "@/types/dashboard"
import type {
  FactoriesDrill,
  FactoriesException,
  FactoriesFilterOptions,
  FactoriesFilters,
  FactoriesMapDistrict,
  FactoriesOverview,
} from "@/types/factories"

interface Named { id: string; name: string }
interface Taluk extends Named { districtId: string; weight: number }
interface Category extends Named {
  kind: "factory" | "other"
  factories: number
  activeFactories: number
  activeOther: number
  inspections: number
  pending: number
  violations: number
  accidents: number
  injuries: number
  fatalities: number
  boilers: number
  boilersDue: number
}
interface Severity extends Named { accidents: number; injuries: number; fatalities: number }
interface Counted extends Named { count: number }
interface VerifiedMatch { department: string; reference: string; note: string }
interface FactorySample {
  id: string
  factoryId: string
  name: string
  districtId: string
  talukId: string
  category: string
  kind: string
  registrationNumber: string
  registrationDate: string
  status: string
  monthIndex: number
  source: string
  verifiedMatch: VerifiedMatch | null
}
interface InspectionSample {
  id: string
  inspectionId: string
  factoryId: string
  name: string
  districtId: string
  talukId: string
  category: string
  inspectionDate: string
  inspector: string
  inspectionCategory: string
  findings: string
  complianceStatus: string
  inspectionStatus: string
  monthIndex: number
  source: string
}
interface AccidentSample {
  id: string
  accidentId: string
  name: string
  districtId: string
  talukId: string
  category: string
  incidentDate: string
  accidentCategory: string
  severity: string
  injuries: number
  fatalities: number
  investigationStatus: string
  monthIndex: number
  source: string
  constructionLink: null
}
interface BoilerSample {
  id: string
  boilerId: string
  name: string
  districtId: string
  talukId: string
  category: string
  boilerCategory: string
  lastInspectionDate: string
  nextDueDate: string
  certificateStatus: string
  boilerStatus: string
  monthIndex: number
  source: string
}
interface DataFile {
  meta: {
    source: string
    lastRefreshed: string
    illustrativeNote: string
    jurisdictionNote: string
    separationNote: string
    stageNote: string
  }
  years: string[]
  months: { index: number; label: string }[]
  districts: Named[]
  taluks: Taluk[]
  categories: Category[]
  severities: Severity[]
  causes: Counted[]
  violationTypes: Counted[]
  inspectionStatuses: Named[]
  complianceStatuses: Named[]
  boilerStatuses: Named[]
  rules: {
    activeFactories: number
    closedFactories: number
    suspendedFactories: number
    activeOther: number
    notices: number
    actionsInitiated: number
    actionsCompleted: number
    actionsOpen: number
    overdueActions: number
    repeatViolations: number
    criticalOpen: number
    violationsOpen: number
    violationsClosed: number
    fatalAccidents: number
    injuries: number
    fatalities: number
    boilerInspectionsCompleted: number
    certificatesIssued: number
    certificatesExpiring: number
    certificatesExpired: number
    pendingBeyondSchedule: number
  }
  metrics: Record<string, number[][][]>
  samples: {
    factories: FactorySample[]
    inspections: InspectionSample[]
    accidents: AccidentSample[]
    boilers: BoilerSample[]
  }
}

const data = raw as unknown as DataFile
const boundaryNote = "District boundaries follow the Census 2011 outline. Vijayanagara is not drawn separately on this illustrative map."

function allocate(total: number, weights: number[]) {
  const rounded = Math.max(0, Math.round(total))
  if (rounded === 0 || weights.every((weight) => weight <= 0)) return weights.map(() => 0)
  const sum = weights.reduce((left, right) => left + right, 0)
  const exact = weights.map((weight) => (rounded * weight) / sum)
  const floors = exact.map((value) => Math.floor(value + 1e-8))
  let left = rounded - floors.reduce((sum, value) => sum + value, 0)
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value + 1e-8) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index)
  let cursor = 0
  while (left > 0) {
    floors[order[cursor % order.length].index] += 1
    left -= 1
    cursor += 1
  }
  return floors
}

function share(value: number, part: number, whole: number) {
  if (part === 0 || whole === 0) return 0
  return Math.round(value * part / whole)
}

function yearIndexOf(financialYear: string) {
  const index = data.years.indexOf(financialYear)
  return index >= 0 ? index : data.years.length - 1
}

function monthIndexes(filters: FactoriesFilters) {
  const startYear = Number(filters.financialYear.slice(0, 4))
  const from = Date.parse(`${filters.fromDate}T00:00:00Z`)
  const to = Date.parse(`${filters.toDate}T00:00:00Z`)
  const indexes: number[] = []
  for (let month = 0; month < 12; month += 1) {
    const monthStart = Date.UTC(startYear, 3 + month, 1)
    const monthEnd = Date.UTC(startYear, 4 + month, 0)
    if (monthEnd >= from && monthStart <= to) indexes.push(month)
  }
  return indexes
}

function districtIndexes(districtId: string) {
  if (districtId === "all") return data.districts.map((_, index) => index)
  const index = data.districts.findIndex((district) => district.id === districtId)
  return index >= 0 ? [index] : []
}

function talukFactor(districtIndex: number, filters: FactoriesFilters) {
  if (filters.talukId === "all") return 1
  const taluk = data.taluks.find((item) => item.id === filters.talukId)
  if (!taluk) return 0
  if (data.districts[districtIndex].id !== taluk.districtId) return filters.districtId === "all" ? 1 : 0
  return taluk.weight / 100
}

function sumCube(metric: string, filters: FactoriesFilters, districtId = filters.districtId) {
  const year = yearIndexOf(filters.financialYear)
  const months = monthIndexes(filters)
  let total = 0
  for (const district of districtIndexes(districtId)) {
    const weight = talukFactor(district, filters)
    for (const month of months) total += data.metrics[metric][year][district][month] * weight
  }
  return total
}

function monthly(metric: string, filters: FactoriesFilters) {
  const year = yearIndexOf(filters.financialYear)
  const districts = districtIndexes(filters.districtId)
  return monthIndexes(filters).map((month) => {
    let total = 0
    for (const district of districts) total += data.metrics[metric][year][district][month] * talukFactor(district, filters)
    return Math.round(total)
  })
}

function fullSum(metric: string) {
  return data.metrics[metric][2].reduce((total, district) => total + district.reduce((sum, value) => sum + value, 0), 0)
}

const FULL = {
  factories: fullSum("factories"),
  activeEstablishments: fullSum("activeEstablishments"),
  inspectionsConducted: fullSum("inspectionsConducted"),
  pendingInspections: fullSum("pendingInspections"),
  violations: fullSum("violations"),
  openCases: fullSum("openCases"),
  accidents: fullSum("accidents"),
  boilers: fullSum("boilers"),
  boilersDue: fullSum("boilersDue"),
}

function chart(model: ChartModel): ChartModel {
  return model
}

function categoryOf(filters: FactoriesFilters) {
  return data.categories.find((item) => item.id === filters.category)
}

function severityOf(filters: FactoriesFilters) {
  return data.severities.find((item) => item.id === filters.severity)
}

function slice(value: number, part: number, whole: number, category: Category | undefined) {
  return category ? share(value, part, whole) : Math.round(value)
}

function inScope(row: { districtId: string; talukId: string; category: string; monthIndex: number }, filters: FactoriesFilters) {
  if (filters.districtId !== "all" && row.districtId !== filters.districtId) return false
  if (filters.talukId !== "all" && row.talukId !== filters.talukId) return false
  if (filters.category !== "all" && row.category !== filters.category) return false
  return monthIndexes(filters).includes(row.monthIndex)
}

function districtName(id: string) {
  return data.districts.find((item) => item.id === id)?.name ?? id
}

function talukName(id: string) {
  return data.taluks.find((item) => item.id === id)?.name ?? id
}

export function localFactoriesOptions(): FactoriesFilterOptions {
  return {
    financialYears: data.years,
    districts: data.districts,
    taluks: data.taluks,
    categories: data.categories.map((item) => ({ id: item.id, name: item.name })),
    inspectionStatuses: data.inspectionStatuses,
    severities: data.severities.map((item) => ({ id: item.id, name: item.name })),
    complianceStatuses: data.complianceStatuses,
    boilerStatuses: data.boilerStatuses,
  }
}

export function buildFactoriesOverview(filters: FactoriesFilters): FactoriesOverview {
  const category = categoryOf(filters)
  const severity = severityOf(filters)
  const months = monthIndexes(filters).map((index) => data.months[index].label)
  const districtLabel = data.districts.find((item) => item.id === filters.districtId)?.name ?? "All districts"
  const talukLabel = data.taluks.find((item) => item.id === filters.talukId)?.name
  const scopeLabel = `${filters.financialYear} · ${formatLongDate(filters.fromDate)} to ${formatLongDate(filters.toDate)} · ${districtLabel}${talukLabel ? ` · ${talukLabel}` : ""}`

  const base = (metric: keyof typeof FULL) => Math.round(sumCube(metric, filters))
  const factoriesAll = base("factories")
  const activeAll = base("activeEstablishments")
  const conductedAll = base("inspectionsConducted")
  const pendingAll = base("pendingInspections")
  const violationsAll = base("violations")
  const casesAll = base("openCases")
  const accidentsAll = base("accidents")
  const boilersAll = base("boilers")
  const dueAll = base("boilersDue")

  let factories = slice(factoriesAll, category?.factories ?? 0, FULL.factories, category)
  let active = slice(activeAll, (category?.activeFactories ?? 0) + (category?.activeOther ?? 0), FULL.activeEstablishments, category)
  let conducted = slice(conductedAll, category?.inspections ?? 0, FULL.inspectionsConducted, category)
  let pending = slice(pendingAll, category?.pending ?? 0, FULL.pendingInspections, category)
  let violations = slice(violationsAll, category?.violations ?? 0, FULL.violations, category)
  let openCases = category ? share(casesAll, category.violations, FULL.violations) : casesAll
  let accidents = slice(accidentsAll, category?.accidents ?? 0, FULL.accidents, category)
  let boilers = slice(boilersAll, category?.boilers ?? 0, FULL.boilers, category)
  let boilersDue = slice(dueAll, category?.boilersDue ?? 0, FULL.boilersDue, category)

  let notices = share(conducted, data.rules.notices, FULL.inspectionsConducted)
  let initiated = share(conducted, data.rules.actionsInitiated, FULL.inspectionsConducted)
  let completed = share(conducted, data.rules.actionsCompleted, FULL.inspectionsConducted)
  let actionsOpen = share(conducted, data.rules.actionsOpen, FULL.inspectionsConducted)
  let overdue = share(conducted, data.rules.overdueActions, FULL.inspectionsConducted)
  let critical = 0
  let repeat = 0
  let injuries = share(accidents, data.rules.injuries, FULL.accidents)
  let fatalities = share(accidents, data.rules.fatalities, FULL.accidents)
  let boilerCompleted = share(boilers, data.rules.boilerInspectionsCompleted, FULL.boilers)
  let certificatesIssued = share(boilers, data.rules.certificatesIssued, FULL.boilers)
  let certificatesExpiring = share(boilers, data.rules.certificatesExpiring, FULL.boilers)
  let certificatesExpired = share(boilers, data.rules.certificatesExpired, FULL.boilers)
  let pendingBeyond = share(pending, data.rules.pendingBeyondSchedule, FULL.pendingInspections)

  if (filters.inspectionStatus === "conducted") pending = 0
  if (filters.inspectionStatus === "pending") conducted = 0
  if (pending === 0) pendingBeyond = 0

  if (severity) {
    accidents = share(accidents, severity.accidents, FULL.accidents)
    injuries = severity.injuries === 0 ? 0 : share(injuries, severity.injuries, data.rules.injuries)
    fatalities = severity.fatalities === 0 ? 0 : share(fatalities, severity.fatalities, data.rules.fatalities)
  }

  if (filters.complianceStatus === "open") {
    violations = share(violations, data.rules.violationsOpen, FULL.violations)
    completed = 0
  }
  if (filters.complianceStatus === "closed") {
    violations = share(violations, data.rules.violationsClosed, FULL.violations)
    openCases = 0
    overdue = 0
    critical = 0
    actionsOpen = 0
  }
  if (filters.complianceStatus === "overdue") {
    violations = share(violations, data.rules.violationsOpen, FULL.violations)
    completed = 0
  }
  critical = filters.complianceStatus === "closed" ? 0 : share(violations, data.rules.criticalOpen, filters.complianceStatus === "all" ? FULL.violations : data.rules.violationsOpen)
  repeat = filters.complianceStatus === "closed" ? 0 : share(violations, data.rules.repeatViolations, filters.complianceStatus === "all" ? FULL.violations : data.rules.violationsOpen)

  if (filters.boilerStatus === "completed") {
    boilersDue = 0
    certificatesExpiring = 0
    certificatesExpired = 0
  }
  if (filters.boilerStatus === "due") {
    boilerCompleted = 0
    certificatesExpiring = 0
    certificatesExpired = 0
  }
  if (filters.boilerStatus === "expiring") {
    boilerCompleted = 0
    boilersDue = 0
    certificatesExpired = 0
  }
  if (filters.boilerStatus === "expired") {
    boilerCompleted = 0
    boilersDue = 0
    certificatesExpiring = 0
  }

  const closedShown = share(factories, data.rules.closedFactories, FULL.factories)
  const suspendedShown = share(factories, data.rules.suspendedFactories, FULL.factories)
  const activeShown = Math.max(0, factories - closedShown - suspendedShown)
  const otherShown = !category ? share(active, data.rules.activeOther, FULL.activeEstablishments) : category.kind === "other" ? active : 0

  const conductedMonths = monthly("inspectionsConducted", filters).map((value) => slice(value, category?.inspections ?? 0, FULL.inspectionsConducted, category))
  const pendingMonths = monthly("pendingInspections", filters).map((value) => slice(value, category?.pending ?? 0, FULL.pendingInspections, category))
  const accidentMonths = monthly("accidents", filters).map((value) => {
    const scaled = slice(value, category?.accidents ?? 0, FULL.accidents, category)
    return severity ? share(scaled, severity.accidents, FULL.accidents) : scaled
  })

  const perDistrict = (metric: keyof typeof FULL, part: number, whole: number) => data.districts.map((district) => {
    const value = Math.round(sumCube(metric, { ...filters, districtId: district.id, talukId: filters.districtId === district.id ? filters.talukId : "all" }))
    return slice(value, part, whole, category)
  })

  const mapDistricts: FactoriesMapDistrict[] = data.districts.map((district, index) => ({
    id: district.id,
    name: district.name,
    factories: perDistrict("factories", category?.factories ?? 0, FULL.factories)[index] ?? 0,
    inspections: filters.inspectionStatus === "pending" ? 0 : (perDistrict("inspectionsConducted", category?.inspections ?? 0, FULL.inspectionsConducted)[index] ?? 0),
    accidents: severity ? share(perDistrict("accidents", category?.accidents ?? 0, FULL.accidents)[index] ?? 0, severity.accidents, FULL.accidents) : (perDistrict("accidents", category?.accidents ?? 0, FULL.accidents)[index] ?? 0),
    openCases: filters.complianceStatus === "closed" ? 0 : (perDistrict("openCases", category?.violations ?? 0, FULL.violations)[index] ?? 0),
    boilers: perDistrict("boilers", category?.boilers ?? 0, FULL.boilers)[index] ?? 0,
  }))

  const categoryNames = data.categories.map((item) => item.name)
  const inspectionByCategory = allocate(
    filters.inspectionStatus === "pending" ? pendingAll : conductedAll,
    data.categories.map((item) => (filters.inspectionStatus === "pending" ? item.pending : item.inspections)),
  )

  const factoriesRows = data.samples.factories.filter((row) => inScope(row, filters)).map((row) => ({
    Reference: row.factoryId,
    "Factory ID": row.factoryId,
    "Establishment Name": row.name,
    District: districtName(row.districtId),
    Taluk: talukName(row.talukId),
    "Industry Category": data.categories.find((item) => item.id === row.category)?.name ?? row.category,
    "Registration Number": row.registrationNumber,
    "Registration Date": formatLongDate(row.registrationDate),
    "Current Status": row.status,
  }))
  const inspectionRows = data.samples.inspections.filter((row) => inScope(row, filters))
    .filter((row) => filters.inspectionStatus === "all" || row.inspectionStatus === filters.inspectionStatus)
    .filter((row) => filters.complianceStatus === "all" || row.complianceStatus === filters.complianceStatus)
    .map((row) => ({
      Reference: row.inspectionId,
      "Inspection ID": row.inspectionId,
      "Factory ID": row.factoryId,
      "Establishment Name": row.name,
      District: districtName(row.districtId),
      "Inspection Date": formatLongDate(row.inspectionDate),
      Inspector: row.inspector,
      "Inspection Category": row.inspectionCategory,
      Findings: row.findings,
      "Compliance Status": row.complianceStatus,
    }))
  const accidentRows = data.samples.accidents.filter((row) => inScope(row, filters))
    .filter((row) => filters.severity === "all" || row.severity === filters.severity)
    .map((row) => ({
      Reference: row.accidentId,
      "Accident ID": row.accidentId,
      Establishment: row.name,
      District: districtName(row.districtId),
      "Incident Date": formatLongDate(row.incidentDate),
      "Accident Category": row.accidentCategory,
      Severity: data.severities.find((item) => item.id === row.severity)?.name ?? row.severity,
      Injuries: formatCount(row.injuries),
      Fatalities: formatCount(row.fatalities),
      "Investigation Status": row.investigationStatus,
    }))
  const boilerRows = data.samples.boilers.filter((row) => inScope(row, filters))
    .filter((row) => filters.boilerStatus === "all" || row.boilerStatus === filters.boilerStatus)
    .map((row) => ({
      Reference: row.boilerId,
      "Boiler ID": row.boilerId,
      Establishment: row.name,
      District: districtName(row.districtId),
      "Boiler Category": row.boilerCategory,
      "Last Inspection Date": formatLongDate(row.lastInspectionDate),
      "Next Inspection Due": formatLongDate(row.nextDueDate),
      "Certificate Status": row.certificateStatus,
    }))

  const anchor = data.samples.factories.find((row) => inScope(row, filters))
  const exceptions: FactoriesException[] = [
    { id: "critical", title: "Critical unresolved safety violations", description: "Open findings recorded as critical. A violation stays open until a closure is recorded.", priority: "high" as const, count: critical, action: "Review the open finding on the violation file." },
    { id: "fatal", title: "Fatal accidents requiring review", description: "Fatal accident events. The file does not name an injured person, and the event is not recorded as a construction-site accident.", priority: "high" as const, count: filters.severity === "all" || filters.severity === "fatal" ? share(accidents, data.rules.fatalAccidents, severity ? severity.accidents : FULL.accidents) : 0, action: "Follow the accident investigation file." },
    { id: "overdue", title: "Overdue corrective actions", description: "Actions with no recorded closure inside the illustrative schedule.", priority: "high" as const, count: overdue, action: "Record a closure or keep the action open." },
    { id: "pending-beyond", title: "Inspections pending beyond schedule", description: "Inspections still on the schedule after the illustrative due month.", priority: "medium" as const, count: pendingBeyond, action: "The visit remains pending. It is not counted as conducted." },
    { id: "expired", title: "Expired boiler certificates", description: "Certificates past the illustrative expiry. Registration of the boiler stays a separate record.", priority: "high" as const, count: certificatesExpired, action: "Follow the boiler certificate file." },
    { id: "repeat", title: "Repeat violations", description: "A finding type recorded again while an earlier finding of that type is still open.", priority: "medium" as const, count: repeat, action: "Keep the repeat finding open until its own closure is recorded." },
  ].map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    priority: item.priority,
    reference: anchor?.factoryId ?? "Factories establishment register",
    district: anchor ? districtName(anchor.districtId) : districtLabel,
    countLabel: formatCount(item.count),
    date: data.meta.lastRefreshed,
    action: item.action,
  }))

  const charts: Record<string, ChartModel> = {
    planned: chart({
      id: "planned-conducted",
      title: "Planned and conducted inspections",
      description: "Conducted visits and visits still pending are separate. The two series are not added into one inspection total.",
      kind: "grouped",
      categories: months,
      series: [
        { name: "Conducted", color: palette.blue, values: filters.inspectionStatus === "pending" ? conductedMonths.map(() => 0) : conductedMonths },
        { name: "Still pending", color: palette.amber, values: filters.inspectionStatus === "conducted" ? pendingMonths.map(() => 0) : pendingMonths },
      ],
      unit: "count",
      emptyLabel: "No months fall in the selected dates.",
    }),
    trend: chart({
      id: "inspection-trend",
      title: "Monthly inspection trend",
      description: "Inspections recorded as conducted. Pending visits stay on the schedule chart.",
      kind: "line",
      categories: filters.inspectionStatus === "pending" ? [] : months,
      series: [{ name: "Conducted", color: palette.navy, values: conductedMonths }],
      unit: "count",
      emptyLabel: "Conducted inspections are hidden while the inspection status is pending.",
    }),
    coverage: chart({
      id: "inspection-coverage",
      title: "District-wise inspection coverage",
      description: "Conducted inspections in each district for the selected dates. Select a district to filter the dashboard.",
      kind: "horizontal",
      categories: data.districts.map((item) => item.name),
      series: [{ name: "Conducted", color: palette.blue, values: mapDistricts.map((item) => item.inspections) }],
      unit: "count",
      height: 640,
    }),
    inspectedCategory: chart({
      id: "inspected-category",
      title: "Inspections by establishment category",
      description: "Each bar is that category's inspections. Other regulated establishments are on their own list, separate from registered factories.",
      kind: "horizontal",
      categories: categoryNames,
      series: [{ name: filters.inspectionStatus === "pending" ? "Pending" : "Conducted", color: palette.slate, values: inspectionByCategory }],
      unit: "count",
    }),
    pendingCategory: chart({
      id: "pending-category",
      title: "Pending inspections",
      description: "Visits still on the schedule. They are not counted as conducted.",
      kind: "horizontal",
      categories: filters.inspectionStatus === "conducted" ? [] : categoryNames,
      series: [{ name: "Pending", color: palette.amber, values: allocate(pendingAll, data.categories.map((item) => item.pending)) }],
      unit: "count",
      emptyLabel: "Pending inspections are hidden while the inspection status is conducted.",
    }),
    accidentTrend: chart({
      id: "accident-trend",
      title: "Monthly accident trend",
      description: "Accident events on the factories accident file. An event here is not treated as a construction-site accident.",
      kind: "line",
      categories: months,
      series: [{ name: "Accident events", color: palette.amber, values: accidentMonths }],
      unit: "count",
      emptyLabel: "No months fall in the selected dates.",
    }),
    severity: chart({
      id: "accident-severity",
      title: "Accident severity",
      description: "Events, injuries and fatalities stay on separate series. They are not added together.",
      kind: "grouped",
      categories: data.severities.map((item) => item.name),
      series: [
        { name: "Events", color: palette.navy, values: data.severities.map((item) => share(accidentsAll, item.accidents, FULL.accidents)) },
        { name: "Injuries", color: palette.amber, values: data.severities.map((item) => share(share(accidentsAll, data.rules.injuries, FULL.accidents), item.injuries, data.rules.injuries)) },
        { name: "Fatalities", color: palette.slate, values: data.severities.map((item) => share(share(accidentsAll, data.rules.fatalities, FULL.accidents), item.fatalities, data.rules.fatalities)) },
      ],
      unit: "count",
    }),
    causes: chart({
      id: "accident-causes",
      title: "Recorded accident causes",
      description: "Cause mix for the accident events in this scope.",
      kind: "horizontal",
      categories: data.causes.map((item) => item.name),
      series: [{ name: "Events", color: palette.amber, values: allocate(accidents, data.causes.map((item) => item.count)) }],
      unit: "count",
    }),
    industryAccidents: chart({
      id: "industry-accidents",
      title: "Accidents by industry",
      description: "Accident events by establishment category on the factories list.",
      kind: "horizontal",
      categories: categoryNames,
      series: [{ name: "Events", color: palette.navy, values: allocate(accidentsAll, data.categories.map((item) => item.accidents)) }],
      unit: "count",
    }),
    accidentDistrict: chart({
      id: "accident-district",
      title: "District-wise accident events",
      description: "Select a district to filter the dashboard. Events, injuries and fatalities remain separate counts.",
      kind: "horizontal",
      categories: data.districts.map((item) => item.name),
      series: [{ name: "Events", color: palette.amber, values: mapDistricts.map((item) => item.accidents) }],
      unit: "count",
      height: 640,
    }),
    violationTypes: chart({
      id: "violation-types",
      title: "Violations by category",
      description: "Findings on the violation file. An open finding stays open until a closure is recorded.",
      kind: "horizontal",
      categories: data.violationTypes.map((item) => item.name),
      series: [{ name: "Findings", color: palette.amber, values: allocate(violations, data.violationTypes.map((item) => item.count)) }],
      unit: "count",
    }),
    actions: chart({
      id: "corrective-actions",
      title: "Notices and corrective actions",
      description: "Notices, actions started, actions with a recorded closure, and actions still open. Closure is not assumed from the notice alone.",
      kind: "horizontal",
      categories: ["Notices issued", "Actions initiated", "Actions completed", "Actions still open"],
      series: [{ name: "Records", color: palette.navy, values: [notices, initiated, completed, actionsOpen] }],
      unit: "count",
    }),
    boilerDistrict: chart({
      id: "boiler-district",
      title: "District-wise boiler status",
      description: "Registered boilers and boilers with an inspection due. Registration, inspection and certification stay separate.",
      kind: "horizontal",
      categories: data.districts.map((item) => item.name),
      series: [
        { name: "Registered boilers", color: palette.blue, values: mapDistricts.map((item) => item.boilers) },
        { name: "Inspection due", color: palette.amber, values: filters.boilerStatus === "completed" || filters.boilerStatus === "expiring" || filters.boilerStatus === "expired" ? mapDistricts.map(() => 0) : perDistrict("boilersDue", category?.boilersDue ?? 0, FULL.boilersDue) },
      ],
      unit: "count",
      height: 640,
    }),
  }
  const establishmentNote = category?.kind === "other"
    ? "This category is an other regulated establishment. It is not counted as a registered factory."
    : `Of the registered factories in this scope, ${formatCount(activeShown)} are active, ${formatCount(closedShown)} are closed and ${formatCount(suspendedShown)} are suspended. Active establishments also include ${formatCount(otherShown)} other regulated establishments.`

  return {
    source: data.meta.source,
    lastRefreshed: data.meta.lastRefreshed,
    illustrativeNote: data.meta.illustrativeNote,
    jurisdictionNote: data.meta.jurisdictionNote,
    separationNote: data.meta.separationNote,
    stageNote: data.meta.stageNote,
    boundaryNote,
    scopeLabel,
    establishmentNote,
    kpis: [
      { id: "factories", group: "establishments", label: "Registered factories", displayValue: formatCount(factories), hint: "Factories on the factories register." },
      { id: "active", group: "establishments", label: "Active establishments", displayValue: formatCount(active), hint: "Active factories plus other regulated establishments still active." },
      { id: "inspections", group: "inspections", label: "Inspections conducted", displayValue: formatCount(conducted), hint: "Visits recorded in the inspection diary." },
      { id: "pending", group: "inspections", label: "Pending inspections", displayValue: formatCount(pending), hint: "Visits still on the schedule." },
      { id: "violations", group: "inspections", label: "Safety violations", displayValue: formatCount(violations), hint: "Findings on the violation file." },
      { id: "cases", group: "inspections", label: "Open compliance cases", displayValue: formatCount(openCases), hint: "Cases without a recorded closure." },
      { id: "accidents", group: "inspections", label: "Reported accidents", displayValue: formatCount(accidents), hint: "Accident events. Injuries and fatalities are separate." },
      { id: "boilers", group: "boilers", label: "Registered boilers", displayValue: formatCount(boilers), hint: "Boilers on the boiler register." },
      { id: "boilers-due", group: "boilers", label: "Boiler inspections due", displayValue: formatCount(boilersDue), hint: "Inspections due. Certification is a separate record." },
    ],
    watch: [
      { label: "Open compliance cases", displayValue: formatCount(openCases), note: "No recorded closure" },
      { label: "Overdue actions", displayValue: formatCount(overdue), note: "Past the illustrative schedule" },
      { label: "Expired certificates", displayValue: formatCount(certificatesExpired), note: "Boiler certificate file" },
    ],
    charts,
    districts: mapDistricts,
    compliance: [
      { label: "Open compliance cases", displayValue: formatCount(openCases), note: "Still without a recorded closure." },
      { label: "Repeat violations", displayValue: formatCount(repeat), note: "An earlier finding of the same type is still open." },
      { label: "Overdue corrective actions", displayValue: formatCount(overdue), note: "Initiated actions are not treated as completed." },
    ],
    boilers: [
      { label: "Registered boilers", displayValue: formatCount(boilers), note: "Registration." },
      { label: "Inspections completed", displayValue: formatCount(boilerCompleted), note: "Inspection diary for boilers." },
      { label: "Inspections due", displayValue: formatCount(boilersDue), note: "Still due." },
      { label: "Certificates issued", displayValue: formatCount(certificatesIssued), note: "Certificate file." },
      { label: "Certificates expiring", displayValue: formatCount(certificatesExpiring), note: "Inside the illustrative expiry window." },
      { label: "Certificates expired", displayValue: formatCount(certificatesExpired), note: "Past expiry. The boiler registration remains." },
    ],
    accidentCounts: [
      { label: "Accident events", displayValue: formatCount(accidents), note: "One event can record more than one injury." },
      { label: "Injuries", displayValue: formatCount(injuries), note: "Injured persons are not named in this extract." },
      { label: "Fatalities", displayValue: formatCount(fatalities), note: "Counted separately from events and injuries." },
    ],
    exceptions,
    registers: { factories: factoriesRows, inspections: inspectionRows, accidents: accidentRows, boilers: boilerRows },
    filters,
  }
}

const sourceColumns: DetailColumn[] = [
  { key: "Field", label: "Field" },
  { key: "Value", label: "Value" },
]

export function buildFactoriesDetail(request: FactoriesDrill, filters: FactoriesFilters): DetailModel {
  const overview = buildFactoriesOverview(filters)
  const note = `${overview.illustrativeNote} ${overview.jurisdictionNote}`
  if (request.type === "kpi") {
    const kpi = overview.kpis.find((item) => item.id === request.kpiId)
    return {
      title: kpi?.label ?? "Indicator",
      summary: `${kpi?.displayValue ?? "—"} in ${overview.scopeLabel}. ${kpi?.hint ?? ""}`,
      note,
      columns: sourceColumns,
      rows: [
        { Field: "Source", Value: overview.source },
        { Field: "Scope", Value: overview.scopeLabel },
        { Field: "Reading", Value: kpi?.hint ?? "" },
      ],
    }
  }
  if (request.type === "chart") {
    const selected = Object.values(overview.charts).find((item) => item.id === request.chartId)
    const rows = (selected?.categories ?? []).map((category, index) => {
      const row: Record<string, string> = { Category: category }
      for (const series of selected?.series ?? []) row[series.name] = formatCount(series.values[index] ?? 0)
      return row
    })
    return {
      title: selected?.title ?? "Chart",
      summary: request.category ? `${request.category}${request.series ? ` · ${request.series}` : ""}` : selected?.description ?? "",
      note: `${selected?.description ?? ""} ${note}`,
      columns: [{ key: "Category", label: "Category" }, ...(selected?.series ?? []).map((series) => ({ key: series.name, label: series.name, align: "right" as const }))],
      rows: request.category ? rows.filter((row) => row.Category === request.category) : rows,
    }
  }
  if (request.type === "exception") {
    const row = overview.exceptions.find((item) => item.id === request.exceptionId)
    return {
      title: row?.title ?? "Exception",
      summary: row ? `${row.countLabel} in ${overview.scopeLabel}.` : "This item is outside the selected scope.",
      note: row?.action ?? note,
      columns: sourceColumns,
      rows: row
        ? [
            { Field: "Priority", Value: row.priority },
            { Field: "Establishment reference", Value: row.reference },
            { Field: "District", Value: row.district },
            { Field: "Records", Value: row.countLabel },
            { Field: "Date", Value: row.date },
            { Field: "Action required", Value: row.action },
          ]
        : [],
    }
  }
  const pool = {
    factories: data.samples.factories,
    inspections: data.samples.inspections,
    accidents: data.samples.accidents,
    boilers: data.samples.boilers,
  }[request.register]
  const record = pool.find((item) => ("factoryId" in item && item.factoryId === request.id) || ("inspectionId" in item && item.inspectionId === request.id) || ("accidentId" in item && item.accidentId === request.id) || ("boilerId" in item && item.boilerId === request.id) || item.id === request.id)
  const match = record && "verifiedMatch" in record ? record.verifiedMatch : null
  const rows = record
    ? Object.entries(record)
        .filter(([key]) => !["id", "districtId", "talukId", "monthIndex", "year", "verifiedMatch", "constructionLink", "kind"].includes(key))
        .map(([key, value]) => ({ Field: key, Value: value == null ? "—" : String(value) }))
    : []
  if (match) rows.push({ Field: "Verified link", Value: `${match.department} · ${match.reference}. ${match.note}` })
  return {
    title: request.id,
    summary: record && "source" in record ? String(record.source) : "Record",
    note: match ? `${note} ${match.note}` : `${note} No verified cross-department link is recorded for this row.`,
    columns: sourceColumns,
    rows,
  }
}
