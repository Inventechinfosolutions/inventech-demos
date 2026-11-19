import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const CRORE = 10_000_000
const cr = (value) => value * CRORE

const YEARS = ["2023-24", "2024-25", "2025-26"]
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((label, index) => ({ index, label }))
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
  ["marriage", "Marriage assistance", 180, 320000],
  ["medical", "Medical assistance", 260, 640000],
  ["education", "Education assistance", 210, 510000],
  ["maternity", "Maternity assistance", 95, 220000],
  ["pension", "Pension and family pension", 240, 480000],
  ["housing", "Housing assistance", 145, 160000],
  ["accident", "Accident relief", 70, 90000],
  ["funeral", "Funeral assistance", 50, 140000],
]
const STATUS_ORDER = ["disbursed", "approved", "payment-processing", "pending", "under-verification", "rejected"]
const STATUS_COUNTS = [486000, 62000, 48000, 142000, 64000, 43000]
const ALLOC_WEIGHTS = [180, 260, 210, 95, 240, 145, 140, 110]
const HEADLINE = {
  workers: 3860000,
  renewals: 1840000,
  beneficiaries: 2480000,
  applications: 845000,
  pending: 142000,
  approved: cr(1420),
  disbursed: cr(1250),
  failedPayments: 8250,
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function allocate(total, weights) {
  if (!Number.isInteger(total)) throw new Error(`total must be an integer, got ${total}`)
  const sum = weights.reduce((a, b) => a + b, 0)
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
const schemeWeights = SCHEMES.map(([, , croreAmount]) => croreAmount)

function yearWeights(yearIndex, salt) {
  if (yearIndex === 2) return baseWeights
  const random = mulberry32(7000 + yearIndex * 100 + salt)
  return baseWeights.map((weight) => weight * (0.84 + random() * 0.32))
}

function buildCube(yearTotals, salt) {
  return yearTotals.map((total, yearIndex) => {
    const byDistrict = allocate(total, yearWeights(yearIndex, salt))
    return byDistrict.map((districtTotal) => allocate(districtTotal, MONTH_WEIGHTS))
  })
}

function buildCapped(higherTotals, lowerTotals, salt) {
  const higher = []
  const lower = []
  higherTotals.forEach((higherTotal, yearIndex) => {
    const weights = yearWeights(yearIndex, salt)
    const higherDistrict = allocate(higherTotal, weights)
    const lowerDistrict = fitUnderCap(lowerTotals[yearIndex], weights, higherDistrict)
    const higherMonth = higherDistrict.map((total) => allocate(total, MONTH_WEIGHTS))
    const lowerMonth = lowerDistrict.map((total, district) => fitUnderCap(total, MONTH_WEIGHTS, higherMonth[district]))
    higher.push(higherMonth)
    lower.push(lowerMonth)
  })
  return { higher, lower }
}

const rate = 5
const yearMetric = (value) => [prior(prior(value, rate), rate), prior(value, rate), value]
const workers = buildCube(yearMetric(HEADLINE.workers), 1)
const renewals = buildCube(yearMetric(HEADLINE.renewals), 2)
const beneficiaries = buildCube(yearMetric(HEADLINE.beneficiaries), 3)
const applicationsPair = buildCapped(yearMetric(HEADLINE.applications), yearMetric(HEADLINE.pending), 4)
const moneyPair = buildCapped(yearMetric(HEADLINE.approved), yearMetric(HEADLINE.disbursed), 5)
const failedPayments = buildCube(yearMetric(HEADLINE.failedPayments), 6)

const statusByScheme = STATUS_COUNTS.map((total) => allocate(total, schemeWeights))
const schemeApplications = SCHEMES.map((_, index) => statusByScheme.reduce((sum, row) => sum + row[index], 0))
const approvedByScheme = allocate(HEADLINE.approved, schemeWeights)
const disbursedByScheme = SCHEMES.map(([, , croreAmount]) => cr(croreAmount))
const allocatedByScheme = allocate(cr(1560), ALLOC_WEIGHTS)
for (let index = 0; index < SCHEMES.length; index += 1) {
  if (approvedByScheme[index] < disbursedByScheme[index]) throw new Error(`approved below disbursed for ${SCHEMES[index][0]}`)
  if (allocatedByScheme[index] < disbursedByScheme[index]) throw new Error(`allocated below disbursed for ${SCHEMES[index][0]}`)
}

const schemes = SCHEMES.map(([id, name, , beneficiariesCount], index) => {
  const utilization = disbursedByScheme[index] / allocatedByScheme[index]
  return {
    id,
    name,
    illustrative: true,
    eligibility: "Illustrative eligibility: a person on the Board register whose membership and documents meet this scheme master. This is not a verified statutory rule.",
    applications: schemeApplications[index],
    disbursedApplications: statusByScheme[0][index],
    approvedApplications: statusByScheme[1][index],
    paymentProcessing: statusByScheme[2][index],
    pending: statusByScheme[3][index],
    underVerification: statusByScheme[4][index],
    rejected: statusByScheme[5][index],
    beneficiaries: beneficiariesCount,
    approvedRupees: approvedByScheme[index],
    disbursedRupees: disbursedByScheme[index],
    allocatedRupees: allocatedByScheme[index],
    lowUtilization: utilization < 0.7,
  }
})

const occupations = [
  ["mason", "Mason", 28],
  ["helper", "Helper", 22],
  ["carpenter", "Carpenter", 14],
  ["painter", "Painter", 10],
  ["electrician", "Electrician", 8],
  ["plumber", "Plumber", 6],
  ["bar-bender", "Bar bender", 7],
  ["other", "Other construction work", 5],
].map(([id, name, share]) => ({ id, name, share }))

const ageGroups = [
  ["18-25", "18–25", 14],
  ["26-35", "26–35", 32],
  ["36-45", "36–45", 28],
  ["46-55", "46–55", 18],
  ["56-60", "56–60", 8],
].map(([id, name, share]) => ({ id, name, share }))

const membershipStatuses = [
  { id: "active", name: "Active", count: 3120000 },
  { id: "expired", name: "Expired", count: 540000 },
  { id: "not-yet-active", name: "Not yet active", count: 200000 },
]
const applicationStatuses = [
  { id: "disbursed", name: "Disbursed", count: 486000, averageDays: 27 },
  { id: "approved", name: "Approved", count: 62000, averageDays: 18 },
  { id: "payment-processing", name: "Payment processing", count: 48000, averageDays: 9 },
  { id: "pending", name: "Pending", count: 142000, averageDays: 46 },
  { id: "under-verification", name: "Under verification", count: 64000, averageDays: 11 },
  { id: "rejected", name: "Rejected", count: 43000, averageDays: 21 },
]
const paymentStatuses = [
  { id: "success", name: "Successful" },
  { id: "failed", name: "Failed" },
  { id: "returned", name: "Returned" },
  { id: "processing", name: "Processing" },
]

const taluks = districts.flatMap((district) => ["Headquarters", "North", "South"].map((label, index) => ({
  id: `${district.id}-${slug(label)}`,
  districtId: district.id,
  name: `${label} taluk`,
  weight: [50, 30, 20][index],
})))

const occupationsCycle = occupations.map((item) => item.id)
const ageCycle = ageGroups.map((item) => item.id)
const membershipCycle = ["active", "active", "active", "expired", "not-yet-active"]
const appCycle = STATUS_ORDER
const paymentCycle = ["success", "success", "failed", "returned", "processing"]
const failureReasons = {
  failed: "Illustrative bank rejection",
  returned: "Illustrative return from the beneficiary account",
  processing: "Payment is still in process",
  success: "—",
}

const samples = { workers: [], memberships: [], dependents: [], applications: [], statusHistory: [], verifications: [], approvals: [], disbursements: [] }
districts.forEach((district, index) => {
  const month = index % 12
  const monthNumber = String(((month + 3) % 12) + 1).padStart(2, "0")
  const workerKey = `wrk-${district.id}`
  const workerCode = `WRK-2025-${String(2400 + index).padStart(4, "0")}`
  const applicationKey = `app-${district.id}`
  const applicationCode = `APP-2025-${String(5600 + index).padStart(4, "0")}`
  const scheme = schemes[index % schemes.length]
  const membership = membershipCycle[index % membershipCycle.length]
  const applicationStatus = appCycle[index % appCycle.length]
  const payment = paymentCycle[index % paymentCycle.length]
  const taluk = taluks.filter((item) => item.districtId === district.id)[index % 3]
  const approvedRupees = 25000 + index * 500
  const disbursedRupees = payment === "success" ? approvedRupees : 0
  samples.workers.push({
    id: workerKey,
    workerId: workerCode,
    displayName: `Worker ••${String(10 + (index % 90)).padStart(2, "0")}`,
    districtId: district.id,
    talukId: taluk.id,
    occupation: occupationsCycle[index % occupationsCycle.length],
    ageGroup: ageCycle[index % ageCycle.length],
    registrationDate: `2025-${monthNumber}-08`,
    expiryDate: membership === "expired" ? "2025-12-31" : "2027-03-31",
    membershipStatus: membership,
    year: "2025-26",
    monthIndex: month,
    source: "KBOCW membership register",
  })
  samples.memberships.push({
    id: `mem-${district.id}`,
    workerId: workerCode,
    status: membership,
    districtId: district.id,
    year: "2025-26",
    monthIndex: month,
    source: "KBOCW membership register",
  })
  if (index % 3 === 0) {
    samples.dependents.push({
      id: `dep-${district.id}`,
      workerId: workerCode,
      displayName: `Dependent ••${String(index).padStart(2, "0")}`,
      relationship: index % 2 === 0 ? "Spouse" : "Child",
      districtId: district.id,
      source: "KBOCW dependent register",
    })
  }
  samples.applications.push({
    id: applicationKey,
    applicationId: applicationCode,
    workerId: workerCode,
    schemeId: scheme.id,
    applicationDate: `2025-${monthNumber}-14`,
    status: applicationStatus,
    verificationStatus: applicationStatus === "under-verification" || applicationStatus === "pending" ? "Pending" : "Recorded",
    pendingDays: applicationStatus === "pending" ? 40 + (index % 20) : applicationStatuses.find((item) => item.id === applicationStatus).averageDays,
    districtId: district.id,
    talukId: taluk.id,
    membershipStatus: membership,
    year: "2025-26",
    monthIndex: month,
    source: "KBOCW application file",
  })
  samples.statusHistory.push(
    { id: `hist-${district.id}-1`, applicationId: applicationCode, status: "Received", eventDate: `2025-${monthNumber}-14`, source: "KBOCW application file" },
    { id: `hist-${district.id}-2`, applicationId: applicationCode, status: applicationStatuses.find((item) => item.id === applicationStatus).name, eventDate: `2025-${monthNumber}-24`, source: "KBOCW application file" },
  )
  samples.verifications.push({
    id: `ver-${district.id}`,
    applicationId: applicationCode,
    status: applicationStatus === "pending" ? "Incomplete documents" : "Recorded",
    districtId: district.id,
    source: "KBOCW verification file",
  })
  if (["approved", "payment-processing", "disbursed"].includes(applicationStatus)) {
    samples.approvals.push({
      id: `apr-${district.id}`,
      applicationId: applicationCode,
      schemeId: scheme.id,
      amountRupees: approvedRupees,
      districtId: district.id,
      source: "KBOCW sanction file",
    })
  }
  if (["disbursed", "payment-processing"].includes(applicationStatus) || payment !== "success") {
    samples.disbursements.push({
      id: `pay-${district.id}`,
      transactionId: `TXN-2025-${String(7700 + index).padStart(4, "0")}`,
      applicationId: applicationCode,
      schemeId: scheme.id,
      districtId: district.id,
      approvedRupees,
      disbursedRupees,
      transactionDate: `2025-${monthNumber}-26`,
      paymentStatus: applicationStatus === "payment-processing" ? "processing" : payment,
      failureReason: failureReasons[applicationStatus === "payment-processing" ? "processing" : payment],
      year: "2025-26",
      monthIndex: month,
      membershipStatus: membership,
      source: "KBOCW disbursement ledger",
    })
  }
})

const lowCoverageDistricts = [...DISTRICT_ROWS].sort((a, b) => a[1] - b[1]).slice(0, 6).map(([name]) => slug(name))

for (const [key, cube] of [
  ["workers", workers],
  ["renewals", renewals],
  ["beneficiaries", beneficiaries],
  ["applications", applicationsPair.higher],
  ["pending", applicationsPair.lower],
  ["approved", moneyPair.higher],
  ["disbursed", moneyPair.lower],
  ["failedPayments", failedPayments],
]) {
  const expected = HEADLINE[key === "applications" ? "applications" : key === "pending" ? "pending" : key === "approved" ? "approved" : key === "disbursed" ? "disbursed" : key]
  if (cubeTotal(cube, 2) !== expected) throw new Error(`${key} total ${cubeTotal(cube, 2)}`)
}
if (schemes.reduce((sum, scheme) => sum + scheme.applications, 0) !== 845000) throw new Error("scheme applications")
if (schemes.reduce((sum, scheme) => sum + scheme.pending, 0) !== 142000) throw new Error("scheme pending")
if (schemes.reduce((sum, scheme) => sum + scheme.beneficiaries, 0) !== 2560000) throw new Error("scheme people")
if (schemes.reduce((sum, scheme) => sum + scheme.disbursedRupees, 0) !== cr(1250)) throw new Error("scheme disbursed")
if (schemes.reduce((sum, scheme) => sum + scheme.approvedRupees, 0) !== cr(1420)) throw new Error("scheme approved")
if (schemes.reduce((sum, scheme) => sum + scheme.allocatedRupees, 0) !== cr(1560)) throw new Error("scheme allocated")
if (schemes.filter((scheme) => scheme.lowUtilization).length !== 2) throw new Error("expected two low-utilization schemes")
if (membershipStatuses.reduce((sum, item) => sum + item.count, 0) !== 3860000) throw new Error("membership split")

const payload = {
  meta: {
    illustrative: true,
    source: "Illustrative KBOCW Welfare Board extract",
    lastRefreshed: "18 Nov 2026, 09:30 IST",
    illustrativeNote: "Illustrative data. This demonstration is not connected to Karnataka Government systems. Personal names in the registers are masked.",
    boundaryNote: "District boundaries follow the Census 2011 outline. Vijayanagara is not drawn separately on this illustrative map.",
    separationNote: "Registered workers, active members, dependents and beneficiaries are separate counts. A person is counted once in the unique beneficiary total.",
    stageNote: "Approved assistance and disbursed assistance are separate. Remaining balance is available funds minus successful disbursement. Failed and returned payments are not treated as disbursed.",
    schemeNote: "Scheme categories come from this illustrative scheme master. They are not a verified list of officially active schemes.",
    fundNote: "Available funds ₹1,860 Cr. Allocated funds ₹1,560 Cr. Approved assistance ₹1,420 Cr. Disbursed assistance ₹1,250 Cr. Remaining balance is available funds minus disbursed assistance.",
  },
  years: YEARS,
  months: MONTHS,
  districts,
  taluks,
  schemes,
  occupations,
  ageGroups,
  membershipStatuses,
  applicationStatuses,
  paymentStatuses,
  sources: [
    { id: "membership", name: "KBOCW membership register", system: "KBOCW Welfare Board", holds: "Workers and memberships" },
    { id: "dependents", name: "KBOCW dependent register", system: "KBOCW Welfare Board", holds: "Dependents" },
    { id: "schemes", name: "KBOCW scheme master", system: "KBOCW Welfare Board", holds: "Schemes and illustrative eligibility" },
    { id: "applications", name: "KBOCW application file", system: "KBOCW Welfare Board", holds: "Applications and status history" },
    { id: "verification", name: "KBOCW verification file", system: "KBOCW Welfare Board", holds: "Verification records" },
    { id: "sanction", name: "KBOCW sanction file", system: "KBOCW Welfare Board", holds: "Approvals" },
    { id: "ledger", name: "KBOCW disbursement ledger", system: "KBOCW Welfare Board", holds: "Disbursements" },
    { id: "fund", name: "KBOCW fund allocation file", system: "KBOCW Welfare Board", holds: "Allocations and utilization" },
  ],
  rules: {
    availableRupees: cr(1860),
    allocatedRupees: cr(1560),
    failedSplit: [5100, 3150],
    slaDays: 30,
    pendingBeyondSla: 46200,
    renewalsDue: 186000,
    incompleteDocs: 38400,
    lowCoverageDistricts,
  },
  metrics: {
    workers,
    renewals,
    beneficiaries,
    applications: applicationsPair.higher,
    pendingApplications: applicationsPair.lower,
    assistanceApproved: moneyPair.higher,
    assistanceDisbursed: moneyPair.lower,
    failedPayments,
  },
  samples,
}

const target = join(root, "src/data/welfare-board.json")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(payload))
console.log(`Wrote ${target}`)
console.log("Welfare headline checks passed")
console.log(schemes.filter((scheme) => scheme.lowUtilization).map((scheme) => scheme.id).join(", "))
