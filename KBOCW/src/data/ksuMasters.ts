// Reference masters for the KSUWSSB Executive Overview.
// Everything here is configuration for the illustrative proof of concept. Scheme names, benefit
// types, amounts, service targets and occupation categories are sample entries until the Board
// supplies its notified lists. Nothing here should be read as a rule or a government figure.

export const KSU_DATA_START = "2025-04-01"
export const KSU_DATA_END = "2026-09-30"
export const KSU_REPORTING_DATE = "2026-10-05"
export const KSU_LAST_REFRESH = "2026-10-05T08:30:00"

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY = 86400000
const BASE = Date.UTC(2025, 3, 1)

export interface KsuMonth {
  index: number
  key: string
  label: string
  short: string
  startDay: number
  endDay: number
  financialYear: string
}

/** Eighteen calendar months, April 2025 to September 2026. Day numbers count from 1 April 2025. */
export const KSU_MONTHS: KsuMonth[] = Array.from({ length: 18 }, (_, index) => {
  const first = new Date(Date.UTC(2025, 3 + index, 1))
  const next = Date.UTC(2025, 4 + index, 1)
  const year = first.getUTCFullYear()
  const month = first.getUTCMonth()
  return {
    index,
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: `${SHORT_MONTHS[month]} ${year}`,
    short: `${SHORT_MONTHS[month]} ${String(year).slice(2)}`,
    startDay: Math.round((first.getTime() - BASE) / DAY),
    endDay: Math.round((next - BASE) / DAY) - 1,
    financialYear: index < 12 ? "2025-26" : "2026-27",
  }
})

export const KSU_LAST_DAY = KSU_MONTHS[17].endDay

export const dayOfIso = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - BASE) / DAY)
export const isoOfDay = (day: number) => new Date(BASE + day * DAY).toISOString().slice(0, 10)
/** Month index of a day, or 18 for a day after the end of the extract. */
export const monthOfDay = (day: number) => {
  const found = KSU_MONTHS.findIndex((month) => day <= month.endDay)
  return found < 0 ? 18 : found
}
export const monthOfIso = (iso: string) => {
  const key = iso.slice(0, 7)
  const found = KSU_MONTHS.find((month) => month.key === key)
  return found ? found.index : iso < KSU_DATA_START ? 0 : 17
}

export const KSU_FINANCIAL_YEARS = [
  { id: "2025-26", label: "FY 2025-26 (Apr 2025 to Mar 2026)", from: "2025-04-01", to: "2026-03-31" },
  { id: "2026-27", label: "FY 2026-27 (Apr to Sep 2026)", from: "2026-04-01", to: "2026-09-30" },
]

export const KSU_QUARTERS = [
  { id: "q1-25", label: "Q1 (Apr to Jun 2025)", financialYear: "2025-26", from: "2025-04-01", to: "2025-06-30" },
  { id: "q2-25", label: "Q2 (Jul to Sep 2025)", financialYear: "2025-26", from: "2025-07-01", to: "2025-09-30" },
  { id: "q3-25", label: "Q3 (Oct to Dec 2025)", financialYear: "2025-26", from: "2025-10-01", to: "2025-12-31" },
  { id: "q4-25", label: "Q4 (Jan to Mar 2026)", financialYear: "2025-26", from: "2026-01-01", to: "2026-03-31" },
  { id: "q1-26", label: "Q1 (Apr to Jun 2026)", financialYear: "2026-27", from: "2026-04-01", to: "2026-06-30" },
  { id: "q2-26", label: "Q2 (Jul to Sep 2026)", financialYear: "2026-27", from: "2026-07-01", to: "2026-09-30" },
]

export interface KsuDistrictMaster {
  id: string
  name: string
  drawn: boolean
  /** Relative size of the estimated unorganised workforce. Illustrative. */
  weight: number
  /** Share of the district classified as urban for this sample. */
  urban: number
}

const D = (id: string, name: string, weight: number, urban: number, drawn = true): KsuDistrictMaster => ({ id, name, drawn, weight, urban })

export const KSU_DISTRICTS: KsuDistrictMaster[] = [
  D("bengaluru-urban", "Bengaluru Urban", 17, 0.96),
  D("belagavi", "Belagavi", 6, 0.28),
  D("mysuru", "Mysuru", 4.6, 0.42),
  D("tumakuru", "Tumakuru", 3.6, 0.2),
  D("ballari", "Ballari", 3.1, 0.38),
  D("dakshina-kannada", "Dakshina Kannada", 3.2, 0.5),
  D("bengaluru-rural", "Bengaluru Rural", 2, 0.25),
  D("kalaburagi", "Kalaburagi", 4.1, 0.34),
  D("vijayapura", "Vijayapura", 3.2, 0.26),
  D("dharwad", "Dharwad", 3.2, 0.58),
  D("mandya", "Mandya", 2.6, 0.18),
  D("hassan", "Hassan", 2.6, 0.2),
  D("shivamogga", "Shivamogga", 2.6, 0.3),
  D("davanagere", "Davanagere", 2.6, 0.32),
  D("raichur", "Raichur", 2.6, 0.25),
  D("kolar", "Kolar", 2.2, 0.26),
  D("bagalkote", "Bagalkote", 2.5, 0.26),
  D("chitradurga", "Chitradurga", 2.1, 0.2),
  D("udupi", "Udupi", 2.1, 0.28),
  D("bidar", "Bidar", 2.1, 0.24),
  D("chikkaballapura", "Chikkaballapura", 1.6, 0.2),
  D("haveri", "Haveri", 2, 0.2),
  D("uttara-kannada", "Uttara Kannada", 2, 0.28),
  D("ramanagara", "Ramanagara", 1.6, 0.22),
  D("chikkamagaluru", "Chikkamagaluru", 1.5, 0.18),
  D("koppal", "Koppal", 2, 0.2),
  D("chamarajanagara", "Chamarajanagara", 1.3, 0.14),
  D("gadag", "Gadag", 1.6, 0.3),
  D("yadgir", "Yadgir", 1.6, 0.16),
  D("kodagu", "Kodagu", 0.8, 0.16),
  D("vijayanagara", "Vijayanagara", 2.2, 0.3, false),
]

export const KSU_OCCUPATIONS = [
  { id: "agri", name: "Agricultural and allied labour", weight: 14 },
  { id: "vendor", name: "Street vendors and hawkers", weight: 9 },
  { id: "domestic", name: "Domestic workers", weight: 10 },
  { id: "home", name: "Home-based workers", weight: 7 },
  { id: "handloom", name: "Handloom and weaving workers", weight: 5 },
  { id: "fishing", name: "Fishing and allied workers", weight: 4 },
  { id: "tailor", name: "Tailors and garment workers", weight: 8 },
  { id: "hotel", name: "Hotel and eating-place workers", weight: 7 },
  { id: "housekeeping", name: "Security and housekeeping workers", weight: 8 },
  { id: "salon", name: "Barbers and salon workers", weight: 4 },
  { id: "artisan", name: "Potters, cobblers and other artisans", weight: 5 },
  { id: "newsmilk", name: "Newspaper and milk distribution workers", weight: 1.3 },
  { id: "gig", name: "Gig and platform workers", weight: 4 },
  { id: "other", name: "Other unorganised workers", weight: 12 },
]

export const KSU_GENDERS = [
  { id: "female", name: "Female", weight: 0.46 },
  { id: "male", name: "Male", weight: 0.53 },
  { id: "other", name: "Other or not stated", weight: 0.01 },
]

export const KSU_AGE_GROUPS = [
  { id: "18-24", name: "18 to 24", weight: 0.14 },
  { id: "25-34", name: "25 to 34", weight: 0.32 },
  { id: "35-44", name: "35 to 44", weight: 0.3 },
  { id: "45+", name: "45 and above", weight: 0.24 },
]

/** Worker registration states, as at the end of the reporting window. */
export const KSU_REG_STATUSES = [
  { id: "verified", name: "Verified, valid registration" },
  { id: "pending", name: "Pending verification" },
  { id: "rejected", name: "Rejected or returned" },
  { id: "inactive", name: "Inactive or expired" },
]

export const KSU_CLAIM_STAGES = [
  { id: "verification", name: "Under verification" },
  { id: "returned", name: "Returned for correction" },
  { id: "rejected", name: "Rejected" },
  { id: "approved", name: "Approved, payment not yet initiated" },
  { id: "initiated", name: "Payment initiated" },
  { id: "disbursed", name: "Successfully disbursed" },
  { id: "failed", name: "Payment failed or returned" },
]

export interface KsuSchemeMaster {
  id: string
  name: string
  short: string
  /** Very short label used to tell benefit types apart. */
  tag: string
  /** Operational status is shown as confirmation pending until the Board confirms it. */
  statusLabel: string
  effectiveFrom: string
  note: string
}

export const KSU_SCHEMES: KsuSchemeMaster[] = [
  {
    id: "aksh",
    name: "Ambedkar Karmika Sahaya Hasta Scheme",
    short: "Ambedkar Karmika Sahaya Hasta",
    tag: "Sahaya Hasta",
    statusLabel: "Operational status to be confirmed by the Board",
    effectiveFrom: "2025-04-01",
    note: "Sample configuration. Eligibility, rates and effective dates are placeholders.",
  },
  {
    id: "gig-insurance",
    name: "Karnataka State Gig Workers Insurance Scheme",
    short: "Gig Workers Insurance Scheme",
    tag: "Gig insurance",
    statusLabel: "Operational status to be confirmed by the Board",
    effectiveFrom: "2025-04-01",
    note: "Shown as implemented through KSUWSSB for this POC. No separate board is modelled.",
  },
  {
    id: "newsmilk",
    name: "Newspaper and Milk Distribution Workers assistance",
    short: "Newspaper and Milk Distribution Workers",
    tag: "Newspaper and milk",
    statusLabel: "Operational status to be confirmed by the Board",
    effectiveFrom: "2025-04-01",
    note: "Accident and medical assistance. Sample configuration.",
  },
]

export const KSU_OTHER_SCHEMES_NOTE =
  "Other KSUWSSB schemes are not configured. They will appear here once the Board supplies their names, guidelines and effective dates."

export interface KsuBenefitMaster {
  id: string
  schemeId: string
  name: string
  weight: number
  /** Placeholder amount range in rupees, in steps of 500. Not a notified rate. */
  min: number
  max: number
}

export const KSU_BENEFITS: KsuBenefitMaster[] = [
  { id: "aksh-accident-death", schemeId: "aksh", name: "Accidental death assistance", weight: 0.07, min: 100000, max: 100000 },
  { id: "aksh-natural-death", schemeId: "aksh", name: "Natural death assistance", weight: 0.2, min: 10000, max: 10000 },
  { id: "aksh-medical", schemeId: "aksh", name: "Accident or medical assistance", weight: 0.73, min: 5000, max: 50000 },
  { id: "gig-accident", schemeId: "gig-insurance", name: "Accident insurance claim", weight: 0.45, min: 25000, max: 100000 },
  { id: "gig-hospital", schemeId: "gig-insurance", name: "Hospitalisation insurance claim", weight: 0.55, min: 5000, max: 40000 },
  { id: "newsmilk-assistance", schemeId: "newsmilk", name: "Accident or medical assistance", weight: 1, min: 5000, max: 30000 },
]

/** Reasons recorded when a case is returned or rejected. Sample list. */
export const KSU_REASONS = [
  "Documents incomplete",
  "Identity details do not match",
  "Duplicate application",
  "Application outside the claim window",
  "Eligibility not established",
  "Payment details to be corrected",
]
export const KSU_RETURN_REASONS = [0, 1, 5]
export const KSU_REJECT_REASONS = [2, 3, 4, 1]

/** Working-day style service target. A POC placeholder, not a published standard. */
export const KSU_SERVICE_TARGET_DAYS = 30
export const KSU_ADMIN_RATE = 0.05
export const KSU_PENDING_BUCKETS = ["0 to 15 days", "16 to 30 days", "31 to 60 days", "61 to 90 days", "Over 90 days"]
export const KSU_BUCKET_LIMITS = [15, 30, 60, 90]
export const bucketOf = (days: number) => {
  const index = KSU_BUCKET_LIMITS.findIndex((limit) => days <= limit)
  return index < 0 ? KSU_BUCKET_LIMITS.length : index
}

export const KSU_SOURCES = [
  { id: "registry", name: "Worker registration and smart card records", updated: "2026-10-05T08:30:00", cadenceDays: 2 },
  { id: "applications", name: "Scheme application and claim records", updated: "2026-10-05T07:45:00", cadenceDays: 2 },
  { id: "approvals", name: "Approval and workflow registers", updated: "2026-10-04T18:10:00", cadenceDays: 3 },
  { id: "payments", name: "Payment and bank confirmation records", updated: "2026-09-18T17:00:00", cadenceDays: 7 },
  { id: "finance", name: "Budget, fund release and expenditure ledgers", updated: "2026-09-30T19:00:00", cadenceDays: 30 },
  { id: "facilitation", name: "Karmika Seva Kendra and district office registers", updated: "2026-10-01T12:00:00", cadenceDays: 7 },
  { id: "eshram", name: "e-Shram aggregated data (external reference)", updated: "2026-09-15T10:00:00", cadenceDays: 30 },
]

/** Published figures, reproduced as reported and kept apart from every figure on the dashboard. */
export const KSU_PUBLISHED = {
  source: "Karnataka Economic Survey 2025-26",
  period: "April to December 2025",
  items: [
    { id: "aksh-registered", label: "Ambedkar Karmika Sahaya Hasta: unorganised workers registered", value: "56,900" },
    { id: "aksh-accident", label: "Ambedkar Karmika Sahaya Hasta: accidental death cases", value: "2 cases, ₹2.00 lakh compensation" },
    { id: "aksh-natural", label: "Ambedkar Karmika Sahaya Hasta: natural death cases", value: "9 cases, ₹90,000" },
    { id: "gig-registered", label: "Gig Workers Insurance Scheme: workers registered", value: "968" },
    { id: "newsmilk-registered", label: "Newspaper and Milk Distribution Workers: registered", value: "119" },
    { id: "ksk", label: "B.R. Ambedkar Karmika Seva Kendra centres, at Labour Department sub-divisional offices", value: "43" },
  ],
  caution:
    "These are published historical figures for the period shown. They are not live, not necessarily cumulative, and have not been validated against Board records. They do not show that any scheme is currently open for registration or applications.",
}

export const KSU_ESHRAM_NOTE =
  "e-Shram is an external reference. It is never added to KSUWSSB registrations, scheme enrolments or beneficiaries."

export const KSU_UNPAID_NOTE = "Approved cases where payment has not succeeded: not yet initiated, initiated but unconfirmed, or failed or returned."

export const benefitLabel = (benefitIndex: number) => {
  const benefit = KSU_BENEFITS[benefitIndex]
  return `${benefit.name} (${KSU_SCHEMES.find((scheme) => scheme.id === benefit.schemeId)?.tag ?? ""})`
}
