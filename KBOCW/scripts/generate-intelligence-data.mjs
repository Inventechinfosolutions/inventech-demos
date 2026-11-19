import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const CR = 10_000_000
const cr = (value) => value * CR
const YEARS = ["2023-24", "2024-25", "2025-26"]
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((label, index) => ({ index, label }))
const MONTH_WEIGHTS = [90, 85, 60, 55, 60, 75, 90, 95, 90, 100, 100, 100]
const DISTRICT_ROWS = [
  ["Bengaluru Urban", 162], ["Belagavi", 62], ["Mysuru", 55], ["Tumakuru", 46], ["Ballari", 42],
  ["Dakshina Kannada", 40], ["Bengaluru Rural", 38], ["Kalaburagi", 36], ["Vijayapura", 34], ["Dharwad", 32],
  ["Mandya", 30], ["Hassan", 28], ["Shivamogga", 28], ["Davanagere", 26], ["Raichur", 25], ["Kolar", 24],
  ["Bagalkote", 23], ["Chitradurga", 22], ["Udupi", 21], ["Bidar", 20], ["Chikkaballapura", 20], ["Haveri", 18],
  ["Uttara Kannada", 18], ["Ramanagara", 17], ["Chikkamagaluru", 17], ["Koppal", 16], ["Chamarajanagara", 15],
  ["Gadag", 14], ["Yadgir", 13], ["Kodagu", 12],
]
const HEADLINE = {
  matchedProjects: 9420,
  verificationProjects: 2140,
  unmatchedProjects: 3300,
  cessExceptions: 1860,
  workerGaps: 86400,
  welfareExceptions: 18640,
  alerts: 246,
  cessAssessed: cr(2450),
  cessCollected: cr(1920),
  cessRemitted: cr(1780),
  cessCredited: cr(1640),
  labourWorkers: 1860000,
  kbocwWorkers: 3860000,
  verifiedWorkerMatches: 640000,
  potentialWorkerMatches: 180000,
  welfareReceived: 845000,
  welfareApproved: 596000,
  welfareDisbursed: 486000,
  labourInspections: 8450,
  factoriesInspections: 6250,
  labourViolations: 1285,
  factoriesViolations: 985,
  labourAccidents: 128,
  factoriesAccidents: 142,
  labourOverdue: 310,
  factoriesOverdue: 74,
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
function allocate(total, weights) {
  if (!Number.isInteger(total)) throw new Error(`total must be an integer, got ${total}`)
  if (total === 0) return weights.map(() => 0)
  const sum = weights.reduce((a, b) => a + b, 0)
  const exact = weights.map((weight) => (total * weight) / sum)
  const floors = exact.map((value) => Math.floor(value + 1e-8))
  let left = total - floors.reduce((a, b) => a + b, 0)
  const order = exact.map((value, index) => ({ index, frac: value - Math.floor(value + 1e-8) })).sort((a, b) => b.frac - a.frac || a.index - b.index)
  let cursor = 0
  while (left > 0) {
    floors[order[cursor % order.length].index] += 1
    left -= 1
    cursor += 1
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
      return values
    }
  }
  if (remaining !== 0) throw new Error(`unallocated ${remaining}`)
  return values
}
function prior(current) {
  return Math.max(1, Math.round(current / 1.04))
}
function cubeTotal(cube, yearIndex) {
  return cube[yearIndex].reduce((total, district) => total + district.reduce((a, b) => a + b, 0), 0)
}
const districts = DISTRICT_ROWS.map(([name]) => ({ id: slug(name), name }))
const baseWeights = DISTRICT_ROWS.map(([, weight]) => weight)
function yearWeights(yearIndex, salt) {
  if (yearIndex === 2) return baseWeights
  let value = (1400 + yearIndex * 80 + salt) >>> 0
  return baseWeights.map((weight) => {
    value = (value + 0x6d2b79f5) >>> 0
    const roll = ((value ^ (value >>> 14)) >>> 0) / 4294967296
    return weight * (0.86 + roll * 0.28)
  })
}
function buildCube(yearTotals, salt) {
  return yearTotals.map((total, yearIndex) => allocate(total, yearWeights(yearIndex, salt)).map((districtTotal) => allocate(districtTotal, MONTH_WEIGHTS)))
}
function buildChain(levels) {
  const cubes = levels.map(() => [])
  levels[0].forEach((_, yearIndex) => {
    const weights = yearWeights(yearIndex, 21)
    let caps = allocate(levels[0][yearIndex], weights)
    const districtRows = [caps]
    for (let level = 1; level < levels.length; level += 1) {
      caps = fitUnderCap(levels[level][yearIndex], weights, caps)
      districtRows.push(caps)
    }
    const monthRows = []
    districtRows.forEach((districtTotals, level) => {
      if (level === 0) monthRows.push(districtTotals.map((total) => allocate(total, MONTH_WEIGHTS)))
      else monthRows.push(districtTotals.map((total, district) => fitUnderCap(total, MONTH_WEIGHTS, monthRows[level - 1][district])))
    })
    monthRows.forEach((months, level) => cubes[level].push(months))
  })
  return cubes
}

const yearsOf = (value) => [prior(prior(value)), prior(value), value]
const metrics = {}
for (const [key, value] of Object.entries(HEADLINE)) {
  if (key.startsWith("cessA") || key.startsWith("cessC") || key.startsWith("cessR")) continue
  metrics[key] = buildCube(yearsOf(value), key.length + value % 17)
}
const cessLevels = ["cessAssessed", "cessCollected", "cessRemitted", "cessCredited"].map((key) => yearsOf(HEADLINE[key]))
const cessCubes = buildChain(cessLevels)
;"cessAssessed,cessCollected,cessRemitted,cessCredited".split(",").forEach((key, index) => {
  metrics[key] = cessCubes[index]
})
for (const [key, value] of Object.entries(HEADLINE)) {
  if (!metrics[key]) throw new Error(`missing cube ${key}`)
  if (cubeTotal(metrics[key], 2) !== value) throw new Error(`${key} ${cubeTotal(metrics[key], 2)}`)
}

const assessedSplit = allocate(cr(2450), [70, 30])
const collectedSplit = allocate(cr(1920), [70, 30])
const departments = [
  { id: "pwd", name: "PWD", projectRecords: 5120, matchedRecords: 3100, verificationRecords: 820, unmatchedRecords: 1200, cessAssessed: assessedSplit[1], cessCollected: 0, cessRemitted: 0, cessCredited: 0, cessExceptions: 180, workerGaps: 0, welfareExceptions: 0, alerts: 28, holdsWorkers: false, holdsWelfare: false, safety: null },
  { id: "labour", name: "Labour Commissionerate", projectRecords: 4860, matchedRecords: 2800, verificationRecords: 760, unmatchedRecords: 1300, cessAssessed: assessedSplit[0], cessCollected: collectedSplit[0], cessRemitted: 0, cessCredited: 0, cessExceptions: 860, workerGaps: 42000, welfareExceptions: 0, alerts: 74, holdsWorkers: true, holdsWelfare: false, safety: "labour" },
  { id: "bbmp", name: "BBMP / ULBs", projectRecords: 3640, matchedRecords: 1600, verificationRecords: 740, unmatchedRecords: 1300, cessAssessed: 0, cessCollected: collectedSplit[1], cessRemitted: 0, cessCredited: 0, cessExceptions: 180, workerGaps: 0, welfareExceptions: 0, alerts: 36, holdsWorkers: false, holdsWelfare: false, safety: null },
  { id: "kbocw", name: "KBOCW Board", projectRecords: 2940, matchedRecords: 1500, verificationRecords: 540, unmatchedRecords: 900, cessAssessed: 0, cessCollected: 0, cessRemitted: 0, cessCredited: 0, cessExceptions: 0, workerGaps: 44400, welfareExceptions: 18640, alerts: 62, holdsWorkers: true, holdsWelfare: true, safety: null },
  { id: "treasury", name: "Treasury", projectRecords: 2480, matchedRecords: 1420, verificationRecords: 360, unmatchedRecords: 700, cessAssessed: 0, cessCollected: 0, cessRemitted: cr(1780), cessCredited: cr(1640), cessExceptions: 640, workerGaps: 0, welfareExceptions: 0, alerts: 31, holdsWorkers: false, holdsWelfare: false, safety: null },
  { id: "factories", name: "Factories & Boilers", projectRecords: 980, matchedRecords: 420, verificationRecords: 180, unmatchedRecords: 380, cessAssessed: 0, cessCollected: 0, cessRemitted: 0, cessCredited: 0, cessExceptions: 0, workerGaps: 0, welfareExceptions: 0, alerts: 15, holdsWorkers: false, holdsWelfare: false, safety: "factories" },
]
for (const department of departments) {
  if (department.matchedRecords + department.verificationRecords + department.unmatchedRecords !== department.projectRecords) throw new Error(department.id)
}
if (departments.reduce((sum, department) => sum + department.cessExceptions, 0) !== 1860) throw new Error("cess exceptions")
if (departments.reduce((sum, department) => sum + department.workerGaps, 0) !== 86400) throw new Error("gaps")
if (departments.reduce((sum, department) => sum + department.alerts, 0) !== 246) throw new Error("alerts")
if (departments.reduce((sum, department) => sum + department.cessAssessed, 0) !== cr(2450)) throw new Error("assessed split")
if (departments.reduce((sum, department) => sum + department.cessCollected, 0) !== cr(1920)) throw new Error("collected split")

const membership = [
  { id: "active", name: "Active KBOCW membership", count: 3120000 },
  { id: "expired", name: "Expired KBOCW membership", count: 540000 },
  { id: "not-yet-active", name: "Registered, not yet active", count: 200000 },
]
if (membership.reduce((sum, item) => sum + item.count, 0) !== 3860000) throw new Error("membership")

const entities = [
  ["project", "PRJ-2025-1001", "Construction Project", "PWD", "pwd", "bengaluru-urban", "PWD work file", "PWD-WF-1001"],
  ["project-b", "PRJ-2025-1008", "Construction Project", "PWD", "pwd", "mysuru", "PWD work file", "PWD-WF-1008"],
  ["contractor", "CON-2025-014", "Contractor", "PWD", "pwd", "bengaluru-urban", "PWD contractor file", "PWD-CON-014"],
  ["establishment", "EST-2025-221", "Establishment", "Labour Commissionerate", "labour", "bengaluru-urban", "Labour establishment register", "LER-221"],
  ["establishment-b", "EST-2025-418", "Establishment", "Labour Commissionerate", "labour", "mysuru", "Labour establishment register", "LER-418"],
  ["worker", "WRK-2025-4410", "Worker", "Labour Commissionerate", "labour", "bengaluru-urban", "Labour worker extract", "LWR-4410"],
  ["membership", "MEM-2025-4410", "KBOCW Membership", "KBOCW Board", "kbocw", "bengaluru-urban", "KBOCW membership register", "KBM-4410"],
  ["assessment", "ASM-2025-077", "Cess Assessment", "Labour Commissionerate", "labour", "bengaluru-urban", "Labour cess assessment file", "LCA-077"],
  ["payment", "PAY-2025-077", "Cess Payment", "Labour Commissionerate", "labour", "bengaluru-urban", "Labour collection receipt", "LCR-077"],
  ["treasury", "TXN-2025-077", "Treasury Transaction", "Treasury", "treasury", "bengaluru-urban", "Treasury challan", "TRY-077"],
  ["application", "APP-2025-5601", "Welfare Application", "KBOCW Board", "kbocw", "bengaluru-urban", "KBOCW application file", "KBA-5601"],
  ["beneficiary", "BEN-2025-019", "Beneficiary", "KBOCW Board", "kbocw", "bengaluru-urban", "KBOCW beneficiary extract", "KBB-019"],
  ["inspection", "INS-2025-303", "Inspection", "Labour Commissionerate", "labour", "bengaluru-urban", "Labour inspection diary", "LID-303"],
  ["factory-inspection", "INS-FB-2025-018", "Inspection", "Factories & Boilers", "factories", "dharwad", "Factories inspection diary", "FID-018"],
].map(([id, recordId, type, department, departmentId, districtId, system, sourceRecordId]) => ({
  id,
  label: type === "Worker" ? "Worker ••10" : type === "Beneficiary" ? "Beneficiary ••19" : recordId,
  recordId,
  type,
  department,
  departmentId,
  districtId,
  system,
  sourceRecordId,
  recordDate: "2025-11-12",
  lastUpdatedAt: "18 Nov 2026, 09:30 IST",
}))
const relationships = [
  ["project", "contractor", "Contractor named on the work file", "Shared work-file number PWD-WF-1001", "High", "verified"],
  ["project", "assessment", "Cess assessment for the work file", "Shared work-file number PWD-WF-1001", "High", "verified"],
  ["assessment", "payment", "Collection against the assessment", "Shared assessment number LCA-077", "High", "verified"],
  ["payment", "treasury", "Challan presented to the treasury", "Shared challan LCR-077", "High", "verified"],
  ["worker", "membership", "Same person on the labour extract and the Board register", "Verified membership number KBM-4410", "High", "verified"],
  ["membership", "application", "Application filed by the member", "Verified membership number KBM-4410", "High", "verified"],
  ["application", "beneficiary", "Beneficiary named on the application", "Verified application number KBA-5601", "High", "verified"],
  ["establishment", "inspection", "Inspection of this establishment", "Shared establishment number LER-221", "High", "verified"],
  ["establishment-b", "project-b", "Possible same site", "Same district and a similar site description", "Low", "requires-verification"],
  ["factory-inspection", "establishment", "Possible same premises", "Similar establishment name only", "Low", "requires-verification"],
].map(([source, target, type, method, confidence, status], index) => ({
  id: `rel-${index + 1}`,
  source,
  target,
  relationshipType: type,
  matchingMethod: method,
  matchingConfidence: confidence,
  verificationStatus: status,
}))

const exceptions = [
  ["EX-2025-014", "Collected cess without a treasury challan", "PAY-2025-188", "Bengaluru Urban", "Labour Commissionerate, Treasury", "high", "requires-verification", "Treasury", "in-review", "2025-11-02", "Ask the treasury extract for challan LCR-188"],
  ["EX-2025-021", "Remitted challan without a credit entry", "TXN-2025-044", "Mysuru", "Treasury", "high", "unmatched", "Treasury", "awaiting-source", "2025-10-18", "Trace the credit entry. Do not treat this as a finding of wrongdoing."],
  ["EX-2025-033", "Project seen by PWD and Labour with no verified link", "PRJ-2025-1008", "Mysuru", "PWD, Labour Commissionerate", "medium", "requires-verification", "Labour Commissionerate", "new", "2025-11-06", "Compare the work-file number. A similar site description is not a match."],
  ["EX-2025-041", "Labour worker record without a verified KBOCW membership", "LWR-2281", "Belagavi", "Labour Commissionerate, KBOCW Board", "medium", "unmatched", "KBOCW Board", "new", "2025-09-14", "A labour record is not a Board membership. Check the membership number."],
  ["EX-2025-052", "Approved welfare application with no successful payment", "KBA-4412", "Tumakuru", "KBOCW Board", "high", "verified", "KBOCW Board", "in-review", "2025-11-09", "Confirm whether payment is still in process or was returned."],
  ["EX-2025-058", "Returned welfare payment", "TXN-W-7734", "Ballari", "KBOCW Board", "high", "verified", "KBOCW Board", "awaiting-source", "2025-10-29", "Keep the return separate from successful disbursement."],
  ["EX-2025-066", "Two beneficiary records may refer to one person", "KBB-104, KBB-331", "Dharwad", "KBOCW Board", "medium", "requires-verification", "KBOCW Board", "new", "2025-11-11", "This is a possible duplicate for review. It is not recorded as fraud."],
  ["EX-2025-074", "Factories inspection linked only by a similar name", "FID-018", "Dharwad", "Factories & Boilers, Labour Commissionerate", "low", "requires-verification", "Factories & Boilers", "new", "2025-08-22", "Do not treat the factory inspection as covering a construction site."],
  ["EX-2025-081", "Assessment without a collection receipt", "LCA-390", "Kalaburagi", "Labour Commissionerate", "medium", "unmatched", "Labour Commissionerate", "in-review", "2025-07-19", "Assessment and collection stay separate until a receipt is matched."],
  ["EX-2025-090", "BBMP permission without a cess assessment", "BBMP-PRM-552", "Bengaluru Urban", "BBMP / ULBs, Labour Commissionerate", "medium", "unmatched", "Labour Commissionerate", "new", "2025-11-01", "A building permission is not a cess assessment."],
  ["EX-2025-104", "Overdue labour inspection follow-up", "LID-303", "Bengaluru Urban", "Labour Commissionerate", "high", "verified", "Labour Commissionerate", "in-review", "2025-06-30", "Follow the labour inspection diary. This is not a factories case."],
  ["EX-2025-112", "Overdue factory corrective action", "FID-077", "Hassan", "Factories & Boilers", "high", "verified", "Factories & Boilers", "awaiting-source", "2025-05-16", "This action is on the factories list only."],
  ["EX-2025-120", "Welfare membership expired before the application", "KBM-902", "Raichur", "KBOCW Board", "low", "verified", "KBOCW Board", "closed", "2025-04-28", "Membership status and the application are both on the Board register."],
  ["EX-2025-128", "Treasury credit amount differs from the remitted challan", "TRY-210", "Vijayapura", "Treasury", "high", "requires-verification", "Treasury", "new", "2025-11-15", "Compare the two amounts. Do not replace one stage with the other."],
  ["EX-2025-136", "KBOCW worker with no labour-record link", "KBM-3004", "Mandya", "KBOCW Board, Labour Commissionerate", "low", "unmatched", "Labour Commissionerate", "new", "2025-10-02", "Board membership does not require a labour construction-worker record."],
  ["EX-2025-144", "Possible beneficiary overlap across two schemes", "KBB-019", "Bengaluru Urban", "KBOCW Board", "medium", "requires-verification", "KBOCW Board", "in-review", "2025-11-12", "A person in two schemes is not, by itself, a duplicate record."],
].map(([id, type, entity, district, sources, priority, matching, assigned, investigation, created, action]) => ({
  id,
  type,
  entity,
  district,
  districtId: slug(district),
  sources,
  sourceDepartmentIds: sources.split(", ").map((name) => departments.find((department) => department.name === name)?.id).filter(Boolean),
  priority,
  matching,
  assigned,
  investigation,
  created,
  action,
  notes: ["Illustrative note: this case was opened from the source records listed here."],
  audit: [{ at: created, text: "Exception opened from the illustrative extract." }],
}))

const cessReviews = [
  ["PRJ-2025-1008", "PWD", "Mysuru", "No assessment matched", "Requires verification"],
  ["PRJ-2025-2210", "BBMP / ULBs", "Bengaluru Urban", "Permission only", "Unmatched"],
  ["PRJ-2025-1844", "Labour Commissionerate", "Belagavi", "Assessment without a receipt", "Requires verification"],
  ["PRJ-2025-0902", "PWD", "Tumakuru", "Work file without a cess stage", "Unmatched"],
  ["PRJ-2025-3104", "Labour Commissionerate", "Kalaburagi", "Receipt without a treasury challan", "Requires verification"],
  ["PRJ-2025-2740", "Treasury", "Vijayapura", "Challan without a credit entry", "Requires verification"],
].map(([project, department, district, stage, status]) => ({ project, department, district, districtId: slug(district), stage, status }))

const payload = {
  meta: {
    source: "Illustrative cross-department extract",
    lastRefreshed: "18 Nov 2026, 09:30 IST",
    illustrativeNote: "Illustrative data. This demonstration is not connected to Karnataka Government systems. Worker and beneficiary names are masked.",
    stageNote: "Cess assessed, collected, remitted and credited are separate stages. They are not added together. A difference between two stages is a reconciliation item, not a combined balance.",
    jurisdictionNote: "Labour inspections and Factories & Boilers inspections cover different lists. A factory inspection is not treated as an inspection of every construction site.",
    boundaryNote: "District boundaries follow the Census 2011 outline. Vijayanagara is not drawn separately on this illustrative map.",
    matchNote: "A relationship is shown only where the extract records a matching method. Similar names or the same district are marked as requiring verification.",
  },
  years: YEARS,
  months: MONTHS,
  districts,
  departments,
  membership,
  rules: {
    identifiedProjects: 14860,
    approvedUnpaid: 110000,
    failedPayments: 8250,
    potentialDuplicates: 4860,
    otherWelfareExceptions: 5530,
    labourWithoutMembership: 1040000,
    kbocwWithoutLabourLink: 3040000,
  },
  metrics,
  entities,
  relationships,
  exceptions,
  cessReviews,
}
if (payload.rules.identifiedProjects !== HEADLINE.matchedProjects + HEADLINE.verificationProjects + HEADLINE.unmatchedProjects) throw new Error("project partition")
if (payload.rules.failedPayments + payload.rules.potentialDuplicates + payload.rules.otherWelfareExceptions !== HEADLINE.welfareExceptions) throw new Error("welfare exceptions")

const target = join(root, "src/data/intelligence.json")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(payload))
console.log(`Wrote ${target}`)
console.log("Intelligence checks passed")
