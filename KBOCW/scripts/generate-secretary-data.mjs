import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

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

const SCHEMES = [
  ["marriage", "Marriage assistance", 180],
  ["medical", "Medical assistance", 260],
  ["education", "Education scholarship", 210],
  ["maternity", "Maternity benefit", 95],
  ["pension", "Pension and family pension", 240],
  ["housing", "Housing support", 145],
  ["accident", "Accident relief", 70],
  ["funeral", "Funeral assistance", 50],
]

const CRORE = 10_000_000
const cr = (value) => value * CRORE

const HEADLINE = {
  projects: 12450,
  workers: 3_860_000,
  cessAssessed: cr(2450),
  cessCollected: cr(1920),
  cessRemitted: cr(1780),
  cessCredited: cr(1640),
  beneficiaries: 2_480_000,
  disbursement: cr(1250),
  pendingApplications: 142_000,
  applicationsSanctioned: 980_000,
  applicationsReturned: 64_000,
}

const GROWTH = {
  projects: 6.4,
  workers: 4.1,
  cessAssessed: 8.2,
  cessCollected: 5.7,
  cessRemitted: 3.9,
  cessCredited: 4.6,
  beneficiaries: 7.2,
  disbursement: 6.1,
  pendingApplications: -2.4,
  applicationsSanctioned: 5.4,
  applicationsReturned: 1.8,
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
  if (left < 0) throw new Error("allocate overshot")
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
  if (values.reduce((a, b) => a + b, 0) !== total) throw new Error("fit sum mismatch")
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

function jitter(weights, seed) {
  const random = mulberry32(seed)
  return weights.map((weight) => weight * (0.82 + random() * 0.36))
}

function shownPercent(current, previous) {
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function tune(current, targetPercent) {
  let previous = Math.max(1, Math.round(current / (1 + targetPercent / 100)))
  for (let delta = -40; delta <= 40; delta += 1) {
    const candidate = previous + delta
    if (candidate > 0 && shownPercent(current, candidate) === targetPercent) return candidate
  }
  throw new Error(`no previous value for ${current} at ${targetPercent}%`)
}

function sum(values) {
  return values.reduce((a, b) => a + b, 0)
}

const districts = DISTRICT_ROWS.map(([name]) => ({ id: slug(name), name }))
const baseWeights = DISTRICT_ROWS.map(([, weight]) => weight)

function yearWeights(yearIndex, salt) {
  if (yearIndex === 2) return baseWeights
  return jitter(baseWeights, 1000 + yearIndex * 100 + salt)
}

function buildCountCube(yearTotals, salt) {
  return yearTotals.map((total, yearIndex) => {
    const byDistrict = allocate(total, yearWeights(yearIndex, salt))
    return byDistrict.map((districtTotal) => allocate(districtTotal, MONTH_WEIGHTS))
  })
}

function buildCessCubes(yearTotals) {
  const assessed = []
  const collected = []
  const remitted = []
  const credited = []
  yearTotals.forEach((totals, yearIndex) => {
    const weights = yearWeights(yearIndex, 7)
    if (!(totals.assessed >= totals.collected && totals.collected >= totals.remitted && totals.remitted >= totals.credited)) {
      throw new Error(`cess stage order failed for ${YEARS[yearIndex]}`)
    }
    const assessedDistrict = allocate(totals.assessed, weights)
    const collectedDistrict = fitUnderCap(totals.collected, weights, assessedDistrict)
    const remittedDistrict = fitUnderCap(totals.remitted, weights, collectedDistrict)
    const creditedDistrict = fitUnderCap(totals.credited, weights, remittedDistrict)
    const assessedMonth = assessedDistrict.map((total) => allocate(total, MONTH_WEIGHTS))
    const collectedMonth = collectedDistrict.map((total, district) => fitUnderCap(total, MONTH_WEIGHTS, assessedMonth[district]))
    const remittedMonth = remittedDistrict.map((total, district) => fitUnderCap(total, MONTH_WEIGHTS, collectedMonth[district]))
    const creditedMonth = creditedDistrict.map((total, district) => fitUnderCap(total, MONTH_WEIGHTS, remittedMonth[district]))
    assessed.push(assessedMonth)
    collected.push(collectedMonth)
    remitted.push(remittedMonth)
    credited.push(creditedMonth)
  })
  return { cessAssessed: assessed, cessCollected: collected, cessRemitted: remitted, cessCredited: credited }
}

const headlineYear = {
  projects: HEADLINE.projects,
  workers: HEADLINE.workers,
  cessAssessed: HEADLINE.cessAssessed,
  cessCollected: HEADLINE.cessCollected,
  cessRemitted: HEADLINE.cessRemitted,
  cessCredited: HEADLINE.cessCredited,
  beneficiaries: HEADLINE.beneficiaries,
  disbursement: HEADLINE.disbursement,
  pendingApplications: HEADLINE.pendingApplications,
  applicationsSanctioned: HEADLINE.applicationsSanctioned,
  applicationsReturned: HEADLINE.applicationsReturned,
}

const previousYear = Object.fromEntries(
  Object.entries(headlineYear).map(([key, value]) => [key, tune(value, GROWTH[key])]),
)

const earlierRates = {
  projects: 5.1,
  workers: 3.6,
  cessAssessed: 4.8,
  cessCollected: 4.4,
  cessRemitted: 3.2,
  cessCredited: 3.5,
  beneficiaries: 4.9,
  disbursement: 4.2,
  pendingApplications: -1.6,
  applicationsSanctioned: 3.8,
  applicationsReturned: 2.1,
}
const earlierYear = Object.fromEntries(
  Object.entries(previousYear).map(([key, value]) => [key, tune(value, earlierRates[key])]),
)

for (const year of [headlineYear, previousYear, earlierYear]) {
  if (!(year.cessAssessed >= year.cessCollected && year.cessCollected >= year.cessRemitted && year.cessRemitted >= year.cessCredited)) {
    throw new Error("state cess totals broke stage order")
  }
}

const yearMetric = (key) => [earlierYear[key], previousYear[key], headlineYear[key]]

const projects = buildCountCube(yearMetric("projects"), 1)
const workers = buildCountCube(yearMetric("workers"), 2)
const beneficiaries = buildCountCube(yearMetric("beneficiaries"), 3)
const pendingApplications = buildCountCube(yearMetric("pendingApplications"), 4)
const applicationsSanctioned = buildCountCube(yearMetric("applicationsSanctioned"), 5)
const applicationsReturned = buildCountCube(yearMetric("applicationsReturned"), 6)
const cess = buildCessCubes(yearMetric("cessAssessed").map((assessed, index) => ({
  assessed,
  collected: yearMetric("cessCollected")[index],
  remitted: yearMetric("cessRemitted")[index],
  credited: yearMetric("cessCredited")[index],
})))

const schemeStateTotals = SCHEMES.map(([, , croreAmount]) => yearMetric("disbursement").map((total) => Math.round((total * croreAmount) / 1250)))
for (let yearIndex = 0; yearIndex < 3; yearIndex += 1) {
  const target = yearMetric("disbursement")[yearIndex]
  const current = SCHEMES.reduce((total, _, schemeIndex) => total + schemeStateTotals[schemeIndex][yearIndex], 0)
  schemeStateTotals[0][yearIndex] += target - current
}
const schemeWeights = [0, 1, 2].map((yearIndex) => yearWeights(yearIndex, 11))
const schemes = SCHEMES.map(([id, name], schemeIndex) => ({
  id,
  name,
  byDistrict: [0, 1, 2].map((yearIndex) => allocate(schemeStateTotals[schemeIndex][yearIndex], schemeWeights[yearIndex])),
}))
const disbursement = [0, 1, 2].map((yearIndex) => {
  const byDistrict = districts.map((_, districtIndex) => schemes.reduce((total, scheme) => total + scheme.byDistrict[yearIndex][districtIndex], 0))
  if (sum(byDistrict) !== yearMetric("disbursement")[yearIndex]) throw new Error("disbursement drifted from schemes")
  return byDistrict.map((total) => allocate(total, MONTH_WEIGHTS))
})

function exceptionCube(yearTotals, salt) {
  return yearTotals.map((total, yearIndex) => {
    const byDistrict = allocate(total, yearWeights(yearIndex, salt))
    return byDistrict.map((districtTotal) => allocate(districtTotal, MONTH_WEIGHTS))
  })
}

const exceptions = [
  {
    id: "cess-unreconciled",
    title: "Cess collected but not reconciled",
    description: "Collected cess in the selected period has no matching remittance or credit record. This is a potential exception for review, not a confirmed violation.",
    sourceDepartment: "Treasury",
    priority: "high",
    counts: exceptionCube([1740, 1805, 1860].map((value, index) => tuneChain(value, index)), 21),
  },
  {
    id: "projects-without-assessment",
    title: "Projects without matched cess assessment",
    description: "Construction projects have no matched cess assessment in the selected period. This is a potential exception for review, not a confirmed violation.",
    sourceDepartment: "PWD",
    priority: "high",
    counts: exceptionCube([860, 905, 940], 22),
  },
  {
    id: "pending-beyond-time",
    title: "Pending welfare applications",
    description: "Welfare applications have remained pending beyond the prescribed processing time.",
    sourceDepartment: "KBOCW Board",
    priority: "medium",
    counts: exceptionCube([43800, 45110, 46200], 23),
  },
  {
    id: "delayed-updates",
    title: "Delayed departmental data updates",
    description: "Department feeds were not received by the expected refresh time. Figures drawn from these feeds may be incomplete.",
    sourceDepartment: "BBMP / ULBs",
    priority: "medium",
    counts: exceptionCube([16840, 17620, 18420], 24),
  },
  {
    id: "safety-incidents",
    title: "Construction safety incidents",
    description: "Construction safety incidents recorded in the selected period. The count is illustrative and is not a compliance finding.",
    sourceDepartment: "Labour Commissionerate",
    priority: "high",
    counts: exceptionCube([112, 121, 128], 25),
  },
]

function tuneChain(value) {
  return value
}

const departments = [
  { id: "labour", name: "Labour Commissionerate", category: "Worker registrations", recordsByYear: [168900, 177400, 186400], lastUpdated: "17 Nov 2026", status: "current", shareMetric: "workers" },
  { id: "kbocw", name: "KBOCW Board", category: "Welfare applications", recordsByYear: [86200, 90100, 94200], lastUpdated: "18 Nov 2026", status: "current", shareMetric: "beneficiaries" },
  { id: "bbmp", name: "BBMP / ULBs", category: "Building permissions", recordsByYear: [11480, 12110, 12840], lastUpdated: "12 Nov 2026", status: "delayed", shareMetric: "projects" },
  { id: "pwd", name: "PWD", category: "Work estimates", recordsByYear: [3010, 3220, 3420], lastUpdated: "16 Nov 2026", status: "current", shareMetric: "projects" },
  { id: "treasury", name: "Treasury", category: "Remittance records", recordsByYear: [8120, 8540, 8960], lastUpdated: "18 Nov 2026", status: "partial", shareMetric: "cessRemitted" },
  { id: "factories", name: "Factories & Boilers", category: "Establishment records", recordsByYear: [5480, 5790, 6110], lastUpdated: "09 Nov 2026", status: "delayed", shareMetric: "projects" },
]

const workTypes = ["Road improvement", "School building", "Hospital block", "Canal lining", "Housing quarters", "Drainage works", "Bridge reconstruction", "Market yard", "Hostel building", "Water supply"]
const samples = { projects: [], cess: [], welfare: [], exceptions: [], departments: [], incidents: [] }

districts.forEach((district, districtIndex) => {
  samples.projects.push({
    id: `prj-${district.id}`,
    year: "2025-26",
    monthIndex: districtIndex % 12,
    districtId: district.id,
    reference: `PRJ-2025-${String(1400 + districtIndex).padStart(4, "0")}`,
    project: `${workTypes[districtIndex % workTypes.length]}, ${district.name}`,
    workType: workTypes[districtIndex % workTypes.length],
    cessAssessment: districtIndex % 4 === 0 ? "No matched assessment" : "Assessment on record",
  })
})

const stages = [
  ["Cess assessed", "Assessment recorded"],
  ["Cess collected", "Not reconciled"],
  ["Cess remitted", "Remitted to treasury"],
  ["Cess credited", "Credited to the Board"],
]
stages.forEach(([stage, reconciliation], stageIndex) => {
  for (let row = 0; row < 8; row += 1) {
    const district = districts[(row * 3 + stageIndex) % districts.length]
    samples.cess.push({
      id: `cess-${stageIndex}-${row}`,
      year: "2025-26",
      monthIndex: (row + stageIndex) % 12,
      districtId: district.id,
      reference: `CESS-2025-${String(2100 + stageIndex * 20 + row).padStart(4, "0")}`,
      stage,
      amountRupees: (18 + row * 3 + stageIndex) * 100000,
      reconciliation,
    })
  }
})

schemes.forEach((scheme, schemeIndex) => {
  for (let row = 0; row < 4; row += 1) {
    const district = districts[(schemeIndex * 2 + row) % districts.length]
    const status = ["Sanctioned", "Pending", "Returned", "Sanctioned"][row]
    samples.welfare.push({
      id: `wlf-${scheme.id}-${row}`,
      year: row === 3 ? "2024-25" : "2025-26",
      monthIndex: (schemeIndex + row) % 12,
      districtId: district.id,
      reference: `WLF-2025-${String(3300 + schemeIndex * 10 + row).padStart(4, "0")}`,
      scheme: scheme.name,
      status,
      amountRupees: (2 + schemeIndex + row) * 100000,
    })
  }
})

exceptions.forEach((item, itemIndex) => {
  for (let row = 0; row < 6; row += 1) {
    const district = districts[(itemIndex * 5 + row) % districts.length]
    samples.exceptions.push({
      id: `exc-${item.id}-${row}`,
      year: "2025-26",
      monthIndex: (itemIndex + row * 2) % 12,
      districtId: district.id,
      exceptionId: item.id,
      reference: `EXC-2025-${String(4100 + itemIndex * 10 + row).padStart(4, "0")}`,
      detail: item.title,
      records: 4 + row * 3 + itemIndex,
    })
  }
})

departments.forEach((department, departmentIndex) => {
  for (let row = 0; row < 4; row += 1) {
    const district = districts[(departmentIndex * 4 + row) % districts.length]
    samples.departments.push({
      id: `dep-${department.id}-${row}`,
      year: "2025-26",
      monthIndex: (departmentIndex + row) % 12,
      districtId: district.id,
      departmentId: department.id,
      reference: `FEED-2025-${String(5100 + departmentIndex * 10 + row).padStart(4, "0")}`,
      records: 20 + row * 15 + departmentIndex,
      status: department.status,
    })
  }
})

for (let row = 0; row < 16; row += 1) {
  const district = districts[row % districts.length]
  samples.incidents.push({
    id: `inc-${row}`,
    year: "2025-26",
    monthIndex: row % 12,
    districtId: district.id,
    reference: `INC-2025-${String(600 + row).padStart(4, "0")}`,
    incidentType: ["Fall from height", "Electrical contact", "Excavation collapse", "Material handling"][row % 4],
    status: "Recorded for review",
  })
}

function cubeTotal(cube, yearIndex) {
  return cube[yearIndex].reduce((total, district) => total + sum(district), 0)
}

const checks = {
  projects: cubeTotal(projects, 2),
  workers: cubeTotal(workers, 2),
  cessAssessed: cubeTotal(cess.cessAssessed, 2),
  cessCollected: cubeTotal(cess.cessCollected, 2),
  cessRemitted: cubeTotal(cess.cessRemitted, 2),
  cessCredited: cubeTotal(cess.cessCredited, 2),
  beneficiaries: cubeTotal(beneficiaries, 2),
  disbursement: cubeTotal(disbursement, 2),
  pendingApplications: cubeTotal(pendingApplications, 2),
}
for (const [key, value] of Object.entries(checks)) {
  if (value !== HEADLINE[key]) throw new Error(`${key} is ${value}, expected ${HEADLINE[key]}`)
}
for (const [key, target] of Object.entries(GROWTH)) {
  const actual = shownPercent(headlineYear[key], previousYear[key])
  if (actual !== target) throw new Error(`${key} change is ${actual}, expected ${target}`)
}

const payload = {
  meta: {
    illustrative: true,
    source: "Illustrative consolidated extract",
    lastRefreshed: "18 Nov 2026, 09:30 IST",
    illustrativeNote: "Illustrative data. This demonstration is not connected to Karnataka Government systems.",
    boundaryNote: "District boundaries follow the Census 2011 outline. Vijayanagara is not drawn separately on this illustrative map.",
    stageNote: "Cess assessed, collected, remitted and credited are separate stages. They are not added together.",
  },
  years: YEARS,
  months: MONTHS,
  districts,
  metrics: {
    projects,
    workers,
    beneficiaries,
    disbursement,
    pendingApplications,
    applicationsSanctioned,
    applicationsReturned,
    ...cess,
  },
  schemes,
  departments,
  exceptions: exceptions.map(({ counts, ...item }) => ({ ...item, counts })),
  samples,
}

const target = join(root, "src/data/secretary-overview.json")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(payload))
console.log(`Wrote ${target}`)
console.log("Headline checks passed", checks)
console.log("Previous-year change targets passed")
