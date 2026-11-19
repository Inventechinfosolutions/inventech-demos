import secretary from "@/data/secretary-overview.json" with { type: "json" }
import { DEPARTMENTS, DISTRICTS, PROJECT_TYPES, SCHEMES } from "@/analytics/catalog"
import type { Row } from "@/analytics/types"

// Synthetic rows for the analytics extracts. Everything is generated from fixed seeds so the same
// numbers appear on every load. Personal references are masked at source.

type Rng = () => number

function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const between = (r: Rng, low: number, high: number) => low + r() * (high - low)
const int = (r: Rng, low: number, high: number) => Math.floor(between(r, low, high + 1))
const pick = <T,>(r: Rng, items: T[]) => items[Math.floor(r() * items.length)]

function weighted<T>(r: Rng, items: T[], weights: number[]): T {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let cursor = r() * total
  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index]
    if (cursor <= 0) return items[index]
  }
  return items[items.length - 1]
}

function normal(r: Rng, mean: number, deviation: number) {
  const u = Math.max(r(), 1e-9)
  const v = r()
  return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const lognormal = (r: Rng, median: number, sigma: number) => median * Math.exp(normal(r, 0, sigma))

const pad = (value: number, size = 2) => String(value).padStart(size, "0")
const iso = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`

export function financialYearOf(isoDate: string) {
  const year = Number(isoDate.slice(0, 4))
  const month = Number(isoDate.slice(5, 7))
  const start = month >= 4 ? year : year - 1
  return `${start}-${pad((start + 1) % 100)}`
}

const SEASON = [0.9, 0.85, 0.65, 0.6, 0.65, 0.8, 1, 1.05, 1, 1.15, 1.15, 1.2]
const YEAR_WEIGHT = [0.28, 0.33, 0.39]
const END = Date.UTC(2026, 2, 31)

function randomDate(r: Rng, yearWeights = YEAR_WEIGHT) {
  const yearIndex = weighted(r, [0, 1, 2], yearWeights)
  const monthIndex = weighted(r, SEASON.map((_, index) => index), SEASON)
  const calendarMonth = ((monthIndex + 3) % 12) + 1
  const calendarYear = 2023 + yearIndex + (calendarMonth < 4 ? 1 : 0)
  const maxDay = new Date(Date.UTC(calendarYear, calendarMonth, 0)).getUTCDate()
  return iso(calendarYear, calendarMonth, int(r, 1, maxDay))
}

function addDays(isoDate: string, days: number) {
  const time = Date.UTC(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)) - 1, Number(isoDate.slice(8, 10))) + days * 86400000
  const date = new Date(time)
  return { text: iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()), beyond: time > END }
}

const DISTRICT_WEIGHTS: Record<string, number> = {
  "bengaluru-urban": 14,
  belagavi: 5,
  mysuru: 5,
  tumakuru: 4,
  ballari: 3.5,
  "dakshina-kannada": 4,
  "bengaluru-rural": 3,
  kalaburagi: 3.5,
  vijayapura: 3,
  dharwad: 3.5,
  mandya: 3,
  hassan: 3,
  shivamogga: 3,
  davanagere: 3,
  raichur: 2.5,
  kolar: 2.5,
  bagalkote: 2.5,
  chitradurga: 2.5,
  udupi: 2.5,
  bidar: 2,
  chikkaballapura: 2,
  haveri: 2,
  "uttara-kannada": 2.5,
  ramanagara: 2.5,
  chikkamagaluru: 2,
  koppal: 2,
  chamarajanagara: 1.5,
  gadag: 1.5,
  yadgir: 1.5,
  kodagu: 1,
}

const districtNames = DISTRICTS.map((district) => district.name)
const districtWeights = DISTRICTS.map((district) => DISTRICT_WEIGHTS[district.id] ?? 2)
const pickDistrict = (r: Rng) => weighted(r, districtNames, districtWeights)
const pickTaluk = (r: Rng, district: string) => `${district} ${weighted(r, ["Headquarters", "North", "South"], [50, 30, 20])}`

// ---------------------------------------------------------------- shared pools

interface Contractor {
  id: string
  name: string
  district: string
  className: string
}

function contractorPool(): Contractor[] {
  const r = mulberry32(11)
  const first = ["Sri", "Nandi", "Cauvery", "Malnad", "Tunga", "Hoysala", "Vijaya", "Basava", "Kaveri", "Sahyadri", "Deccan", "Western Ghats"]
  const second = ["Constructions", "Infra", "Builders", "Engineers", "Associates", "Projects"]
  return Array.from({ length: 60 }, (_, index) => ({
    id: `CTR-${pad(index + 1, 4)}`,
    name: `${first[index % first.length]} ${second[Math.floor(index / first.length) % second.length]} ${pad(index + 1)}`,
    district: pickDistrict(r),
    className: weighted(r, ["Class A", "Class B", "Class C"], [18, 42, 40]),
  }))
}

const CONTRACTORS = contractorPool()

function contractorFor(r: Rng, district: string) {
  const local = CONTRACTORS.filter((item) => item.district === district)
  if (local.length > 0 && r() < 0.6) return pick(r, local)
  return pick(r, CONTRACTORS)
}

const TYPE_COST: Record<string, number> = {
  "Building works": 6e7,
  "Roads and bridges": 9e7,
  "Irrigation works": 1.8e8,
  "Industrial construction": 2.2e8,
  "Residential layouts": 8e7,
  "Public buildings": 7e7,
}

// ---------------------------------------------------------------- generators

function buildProjects(): Row[] {
  const r = mulberry32(101)
  const rows: Row[] = []
  for (let index = 0; index < 1800; index += 1) {
    const district = pickDistrict(r)
    const projectType = weighted(r, PROJECT_TYPES, [28, 24, 10, 12, 14, 12])
    const cost = Math.max(5e6, Math.round(lognormal(r, TYPE_COST[projectType], 0.8) / 1000) * 1000)
    const startDate = randomDate(r)
    const age = startDate < "2024-04-01" ? 0 : startDate < "2025-04-01" ? 1 : 2
    const status = weighted(r, ["Completed", "Ongoing", "Not started", "Suspended"], age === 0 ? [62, 28, 2, 8] : age === 1 ? [34, 52, 5, 9] : [8, 66, 20, 6])
    const contractor = contractorFor(r, district)
    rows.push({
      project_id: `PRJ-${pad(index + 1, 5)}`,
      district,
      taluk: pickTaluk(r, district),
      project_type: projectType,
      status,
      contractor: contractor.name,
      department: weighted(r, ["PWD", "BBMP / ULBs", "KBOCW Board", "Labour Commissionerate"], projectType === "Irrigation works" ? [90, 0, 4, 6] : [46, 34, 12, 8]),
      financial_year: financialYearOf(startDate),
      start_date: startDate,
      estimated_cost: cost,
      workers_deployed: Math.max(8, Math.round((cost / 1e6) * between(r, 0.7, 1.7)) + int(r, 4, 20)),
      cess_payable: Math.round(cost * 0.01),
    })
  }
  return rows
}

function buildAssessments(projects: Row[]): Row[] {
  const r = mulberry32(202)
  const rows: Row[] = []
  for (const project of projects) {
    if (project.status === "Not started" && r() < 0.75) continue
    if (r() < 0.1) continue
    const cost = project.estimated_cost as number
    const assessed = Math.round((cost * 0.01 * between(r, 0.97, 1.03)) / 10) * 10
    const after = addDays(project.start_date as string, int(r, 15, 70))
    if (after.beyond) continue
    const old = (project.start_date as string) < "2025-04-01"
    rows.push({
      assessment_id: `ASM-${pad(rows.length + 1, 5)}`,
      district: project.district,
      taluk: project.taluk,
      project_type: project.project_type,
      contractor: project.contractor,
      status: weighted(r, ["Collected", "Partially collected", "Assessed, not collected"], old ? [72, 18, 10] : [50, 24, 26]),
      financial_year: financialYearOf(after.text),
      assessment_date: after.text,
      cess_assessed: assessed,
      project_cost: cost,
    })
  }
  return rows
}

const AUTHORITIES = ["Labour office", "Urban local body", "PWD counter", "Treasury challan", "Board collection counter"]
const AUTHORITY_SHARE = [34, 22, 18, 16, 10]

function buildCollections(assessments: Row[]): Row[] {
  const r = mulberry32(303)
  const rows: Row[] = []
  for (const assessment of assessments) {
    if (assessment.status === "Assessed, not collected") continue
    const assessed = assessment.cess_assessed as number
    const full = assessment.status === "Collected"
    const total = full ? assessed * between(r, 0.985, 1) : assessed * between(r, 0.3, 0.8)
    const parts = full && r() < 0.3 ? 2 : 1
    for (let part = 0; part < parts; part += 1) {
      const after = addDays(assessment.assessment_date as string, int(r, 10, 75) + part * int(r, 10, 30))
      if (after.beyond) continue
      rows.push({
        collection_id: `COL-${pad(rows.length + 1, 5)}`,
        district: assessment.district,
        taluk: assessment.taluk,
        project_type: assessment.project_type,
        contractor: assessment.contractor,
        collecting_authority: weighted(r, AUTHORITIES, AUTHORITY_SHARE),
        payment_mode: weighted(r, ["Challan", "Online", "Demand draft"], [45, 40, 15]),
        status: weighted(r, ["Collected", "Awaiting remittance"], after.text > "2026-01-01" ? [45, 55] : [86, 14]),
        financial_year: financialYearOf(after.text),
        collection_date: after.text,
        cess_collected: Math.round((total / parts) / 10) * 10,
        delay_days: Math.max(0, Math.round(normal(r, 16, 20))),
      })
    }
  }
  return rows
}

function buildTreasury(): Row[] {
  const r = mulberry32(404)
  const rows: Row[] = []
  const departments = ["Labour Commissionerate", "BBMP / ULBs", "PWD", "Treasury", "KBOCW Board"]
  for (let index = 0; index < 900; index += 1) {
    const day = randomDate(r)
    const remitted = Math.round(lognormal(r, 2.5e7, 0.9) / 1000) * 1000
    const status = weighted(r, ["Credited", "In transit", "Reconciliation pending"], day > "2026-02-01" ? [58, 24, 18] : [84, 6, 10])
    const credited = status === "Credited" ? remitted : status === "In transit" ? 0 : Math.round((remitted * between(r, 0.7, 0.95)) / 1000) * 1000
    rows.push({
      txn_id: `TRS-${pad(index + 1, 5)}`,
      department: weighted(r, departments, AUTHORITY_SHARE),
      district: pickDistrict(r),
      status,
      financial_year: financialYearOf(day),
      txn_date: day,
      cess_remitted: remitted,
      cess_credited: credited,
    })
  }
  return rows
}

const SCHEME_WEIGHT = [20, 17, 20, 8, 10, 7, 10, 8]
const SCHEME_MEDIAN: Record<string, number> = {
  "Marriage assistance": 50000,
  "Medical assistance": 30000,
  "Education scholarship": 15000,
  "Maternity benefit": 20000,
  "Pension and family pension": 12000,
  "Housing support": 150000,
  "Accident relief": 200000,
  "Funeral assistance": 20000,
}

const masked = (prefix: string, number: number) => `${prefix}-••••${pad(number, 4)}`

function buildApplications(): Row[] {
  const r = mulberry32(505)
  const rows: Row[] = []
  for (let index = 0; index < 3000; index += 1) {
    const day = randomDate(r)
    const scheme = weighted(r, SCHEMES, SCHEME_WEIGHT)
    const district = pickDistrict(r)
    const requested = Math.max(5000, Math.round(lognormal(r, SCHEME_MEDIAN[scheme], 0.5) / 100) * 100)
    const status = weighted(r, ["Sanctioned", "Pending", "Returned"], day > "2026-01-15" ? [38, 54, 8] : day > "2025-04-01" ? [70, 22, 8] : [82, 10, 8])
    rows.push({
      application_id: `APP-${pad(index + 1, 5)}`,
      beneficiary_ref: masked("BEN", int(r, 1, 2000)),
      district,
      taluk: pickTaluk(r, district),
      scheme,
      status,
      financial_year: financialYearOf(day),
      application_date: day,
      amount_requested: requested,
      amount_sanctioned: status === "Sanctioned" ? Math.round((requested * between(r, 0.7, 1)) / 100) * 100 : 0,
      processing_days: status === "Pending" ? int(r, 4, 90) : Math.min(90, Math.max(3, Math.round(normal(r, 24, 12)))),
    })
  }
  return rows
}

const OCCUPATIONS = ["Mason", "Carpenter", "Painter", "Plumber", "Electrician", "Bar bender", "Helper", "Tile layer", "Welder", "Hoist operator"]
const AGE_BANDS: [string, number, number][] = [
  ["18 to 25", 18, 25],
  ["26 to 35", 26, 35],
  ["36 to 45", 36, 45],
  ["46 to 55", 46, 55],
  ["56 to 60", 56, 60],
]

function buildWorkers(): Row[] {
  const r = mulberry32(606)
  const rows: Row[] = []
  for (let index = 0; index < 2400; index += 1) {
    const day = randomDate(r)
    const district = pickDistrict(r)
    const band = weighted(r, AGE_BANDS, [20, 33, 27, 15, 5])
    rows.push({
      worker_ref: masked("WRK", index + 1),
      district,
      taluk: pickTaluk(r, district),
      occupation: weighted(r, OCCUPATIONS, [22, 14, 9, 7, 8, 9, 18, 5, 5, 3]),
      gender: weighted(r, ["Male", "Female", "Other"], [660, 332, 8]),
      age_band: band[0],
      status: weighted(r, ["Active", "Expired", "Renewal due"], [70, 18, 12]),
      financial_year: financialYearOf(day),
      registration_date: day,
      age: int(r, band[1], band[2]),
      dependents: Math.max(0, Math.round(normal(r, 2.4, 1.3))),
    })
  }
  return rows
}

function buildMemberships(): Row[] {
  const r = mulberry32(707)
  const rows: Row[] = []
  for (let index = 0; index < 1800; index += 1) {
    const day = randomDate(r, [0.4, 0.33, 0.27])
    const district = pickDistrict(r)
    const renewals = int(r, 0, day < "2024-04-01" ? 4 : day < "2025-04-01" ? 2 : 1)
    rows.push({
      membership_ref: masked("MBR", index + 1),
      district,
      taluk: pickTaluk(r, district),
      occupation: weighted(r, OCCUPATIONS, [22, 14, 9, 7, 8, 9, 18, 5, 5, 3]),
      status: weighted(r, ["Active", "Expired", "Renewal due"], [66, 20, 14]),
      financial_year: financialYearOf(day),
      membership_date: day,
      renewals_count: renewals,
      contribution_paid: 120 * (renewals + 1),
    })
  }
  return rows
}

function buildBeneficiaries(): Row[] {
  const r = mulberry32(808)
  const rows: Row[] = []
  for (let index = 0; index < 2000; index += 1) {
    const day = randomDate(r)
    const district = pickDistrict(r)
    const scheme = weighted(r, SCHEMES, SCHEME_WEIGHT)
    rows.push({
      beneficiary_ref: masked("BEN", index + 1),
      district,
      taluk: pickTaluk(r, district),
      scheme,
      gender: weighted(r, ["Male", "Female", "Other"], [610, 382, 8]),
      age_band: weighted(r, AGE_BANDS, [12, 28, 30, 22, 8])[0],
      occupation: weighted(r, OCCUPATIONS, [22, 14, 9, 7, 8, 9, 18, 5, 5, 3]),
      status: weighted(r, ["Receiving", "Completed", "Suspended"], [46, 49, 5]),
      financial_year: financialYearOf(day),
      benefit_start: day,
      amount_received: Math.max(3000, Math.round((lognormal(r, SCHEME_MEDIAN[scheme], 0.45) * between(r, 0.8, 1)) / 100) * 100),
      dependents: Math.max(0, Math.round(normal(r, 2.6, 1.3))),
      schemes_availed: weighted(r, [1, 2, 3, 4], [64, 24, 9, 3]),
    })
  }
  return rows
}

function buildInspections(): Row[] {
  const r = mulberry32(909)
  const rows: Row[] = []
  for (let index = 0; index < 1800; index += 1) {
    const day = randomDate(r)
    const district = pickDistrict(r)
    const status = weighted(r, ["No violation recorded", "Follow-up due", "Violation open"], [62, 20, 18])
    rows.push({
      inspection_id: `INS-${pad(index + 1, 5)}`,
      district,
      taluk: pickTaluk(r, district),
      department: weighted(r, ["Labour Commissionerate", "Factories & Boilers"], [80, 20]),
      inspection_type: weighted(r, ["Routine", "Complaint based", "Follow-up"], [58, 24, 18]),
      status,
      financial_year: financialYearOf(day),
      inspection_date: day,
      violations_found: status === "No violation recorded" ? 0 : int(r, 1, 6),
      pending_days: status === "No violation recorded" ? null : status === "Follow-up due" ? int(r, 3, 60) : int(r, 5, 180),
    })
  }
  return rows
}

function buildEstablishments(): Row[] {
  const r = mulberry32(1010)
  const categories = ["Building contractor", "Civil engineering firm", "Interior and finishing", "Material supplier", "Developer", "Government works agency"]
  const rows: Row[] = []
  for (let index = 0; index < 1200; index += 1) {
    const day = randomDate(r, [0.4, 0.33, 0.27])
    const district = pickDistrict(r)
    rows.push({
      establishment_id: `EST-${pad(index + 1, 5)}`,
      district,
      taluk: pickTaluk(r, district),
      category: weighted(r, categories, [32, 20, 14, 12, 14, 8]),
      status: weighted(r, ["Active", "Lapsed", "Renewal due"], [72, 16, 12]),
      financial_year: financialYearOf(day),
      registration_date: day,
      employees: Math.max(3, Math.round(lognormal(r, 25, 0.8))),
    })
  }
  return rows
}

function buildContractors(): Row[] {
  const r = mulberry32(1111)
  const rows: Row[] = []
  const years = ["2023-24", "2024-25", "2025-26"]
  for (const contractor of CONTRACTORS) {
    years.forEach((year, yearIndex) => {
      if (yearIndex > 0 && r() < 0.08) return
      const projects = int(r, 1, 25)
      rows.push({
        contractor_id: contractor.id,
        contractor: contractor.name,
        district: contractor.district,
        class: contractor.className,
        status: weighted(r, ["Active", "Under review", "Suspended"], [80, 14, 6]),
        financial_year: year,
        registered_date: iso(2018 + (CONTRACTORS.indexOf(contractor) % 5), int(r, 1, 12), int(r, 1, 28)),
        projects_executed: projects,
        workers_engaged: Math.round(projects * between(r, 8, 40)),
        cess_paid: Math.round(lognormal(r, 1.2e7 * (projects / 8), 0.5) / 1000) * 1000,
        compliance_rating: Number(Math.min(5, Math.max(1.5, normal(r, 3.7, 0.7))).toFixed(1)),
      })
    })
  }
  return rows
}

// ---------------------------------------------------------------- aggregated extracts from the Secretary figures

interface SecretaryMetrics {
  districts: { id: string; name: string }[]
  years: string[]
  metrics: Record<string, number[][][]>
  departments: { id: string; name: string; recordsByYear: number[] }[]
}

const source = secretary as unknown as SecretaryMetrics

function monthStart(yearIndex: number, monthIndex: number) {
  const calendarMonth = ((monthIndex + 3) % 12) + 1
  const calendarYear = 2023 + yearIndex + (calendarMonth < 4 ? 1 : 0)
  return iso(calendarYear, calendarMonth, 1)
}

function buildDistrictPerformance(): Row[] {
  const keys: [string, string][] = [
    ["projects", "projects"],
    ["workers", "workers_registered"],
    ["beneficiaries", "beneficiaries"],
    ["disbursement", "disbursement"],
    ["pendingApplications", "pending_applications"],
    ["applicationsSanctioned", "applications_sanctioned"],
    ["applicationsReturned", "applications_returned"],
    ["cessAssessed", "cess_assessed"],
    ["cessCollected", "cess_collected"],
    ["cessRemitted", "cess_remitted"],
    ["cessCredited", "cess_credited"],
  ]
  const rows: Row[] = []
  source.years.forEach((year, yearIndex) => {
    source.districts.forEach((district, districtIndex) => {
      for (let month = 0; month < 12; month += 1) {
        const row: Row = { district: district.name, financial_year: year, period: monthStart(yearIndex, month) }
        for (const [from, to] of keys) row[to] = source.metrics[from][yearIndex][districtIndex][month]
        rows.push(row)
      }
    })
  })
  return rows
}

function buildDepartmentPerformance(): Row[] {
  const r = mulberry32(1212)
  const cessShare: Record<string, number> = {
    "Labour Commissionerate": 0.34,
    "BBMP / ULBs": 0.22,
    PWD: 0.18,
    Treasury: 0.16,
    "KBOCW Board": 0.1,
    "Factories & Boilers": 0,
  }
  const projectShare: Record<string, number> = {
    "Labour Commissionerate": 0.3,
    "BBMP / ULBs": 0.3,
    PWD: 0.22,
    "Factories & Boilers": 0.18,
    "KBOCW Board": 0,
    Treasury: 0,
  }
  const baseDays: Record<string, number> = { "Labour Commissionerate": 18, "KBOCW Board": 24, "BBMP / ULBs": 31, PWD: 27, Treasury: 12, "Factories & Boilers": 20 }
  const recordsByDepartment: Record<string, number[]> = {
    "Labour Commissionerate": source.departments[0].recordsByYear,
    "KBOCW Board": source.departments[1].recordsByYear,
    "BBMP / ULBs": source.departments[2].recordsByYear,
    PWD: source.departments[3].recordsByYear,
    Treasury: source.departments[4].recordsByYear,
    "Factories & Boilers": source.departments[5].recordsByYear,
  }
  const sumMonth = (key: string, yearIndex: number, month: number) => source.metrics[key][yearIndex].reduce((total, district) => total + district[month], 0)
  const rows: Row[] = []
  source.years.forEach((year, yearIndex) => {
    const projectTotals = Array.from({ length: 12 }, (_, month) => sumMonth("projects", yearIndex, month))
    const projectYear = projectTotals.reduce((a, b) => a + b, 0)
    for (let month = 0; month < 12; month += 1) {
      for (const department of DEPARTMENTS) {
        const records = Math.round((recordsByDepartment[department][yearIndex] * projectTotals[month]) / projectYear)
        const closed = Math.round(records * between(r, 0.55, 0.7))
        rows.push({
          department,
          financial_year: year,
          period: monthStart(yearIndex, month),
          records_received: records,
          projects_active: Math.round(projectTotals[month] * projectShare[department]),
          cess_assessed: Math.round(sumMonth("cessAssessed", yearIndex, month) * cessShare[department]),
          cess_collected: Math.round(sumMonth("cessCollected", yearIndex, month) * cessShare[department]),
          cess_remitted: Math.round(sumMonth("cessRemitted", yearIndex, month) * cessShare[department]),
          cess_credited: Math.round(sumMonth("cessCredited", yearIndex, month) * cessShare[department]),
          cases_closed: closed,
          pending_cases: Math.round((records - closed) * between(r, 0.8, 1.1)),
          avg_processing_days: Number((baseDays[department] * (1 - yearIndex * 0.04) + between(r, -2.5, 2.5)).toFixed(1)),
        })
      }
    }
  })
  return rows
}

// ---------------------------------------------------------------- registry

type Builder = () => Row[]
const cache = new Map<string, Row[]>()

let projectCache: Row[] | null = null
let assessmentCache: Row[] | null = null

const projects = () => (projectCache ??= buildProjects())
const assessments = () => (assessmentCache ??= buildAssessments(projects()))

const builders: Record<string, Builder> = {
  construction_projects: projects,
  establishments: buildEstablishments,
  contractors: buildContractors,
  worker_registrations: buildWorkers,
  kbocw_memberships: buildMemberships,
  cess_assessments: assessments,
  cess_collections: () => buildCollections(assessments()),
  treasury_transactions: buildTreasury,
  welfare_applications: buildApplications,
  beneficiaries: buildBeneficiaries,
  inspections: buildInspections,
  department_performance: buildDepartmentPerformance,
  district_performance: buildDistrictPerformance,
}

export function getRows(datasetId: string): Row[] {
  const cached = cache.get(datasetId)
  if (cached) return cached
  const build = builders[datasetId]
  const rows = build ? build() : []
  cache.set(datasetId, rows)
  return rows
}
