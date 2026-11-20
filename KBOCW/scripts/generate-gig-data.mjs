// Synthetic POC data for the Karnataka Platform-Based Gig Workers Welfare Board Executive Overview.
// Everything here is fictional and generated from fixed seeds, so the file is the same every time.
//
// Model: worker "cohorts". Each cohort row stands for `w` workers who share a district, gender, age
// group, platform set and registration month. Unique workers, platform-worker engagements and source
// records are all derived from the same rows at run time, so they cannot drift apart.
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20251001)
const int = (low, high) => low + Math.floor(rand() * (high - low + 1))
const chance = (p) => rand() < p
const noise = (spread) => (rand() * 2 - 1) * spread
function pick(weights) {
  const total = weights.reduce((sum, value) => sum + value, 0)
  let cursor = rand() * total
  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index]
    if (cursor < 0) return index
  }
  return weights.length - 1
}
const clamp = (value, low, high) => Math.min(high, Math.max(low, value))
const pad = (value) => String(value).padStart(2, "0")

// ---- Calendar: twelve months, October 2025 to September 2026 ---------------------------------
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DATA_START = Date.UTC(2025, 9, 1)
const months = Array.from({ length: 12 }, (_, index) => {
  const first = new Date(Date.UTC(2025, 9 + index, 1))
  const next = new Date(Date.UTC(2025, 10 + index, 1))
  const year = first.getUTCFullYear()
  const month = first.getUTCMonth()
  const startDay = Math.round((first.getTime() - DATA_START) / 86400000)
  const days = Math.round((next.getTime() - first.getTime()) / 86400000)
  const fyStart = month >= 3 ? year : year - 1
  return {
    index,
    label: `${MONTH_NAMES[month]} ${year}`,
    short: `${MONTH_NAMES[month]} ${String(year).slice(2)}`,
    year,
    month,
    startDay,
    days,
    financialYear: `${fyStart}-${String(fyStart + 1).slice(2)}`,
    quarter: Math.floor(index / 3),
  }
})
const isoDay = (offset) => new Date(DATA_START + offset * 86400000).toISOString().slice(0, 10)
const TOTAL_DAYS = months[11].startDay + months[11].days

const quarters = [
  { index: 0, label: "Q3 FY 2025-26", short: "Q3 FY26", financialYear: "2025-26", from: "2025-10-01", to: "2025-12-31", due: "2026-01-30" },
  { index: 1, label: "Q4 FY 2025-26", short: "Q4 FY26", financialYear: "2025-26", from: "2026-01-01", to: "2026-03-31", due: "2026-04-30" },
  { index: 2, label: "Q1 FY 2026-27", short: "Q1 FY27", financialYear: "2026-27", from: "2026-04-01", to: "2026-06-30", due: "2026-07-30" },
  { index: 3, label: "Q2 FY 2026-27", short: "Q2 FY27", financialYear: "2026-27", from: "2026-07-01", to: "2026-09-30", due: "2026-10-30" },
]

// ---- Masters ---------------------------------------------------------------------------------
const districtRows = [
  ["bengaluru-urban", "Bengaluru Urban", 28], ["belagavi", "Belagavi", 5], ["mysuru", "Mysuru", 6], ["tumakuru", "Tumakuru", 3.6],
  ["ballari", "Ballari", 3], ["dakshina-kannada", "Dakshina Kannada", 5.5], ["bengaluru-rural", "Bengaluru Rural", 3.4],
  ["kalaburagi", "Kalaburagi", 4], ["vijayapura", "Vijayapura", 2.4], ["dharwad", "Dharwad", 4.8], ["mandya", "Mandya", 2],
  ["hassan", "Hassan", 2.2], ["shivamogga", "Shivamogga", 2.7], ["davanagere", "Davanagere", 2.8], ["raichur", "Raichur", 2],
  ["kolar", "Kolar", 2], ["bagalkote", "Bagalkote", 1.8], ["chitradurga", "Chitradurga", 1.5], ["udupi", "Udupi", 2.6],
  ["bidar", "Bidar", 1.6], ["chikkaballapura", "Chikkaballapura", 1.3], ["haveri", "Haveri", 1.3], ["uttara-kannada", "Uttara Kannada", 1.6],
  ["ramanagara", "Ramanagara", 1.5], ["chikkamagaluru", "Chikkamagaluru", 1.2], ["koppal", "Koppal", 1.1],
  ["chamarajanagara", "Chamarajanagara", 0.8], ["gadag", "Gadag", 1], ["yadgir", "Yadgir", 0.8], ["kodagu", "Kodagu", 0.7],
  ["vijayanagara", "Vijayanagara", 1.2],
]
const districts = districtRows.map(([id, name]) => ({ id, name, drawn: id !== "vijayanagara" }))
const districtWeights = districtRows.map((row) => row[2])
const districtIndex = Object.fromEntries(districts.map((district, index) => [district.id, index]))

const cities = [
  { id: "bengaluru", name: "Bengaluru", districtId: "bengaluru-urban", share: 0.93 },
  { id: "mysuru", name: "Mysuru", districtId: "mysuru", share: 0.7 },
  { id: "mangaluru", name: "Mangaluru", districtId: "dakshina-kannada", share: 0.72 },
  { id: "hubballi-dharwad", name: "Hubballi–Dharwad", districtId: "dharwad", share: 0.72 },
  { id: "belagavi", name: "Belagavi", districtId: "belagavi", share: 0.62 },
  { id: "kalaburagi", name: "Kalaburagi", districtId: "kalaburagi", share: 0.66 },
  { id: "ballari", name: "Ballari", districtId: "ballari", share: 0.6 },
  { id: "shivamogga", name: "Shivamogga", districtId: "shivamogga", share: 0.6 },
  { id: "tumakuru", name: "Tumakuru", districtId: "tumakuru", share: 0.5 },
  { id: "davanagere", name: "Davanagere", districtId: "davanagere", share: 0.62 },
  { id: "udupi", name: "Udupi", districtId: "udupi", share: 0.58 },
  { id: "vijayapura", name: "Vijayapura", districtId: "vijayapura", share: 0.55 },
]
const cityOfDistrict = districts.map((district) => cities.findIndex((city) => city.districtId === district.id))

// Sector taxonomy follows the specification. It is configurable master data, not a notified list.
const sectors = [
  { id: "food-grocery", name: "Food and grocery delivery", female: 0.14, base: 11500, ticket: 78, rate: 1.0 },
  { id: "ride-2w", name: "Ride-hailing, two-wheelers", female: 0.06, base: 13800, ticket: 92, rate: 1.25 },
  { id: "ride-3w", name: "Ride-hailing, three-wheelers", female: 0.03, base: 15200, ticket: 105, rate: 1.25 },
  { id: "ride-4w", name: "Ride-hailing, four-wheelers", female: 0.04, base: 21500, ticket: 210, rate: 1.5 },
  { id: "logistics", name: "Logistics", female: 0.12, base: 14200, ticket: 140, rate: 1.0 },
  { id: "prof-home", name: "Professional and home services", female: 0.46, base: 12600, ticket: 520, rate: 1.5 },
  { id: "healthcare", name: "Healthcare", female: 0.52, base: 16800, ticket: 640, rate: 1.5 },
  { id: "travel", name: "Travel and hospitality", female: 0.18, base: 13400, ticket: 380, rate: 1.25 },
  { id: "content", name: "Content and media services", female: 0.38, base: 11000, ticket: 900, rate: 1.75 },
  { id: "marketplace", name: "B2B and B2C marketplaces", female: 0.25, base: 10200, ticket: 260, rate: 1.0 },
  { id: "warehousing", name: "Warehousing", female: 0.22, base: 12000, ticket: 450, rate: 1.0 },
  { id: "other", name: "Other notified categories", female: 0.2, base: 9800, ticket: 300, rate: 1.25 },
]
const sectorIndex = Object.fromEntries(sectors.map((sector, index) => [sector.id, index]))

// Synthetic platform names. Real names are used only after the Board approves them for demonstration.
// start = first month with data, ret = quarterly return status for each quarter:
// 0 filed on time, 1 filed late, 2 overdue, 3 not yet due, 4 no data in the quarter.
const aggregatorRows = [
  ["A", "food-grocery", 0, 17, 0.03, 0.012, 0.995, 0.995, 1, [0, 0, 0, 3]],
  ["B", "food-grocery", 0, 15, 0.04, 0.018, 0.985, 0.99, 1, [0, 1, 0, 3]],
  ["C", "ride-2w", 0, 11, 0.025, 0.01, 0.998, 0.998, 1, [0, 0, 0, 0]],
  ["D", "ride-4w", 1, 8, 0.03, 0.014, 0.99, 0.995, 1, [0, 0, 1, 3]],
  ["E", "ride-3w", 3, 3, 0.05, 0.026, 0.97, 0.98, 1, [4, 0, 0, 3]],
  ["F", "logistics", 0, 9, 0.035, 0.015, 0.97, 0.97, 1, [0, 2, 0, 3]],
  ["G", "logistics", 1, 7, 0.04, 0.02, 0.94, 0.96, 0.9, [0, 0, 0, 3]],
  ["H", "prof-home", 1, 6, 0.05, 0.022, 1.0, 1.04, 0.97, [1, 1, 0, 3]],
  ["I", "healthcare", 4, 2, 0.02, 0.008, 0.998, 0.998, 1, [4, 0, 0, 3]],
  ["J", "travel", 3, 3, 0.06, 0.03, 0.96, 0.97, 1, [4, 0, 0, 0]],
  ["K", "content", 3, 3, 0.05, 0.028, 0.9, 0.93, 0.9, [4, 1, 0, 3]],
  ["L", "marketplace", 2, 7, 0.045, 0.02, 0.99, 0.99, 1, [0, 0, 2, 3]],
  ["M", "warehousing", 2, 4, 0.04, 0.02, 0.985, 0.99, 1, [0, 0, 0, 3]],
  ["N", "other", 4, 5, 0.05, 0.03, 0.97, 0.985, 1, [4, 1, 0, 3]],
  ["O", "travel", 99, 0, 0.04, 0.02, 1, 1, 1, [4, 4, 4, 4]],
  ["P", "content", 99, 0, 0.04, 0.02, 1, 1, 1, [4, 4, 4, 4]],
]
const aggregators = aggregatorRows.map(([letter, sector, start, share, dup, validation, decl, dep, rec, returns]) => ({
  id: `platform-${letter.toLowerCase()}`,
  name: `Platform ${letter}`,
  sectorId: sector,
  sectorIndex: sectorIndex[sector],
  start,
  reporting: start < 99,
  share,
  dupRate: dup,
  validationRate: validation,
  declBase: decl,
  depBase: dep,
  recBase: rec,
  returns,
}))
const REPORTING = aggregators.filter((aggregator) => aggregator.reporting).length

const genders = [{ id: "female", name: "Female" }, { id: "male", name: "Male" }, { id: "other", name: "Other or not stated" }]
const ageGroups = [
  { id: "18-24", name: "18 to 24" },
  { id: "25-34", name: "25 to 34" },
  { id: "35-44", name: "35 to 44" },
  { id: "45+", name: "45 and above" },
]
const grievanceCategories = [
  { id: "payout", name: "Payout or payment dispute", weight: 27 },
  { id: "deactivation", name: "Account deactivation or blocking", weight: 22 },
  { id: "fee-query", name: "Welfare fee deduction query", weight: 12 },
  { id: "registration", name: "Registration or identity issue", weight: 14 },
  { id: "conditions", name: "Working conditions or safety", weight: 9 },
  { id: "benefit", name: "Benefit application or disbursement", weight: 11 },
  { id: "other", name: "Other", weight: 5 },
]
const accidentTypes = [
  { id: "road", name: "Road traffic accident", weight: 52 },
  { id: "fall", name: "Fall or slip", weight: 14 },
  { id: "handling", name: "Injury while handling goods", weight: 12 },
  { id: "assault", name: "Assault or harassment", weight: 8 },
  { id: "weather", name: "Heat or weather related", weight: 9 },
  { id: "other", name: "Other", weight: 5 },
]
// Scheme status is POC master data. It is not a statement about which benefits are notified today.
const schemes = [
  { id: "life-insurance", name: "Life insurance", operational: false },
  { id: "accidental", name: "Accidental benefit", operational: true, min: 25000, max: 90000 },
  { id: "disablement", name: "Disablement benefit", operational: false },
  { id: "medical", name: "Medical benefit", operational: true, min: 6000, max: 28000 },
  { id: "maternity", name: "Maternity benefit", operational: true, min: 18000, max: 50000 },
  { id: "old-age", name: "Old-age and pension protection", operational: false },
  { id: "other-benefit", name: "Other notified benefits", operational: false },
]
const schemeIndex = Object.fromEntries(schemes.map((scheme, index) => [scheme.id, index]))

// ---- Worker cohorts --------------------------------------------------------------------------
const N = 7000
const RAMP = [13, 14, 14, 12, 10, 9, 7, 6, 5, 4, 3, 3]
const LAG = [30, 35, 20, 10, 5]
const reportingAggregators = aggregators.filter((aggregator) => aggregator.reporting)
const metroOnly = new Set(["platform-c", "platform-d", "platform-h", "platform-i", "platform-j", "platform-k", "platform-m"])

const workers = []
const stockByMonth = Array(12).fill(0)
for (let i = 0; i < N; i += 1) {
  const d = pick(districtWeights)
  const cityIndex = cityOfDistrict[d]
  const urban = cityIndex >= 0 && chance(cities[cityIndex].share) ? 1 : 0
  const metro = urban === 1 || d === districtIndex["bengaluru-urban"] || d === districtIndex["bengaluru-rural"]
  const primaryWeights = reportingAggregators.map((aggregator) => aggregator.share * (metroOnly.has(aggregator.id) && !metro ? 0.35 : 1))
  const p1 = aggregators.indexOf(reportingAggregators[pick(primaryWeights)])
  const sector = sectors[aggregators[p1].sectorIndex]
  const g = chance(0.008) ? 2 : chance(sector.female) ? 0 : 1
  const a = pick(sector.id === "ride-4w" || sector.id === "healthcare" ? [0.1, 0.38, 0.3, 0.22] : [0.24, 0.41, 0.22, 0.13])
  const w = int(70, 118)
  const startMonth = aggregators[p1].start
  const rampWeights = RAMP.map((value, index) => (index >= startMonth ? value : 0))
  const rm = pick(rampWeights)
  let bm = rm + pick(LAG)
  if (bm > 11 || chance(0.05)) bm = 99
  let sm = 99
  if (bm <= 10 && chance(0.03)) sm = int(bm + 1, 11)
  const k = 1 + pick([72, 22, 6])
  const platforms = [p1]
  while (platforms.length < k) {
    const candidates = reportingAggregators.filter((aggregator) => aggregator.start <= rm && !platforms.includes(aggregators.indexOf(aggregator)))
    if (candidates.length === 0) break
    const weights = candidates.map((aggregator) => aggregator.share * (aggregator.sectorIndex === aggregators[p1].sectorIndex ? 2.2 : 1) * (metroOnly.has(aggregator.id) && !metro ? 0.35 : 1))
    platforms.push(aggregators.indexOf(candidates[pick(weights)]))
  }
  const lv = pick([12, 26, 32, 20, 10])
  let mask = 0
  if (bm <= 11) {
    let active = chance(0.6)
    for (let t = bm; t < Math.min(12, sm); t += 1) {
      if (t > bm) active = chance(active ? 0.82 : 0.18)
      if (active) mask |= 1 << t
    }
  }
  workers.push([d, urban, g, a, w, rm, bm, sm, lv, mask, platforms[0], platforms[1] ?? -1, platforms[2] ?? -1])
  if (bm <= 11) for (let t = bm; t < Math.min(12, sm); t += 1) stockByMonth[t] += w
}

const registered = workers.map((row, index) => ({ row, index })).filter(({ row }) => row[6] <= 11)
const platformsOf = (row) => [row[10], row[11], row[12]].filter((value) => value >= 0)

// ---- Scheme applications ---------------------------------------------------------------------
function statusForAge(age) {
  // 1 scrutiny, 2 rejected, 3 approved awaiting payment, 4 payment processing, 5 disbursed, 6 failed or returned
  const settled = clamp(age / 5, 0, 1)
  const weights = [
    2 + (1 - settled) * 33,
    7 + (1 - settled) * 2,
    3 + (1 - settled) * 14,
    2 + (1 - settled) * 16,
    74 - (1 - settled) * 54,
    7 - (1 - settled) * 5,
  ]
  return 1 + pick(weights)
}
const applications = []
const seenApplications = new Set()
const applicationTarget = 4800
let guard = 0
while (applications.length < applicationTarget && guard < applicationTarget * 20) {
  guard += 1
  const { row, index } = registered[int(0, registered.length - 1)]
  const first = Math.max(row[6], 1)
  if (first > 11) continue
  const month = first + pick(Array.from({ length: 12 - first }, (_, offset) => 1 + offset * 0.4))
  const scheme = row[2] === 0 ? pick([0, 20, 0, 55, 25].map((value, position) => (position === 1 || position === 3 || position === 4 ? value : 0))) : pick([0, 20, 0, 55, 0].map((value, position) => (position === 1 || position === 3 ? value : 0)))
  const key = `${index}:${scheme}`
  if (seenApplications.has(key)) continue
  seenApplications.add(key)
  const def = schemes[scheme]
  const amount = Math.round((def.min + (def.max - def.min) * rand() ** 1.6) / 500) * 500
  applications.push([index, scheme, month, statusForAge(11 - month), amount])
}
applications.sort((left, right) => left[2] - right[2] || left[0] - right[0])

// ---- Grievances and appeals ------------------------------------------------------------------
const grievances = []
const grievanceTarget = 3400
const monthWeightsForEvents = stockByMonth.map((value, index) => value * (0.6 + 0.4 * (index / 11)))
guard = 0
while (grievances.length < grievanceTarget && guard < grievanceTarget * 20) {
  guard += 1
  const { row, index } = registered[int(0, registered.length - 1)]
  const month = pick(monthWeightsForEvents)
  if (month < row[6]) continue
  const day = months[month].startDay + int(0, months[month].days - 1)
  const platformList = platformsOf(row)
  const platform = platformList[int(0, platformList.length - 1)]
  const category = pick(grievanceCategories.map((item) => item.weight))
  const age = TOTAL_DAYS - day
  let resolveDays = 0
  let status = 1
  const unresolvedChance = age > 60 ? 0.04 : age > 30 ? 0.12 : age > 14 ? 0.35 : 0.7
  if (!chance(unresolvedChance)) {
    resolveDays = int(3, 38)
    if (day + resolveDays >= TOTAL_DAYS) resolveDays = 0
  }
  if (resolveDays > 0) status = 0
  else if (age > 30 && chance(0.28)) status = 2
  let appeal = 0
  if (status === 0 && chance(0.06)) appeal = chance(0.55) ? 2 : 1
  grievances.push([index, platform, category, day, resolveDays, status, appeal])
}
grievances.sort((left, right) => left[3] - right[3])

// ---- Accidents and claims --------------------------------------------------------------------
const accidents = []
const accidentTarget = 720
const activeWorkers = registered.filter(({ row }) => row[9] !== 0)
guard = 0
while (accidents.length < accidentTarget && guard < accidentTarget * 30) {
  guard += 1
  const { row, index } = activeWorkers[int(0, activeWorkers.length - 1)]
  const monthChoices = []
  for (let t = 0; t < 12; t += 1) if (row[9] & (1 << t)) monthChoices.push(t)
  const month = monthChoices[int(0, monthChoices.length - 1)]
  const day = months[month].startDay + int(0, months[month].days - 1)
  const platformList = platformsOf(row)
  const platform = platformList[int(0, platformList.length - 1)]
  const fatal = chance(0.035) ? 1 : 0
  const type = pick(accidentTypes.map((item) => item.weight))
  const age = TOTAL_DAYS - day
  let claim = 0
  if (chance(fatal ? 0.92 : 0.56)) claim = chance(clamp(age / 120, 0.1, 0.78)) ? 2 : 1
  accidents.push([index, platform, day, fatal, type, claim])
}
accidents.sort((left, right) => left[2] - right[2])

// Safety training participants reported by each district. Some district months are not reported.
const trainings = districts.map((_, d) => months.map((_, t) => (t < 2 || chance(0.35) ? 0 : Math.round((districtWeights[d] * 6 + int(10, 70)) / 5) * 5)))

// ---- Aggregator reporting: ratios, statuses and receipt times --------------------------------
const ratios = aggregators.map((aggregator) => {
  const decl = []
  const dep = []
  const rec = []
  const recStatus = []
  const received = []
  for (let t = 0; t < 12; t += 1) {
    const quarter = months[t].quarter
    const active = aggregator.reporting && t >= aggregator.start
    const overdue = aggregator.returns[quarter] === 2
    const declRatio = !active || overdue ? 0 : clamp(aggregator.declBase + noise(0.004), 0, 1)
    const depRatio = !active || overdue ? 0 : aggregator.depBase + noise(0.003)
    let recRatio = aggregator.recBase < 1 ? clamp(aggregator.recBase + noise(0.02), 0.5, 0.99) : 1
    if (t === 9) recRatio = clamp(0.95 + noise(0.04), 0.5, 0.99)
    if (t === 10) recRatio = clamp(0.72 + noise(0.12), 0.1, 0.95)
    if (t === 11) recRatio = clamp(0.35 + noise(0.18), 0, 0.7)
    decl.push(Number(declRatio.toFixed(4)))
    dep.push(Number(depRatio.toFixed(4)))
    rec.push(Number(recRatio.toFixed(4)))
    // 0 pending, 1 partly reconciled, 2 fully reconciled, 3 nothing deposited to reconcile
    recStatus.push(!active || declRatio === 0 ? 3 : recRatio >= 0.9995 ? 2 : recRatio >= 0.05 ? 1 : 0)
    const nextMonth = new Date(Date.UTC(months[t].year, months[t].month + 1, int(3, 8), int(10, 17), int(0, 59)))
    received.push(active ? nextMonth.toISOString().slice(0, 16) : null)
  }
  const submitted = aggregator.returns.map((status, quarter) => {
    if (status === 4 || status === 2) return null
    const due = Date.parse(`${quarters[quarter].due}T00:00:00Z`)
    if (status === 0) return new Date(due - int(1, 9) * 86400000).toISOString().slice(0, 10)
    if (status === 1) return new Date(due + int(3, 21) * 86400000).toISOString().slice(0, 10)
    return null
  })
  // The "not yet due" quarter: a few platforms have already filed early.
  if (aggregator.returns[3] === 0) submitted[3] = `2026-10-0${int(1, 5)}`
  return { decl, dep, rec, recStatus, received, submitted }
})

// ---- Welfare fund ledger inputs (everything not derived from fees or benefits) ---------------
const fundMonthly = months.map((month) => ({
  stateGrant: month.index === 2 ? 120000000 : month.index === 8 ? 100000000 : 0,
  centralGrant: 0,
  donations: Math.round((400000 + rand() * 800000) / 10000) * 10000,
  otherReceipts: Math.round((600000 + rand() * 500000) / 10000) * 10000,
  admin: Math.round((2500000 + rand() * 1700000) / 10000) * 10000,
  programme: Math.round((800000 + rand() * 2700000) / 10000) * 10000,
  otherExpenditure: chance(0.3) ? Math.round((500000 + rand() * 400000) / 10000) * 10000 : 0,
  otherAdjustment: chance(0.18) ? (chance(0.5) ? 1 : -1) * Math.round((100000 + rand() * 200000) / 10000) * 10000 : 0,
}))

const sources = [
  { id: "worker-registry", name: "Board worker registration database", updated: "2026-10-05T09:30", cadenceDays: 2 },
  { id: "aggregator-submissions", name: "Aggregator worker submissions", updated: "2026-10-05T07:10", cadenceDays: 2 },
  { id: "aggregator-registry", name: "Aggregator registration records", updated: "2026-10-01T11:00", cadenceDays: 7 },
  { id: "pwfvs", name: "PWFVS payout transaction records", updated: "2026-10-04T23:45", cadenceDays: 2 },
  { id: "fee-ledger", name: "Welfare fee declarations and deposits", updated: "2026-10-03T16:20", cadenceDays: 5 },
  { id: "bank-reconciliation", name: "Treasury and bank reconciliation data", updated: "2026-09-21T18:00", cadenceDays: 7 },
  { id: "fund-ledger", name: "Welfare fund accounting records", updated: "2026-09-30T20:00", cadenceDays: 10 },
  { id: "scheme-applications", name: "Welfare scheme application records", updated: "2026-10-05T08:40", cadenceDays: 2 },
  { id: "payment-gateway", name: "Benefit disbursement and payment gateway records", updated: "2026-10-05T08:45", cadenceDays: 2 },
  { id: "grievances", name: "Grievance and appeal records", updated: "2026-10-05T10:05", cadenceDays: 3 },
  { id: "safety", name: "Accident, safety and insurance claim records", updated: "2026-10-02T14:30", cadenceDays: 7 },
  { id: "training", name: "Safety training records", updated: "2026-09-28T12:00", cadenceDays: 14 },
]

const payload = {
  meta: {
    illustrative: true,
    title: "Karnataka Platform-Based Gig Workers Welfare Board",
    source: "Illustrative Gig Workers Welfare Board extract",
    reportingDate: "2026-10-06",
    lastRefreshed: "6 Oct 2026, 09:30 IST",
    illustrativeNote: "Illustrative POC data. Every figure on this page is fictional and is not a Board figure.",
    boundaryNote: "District boundaries follow the Census 2011 outline. Vijayanagara is not drawn separately on this illustrative map. Its figures are listed under the map and included in every total.",
    locationNote: "District shows the operating district reported at registration. It does not show where a worker lives or works on a given day.",
    activityRuleNote: "POC placeholder, not a Board-approved rule: a worker is active in a month when a payout was reported for that month. The rule and its effective date are configuration.",
    feeNote: "Welfare fee rates in this POC are placeholders set for each sector with an effective date. They are not notified rates.",
    schemeNote: "Scheme status in this POC is sample master data. It does not state which benefits are notified or open for applications.",
    benchmark: {
      text: "The New Indian Express reported on 29 April 2026 that 23 aggregators had provided data covering 12.19 lakh gig worker records. Workers may be associated with more than one platform, so this is a count of records and not of unique workers.",
      source: "The New Indian Express",
      date: "29 April 2026",
      url: "https://www.newindianexpress.com/states/karnataka/2026/Apr/29/karnataka-plans-social-security-net-for-gig-workers-eyes-pension-and-maternity-aid",
    },
  },
  dataStart: isoDay(0),
  dataEnd: isoDay(TOTAL_DAYS - 1),
  totalDays: TOTAL_DAYS,
  months,
  quarters,
  financialYears: [
    { id: "2025-26", label: "FY 2025-26 (Oct 2025 to Mar 2026)", from: "2025-10-01", to: "2026-03-31" },
    { id: "2026-27", label: "FY 2026-27 (Apr to Sep 2026)", from: "2026-04-01", to: "2026-09-30" },
  ],
  districts,
  cities,
  sectors: sectors.map(({ id, name }) => ({ id, name })),
  aggregators: aggregators.map(({ id, name, sectorId, start, reporting, dupRate, validationRate, returns }) => ({
    id,
    name,
    sectorId,
    start,
    reporting,
    dupRate,
    validationRate,
    returns,
  })),
  genders,
  ageGroups,
  grievanceCategories: grievanceCategories.map(({ id, name }) => ({ id, name })),
  accidentTypes: accidentTypes.map(({ id, name }) => ({ id, name })),
  schemes,
  config: {
    // Monthly payout for one worker on one platform, before the level and season factors.
    sectorBase: sectors.map((sector) => sector.base),
    sectorTicket: sectors.map((sector) => sector.ticket),
    levelFactor: [0.55, 0.8, 1, 1.25, 1.6],
    seasonFactor: [1.08, 1.12, 1.1, 0.96, 0.94, 1, 0.97, 0.98, 0.93, 0.92, 0.97, 1.02],
    platformShare: [1, 0.62, 0.48],
    feeRates: sectors.map((sector) => ({ sectorId: sector.id, ratePct: sector.rate, effectiveFrom: "2025-10-01" })),
    returnWindowDays: 30,
    grievanceTargetDays: 30,
    claimTargetDays: 45,
    exceptionRules: {
      shortfallShare: 0.03,
      highShortfallRupees: 5000000,
      highRecordCount: 2500,
      validationShare: 0.02,
    },
  },
  fund: {
    openingBalance: 32000000,
    monthly: fundMonthly,
  },
  returns: ratios.map((entry, index) => ({
    aggregatorId: aggregators[index].id,
    submitted: entry.submitted,
    decl: entry.decl,
    dep: entry.dep,
    rec: entry.rec,
    recStatus: entry.recStatus,
    received: entry.received,
  })),
  sources,
  workers: {
    fields: ["district", "urban", "gender", "age", "weight", "recordMonth", "boardMonth", "separatedMonth", "level", "activeMask", "platform1", "platform2", "platform3"],
    rows: workers,
  },
  applications: { fields: ["worker", "scheme", "month", "status", "amount"], rows: applications },
  grievances: { fields: ["worker", "platform", "category", "day", "resolveDays", "status", "appeal"], rows: grievances },
  accidents: { fields: ["worker", "platform", "day", "fatal", "type", "claim"], rows: accidents },
  trainings,
}

const target = join(root, "src/data/gig-workers.json")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(payload))

// ---- Quick checks printed for the author -----------------------------------------------------
const weightSum = (rows) => rows.reduce((sum, row) => sum + row[4], 0)
const boardIssued = workers.filter((row) => row[6] <= 11)
console.log(`Wrote ${target}`)
console.log(`Cohorts: ${workers.length}. Workers with records: ${weightSum(workers).toLocaleString("en-IN")}. Board-registered ever: ${weightSum(boardIssued).toLocaleString("en-IN")}.`)
console.log(`Registered stock by month: ${stockByMonth.map((value) => value.toLocaleString("en-IN")).join(", ")}`)
console.log(`Reporting aggregators: ${REPORTING} of ${aggregators.length}. Applications: ${applications.length}. Grievances: ${grievances.length}. Accidents: ${accidents.length}.`)
