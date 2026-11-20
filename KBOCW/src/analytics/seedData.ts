import factories from "@/data/factories-boilers.json" with { type: "json" }
import labour from "@/data/labour-commissionerate.json" with { type: "json" }
import welfare from "@/data/welfare-board.json" with { type: "json" }
import { BOARD } from "@/analytics/catalog"
import type { Row } from "@/analytics/types"
import { KSU_MONTHS } from "@/data/ksuMasters"
import { DEFAULT_GIG_FILTERS } from "@/lib/gigQuery"
import { DEFAULT_KSU_FILTERS } from "@/lib/ksuQuery"
import { buildGigOverview } from "@/services/gigOverview"
import { buildKsuOverview } from "@/services/ksuOverview"

// Rows for the analytics datasets. Every row comes from the figures behind one of the five department
// dashboards. Nothing is generated here, so a total for the same scope and period matches the dashboard.
//
// Labour, welfare and factories use the monthly figures by district that their dashboards add up.
// Gig workers and the Unorganised Workers Board run the dashboard's own calculation once for each
// month, so every row is a figure the dashboard itself would show for that month.

const pad = (value: number, size = 2) => String(value).padStart(size, "0")
const iso = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`

export function financialYearOf(isoDate: string) {
  const year = Number(isoDate.slice(0, 4))
  const month = Number(isoDate.slice(5, 7))
  const start = month >= 4 ? year : year - 1
  return `${start}-${pad((start + 1) % 100)}`
}

const monthEnd = (year: number, month: number) => iso(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate())

// ---------------------------------------------------------------- labour, welfare and factories

interface Cube {
  years: string[]
  districts: { id: string; name: string }[]
  metrics: Record<string, number[][][]>
}

/** Financial year index 0 is 2023-24. Month index 0 is April. */
function monthStart(yearIndex: number, monthIndex: number) {
  const calendarMonth = ((monthIndex + 3) % 12) + 1
  const calendarYear = 2023 + yearIndex + (calendarMonth < 4 ? 1 : 0)
  return iso(calendarYear, calendarMonth, 1)
}

function cubeRows(cube: Cube, department: string, columns: [string, string][]): Row[] {
  const rows: Row[] = []
  cube.years.forEach((year, yearIndex) => {
    cube.districts.forEach((district, districtIndex) => {
      for (let month = 0; month < 12; month += 1) {
        const row: Row = { department, district: district.name, financial_year: year, period: monthStart(yearIndex, month) }
        for (const [from, to] of columns) row[to] = cube.metrics[from][yearIndex][districtIndex][month]
        rows.push(row)
      }
    })
  })
  return rows
}

function buildLabourMonthly(): Row[] {
  return cubeRows(labour as unknown as Cube, BOARD.labour, [
    ["establishments", "establishments"],
    ["activeProjects", "projects"],
    ["inspections", "inspections"],
    ["violations", "violations"],
    ["pendingCompliance", "pending_cases"],
    ["newRegistrations", "new_registrations"],
    ["renewedRegistrations", "renewed_registrations"],
    ["cessAssessed", "cess_assessed"],
    ["cessCollected", "cess_collected"],
  ])
}

function buildLabourProjects(): Row[] {
  const source = labour as unknown as Cube & { categories: { id: string; name: string }[]; categoryMix: number[][] }
  const rows: Row[] = []
  source.years.forEach((year, yearIndex) => {
    source.districts.forEach((district, districtIndex) => {
      const total = source.metrics.activeProjects[yearIndex][districtIndex].reduce((sum, value) => sum + value, 0)
      source.categories.forEach((category, categoryIndex) => {
        rows.push({
          department: BOARD.labour,
          district: district.name,
          category: category.name,
          financial_year: year,
          projects: Math.round(total * source.categoryMix[districtIndex][categoryIndex]),
        })
      })
    })
  })
  return rows
}

function buildWelfareMonthly(): Row[] {
  return cubeRows(welfare as unknown as Cube, BOARD.welfare, [
    ["workers", "workers"],
    ["renewals", "renewals"],
    ["beneficiaries", "beneficiaries"],
    ["applications", "applications"],
    ["pendingApplications", "pending_applications"],
    ["assistanceApproved", "assistance_approved"],
    ["assistanceDisbursed", "assistance_disbursed"],
    ["failedPayments", "failed_payments"],
  ])
}

function buildWelfareSchemes(): Row[] {
  const source = welfare as unknown as {
    schemes: {
      name: string
      applications: number
      disbursedApplications: number
      approvedApplications: number
      paymentProcessing: number
      pending: number
      underVerification: number
      rejected: number
      beneficiaries: number
      approvedRupees: number
      disbursedRupees: number
      allocatedRupees: number
    }[]
  }
  return source.schemes.map((scheme) => ({
    department: BOARD.welfare,
    scheme: scheme.name,
    financial_year: "2025-26",
    applications: scheme.applications,
    disbursed_applications: scheme.disbursedApplications,
    approved_applications: scheme.approvedApplications,
    payment_processing: scheme.paymentProcessing,
    pending: scheme.pending,
    under_verification: scheme.underVerification,
    rejected: scheme.rejected,
    people_assisted: scheme.beneficiaries,
    approved_rupees: scheme.approvedRupees,
    disbursed_rupees: scheme.disbursedRupees,
    allocated_rupees: Math.round(scheme.allocatedRupees),
  }))
}

function buildFactoriesMonthly(): Row[] {
  return cubeRows(factories as unknown as Cube, BOARD.factories, [
    ["factories", "factories"],
    ["activeEstablishments", "active_establishments"],
    ["inspectionsConducted", "inspections"],
    ["pendingInspections", "pending_inspections"],
    ["violations", "violations"],
    ["openCases", "open_cases"],
    ["accidents", "accidents"],
    ["boilers", "boilers"],
    ["boilersDue", "boilers_due"],
  ])
}

function buildFactoriesCategories(): Row[] {
  const source = factories as unknown as {
    categories: {
      name: string
      kind: string
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
    }[]
  }
  return source.categories.map((category) => ({
    department: BOARD.factories,
    category: category.name,
    category_kind: category.kind === "factory" ? "Factory" : "Other regulated establishment",
    financial_year: "2025-26",
    factories: category.factories,
    active_factories: category.activeFactories,
    active_other: category.activeOther,
    inspections: category.inspections,
    pending: category.pending,
    violations: category.violations,
    accidents: category.accidents,
    injuries: category.injuries,
    fatalities: category.fatalities,
    boilers: category.boilers,
    boilers_due: category.boilersDue,
  }))
}

// ---------------------------------------------------------------- gig workers

/** October 2025 to September 2026, the months the gig workers dashboard holds. */
const GIG_MONTH_COUNT = 12

function gigMonths() {
  return Array.from({ length: GIG_MONTH_COUNT }, (_, index) => {
    const calendarMonth = ((9 + index) % 12) + 1
    const calendarYear = 2025 + Math.floor((9 + index) / 12)
    const from = iso(calendarYear, calendarMonth, 1)
    return { from, to: monthEnd(calendarYear, calendarMonth), financialYear: financialYearOf(from) }
  })
}

let gigCache: { month: ReturnType<typeof gigMonths>[number]; overview: ReturnType<typeof buildGigOverview> }[] | null = null

/** The dashboard's own overview for each single month. */
function gigOverviews() {
  gigCache ??= gigMonths().map((month) => ({
    month,
    overview: buildGigOverview({ ...DEFAULT_GIG_FILTERS, financialYear: month.financialYear, fromDate: month.from, toDate: month.to }),
  }))
  return gigCache
}

function buildGigMonthly(): Row[] {
  return gigOverviews().map(({ month, overview }) => {
    const kpi = (id: string) => overview.kpis.find((item) => item.id === id)?.value ?? 0
    return {
      department: BOARD.gig,
      financial_year: month.financialYear,
      period: month.from,
      records: kpi("records"),
      added: overview.registration.newlyRegistered[0] ?? 0,
      separated: overview.registration.separated[0] ?? 0,
      unique_workers: kpi("unique"),
      active_workers: kpi("active"),
      aggregators: kpi("aggregators"),
      payouts: kpi("payouts"),
      transactions: overview.payout.transactions[0] ?? 0,
      fee_payable: overview.fee.totals.payable,
      fee_declared: overview.fee.totals.declared,
      fee_deposited: overview.fee.totals.deposited,
      fee_reconciled: overview.fee.totals.reconciled,
      fee_shortfall: overview.fee.shortfall,
      fund_receipts: overview.fund.summary.receiptsTotal,
      fund_expenditure: overview.fund.summary.expenditureTotal,
      fund_balance: kpi("fund"),
      benefits: kpi("benefits"),
      fatal_accidents: overview.safety.totals.fatal,
      nonfatal_accidents: overview.safety.totals.nonFatal,
      claims_initiated: overview.safety.totals.claimsInitiated,
      claims_settled: overview.safety.totals.claimsSettled,
    }
  })
}

function buildGigDistricts(): Row[] {
  return gigOverviews().flatMap(({ month, overview }) =>
    overview.districts.map((district) => ({
      department: BOARD.gig,
      district: district.name,
      financial_year: month.financialYear,
      period: month.from,
      unique_workers: district.unique,
      active_workers: district.active,
      payouts: district.payout,
      benefits: district.benefits,
      grievances: district.grievances,
    })),
  )
}

function buildGigAggregators(): Row[] {
  return gigOverviews().flatMap(({ month, overview }) =>
    overview.aggregatorTable.map((row) => ({
      department: BOARD.gig,
      aggregator: row.name,
      sector: row.sector,
      financial_year: month.financialYear,
      period: month.from,
      records: row.records,
      unique_workers: row.unique,
      payouts: row.payout,
      fee_payable: row.payable,
      fee_deposited: row.deposited,
      fee_shortfall: row.outstanding,
    })),
  )
}

// ---------------------------------------------------------------- unorganised workers

function ksuMonths() {
  return KSU_MONTHS.map((month) => {
    const year = Number(month.key.slice(0, 4))
    const calendarMonth = Number(month.key.slice(5, 7))
    return { from: iso(year, calendarMonth, 1), to: monthEnd(year, calendarMonth), financialYear: month.financialYear }
  })
}

let ksuCache: { month: ReturnType<typeof ksuMonths>[number]; overview: ReturnType<typeof buildKsuOverview> }[] | null = null

/** The dashboard's own overview for each single month. */
function ksuOverviews() {
  ksuCache ??= ksuMonths().map((month) => ({
    month,
    overview: buildKsuOverview({ ...DEFAULT_KSU_FILTERS, financialYear: month.financialYear, fromDate: month.from, toDate: month.to }),
  }))
  return ksuCache
}

function buildKsuMonthly(): Row[] {
  return ksuOverviews().map(({ month, overview }) => {
    const kpi = (id: string) => overview.kpis.find((item) => item.id === id)?.value ?? 0
    return {
      department: BOARD.ksu,
      financial_year: month.financialYear,
      period: month.from,
      registered: kpi("registered"),
      new_registrations: kpi("newRegistrations"),
      enrolments: kpi("enrolments"),
      beneficiaries: kpi("beneficiaries"),
      received: kpi("received"),
      pending: kpi("pending"),
      approved: kpi("approved"),
      disbursed: kpi("disbursed"),
    }
  })
}

function buildKsuDistricts(): Row[] {
  return ksuOverviews().flatMap(({ month, overview }) =>
    overview.districts.map((district) => ({
      department: BOARD.ksu,
      district: district.name,
      financial_year: month.financialYear,
      period: month.from,
      registered: district.registered,
      enrolments: district.enrolments,
      beneficiaries: district.beneficiaries,
      received: district.received,
      pending: district.pending,
      disbursed: district.disbursed,
    })),
  )
}

function buildKsuSchemes(): Row[] {
  return ksuOverviews().flatMap(({ month, overview }) =>
    overview.schemes.rows.map((scheme) => ({
      department: BOARD.ksu,
      scheme: scheme.name,
      financial_year: month.financialYear,
      period: month.from,
      enrolments: scheme.enrolments,
      received: scheme.received,
      approved_cases: scheme.approved,
      paid_cases: scheme.disbursedCases,
      beneficiaries: scheme.beneficiaries,
      approved: scheme.approvedAmount,
      disbursed: scheme.disbursedAmount,
    })),
  )
}

// ---------------------------------------------------------------- registry

type Builder = () => Row[]
const cache = new Map<string, Row[]>()

const builders: Record<string, Builder> = {
  labour_monthly: buildLabourMonthly,
  labour_projects: buildLabourProjects,
  welfare_monthly: buildWelfareMonthly,
  welfare_schemes: buildWelfareSchemes,
  factories_monthly: buildFactoriesMonthly,
  factories_categories: buildFactoriesCategories,
  gig_monthly: buildGigMonthly,
  gig_districts: buildGigDistricts,
  gig_aggregators: buildGigAggregators,
  ksu_monthly: buildKsuMonthly,
  ksu_districts: buildKsuDistricts,
  ksu_schemes: buildKsuSchemes,
}

export function getRows(datasetId: string): Row[] {
  const cached = cache.get(datasetId)
  if (cached) return cached
  const build = builders[datasetId]
  const rows = build ? build() : []
  cache.set(datasetId, rows)
  return rows
}
