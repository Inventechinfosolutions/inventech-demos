import { moneyShort } from "@/components/gig/gigChartOptions"
import {
  KSU_AGE_GROUPS,
  KSU_BENEFITS,
  KSU_CLAIM_STAGES,
  KSU_DISTRICTS,
  KSU_ESHRAM_NOTE,
  KSU_FINANCIAL_YEARS,
  KSU_GENDERS,
  KSU_LAST_REFRESH,
  KSU_MONTHS,
  KSU_OCCUPATIONS,
  KSU_OTHER_SCHEMES_NOTE,
  KSU_PENDING_BUCKETS,
  KSU_PUBLISHED,
  KSU_QUARTERS,
  KSU_REASONS,
  KSU_REG_STATUSES,
  KSU_REPORTING_DATE,
  KSU_SCHEMES,
  KSU_SERVICE_TARGET_DAYS,
  KSU_SOURCES,
  KSU_UNPAID_NOTE,
  benefitLabel,
  bucketOf,
  dayOfIso,
  isoOfDay,
} from "@/data/ksuMasters"
import { formatCount, formatLongDate } from "@/lib/format"
import { KSU_FILTER_KEYS } from "@/lib/ksuQuery"
import { FINANCIAL_YEAR_MONTHS, computeKsu, computeLedger, mean, median, type Computed } from "@/services/ksuEngine"
import { KSU_DATASETS, KSU_DEFINITIONS, KSU_KPI_ORDER, KSU_KPI_SPECS } from "@/services/ksuMetrics"
import type {
  KsuClaimsSection,
  KsuComparison,
  KsuDemographics,
  KsuDistrictRow,
  KsuFacilitationSection,
  KsuFilterKey,
  KsuFilterOptions,
  KsuFilters,
  KsuFinanceSection,
  KsuKpi,
  KsuMapDistrict,
  KsuOverview,
  KsuPriorityRow,
  KsuSchemeSection,
  KsuSourceStatus,
  KsuStat,
} from "@/types/ksu"

export function ksuFilterOptions(): KsuFilterOptions {
  return {
    financialYears: KSU_FINANCIAL_YEARS,
    quarters: KSU_QUARTERS,
    districts: KSU_DISTRICTS.map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    schemes: KSU_SCHEMES.map(({ id, name, statusLabel }) => ({ id, name, statusLabel })),
    occupations: KSU_OCCUPATIONS.map(({ id, name }) => ({ id, name })),
    registrationStatuses: KSU_REG_STATUSES,
    claimStatuses: KSU_CLAIM_STAGES,
    benefitTypes: KSU_BENEFITS.map((item) => ({ id: item.id, name: item.name, schemeId: item.schemeId, schemeName: KSU_SCHEMES.find((scheme) => scheme.id === item.schemeId)?.short ?? "" })),
    genders: KSU_GENDERS.map(({ id, name }) => ({ id, name })),
    ageGroups: KSU_AGE_GROUPS.map(({ id, name }) => ({ id, name })),
  }
}

const FILTER_LABELS: Record<KsuFilterKey, string> = {
  districtId: "District",
  schemeId: "Scheme",
  occupationId: "Occupation",
  registrationStatus: "Registration status",
  claimStatus: "Claim status",
  benefitType: "Benefit type",
  gender: "Gender",
  ageGroup: "Age group",
}

function filterValueName(key: KsuFilterKey, id: string): string {
  const lists: Record<KsuFilterKey, { id: string; name: string }[]> = {
    districtId: KSU_DISTRICTS,
    schemeId: KSU_SCHEMES,
    occupationId: KSU_OCCUPATIONS,
    registrationStatus: KSU_REG_STATUSES,
    claimStatus: KSU_CLAIM_STAGES,
    benefitType: KSU_BENEFITS,
    gender: KSU_GENDERS,
    ageGroup: KSU_AGE_GROUPS,
  }
  return lists[key].find((item) => item.id === id)?.name ?? id
}

const slice = (values: number[], first: number, last: number) => values.slice(first, last + 1)
const periodText = (first: number, last: number) => (first === last ? KSU_MONTHS[first].label : `${KSU_MONTHS[first].label} to ${KSU_MONTHS[last].label}`)

function change(current: number, previous: number | undefined): KsuComparison["change"] {
  if (previous === undefined || previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function sourceStatuses(): KsuSourceStatus[] {
  const reporting = dayOfIso(KSU_REPORTING_DATE)
  return KSU_SOURCES.map((source) => {
    const ageDays = reporting - dayOfIso(source.updated.slice(0, 10))
    const status = ageDays <= source.cadenceDays ? "current" : ageDays <= source.cadenceDays * 2 ? "delayed" : "stale"
    return { ...source, ageDays, status }
  })
}

const round1 = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10)

function buildKpis(x: Computed): KsuKpi[] {
  const { win, prevWin, reg, clm, prevReg, prevClm } = x
  const { first, last } = win
  const prevLabel = prevWin ? periodText(prevWin.first, prevWin.last) : ""
  const noPrior: KsuComparison = { label: "", change: null, note: "The extract does not reach back far enough to compare this period." }
  const compare = (current: number, previous: number | undefined, what: string): KsuComparison =>
    prevWin && previous !== undefined
      ? { label: prevLabel, change: change(current, previous), note: previous === 0 ? `${what} was zero in ${prevLabel}, so no percentage change is shown.` : `${what} in ${prevLabel}.` }
      : noPrior

  const values: Record<string, { value: number; spark: number[]; comparison: KsuComparison; asOf: boolean }> = {
    registered: { value: reg.valid, spark: slice(reg.validStock, first, last), comparison: compare(reg.valid, prevReg?.valid, "Registered workers at the end"), asOf: true },
    newRegistrations: { value: reg.newTotal, spark: slice(reg.newByMonth, first, last), comparison: compare(reg.newTotal, prevReg?.newTotal, "New registrations"), asOf: false },
    enrolments: { value: reg.enrolTotal, spark: slice(reg.enrolStock, first, last), comparison: compare(reg.enrolTotal, prevReg?.enrolTotal, "Enrolments at the end"), asOf: true },
    beneficiaries: { value: clm.beneficiaries, spark: slice(clm.beneficiariesByMonth, first, last), comparison: compare(clm.beneficiaries, prevClm?.beneficiaries, "Beneficiaries"), asOf: false },
    received: { value: clm.received, spark: slice(clm.receivedByMonth, first, last), comparison: compare(clm.received, prevClm?.received, "Cases received"), asOf: false },
    pending: { value: clm.pending, spark: slice(clm.pendingByMonth, first, last), comparison: compare(clm.pending, prevClm?.pending, "Pending cases at the end"), asOf: true },
    approved: { value: clm.approvedAmount, spark: slice(clm.approvedAmountByMonth, first, last), comparison: compare(clm.approvedAmount, prevClm?.approvedAmount, "Benefits approved"), asOf: false },
    disbursed: { value: clm.paidAmount, spark: slice(clm.paidAmountByMonth, first, last), comparison: compare(clm.paidAmount, prevClm?.paidAmount, "Benefits disbursed"), asOf: false },
  }

  return KSU_KPI_ORDER.map((id) => {
    const spec = KSU_KPI_SPECS[id]
    const item = values[id]
    return {
      id,
      label: spec.name,
      unit: spec.unit,
      value: item.value,
      displayValue: spec.unit === "inr" ? moneyShort(item.value) : formatCount(item.value),
      comparison: item.comparison,
      spark: item.spark,
      period: item.asOf ? `As on ${formatLongDate(isoOfDay(win.endDay))}` : periodText(first, last),
      definition: spec.definition,
      basis: spec.basis,
      sourceIds: spec.sources,
      notAffectedBy: spec.notAffectedBy.map((text) => text.charAt(0).toUpperCase() + text.slice(1)),
    }
  })
}

const REG_NOT = ["Scheme", "Registration status", "Claim status", "Benefit type"]
const CLAIM_NOT = ["Registration status"]

function buildSchemes(x: Computed): KsuSchemeSection {
  const { reg, clm } = x
  const rows = KSU_SCHEMES.map((scheme, s) => {
    const days = clm.decisionDaysByScheme[s]
    return {
      id: scheme.id,
      name: scheme.name,
      statusLabel: scheme.statusLabel,
      enrolments: reg.enrolByScheme[s],
      received: clm.receivedByScheme[s],
      approved: clm.approvedByScheme[s],
      disbursedCases: clm.paidByScheme[s],
      beneficiaries: clm.beneficiariesByScheme[s],
      approvedAmount: clm.approvedAmountByScheme[s],
      disbursedAmount: clm.paidAmountByScheme[s],
      avgDays: round1(mean(days)),
      medianDays: median(days),
    }
  })
  const stages = clm.stageCounts
  return {
    rows,
    enrolmentTotal: reg.enrolTotal,
    uniqueEnrolled: reg.uniqueEnrolled,
    otherSchemesNote: KSU_OTHER_SCHEMES_NOTE,
    funnel: [
      { id: "received", label: "Received", value: clm.received },
      { id: "approved", label: "Approved", value: stages[3] + stages[4] + stages[5] + stages[6] },
      { id: "initiated", label: "Payment initiated", value: stages[4] + stages[5] + stages[6] },
      { id: "disbursed", label: "Successfully disbursed", value: stages[5] },
    ],
    pipeline: KSU_CLAIM_STAGES.map((stage, index) => ({ id: stage.id, label: stage.name, value: stages[index] })),
    beneficiaryTrend: {
      months: KSU_MONTHS.slice(x.win.first, x.win.last + 1).map((month) => month.short),
      monthIndexes: KSU_MONTHS.slice(x.win.first, x.win.last + 1).map((month) => month.index),
      series: KSU_SCHEMES.map((scheme, s) => ({ id: scheme.id, name: scheme.short, values: slice(clm.beneficiariesBySchemeMonth[s], x.win.first, x.win.last) })),
    },
    notAffectedBy: { enrolments: ["Registration status", "Claim status", "Benefit type"], claims: CLAIM_NOT },
  }
}

function buildClaims(x: Computed): KsuClaimsSection {
  const { clm, win } = x
  const days = clm.decisionDays
  return {
    byBenefit: KSU_BENEFITS.map((benefit, index) => ({
      id: benefit.id,
      name: benefitLabel(index),
      scheme: KSU_SCHEMES.find((scheme) => scheme.id === benefit.schemeId)?.short ?? "",
      value: clm.receivedByBenefit[index],
    })),
    pendingAge: { buckets: KSU_PENDING_BUCKETS, verification: clm.pendingAge[0], returned: clm.pendingAge[1], total: clm.pending },
    processing: {
      rows: KSU_SCHEMES.map((scheme, s) => ({
        id: scheme.id,
        name: scheme.short,
        avg: round1(mean(clm.decisionDaysByScheme[s])),
        median: median(clm.decisionDaysByScheme[s]),
        decided: clm.decisionDaysByScheme[s].length,
      })),
      avg: round1(mean(days)),
      median: median(days),
      decided: days.length,
    },
    reasons: KSU_REASONS.map((name, index) => ({ id: String(index), name, value: clm.reasons[index] })).sort((a, b) => b.value - a.value),
    unpaidAge: { buckets: KSU_PENDING_BUCKETS, counts: clm.unpaidBuckets, amounts: clm.unpaidAmountBuckets, totalCount: clm.unpaid, totalAmount: clm.unpaidAmount },
    payments: {
      months: KSU_MONTHS.slice(win.first, win.last + 1).map((month) => month.short),
      monthIndexes: KSU_MONTHS.slice(win.first, win.last + 1).map((month) => month.index),
      amount: slice(clm.paidAmountByMonth, win.first, win.last),
      count: slice(clm.paidCountByMonth, win.first, win.last),
      totalAmount: clm.paidAmount,
      totalCount: clm.paidCount,
    },
    notAffectedBy: CLAIM_NOT,
  }
}

export function financeFor(x: Computed): KsuFinanceSection {
  const { D, scope, win } = x
  const year = KSU_MONTHS[win.last].financialYear
  const yearInfo = KSU_FINANCIAL_YEARS.find((item) => item.id === year) ?? KSU_FINANCIAL_YEARS[1]
  const ledger = computeLedger(D, scope.scheme, year, win.last)
  const rows = ledger.map((row) => ({
    id: KSU_SCHEMES[row.schemeIndex].id,
    name: KSU_SCHEMES[row.schemeIndex].short,
    allocation: row.allocation,
    released: row.released,
    approved: row.approved,
    disbursed: row.disbursed,
    expenditure: row.expenditure,
    utilisation: row.allocation > 0 ? Math.round((row.expenditure / row.allocation) * 1000) / 10 : null,
  }))
  const sum = (key: "allocation" | "released" | "approved" | "disbursed" | "expenditure") => rows.reduce((total, row) => total + row[key], 0)
  const totals = { allocation: sum("allocation"), released: sum("released"), approved: sum("approved"), disbursed: sum("disbursed"), expenditure: sum("expenditure"), utilisation: null as number | null }
  totals.utilisation = totals.allocation > 0 ? Math.round((totals.expenditure / totals.allocation) * 1000) / 10 : null
  const trend = Object.keys(FINANCIAL_YEAR_MONTHS)
    .filter((id) => FINANCIAL_YEAR_MONTHS[id][0] <= win.last)
    .map((id) => {
      const lines = computeLedger(D, scope.scheme, id, win.last)
      const partial = FINANCIAL_YEAR_MONTHS[id][1] > win.last
      return {
        id,
        label: `FY ${id}${partial ? ` to ${KSU_MONTHS[win.last].short}` : ""}`,
        approved: lines.reduce((total, row) => total + row.approved, 0),
        disbursed: lines.reduce((total, row) => total + row.disbursed, 0),
        expenditure: lines.reduce((total, row) => total + row.expenditure, 0),
      }
    })
  return {
    yearLabel: yearInfo.label,
    asOf: formatLongDate(isoOfDay(win.endDay)),
    rows,
    totals,
    trend,
    note: "Allocation, release and the administrative share of expenditure are a sample ledger standing in for the Board's approved budget. Allocation, release, approval, expenditure and disbursement are different stages and are not netted against each other. No fund balance is shown because the ledger is not complete.",
    notAffectedBy: ["District", "Occupation", "Gender", "Age group", "Registration status", "Claim status", "Benefit type"],
  }
}

function buildFacilitation(x: Computed): KsuFacilitationSection {
  const { D, reg, win, scope } = x
  const months = KSU_MONTHS.slice(win.first, win.last + 1)
  const other = months.map((month) => {
    let total = 0
    KSU_DISTRICTS.forEach((_, d) => {
      if (scope.dist >= 0 && d !== scope.dist) return
      total += D.kskOther[d * 18 + month.index]
    })
    return total
  })
  const facilitated = months.map((month) => reg.kskByMonth[month.index])
  const services = months.map((_, index) => facilitated[index] + other[index])
  const districts = KSU_DISTRICTS.map((district, d) => {
    let total = reg.kskByDistrict[d]
    if (scope.dist < 0 || d === scope.dist) for (const month of months) total += D.kskOther[d * 18 + month.index]
    return { id: district.id, name: district.name, value: scope.dist >= 0 && d !== scope.dist ? 0 : total }
  })
  return {
    months: months.map((month) => month.short),
    monthIndexes: months.map((month) => month.index),
    services,
    facilitated,
    districts: districts.sort((a, b) => b.value - a.value),
    totals: {
      services: services.reduce((sum, value) => sum + value, 0),
      facilitated: facilitated.reduce((sum, value) => sum + value, 0),
      districtsServed: districts.filter((item) => item.value > 0).length,
    },
    unavailable: [
      { title: "Enquiries and grievances", reason: "Data not available. KSUWSSB's own grievance tracking has not been confirmed, so no figure is shown." },
      { title: "Outreach events", reason: "Data not available. No validated source has been identified for outreach activity." },
    ],
    notAffectedBy: ["Scheme", "Occupation", "Gender", "Age group", "Registration status", "Claim status", "Benefit type"],
  }
}

function buildPriority(x: Computed): KsuPriorityRow[] {
  const { clm } = x
  const rows: KsuPriorityRow[] = []
  for (const [key, pair] of clm.pairs) {
    const d = Math.floor(key / KSU_SCHEMES.length)
    const s = key % KSU_SCHEMES.length
    const beyond = pair.pending > 0 && pair.oldest > KSU_SERVICE_TARGET_DAYS
    if (!beyond && pair.unpaid === 0) continue
    rows.push({
      key: `${KSU_DISTRICTS[d].id}:${KSU_SCHEMES[s].id}`,
      districtId: KSU_DISTRICTS[d].id,
      district: KSU_DISTRICTS[d].name,
      schemeId: KSU_SCHEMES[s].id,
      scheme: KSU_SCHEMES[s].short,
      pending: pair.pending,
      oldestAge: pair.pending > 0 ? pair.oldest : 0,
      ageBucket: pair.pending > 0 ? KSU_PENDING_BUCKETS[bucketOf(pair.oldest)] : "None pending",
      approvedUnpaid: pair.unpaid,
      approvedUnpaidAmount: pair.unpaidAmount,
      lastUpdated: isoOfDay(pair.last),
      note: beyond ? `Pending beyond the ${KSU_SERVICE_TARGET_DAYS}-day service target` : "Approved cases awaiting payment",
    })
  }
  return rows.sort((a, b) => b.oldestAge - a.oldestAge || b.pending - a.pending || a.district.localeCompare(b.district))
}

export function buildKsuOverview(filters: KsuFilters): KsuOverview {
  const x = computeKsu(filters)
  const { D, reg, clm, win, scope } = x

  const districts: KsuMapDistrict[] = KSU_DISTRICTS.map((district, d) => ({
    id: district.id,
    name: district.name,
    drawn: district.drawn,
    registered: reg.distValid[d],
    enrolments: reg.distEnrol[d],
    beneficiaries: clm.beneficiariesByDist[d],
    received: clm.receivedByDist[d],
    pending: clm.pendingByDist[d],
    disbursed: clm.paidAmountByDist[d],
  }))
  const districtRows: KsuDistrictRow[] = KSU_DISTRICTS.map((district, d) => ({
    id: district.id,
    name: district.name,
    registered: reg.distValid[d],
    baseline: D.baseline[d],
    coverage: D.baseline[d] > 0 ? Math.round((reg.distValid[d] / D.baseline[d]) * 1000) / 10 : 0,
    enrolments: reg.distEnrol[d],
    received: clm.receivedByDist[d],
    pending: clm.pendingByDist[d],
    disbursed: clm.paidAmountByDist[d],
    eshram: D.eshram[d],
  }))

  const named = (items: { id: string; name: string }[], counts: number[]) => items.map((item, index) => ({ id: item.id, name: item.name, value: counts[index] }))
  const demographics: KsuDemographics = {
    occupations: named(KSU_OCCUPATIONS, reg.occupations).sort((a, b) => b.value - a.value),
    genders: named(KSU_GENDERS, reg.genders),
    ages: named(KSU_AGE_GROUPS, reg.ages),
    settlement: [
      { id: "rural", name: "Rural", value: reg.settlement[0] },
      { id: "urban", name: "Urban", value: reg.settlement[1] },
    ],
    statuses: named(KSU_REG_STATUSES, reg.statusCounts),
    total: reg.valid,
    notAffectedBy: { demographics: REG_NOT, status: REG_NOT },
  }

  const months = KSU_MONTHS.slice(win.first, win.last + 1)
  const sources = sourceStatuses()
  const kpis = buildKpis(x)
  const eshramTotal = D.eshram.reduce((sum, value, d) => sum + (scope.dist < 0 || d === scope.dist ? value : 0), 0)
  const activeFilters = KSU_FILTER_KEYS.filter((key) => filters[key] !== "all").map((key) => ({ key, label: FILTER_LABELS[key], value: filterValueName(key, filters[key]) }))
  const districtsActive = KSU_DISTRICTS.filter((_, d) => reg.distValid[d] > 0 || clm.receivedByDist[d] > 0 || clm.pendingByDist[d] > 0).length
  const strip: KsuStat[] = [
    { id: "cards", label: "Smart cards issued", displayValue: formatCount(reg.cards), hint: "Cards issued up to the last day.", sourceIds: ["registry"] },
    { id: "awaiting", label: "Awaiting verification", displayValue: formatCount(reg.statusCounts[1]), hint: "Registrations received and not yet decided on the last day.", sourceIds: ["registry"] },
    { id: "rejected", label: "Rejected or returned registrations", displayValue: formatCount(reg.statusCounts[2]), hint: "Registrations rejected or returned for correction.", sourceIds: ["registry"] },
    { id: "unpaid", label: "Approved, not yet paid", displayValue: formatCount(clm.unpaid), hint: KSU_UNPAID_NOTE, sourceIds: ["approvals", "payments"] },
    { id: "avgtime", label: "Average processing time", displayValue: clm.decisionDays.length ? `${round1(mean(clm.decisionDays))} days` : "No decisions", hint: "Mean days from receipt to decision for cases decided in the period.", sourceIds: ["approvals"] },
    { id: "occupations", label: "Occupation categories", displayValue: formatCount(reg.occupations.filter((value) => value > 0).length), hint: "Occupation categories with registered workers.", sourceIds: ["registry"] },
    { id: "districts", label: "Districts with activity", displayValue: formatCount(districtsActive), hint: "Districts with registered workers or cases.", sourceIds: ["registry", "applications"] },
    { id: "ksk", label: "Facilitation services", displayValue: "", hint: "Karmika Seva Kendra services in the period, including registration support.", sourceIds: ["facilitation"] },
  ]
  const facilitation = buildFacilitation(x)
  strip[7].displayValue = formatCount(facilitation.totals.services)

  const scopeLabel = activeFilters.length === 0 ? "All districts, schemes and occupations" : activeFilters.map((item) => item.value).join(", ")

  return {
    title: "Karnataka State Unorganised Workers' Social Security Board",
    subtitle: "Worker Welfare & Social Security Intelligence Portal",
    illustrativeNote:
      "Illustrative POC Data. Every figure on this page is synthetic and generated for demonstration. None of it is a government statistic or a Board record. Published reference figures are shown separately and are labelled with their source.",
    source: "Synthetic extract of 130,000 worker records and their cases, April 2025 to September 2026",
    lastRefreshed: formatLongDate(KSU_LAST_REFRESH.slice(0, 10)) + ", " + KSU_LAST_REFRESH.slice(11, 16) + " IST",
    reportingDate: formatLongDate(KSU_REPORTING_DATE),
    periodLabel: periodText(win.first, win.last),
    asOfLabel: formatLongDate(isoOfDay(win.endDay)),
    scopeLabel,
    filters,
    activeFilters,
    empty: reg.inScope === 0 && clm.rows === 0,
    months: months.map((month) => ({ index: month.index, short: month.short, label: month.label })),
    kpis,
    strip,
    registration: {
      months: months.map((month) => month.short),
      monthIndexes: months.map((month) => month.index),
      newRegistrations: slice(reg.newByMonth, win.first, win.last),
      validStock: slice(reg.validStock, win.first, win.last),
      notAffectedBy: ["Scheme", "Claim status", "Benefit type"],
    },
    demographics,
    districts,
    districtRows,
    schemes: buildSchemes(x),
    claims: buildClaims(x),
    finance: financeFor(x),
    facilitation,
    eshram: { total: eshramTotal, note: KSU_ESHRAM_NOTE },
    priority: buildPriority(x),
    priorityTarget: KSU_SERVICE_TARGET_DAYS,
    sources,
    published: KSU_PUBLISHED,
    definitions: KSU_DEFINITIONS,
    datasets: KSU_DATASETS,
    notes: {
      counting:
        "Workers are counted once, by synthetic worker ID. Scheme enrolments can overlap, so they are never labelled as unique workers. Records, workers, cases, approvals and payments are kept apart.",
      payments:
        "Approval is a decision and payment is a separate event. Payment initiated is not payment received. Only payments that completed successfully count as disbursed.",
      period: "Dates are applied to whole calendar months. Stock figures are taken on the last day of the last month in the period.",
      classification:
        "Rural and urban classification, the estimated worker baseline, occupation categories, benefit amounts and the service target are sample configuration. They must be replaced with the Board's own lists and rules.",
    },
  }
}
