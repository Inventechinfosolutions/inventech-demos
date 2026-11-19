import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const YEARS = ["2023-24", "2024-25", "2025-26"]
const MONTHS = [
  { index: 0, label: "Apr" },
  { index: 1, label: "May" },
  { index: 2, label: "Jun" },
  { index: 3, label: "Jul" },
  { index: 4, label: "Aug" },
  { index: 5, label: "Sep" },
  { index: 6, label: "Oct" },
  { index: 7, label: "Nov" },
  { index: 8, label: "Dec" },
  { index: 9, label: "Jan" },
  { index: 10, label: "Feb" },
  { index: 11, label: "Mar" },
]
const MONTH_WEIGHTS = [90, 85, 60, 55, 60, 75, 90, 95, 90, 100, 100, 100]
const DISTRICT_ROWS = [
  ["Bengaluru Urban", 162],
  ["Belagavi", 62],
  ["Mysuru", 55],
  ["Tumakuru", 46],
  ["Ballari", 42],
  ["Dakshina Kannada", 40],
  ["Bengaluru Rural", 38],
  ["Kalaburagi", 36],
  ["Vijayapura", 34],
  ["Dharwad", 32],
  ["Mandya", 30],
  ["Hassan", 28],
  ["Shivamogga", 28],
  ["Davanagere", 26],
  ["Raichur", 25],
  ["Kolar", 24],
  ["Bagalkote", 23],
  ["Chitradurga", 22],
  ["Udupi", 21],
  ["Bidar", 20],
  ["Chikkaballapura", 20],
  ["Haveri", 18],
  ["Uttara Kannada", 18],
  ["Ramanagara", 17],
  ["Chikkamagaluru", 17],
  ["Koppal", 16],
  ["Chamarajanagara", 15],
  ["Gadag", 14],
  ["Yadgir", 13],
  ["Kodagu", 12],
]
const TALUK_LABELS = ["Headquarters", "North", "South"]
const TALUK_WEIGHTS = [50, 30, 20]

const HEADLINE = {
  factories: 8450,
  activeEstablishments: 7820,
  inspectionsConducted: 6250,
  pendingInspections: 1180,
  violations: 985,
  openCases: 325,
  accidents: 142,
  boilers: 5680,
  boilersDue: 410,
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function allocate(total, weights) {
  if (!Number.isInteger(total)) throw new Error(`total must be an integer, got ${total}`)
  if (total === 0) return weights.map(() => 0)
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) throw new Error("weights must be positive")
  const exact = weights.map((weight) => (total * weight) / sum)
  const floors = exact.map((value) => Math.floor(value + 1e-8))
  let left = total - floors.reduce((a, b) => a + b, 0)
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

function prior(current, rate) {
  return Math.max(1, Math.round(current / (1 + rate / 100)))
}

function cubeTotal(cube, yearIndex) {
  return cube[yearIndex].reduce((total, district) => total + district.reduce((a, b) => a + b, 0), 0)
}

const districts = DISTRICT_ROWS.map(([name]) => ({ id: slug(name), name }))
const baseWeights = DISTRICT_ROWS.map(([, weight]) => weight)

function yearWeights(yearIndex, salt) {
  if (yearIndex === 2) return baseWeights
  let value = (1000 + yearIndex * 100 + salt) >>> 0
  return baseWeights.map((weight) => {
    value = (value + 0x6d2b79f5) >>> 0
    const roll = ((value ^ (value >>> 14)) >>> 0) / 4294967296
    return weight * (0.84 + roll * 0.32)
  })
}

function buildCube(yearTotals, salt) {
  return yearTotals.map((total, yearIndex) => {
    const byDistrict = allocate(total, yearWeights(yearIndex, salt))
    return byDistrict.map((districtTotal) => allocate(districtTotal, MONTH_WEIGHTS))
  })
}

const yearMetric = (value) => [prior(prior(value, 4), 4), prior(value, 4), value]
const metrics = {
  factories: buildCube(yearMetric(HEADLINE.factories), 1),
  activeEstablishments: buildCube(yearMetric(HEADLINE.activeEstablishments), 2),
  inspectionsConducted: buildCube(yearMetric(HEADLINE.inspectionsConducted), 3),
  pendingInspections: buildCube(yearMetric(HEADLINE.pendingInspections), 4),
  violations: buildCube(yearMetric(HEADLINE.violations), 5),
  openCases: buildCube(yearMetric(HEADLINE.openCases), 6),
  accidents: buildCube(yearMetric(HEADLINE.accidents), 7),
  boilers: buildCube(yearMetric(HEADLINE.boilers), 8),
  boilersDue: buildCube(yearMetric(HEADLINE.boilersDue), 9),
}

const categoryDefs = [
  ["engineering", "Engineering and fabrication", "factory", 22, 20, 18, 16],
  ["chemical", "Chemical and process", "factory", 16, 18, 22, 24],
  ["food", "Food processing", "factory", 14, 12, 10, 12],
  ["textiles", "Textiles and garments", "factory", 12, 10, 12, 10],
  ["metals", "Metals and foundry", "factory", 18, 16, 16, 18],
  ["power", "Power and utilities", "factory", 18, 14, 12, 14],
  ["other", "Other regulated establishment", "other", 0, 10, 10, 6],
]
const factoryWeights = [22, 16, 14, 12, 18, 18]
const inspectionWeights = categoryDefs.map((row) => row[4])
const violationWeights = categoryDefs.map((row) => row[5])
const accidentWeights = categoryDefs.map((row) => row[6])
const boilerWeights = [18, 20, 8, 6, 16, 22, 10]
const factoriesByCat = [...allocate(8450, factoryWeights), 0]
const activeFactoriesByCat = [...allocate(7210, factoryWeights), 0]
if (factoriesByCat.reduce((sum, value) => sum + value, 0) !== 8450) throw new Error("factory categories")
if (activeFactoriesByCat.reduce((sum, value) => sum + value, 0) !== 7210) throw new Error("active factories")
const inspectionsByCat = allocate(6250, inspectionWeights)
const pendingByCat = allocate(1180, inspectionWeights)
const violationsByCat = allocate(985, violationWeights)
const accidentsByCat = allocate(142, accidentWeights)
const injuriesByCat = allocate(186, accidentWeights)
const fatalitiesByCat = [2, 5, 1, 1, 3, 2, 0]
const boilersByCat = allocate(5680, boilerWeights)
const dueByCat = allocate(410, boilerWeights)
const categories = categoryDefs.map(([id, name, kind], index) => ({
  id,
  name,
  kind,
  factories: factoriesByCat[index],
  activeFactories: activeFactoriesByCat[index],
  activeOther: id === "other" ? 610 : 0,
  inspections: inspectionsByCat[index],
  pending: pendingByCat[index],
  violations: violationsByCat[index],
  accidents: accidentsByCat[index],
  injuries: injuriesByCat[index],
  fatalities: fatalitiesByCat[index],
  boilers: boilersByCat[index],
  boilersDue: dueByCat[index],
}))

const severities = [
  { id: "fatal", name: "Fatal", accidents: 11, injuries: 9, fatalities: 14 },
  { id: "serious", name: "Serious", accidents: 46, injuries: 98, fatalities: 0 },
  { id: "minor", name: "Minor", accidents: 63, injuries: 79, fatalities: 0 },
  { id: "non-injury", name: "No injury recorded", accidents: 22, injuries: 0, fatalities: 0 },
]
const causes = [
  ["machinery", "Machinery", 38],
  ["electrical", "Electrical", 22],
  ["fire", "Fire", 16],
  ["fall", "Fall from height", 18],
  ["chemical", "Chemical exposure", 24],
  ["handling", "Material handling", 14],
  ["other-cause", "Other recorded cause", 10],
].map(([id, name, count]) => ({ id, name, count }))
const violationTypes = [
  ["guarding", "Machine guarding", 240],
  ["storage", "Chemical storage", 160],
  ["electrical-safety", "Electrical safety", 145],
  ["housekeeping", "Housekeeping and passages", 120],
  ["pressure", "Pressure plant", 130],
  ["welfare", "On-site welfare facilities", 90],
  ["other-violation", "Other recorded finding", 100],
].map(([id, name, count]) => ({ id, name, count }))

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0)
if (sum(categories, "inspections") !== 6250) throw new Error("inspection categories")
if (sum(categories, "pending") !== 1180) throw new Error("pending categories")
if (sum(categories, "violations") !== 985) throw new Error("violation categories")
if (sum(categories, "accidents") !== 142) throw new Error("accident categories")
if (sum(categories, "injuries") !== 186) throw new Error("injuries")
if (sum(categories, "fatalities") !== 14) throw new Error("fatalities")
if (sum(categories, "boilers") !== 5680) throw new Error("boilers")
if (sum(categories, "boilersDue") !== 410) throw new Error("boilers due")
if (sum(categories, "activeFactories") + sum(categories, "activeOther") !== 7820) throw new Error("active establishments")
if (sum(severities, "accidents") !== 142 || sum(severities, "injuries") !== 186 || sum(severities, "fatalities") !== 14) throw new Error("severity")
if (sum(causes, "count") !== 142) throw new Error("causes")
if (sum(violationTypes, "count") !== 985) throw new Error("violation types")
for (const key of Object.keys(HEADLINE)) {
  if (cubeTotal(metrics[key], 2) !== HEADLINE[key]) throw new Error(`${key} ${cubeTotal(metrics[key], 2)}`)
}

const taluks = districts.flatMap((district) => TALUK_LABELS.map((label, index) => ({
  id: `${district.id}-${slug(label)}`,
  districtId: district.id,
  name: `${label} taluk`,
  weight: TALUK_WEIGHTS[index],
})))

const rules = {
  activeFactories: 7210,
  closedFactories: 840,
  suspendedFactories: 400,
  otherEstablishments: 800,
  activeOther: 610,
  notices: 740,
  actionsInitiated: 610,
  actionsCompleted: 410,
  actionsOpen: 200,
  overdueActions: 74,
  repeatViolations: 96,
  criticalOpen: 48,
  violationsOpen: 373,
  violationsClosed: 612,
  fatalAccidents: 11,
  injuries: 186,
  fatalities: 14,
  boilerInspectionsCompleted: 4920,
  certificatesIssued: 4650,
  certificatesExpiring: 280,
  certificatesExpired: 64,
  pendingBeyondSchedule: 260,
}
if (rules.activeFactories + rules.closedFactories + rules.suspendedFactories !== 8450) throw new Error("factory status")
if (rules.actionsCompleted + rules.actionsOpen !== rules.actionsInitiated) throw new Error("actions")
if (rules.overdueActions > rules.actionsOpen) throw new Error("overdue")
if (rules.violationsOpen + rules.violationsClosed !== 985) throw new Error("violation closure")
if (rules.criticalOpen > rules.violationsOpen) throw new Error("critical")

const factoryStatuses = [
  { id: "active", name: "Active" },
  { id: "closed", name: "Closed" },
  { id: "suspended", name: "Suspended" },
]
const inspectionStatuses = [
  { id: "conducted", name: "Conducted" },
  { id: "pending", name: "Pending" },
]
const complianceStatuses = [
  { id: "open", name: "Open" },
  { id: "closed", name: "Closed with a recorded closure" },
  { id: "overdue", name: "Overdue corrective action" },
]
const boilerStatuses = [
  { id: "completed", name: "Inspection completed" },
  { id: "due", name: "Inspection due" },
  { id: "expiring", name: "Certificate expiring" },
  { id: "expired", name: "Certificate expired" },
]

const samples = { factories: [], inspections: [], accidents: [], boilers: [], schedules: [], violations: [], actions: [], investigations: [], certificates: [] }
const findings = [
  "Illustrative finding: machine guard not recorded as restored.",
  "Illustrative finding: passage marking incomplete.",
  "Illustrative finding: no open finding in this visit.",
  "Illustrative finding: earlier notice still without a closure entry.",
]
districts.forEach((district, index) => {
  const month = index % 12
  const monthNumber = String(((month + 3) % 12) + 1).padStart(2, "0")
  const category = categories[index % 6]
  const other = index % 9 === 0
  const chosen = other ? categories[6] : category
  const factoryStatus = ["active", "active", "active", "closed", "suspended"][index % 5]
  const factoryId = `FAC-2025-${String(3100 + index).padStart(4, "0")}`
  const inspectionStatus = index % 4 === 0 ? "pending" : "conducted"
  const severity = severities[index % severities.length]
  const cause = causes[index % causes.length]
  const compliance = ["open", "closed", "overdue", "open"][index % 4]
  const boilerStatus = boilerStatuses[index % boilerStatuses.length].id
  const verifiedMatch = index % 11 === 0
    ? { department: "Labour Commissionerate", reference: `LER-2025-${String(1800 + index).padStart(4, "0")}`, note: "Verified match to a Labour establishment file. This does not bring the factory's workforce onto the construction-worker register." }
    : index % 13 === 0
      ? { department: "Health & Social Security", reference: `HSS-2025-${String(900 + index).padStart(4, "0")}`, note: "Verified match to a health-services file for this establishment. It is not a match to a construction project." }
      : null
  samples.factories.push({
    id: `fac-${district.id}`,
    factoryId,
    name: `Illustrative ${chosen.name.toLowerCase()} · ${district.name}`,
    districtId: district.id,
    talukId: taluks.filter((taluk) => taluk.districtId === district.id)[index % 3].id,
    category: chosen.id,
    kind: chosen.kind,
    registrationNumber: `FB-REG-2025-${String(7000 + index).padStart(4, "0")}`,
    registrationDate: `2024-${monthNumber}-12`,
    status: chosen.kind === "other" ? "active" : factoryStatus,
    year: "2025-26",
    monthIndex: month,
    source: "Factories establishment register",
    verifiedMatch,
  })
  samples.schedules.push({
    id: `sch-${district.id}`,
    factoryId,
    status: inspectionStatus,
    dueDate: `2025-${monthNumber}-20`,
    source: "Factories inspection schedule",
  })
  samples.inspections.push({
    id: `ins-${district.id}`,
    inspectionId: `INS-2025-${String(4100 + index).padStart(4, "0")}`,
    factoryId,
    name: `Illustrative ${chosen.name.toLowerCase()} · ${district.name}`,
    districtId: district.id,
    talukId: taluks.filter((taluk) => taluk.districtId === district.id)[index % 3].id,
    category: chosen.id,
    inspectionDate: `2025-${monthNumber}-18`,
    inspector: `Inspector ••${String((index % 40) + 1).padStart(2, "0")}`,
    inspectionCategory: index % 2 === 0 ? "Routine" : "Follow-up",
    findings: findings[index % findings.length],
    complianceStatus: compliance,
    inspectionStatus,
    year: "2025-26",
    monthIndex: month,
    source: "Factories inspection diary",
  })
  samples.violations.push({
    id: `vio-${district.id}`,
    factoryId,
    type: violationTypes[index % violationTypes.length].id,
    status: compliance === "closed" ? "closed" : "open",
    closureRecorded: compliance === "closed",
    source: "Factories violation file",
  })
  samples.actions.push({
    id: `act-${district.id}`,
    factoryId,
    status: compliance === "overdue" ? "overdue" : compliance === "closed" ? "completed" : "initiated",
    source: "Factories corrective-action file",
  })
  samples.accidents.push({
    id: `acc-${district.id}`,
    accidentId: `ACC-2025-${String(5100 + index).padStart(4, "0")}`,
    name: `Illustrative ${chosen.name.toLowerCase()} · ${district.name}`,
    districtId: district.id,
    talukId: taluks.filter((taluk) => taluk.districtId === district.id)[index % 3].id,
    category: chosen.id,
    incidentDate: `2025-${monthNumber}-09`,
    accidentCategory: cause.name,
    severity: severity.id,
    injuries: severity.injuries === 0 ? 0 : 1 + (index % 3),
    fatalities: severity.id === "fatal" ? 1 : 0,
    investigationStatus: severity.id === "fatal" ? "Under investigation" : index % 5 === 0 ? "Open" : "Closed",
    year: "2025-26",
    monthIndex: month,
    source: "Factories accident file",
    constructionLink: null,
  })
  samples.investigations.push({
    id: `inv-${district.id}`,
    accidentId: `ACC-2025-${String(5100 + index).padStart(4, "0")}`,
    status: severity.id === "fatal" ? "Under investigation" : "Recorded",
    source: "Factories accident investigation file",
  })
  const certificateStatus = boilerStatus === "expired" ? "Expired" : boilerStatus === "expiring" ? "Expiring" : boilerStatus === "due" ? "Inspection due" : "Valid"
  samples.boilers.push({
    id: `blr-${district.id}`,
    boilerId: `BLR-2025-${String(6100 + index).padStart(4, "0")}`,
    name: `Illustrative ${chosen.name.toLowerCase()} · ${district.name}`,
    districtId: district.id,
    talukId: taluks.filter((taluk) => taluk.districtId === district.id)[index % 3].id,
    category: chosen.id,
    boilerCategory: index % 2 === 0 ? "Package boiler" : "Water-tube boiler",
    lastInspectionDate: `2025-${monthNumber}-04`,
    nextDueDate: `2026-${monthNumber}-04`,
    certificateStatus,
    boilerStatus,
    year: "2025-26",
    monthIndex: month,
    source: "Factories boiler register",
  })
  samples.certificates.push({
    id: `cer-${district.id}`,
    boilerId: `BLR-2025-${String(6100 + index).padStart(4, "0")}`,
    status: certificateStatus,
    source: "Factories boiler certificate file",
  })
})

const payload = {
  meta: {
    illustrative: true,
    source: "Illustrative Factories & Boilers extract",
    lastRefreshed: "18 Nov 2026, 09:30 IST",
    illustrativeNote: "Illustrative data. This demonstration is not connected to Karnataka Government systems. Accident files do not name injured persons.",
    jurisdictionNote: "These records cover factories, boilers and other establishments on the Factories & Boilers list. They do not cover every construction site or every construction worker in the State.",
    separationNote: "Registered factories and other regulated establishments are separate lists. An active establishment is not the same count as a registered factory.",
    stageNote: "Inspections conducted and inspections still pending are separate. A violation stays open until a closure is recorded. Accident events, injuries and fatalities are separate counts. Boiler registration, inspection and certification are separate.",
  },
  years: YEARS,
  months: MONTHS,
  districts,
  taluks,
  categories,
  severities,
  causes,
  violationTypes,
  factoryStatuses,
  inspectionStatuses,
  complianceStatuses,
  boilerStatuses,
  rules,
  sources: [
    { id: "factories", name: "Factories establishment register", system: "Factories & Boilers", holds: "Factories and other regulated establishments" },
    { id: "schedule", name: "Factories inspection schedule", system: "Factories & Boilers", holds: "Planned and pending inspections" },
    { id: "diary", name: "Factories inspection diary", system: "Factories & Boilers", holds: "Inspections conducted" },
    { id: "violations", name: "Factories violation file", system: "Factories & Boilers", holds: "Safety violations" },
    { id: "actions", name: "Factories corrective-action file", system: "Factories & Boilers", holds: "Corrective actions" },
    { id: "accidents", name: "Factories accident file", system: "Factories & Boilers", holds: "Accident events" },
    { id: "investigations", name: "Factories accident investigation file", system: "Factories & Boilers", holds: "Investigations" },
    { id: "boilers", name: "Factories boiler register", system: "Factories & Boilers", holds: "Boiler registration" },
    { id: "certificates", name: "Factories boiler certificate file", system: "Factories & Boilers", holds: "Certificates" },
  ],
  metrics,
  samples,
}

const target = join(root, "src/data/factories-boilers.json")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(payload))
console.log(`Wrote ${target}`)
console.log("Factories headline checks passed")
