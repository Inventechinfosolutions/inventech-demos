import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const CRORE = 10_000_000
const cr = (value) => value * CRORE

const YEARS = ["2023-24", "2024-25", "2025-26"]
const MONTHS = [
  { index: 0, label: "Apr", full: "April" },
  { index: 1, label: "May", full: "May" },
  { index: 2, label: "Jun", full: "June" },
  { index: 3, label: "Jul", full: "July" },
  { index: 4, label: "Aug", full: "August" },
  { index: 5, label: "Sep", full: "September" },
  { index: 6, label: "Oct", full: "October" },
  { index: 7, label: "Nov", full: "November" },
  { index: 8, label: "Dec", full: "December" },
  { index: 9, label: "Jan", full: "January" },
  { index: 10, label: "Feb", full: "February" },
  { index: 11, label: "Mar", full: "March" },
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
const CATEGORIES = [
  ["building", "Building works", 22],
  ["roads", "Roads and bridges", 18],
  ["irrigation", "Irrigation works", 16],
  ["industrial", "Industrial construction", 14],
  ["residential", "Residential layouts", 18],
  ["public", "Public buildings", 12],
]
const TALUK_LABELS = ["Headquarters", "North", "South"]
const TALUK_WEIGHTS = [50, 30, 20]

const HEADLINE = {
  establishments: 48250,
  activeProjects: 12450,
  cessAssessed: cr(2450),
  cessCollected: cr(1920),
  inspections: 8450,
  violations: 1285,
  pendingCompliance: 425,
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
    if (cursor > total + order.length + 5) throw new Error("allocate did not converge")
  }
  return floors
}

function fitUnderCap(total, weights, caps) {
  const values = caps.map(() => 0)
  let remaining = total
  const active = caps.map((cap, index) => cap > 0 && weights[index] > 0)
  for (let guard = 0; guard < caps.length + 3; guard += 1) {
    const indexes = []
    for (let index = 0; index < caps.length; index += 1) if (active[index]) indexes.push(index)
    if (indexes.length === 0) {
      if (remaining !== 0) throw new Error(`no capacity for ${remaining}`)
      return values
    }
    const alloc = allocate(remaining, indexes.map((index) => weights[index]))
    let locked = false
    for (let slot = 0; slot < indexes.length; slot += 1) {
      const index = indexes[slot]
      const room = caps[index] - values[index]
      if (alloc[slot] > room) {
        values[index] = caps[index]
        remaining -= room
        active[index] = false
        locked = true
      }
    }
    if (!locked) {
      indexes.forEach((index, slot) => {
        values[index] += alloc[slot]
      })
      remaining = 0
      break
    }
  }
  if (remaining !== 0) throw new Error(`unallocated ${remaining}`)
  return values
}

function mulberry32(seed) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function prior(current, rate) {
  return Math.max(1, Math.round(current / (1 + rate / 100)))
}

function cubeTotal(cube, yearIndex) {
  return cube[yearIndex].reduce((total, district) => total + district.reduce((a, b) => a + b, 0), 0)
}

const districts = DISTRICT_ROWS.map(([name]) => ({ id: slug(name), name }))
const baseWeights = DISTRICT_ROWS.map(([, weight]) => weight)
const categories = CATEGORIES.map(([id, name]) => ({ id, name }))
const categoryWeights = CATEGORIES.map(([, , weight]) => weight)

function yearWeights(yearIndex, salt) {
  if (yearIndex === 2) return baseWeights
  const random = mulberry32(1000 + yearIndex * 100 + salt)
  return baseWeights.map((weight) => weight * (0.84 + random() * 0.32))
}

function buildCube(yearTotals, salt) {
  return yearTotals.map((total, yearIndex) => {
    const byDistrict = allocate(total, yearWeights(yearIndex, salt))
    return byDistrict.map((districtTotal) => allocate(districtTotal, MONTH_WEIGHTS))
  })
}

function buildCess(assessedTotals, collectedTotals) {
  const assessed = []
  const collected = []
  assessedTotals.forEach((assessedTotal, yearIndex) => {
    const weights = yearWeights(yearIndex, 7)
    const assessedDistrict = allocate(assessedTotal, weights)
    const collectedDistrict = fitUnderCap(collectedTotals[yearIndex], weights, assessedDistrict)
    const assessedMonth = assessedDistrict.map((total) => allocate(total, MONTH_WEIGHTS))
    const collectedMonth = collectedDistrict.map((total, district) => fitUnderCap(total, MONTH_WEIGHTS, assessedMonth[district]))
    assessed.push(assessedMonth)
    collected.push(collectedMonth)
  })
  return { cessAssessed: assessed, cessCollected: collected }
}

const growth = {
  establishments: 5.4,
  activeProjects: 6.4,
  cessAssessed: 8.2,
  cessCollected: 5.7,
  inspections: 4.8,
  violations: -3.2,
  pendingCompliance: -6.1,
}
const headlineYear = { ...HEADLINE }
const previousYear = Object.fromEntries(Object.entries(headlineYear).map(([key, value]) => [key, prior(value, growth[key])]))
const earlierYear = Object.fromEntries(Object.entries(previousYear).map(([key, value]) => [key, prior(value, 4.2)]))
for (const year of [headlineYear, previousYear, earlierYear]) {
  if (year.cessCollected > year.cessAssessed) throw new Error("collected exceeds assessed")
}
const yearMetric = (key) => [earlierYear[key], previousYear[key], headlineYear[key]]

const establishments = buildCube(yearMetric("establishments"), 1)
const activeProjects = buildCube(yearMetric("activeProjects"), 2)
const inspections = buildCube(yearMetric("inspections"), 3)
const violations = buildCube(yearMetric("violations"), 4)
const pendingCompliance = buildCube(yearMetric("pendingCompliance"), 5)
const cess = buildCess(yearMetric("cessAssessed"), yearMetric("cessCollected"))

const newRegistrations = establishments.map((year) => year.map((district) => district.map((total) => Math.round(total * 0.386))))
const renewedRegistrations = establishments.map((year, yearIndex) => year.map((district, districtIndex) => district.map((total, month) => total - newRegistrations[yearIndex][districtIndex][month])))

const categoryMix = districts.map((_, districtIndex) => {
  const random = mulberry32(4000 + districtIndex)
  const weights = categoryWeights.map((weight) => weight * (0.75 + random() * 0.5))
  return allocate(1000, weights).map((value) => value / 1000)
})

const taluks = districts.flatMap((district) => TALUK_LABELS.map((label, index) => ({
  id: `${district.id}-${slug(label)}`,
  districtId: district.id,
  name: `${label} taluk`,
  weight: TALUK_WEIGHTS[index],
})))

const authorities = [
  { id: "labour-office", name: "Labour office", share: 0.34 },
  { id: "ulb", name: "Urban local body", share: 0.22 },
  { id: "pwd", name: "PWD counter", share: 0.18 },
  { id: "treasury", name: "Treasury challan", share: 0.16 },
  { id: "board-counter", name: "Board collection counter", share: 0.1 },
]

const workTypes = ["School block", "Road widening", "Canal lining", "Housing quarters", "Hospital wing", "Market yard", "Drain regrade", "Bridge approach"]
const employers = ["Illustrative employer A", "Illustrative employer B", "Illustrative employer C", "Illustrative employer D"]
const establishmentStatuses = ["Active", "Expired", "Suspended"]
const projectStatuses = [
  { id: "ongoing", name: "Ongoing", count: 12450 },
  { id: "completed", name: "Completed", count: 8640 },
  { id: "not-started", name: "Not started", count: 2310 },
  { id: "suspended", name: "Suspended", count: 780 },
]
const cessStatuses = [
  { id: "collected", name: "Collected" },
  { id: "partial", name: "Partially collected" },
  { id: "assessed-only", name: "Assessed, not collected" },
  { id: "no-assessment", name: "No matched assessment" },
]
const inspectionStatuses = [
  { id: "no-violation", name: "No violation recorded" },
  { id: "follow-up", name: "Follow-up due" },
  { id: "violation-open", name: "Violation open" },
]

const samples = { establishments: [], projects: [], contractors: [], assessments: [], collections: [], inspections: [], violations: [], complianceActions: [] }

districts.forEach((district, districtIndex) => {
  const category = categories[districtIndex % categories.length]
  const taluk = taluks.filter((item) => item.districtId === district.id)[districtIndex % 3]
  const monthIndex = districtIndex % 12
  const projectStatus = projectStatuses[districtIndex % projectStatuses.length].id
  const cessStatus = cessStatuses[districtIndex % cessStatuses.length].id
  const assessed = cessStatus === "no-assessment" ? 0 : (40 + districtIndex) * 100000
  const collected = cessStatus === "collected" ? assessed : cessStatus === "partial" ? Math.round(assessed * 0.6) : 0
  samples.establishments.push({
    id: `est-${district.id}`,
    establishmentId: `EST-2025-${String(1000 + districtIndex).padStart(4, "0")}`,
    name: `${workTypes[districtIndex % workTypes.length]} office, ${district.name}`,
    category: category.id,
    districtId: district.id,
    talukId: taluk.id,
    employer: employers[districtIndex % employers.length],
    projectValueRupees: (80 + districtIndex * 5) * 100000,
    registrationDate: `2025-${String((monthIndex + 3) % 12 + 1).padStart(2, "0")}-12`,
    status: establishmentStatuses[districtIndex % establishmentStatuses.length],
    projectStatus,
    cessStatus,
    year: "2025-26",
    monthIndex,
    source: "Labour Establishment Register",
  })
  samples.projects.push({
    id: `prj-${district.id}`,
    projectId: `PRJ-2025-${String(1400 + districtIndex).padStart(4, "0")}`,
    name: `${workTypes[districtIndex % workTypes.length]}, ${district.name}`,
    districtId: district.id,
    talukId: taluk.id,
    category: category.id,
    projectStatus,
    cessStatus,
    year: "2025-26",
    monthIndex,
    source: "Labour project file",
  })
  samples.contractors.push({
    id: `con-${district.id}`,
    name: employers[districtIndex % employers.length],
    establishmentId: `EST-2025-${String(1000 + districtIndex).padStart(4, "0")}`,
    source: "Labour Establishment Register",
  })
  samples.assessments.push({
    id: `asm-${district.id}`,
    assessmentId: `ASM-2025-${String(2200 + districtIndex).padStart(4, "0")}`,
    projectId: `PRJ-2025-${String(1400 + districtIndex).padStart(4, "0")}`,
    projectName: `${workTypes[districtIndex % workTypes.length]}, ${district.name}`,
    districtId: district.id,
    talukId: taluk.id,
    category: category.id,
    projectStatus,
    cessStatus,
    assessedRupees: assessed,
    collectedRupees: collected,
    assessmentDate: `2025-${String((monthIndex + 3) % 12 + 1).padStart(2, "0")}-18`,
    year: "2025-26",
    monthIndex,
    source: "Labour cess assessment file",
  })
  if (collected > 0) {
    samples.collections.push({
      id: `col-${district.id}`,
      assessmentId: `ASM-2025-${String(2200 + districtIndex).padStart(4, "0")}`,
      districtId: district.id,
      amountRupees: collected,
      authority: authorities[districtIndex % authorities.length].id,
      year: "2025-26",
      monthIndex,
      source: "Labour collection receipt",
    })
  }
  const violationCount = districtIndex % 4 === 0 ? 2 : districtIndex % 3 === 0 ? 1 : 0
  const complianceStatus = violationCount === 0 ? "No violation recorded" : districtIndex % 4 === 0 ? "Follow-up due" : "Violation open"
  samples.inspections.push({
    id: `ins-${district.id}`,
    inspectionId: `INS-2025-${String(3300 + districtIndex).padStart(4, "0")}`,
    establishmentName: `${workTypes[districtIndex % workTypes.length]} office, ${district.name}`,
    districtId: district.id,
    talukId: taluk.id,
    category: category.id,
    inspectionDate: `2025-${String((monthIndex + 3) % 12 + 1).padStart(2, "0")}-21`,
    violationCount,
    complianceStatus,
    actionRequired: violationCount === 0 ? "None" : "Follow-up inspection",
    projectStatus,
    cessStatus,
    year: "2025-26",
    monthIndex,
    source: "Labour inspection diary",
  })
  if (violationCount > 0) {
    samples.violations.push({
      id: `vio-${district.id}`,
      inspectionId: `INS-2025-${String(3300 + districtIndex).padStart(4, "0")}`,
      districtId: district.id,
      finding: "Illustrative safety or register finding",
      count: violationCount,
      year: "2025-26",
      monthIndex,
      source: "Labour inspection diary",
    })
    samples.complianceActions.push({
      id: `act-${district.id}`,
      inspectionId: `INS-2025-${String(3300 + districtIndex).padStart(4, "0")}`,
      districtId: district.id,
      action: complianceStatus,
      year: "2025-26",
      monthIndex,
      source: "Labour compliance file",
    })
  }
})

for (const key of Object.keys(HEADLINE)) {
  const cube = key === "cessAssessed" || key === "cessCollected" ? cess[key] : { establishments, activeProjects, inspections, violations, pendingCompliance }[key]
  if (cubeTotal(cube, 2) !== HEADLINE[key]) throw new Error(`${key} total ${cubeTotal(cube, 2)}`)
}
if (cubeTotal(cess.cessAssessed, 2) - cubeTotal(cess.cessCollected, 2) !== cr(530)) throw new Error("outstanding is not 530 Cr")

const payload = {
  meta: {
    illustrative: true,
    source: "Illustrative Labour Commissionerate extract",
    lastRefreshed: "18 Nov 2026, 09:30 IST",
    illustrativeNote: "Illustrative data. This demonstration is not connected to Karnataka Government systems.",
    boundaryNote: "District boundaries follow the Census 2011 outline. Vijayanagara is not drawn separately on this illustrative map.",
    separationNote: "These are Labour Commissionerate records. They are not KBOCW Board worker registrations, and the two registers are not assumed to be synchronised.",
    stageNote: "Cess assessed and cess collected are separate stages. Outstanding assessed cess is assessed minus collected. Amounts already collected stay out of this balance, including cess that has been collected and is awaiting remittance.",
  },
  sources: [
    { id: "ler", name: "Labour Establishment Register", system: "Labour Commissionerate", holds: "Establishments and contractors" },
    { id: "lpf", name: "Labour project file", system: "Labour Commissionerate", holds: "Construction projects" },
    { id: "lca", name: "Labour cess assessment file", system: "Labour Commissionerate", holds: "Cess assessments" },
    { id: "lcr", name: "Labour collection receipt", system: "Labour Commissionerate", holds: "Cess collections" },
    { id: "lid", name: "Labour inspection diary", system: "Labour Commissionerate", holds: "Inspections and violations" },
    { id: "lcf", name: "Labour compliance file", system: "Labour Commissionerate", holds: "Compliance actions" },
  ],
  years: YEARS,
  months: MONTHS,
  districts,
  taluks,
  categories,
  categoryMix,
  projectStatuses,
  cessStatuses,
  inspectionStatuses,
  authorities,
  rules: {
    newRegistrationShare: 0.386,
    cessSlices: {
      collected: { assessedRatio: 1500 / 2450, countShare: 0.56 },
      partial: { assessedRatio: 700 / 2450, collectedRatio: 420 / 1920, countShare: 0.24 },
      "assessed-only": { assessedRatio: 250 / 2450, countShare: 0.12 },
      "no-assessment": { countShare: 0.08 },
    },
    inspectionSlices: {
      "no-violation": { inspectionShare: 0.78, violationShare: 0, pendingShare: 0 },
      "follow-up": { inspectionShare: 0.1, violationShare: 0.45, pendingShare: 0 },
      "violation-open": { inspectionShare: 0.12, violationShare: 0.55, pendingShare: 1 },
    },
    exceptions: {
      "projects-without-assessment": 1120,
      "outstanding-cases": 2640,
      "overdue-collection": 640,
      "inspection-follow-up": 310,
      "unresolved-compliance": 425,
      "incomplete-establishments": 860,
    },
  },
  metrics: {
    establishments,
    activeProjects,
    inspections,
    violations,
    pendingCompliance,
    newRegistrations,
    renewedRegistrations,
    ...cess,
  },
  samples,
}

const target = join(root, "src/data/labour-commissionerate.json")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(payload))
console.log(`Wrote ${target}`)
console.log("Labour headline checks passed")
