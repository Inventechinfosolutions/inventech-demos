import {
  KSU_ADMIN_RATE,
  KSU_AGE_GROUPS,
  KSU_BENEFITS,
  KSU_CLAIM_STAGES,
  KSU_DISTRICTS,
  KSU_GENDERS,
  KSU_MONTHS,
  KSU_OCCUPATIONS,
  KSU_REASONS,
  KSU_REG_STATUSES,
  KSU_SCHEMES,
  bucketOf,
  monthOfDay,
  monthOfIso,
} from "@/data/ksuMasters"
import { KIND_APPROVED, KIND_REJECTED, NEVER, getKsuData, type KsuData } from "@/services/ksuData"
import type { KsuFilters } from "@/types/ksu"

const SCHEMES = KSU_SCHEMES.length
const DISTRICTS = KSU_DISTRICTS.length
const BENEFITS = KSU_BENEFITS.length

export interface Scope {
  dist: number
  occ: number
  gender: number
  age: number
  scheme: number
  benefit: number
  stage: number
  regStatus: number
  /** True when the chosen scheme and benefit type cannot occur together. */
  impossible: boolean
}

export interface Win {
  first: number
  last: number
  startDay: number
  endDay: number
}

const indexOf = (items: { id: string }[], id: string) => (id === "all" ? -1 : items.findIndex((item) => item.id === id))

export function scopeOf(filters: KsuFilters): Scope {
  const scheme = indexOf(KSU_SCHEMES, filters.schemeId)
  const benefit = indexOf(KSU_BENEFITS, filters.benefitType)
  return {
    dist: indexOf(KSU_DISTRICTS, filters.districtId),
    occ: indexOf(KSU_OCCUPATIONS, filters.occupationId),
    gender: indexOf(KSU_GENDERS, filters.gender),
    age: indexOf(KSU_AGE_GROUPS, filters.ageGroup),
    scheme,
    benefit,
    stage: indexOf(KSU_CLAIM_STAGES, filters.claimStatus),
    regStatus: indexOf(KSU_REG_STATUSES, filters.registrationStatus),
    impossible: scheme >= 0 && benefit >= 0 && KSU_SCHEMES[scheme].id !== KSU_BENEFITS[benefit].schemeId,
  }
}

/** Dates are applied to whole calendar months. */
export function windowOf(filters: KsuFilters): Win {
  const first = monthOfIso(filters.fromDate)
  const last = Math.max(first, monthOfIso(filters.toDate))
  return { first, last, startDay: KSU_MONTHS[first].startDay, endDay: KSU_MONTHS[last].endDay }
}

/** The window of the same length straight before, or null when the extract does not reach back that far. */
export function previousWindow(win: Win): Win | null {
  const length = win.last - win.first + 1
  const first = win.first - length
  if (first < 0) return null
  const last = win.first - 1
  return { first, last, startDay: KSU_MONTHS[first].startDay, endDay: KSU_MONTHS[last].endDay }
}

/** Where a case stands on a given day. -1 when it had not been received. */
export function stageAt(D: KsuData, c: number, day: number): number {
  const k = D.claims
  if (k.recv[c] > day) return -1
  if (k.dec[c] > day) return k.ret[c] >= 0 && k.ret[c] <= day ? 1 : 0
  if (k.kind[c] === KIND_REJECTED) return 2
  if (k.init[c] > day) return 3
  if (k.pay[c] === 1) return k.end[c] <= day ? 5 : 4
  if (k.pay[c] === 2) return k.end[c] <= day ? 6 : 4
  return 4
}

/** Registration state of a worker at the end of a month: 0 verified, 1 pending, 2 rejected, 3 inactive. -1 if not yet registered. */
export function workerStatusAt(D: KsuData, i: number, month: number): number {
  if (D.reg[i] > month) return -1
  if (D.dec[i] > month) return 1
  if (D.rejected[i]) return 2
  if (D.exp[i] <= month) return 3
  return 0
}

export interface RegResult {
  last: number
  inScope: number
  validStock: number[]
  enrolStock: number[]
  valid: number
  statusCounts: number[]
  occupations: number[]
  genders: number[]
  ages: number[]
  settlement: number[]
  distValid: number[]
  distEnrol: number[]
  newTotal: number
  newByMonth: number[]
  enrolByScheme: number[]
  enrolTotal: number
  uniqueEnrolled: number
  cards: number
  kskByMonth: number[]
  kskByDistrict: number[]
}

export function computeReg(D: KsuData, s: Scope, win: Win): RegResult {
  const T = win.last
  const result: RegResult = {
    last: T,
    inScope: 0,
    validStock: [],
    enrolStock: [],
    valid: 0,
    statusCounts: [0, 0, 0, 0],
    occupations: new Array(KSU_OCCUPATIONS.length).fill(0),
    genders: new Array(KSU_GENDERS.length).fill(0),
    ages: new Array(KSU_AGE_GROUPS.length).fill(0),
    settlement: [0, 0],
    distValid: new Array(DISTRICTS).fill(0),
    distEnrol: new Array(DISTRICTS).fill(0),
    newTotal: 0,
    newByMonth: new Array(18).fill(0),
    enrolByScheme: new Array(SCHEMES).fill(0),
    enrolTotal: 0,
    uniqueEnrolled: 0,
    cards: 0,
    kskByMonth: new Array(18).fill(0),
    kskByDistrict: new Array(DISTRICTS).fill(0),
  }
  const validDiff = new Int32Array(19)
  const enrolDiff = new Int32Array(19)

  for (let i = 0; i < D.n; i += 1) {
    const d = D.dist[i]
    if (s.dist >= 0 && d !== s.dist) continue
    const reg = D.reg[i]
    // Facilitation is only narrowed by district.
    if (D.ksk[i] && reg >= win.first && reg <= T) {
      result.kskByMonth[reg] += 1
      result.kskByDistrict[d] += 1
    }
    if (s.occ >= 0 && D.occ[i] !== s.occ) continue
    if (s.gender >= 0 && D.gender[i] !== s.gender) continue
    if (s.age >= 0 && D.age[i] !== s.age) continue

    const dec = D.dec[i]
    const exp = D.exp[i]
    if (!D.rejected[i] && dec <= 17) {
      const end = exp > 18 ? 18 : exp
      const from = dec < 0 ? 0 : dec
      if (from < end) {
        validDiff[from] += 1
        validDiff[end] -= 1
      }
      for (let k = 0; k < SCHEMES; k += 1) {
        const en = D.enrol[k][i]
        if (en === NEVER || en > 17 || (s.scheme >= 0 && s.scheme !== k)) continue
        const start = en < 0 ? 0 : en
        if (start < end) {
          enrolDiff[start] += 1
          enrolDiff[end] -= 1
        }
      }
    }

    if (reg > T) continue
    result.inScope += 1
    const status = workerStatusAt(D, i, T)
    result.statusCounts[status] += 1
    if (reg >= win.first && (s.regStatus < 0 || status === s.regStatus)) {
      result.newByMonth[reg] += 1
      result.newTotal += 1
    }
    if (D.card[i] <= T) result.cards += 1
    if (status !== 0) continue
    result.valid += 1
    result.occupations[D.occ[i]] += 1
    result.genders[D.gender[i]] += 1
    result.ages[D.age[i]] += 1
    result.settlement[D.urban[i]] += 1
    result.distValid[d] += 1
    let any = false
    for (let k = 0; k < SCHEMES; k += 1) {
      if (s.scheme >= 0 && s.scheme !== k) continue
      if (D.enrol[k][i] <= T) {
        result.enrolByScheme[k] += 1
        result.enrolTotal += 1
        result.distEnrol[d] += 1
        any = true
      }
    }
    if (any) result.uniqueEnrolled += 1
  }

  let valid = 0
  let enrolled = 0
  for (let t = 0; t < 18; t += 1) {
    valid += validDiff[t]
    enrolled += enrolDiff[t]
    result.validStock.push(valid)
    result.enrolStock.push(enrolled)
  }
  return result
}

export interface PairInfo {
  pending: number
  oldest: number
  unpaid: number
  unpaidAmount: number
  last: number
}

export interface ClmResult {
  Tday: number
  rows: number
  received: number
  receivedByMonth: number[]
  receivedByScheme: number[]
  receivedByBenefit: number[]
  receivedByDist: number[]
  /** Cases received in the window, by where they stand on the last day. */
  stageCounts: number[]
  approvedCount: number
  approvedAmount: number
  approvedByScheme: number[]
  approvedAmountByScheme: number[]
  approvedAmountByMonth: number[]
  paidCount: number
  paidAmount: number
  paidCountByMonth: number[]
  paidAmountByMonth: number[]
  paidByScheme: number[]
  paidAmountByScheme: number[]
  paidAmountByDist: number[]
  paidByDist: number[]
  beneficiaries: number
  beneficiariesByScheme: number[]
  beneficiariesByMonth: number[]
  beneficiariesBySchemeMonth: number[][]
  beneficiariesByDist: number[]
  pending: number
  pendingByStage: number[]
  pendingByDist: number[]
  pendingByScheme: number[]
  pendingAge: number[][]
  pendingByMonth: number[]
  unpaid: number
  unpaidAmount: number
  unpaidBuckets: number[]
  unpaidAmountBuckets: number[]
  unpaidByDist: number[]
  decisionDays: number[]
  decisionDaysByScheme: number[][]
  reasons: number[]
  pairs: Map<number, PairInfo>
}

/** Visits every case the filters allow that had been received by the given day. */
export function eachClaim(D: KsuData, s: Scope, day: number, visit: (c: number, stage: number) => void) {
  if (s.impossible) return
  const k = D.claims
  for (let c = 0; c < k.n; c += 1) {
    if (k.recv[c] > day) continue
    if (s.scheme >= 0 && k.scheme[c] !== s.scheme) continue
    if (s.benefit >= 0 && k.benefit[c] !== s.benefit) continue
    const w = k.worker[c]
    if (s.dist >= 0 && D.dist[w] !== s.dist) continue
    if (s.occ >= 0 && D.occ[w] !== s.occ) continue
    if (s.gender >= 0 && D.gender[w] !== s.gender) continue
    if (s.age >= 0 && D.age[w] !== s.age) continue
    const stage = stageAt(D, c, day)
    if (s.stage >= 0 && stage !== s.stage) continue
    visit(c, stage)
  }
}

const zeros = (length: number) => new Array<number>(length).fill(0)

export function computeClaims(D: KsuData, s: Scope, win: Win): ClmResult {
  const Tday = win.endDay
  const k = D.claims
  const result: ClmResult = {
    Tday,
    rows: 0,
    received: 0,
    receivedByMonth: zeros(18),
    receivedByScheme: zeros(SCHEMES),
    receivedByBenefit: zeros(BENEFITS),
    receivedByDist: zeros(DISTRICTS),
    stageCounts: zeros(KSU_CLAIM_STAGES.length),
    approvedCount: 0,
    approvedAmount: 0,
    approvedByScheme: zeros(SCHEMES),
    approvedAmountByScheme: zeros(SCHEMES),
    approvedAmountByMonth: zeros(18),
    paidCount: 0,
    paidAmount: 0,
    paidCountByMonth: zeros(18),
    paidAmountByMonth: zeros(18),
    paidByScheme: zeros(SCHEMES),
    paidAmountByScheme: zeros(SCHEMES),
    paidAmountByDist: zeros(DISTRICTS),
    paidByDist: zeros(DISTRICTS),
    beneficiaries: 0,
    beneficiariesByScheme: zeros(SCHEMES),
    beneficiariesByMonth: zeros(18),
    beneficiariesBySchemeMonth: Array.from({ length: SCHEMES }, () => zeros(18)),
    beneficiariesByDist: zeros(DISTRICTS),
    pending: 0,
    pendingByStage: [0, 0],
    pendingByDist: zeros(DISTRICTS),
    pendingByScheme: zeros(SCHEMES),
    pendingAge: [zeros(5), zeros(5)],
    pendingByMonth: zeros(18),
    unpaid: 0,
    unpaidAmount: 0,
    unpaidBuckets: zeros(5),
    unpaidAmountBuckets: zeros(5),
    unpaidByDist: zeros(DISTRICTS),
    decisionDays: [],
    decisionDaysByScheme: Array.from({ length: SCHEMES }, () => [] as number[]),
    reasons: zeros(KSU_REASONS.length),
    pairs: new Map(),
  }
  const seen = new Set<number>()
  const seenScheme = new Set<number>()
  const seenMonth = new Set<number>()
  const seenSchemeMonth = new Set<number>()

  eachClaim(D, s, Tday, (c, stage) => {
    result.rows += 1
    const w = k.worker[c]
    const d = D.dist[w]
    const scheme = k.scheme[c]
    const recv = k.recv[c]
    const dec = k.dec[c]
    const end = k.end[c]
    const amount = k.amount[c]
    const kind = k.kind[c]
    const pairKey = d * SCHEMES + scheme
    let pair = result.pairs.get(pairKey)
    if (!pair) {
      pair = { pending: 0, oldest: 0, unpaid: 0, unpaidAmount: 0, last: 0 }
      result.pairs.set(pairKey, pair)
    }
    for (const day of [recv, dec, k.init[c], end]) if (day >= 0 && day <= Tday && day > pair.last) pair.last = day

    // Open cases at the end of each month in the window.
    const closes = dec
    for (let t = win.first; t <= win.last; t += 1) {
      const monthEnd = KSU_MONTHS[t].endDay
      if (recv <= monthEnd && closes > monthEnd) result.pendingByMonth[t] += 1
    }

    if (recv >= win.startDay) {
      result.received += 1
      result.receivedByMonth[monthOfDay(recv)] += 1
      result.receivedByScheme[scheme] += 1
      result.receivedByBenefit[k.benefit[c]] += 1
      result.receivedByDist[d] += 1
      result.stageCounts[stage] += 1
    }

    if (stage === 0 || stage === 1) {
      result.pending += 1
      result.pendingByStage[stage] += 1
      result.pendingByDist[d] += 1
      result.pendingByScheme[scheme] += 1
      const age = Tday - recv
      result.pendingAge[stage][bucketOf(age)] += 1
      pair.pending += 1
      if (age > pair.oldest) pair.oldest = age
    }

    if (stage === 3 || stage === 4 || stage === 6) {
      result.unpaid += 1
      result.unpaidAmount += amount
      const bucket = bucketOf(Tday - dec)
      result.unpaidBuckets[bucket] += 1
      result.unpaidAmountBuckets[bucket] += amount
      result.unpaidByDist[d] += 1
      pair.unpaid += 1
      pair.unpaidAmount += amount
    }

    if (kind === KIND_APPROVED && dec >= win.startDay && dec <= Tday) {
      result.approvedCount += 1
      result.approvedAmount += amount
      result.approvedByScheme[scheme] += 1
      result.approvedAmountByScheme[scheme] += amount
      const month = monthOfDay(dec)
      result.approvedAmountByMonth[month] += amount
      if (!seen.has(w)) {
        seen.add(w)
        result.beneficiaries += 1
        result.beneficiariesByDist[d] += 1
      }
      const schemeKey = w * SCHEMES + scheme
      if (!seenScheme.has(schemeKey)) {
        seenScheme.add(schemeKey)
        result.beneficiariesByScheme[scheme] += 1
      }
      const monthKey = w * 18 + month
      if (!seenMonth.has(monthKey)) {
        seenMonth.add(monthKey)
        result.beneficiariesByMonth[month] += 1
      }
      const schemeMonthKey = (w * SCHEMES + scheme) * 18 + month
      if (!seenSchemeMonth.has(schemeMonthKey)) {
        seenSchemeMonth.add(schemeMonthKey)
        result.beneficiariesBySchemeMonth[scheme][month] += 1
      }
    }
    if (dec >= win.startDay && dec <= Tday) {
      const days = dec - recv
      result.decisionDays.push(days)
      result.decisionDaysByScheme[scheme].push(days)
    }
    // A reason is counted once: when the case was returned, or when it was rejected without being returned.
    const ret = k.ret[c]
    if (ret >= 0) {
      if (ret >= win.startDay && ret <= Tday) result.reasons[k.reason[c]] += 1
    } else if (kind === KIND_REJECTED && dec >= win.startDay && dec <= Tday) result.reasons[k.reason[c]] += 1

    if (kind === KIND_APPROVED && k.pay[c] === 1 && end >= win.startDay && end <= Tday) {
      const month = monthOfDay(end)
      result.paidCount += 1
      result.paidAmount += amount
      result.paidCountByMonth[month] += 1
      result.paidAmountByMonth[month] += amount
      result.paidByScheme[scheme] += 1
      result.paidAmountByScheme[scheme] += amount
      result.paidAmountByDist[d] += amount
      result.paidByDist[d] += 1
    }
  })
  return result
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export const mean = (values: number[]): number | null => (values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length)

// ---------------------------------------------------------------- financial ledger

export interface LedgerRow {
  schemeIndex: number
  allocation: number
  released: number
  approved: number
  disbursed: number
  expenditure: number
}

const FY_MONTHS: Record<string, [number, number]> = { "2025-26": [0, 11], "2026-27": [12, 17] }
let allocationCache: Record<string, number[]> | null = null

const roundUp = (value: number, step: number) => Math.ceil(value / step) * step

/**
 * Sample annual allocations, set from the 2025-26 disbursements so that the ledger is plausible.
 * They stand in for the Board's approved budget, which is not available to the POC.
 */
function allocations(D: KsuData): Record<string, number[]> {
  if (allocationCache) return allocationCache
  const paid = zeros(SCHEMES)
  const k = D.claims
  for (let c = 0; c < k.n; c += 1) {
    if (k.kind[c] === KIND_APPROVED && k.pay[c] === 1 && monthOfDay(k.end[c]) <= 11) paid[k.scheme[c]] += k.amount[c]
  }
  const first = paid.map((value) => Math.max(1000000, roundUp(value * 1.6, 500000)))
  allocationCache = { "2025-26": first, "2026-27": first.map((value) => roundUp(value * 1.2, 500000)) }
  return allocationCache
}

/** Ledger for one financial year up to a month, for the schemes allowed. Nothing else narrows it. */
export function computeLedger(D: KsuData, schemeFilter: number, financialYear: string, upTo: number): LedgerRow[] {
  const [fyFirst, fyLast] = FY_MONTHS[financialYear]
  const end = Math.min(fyLast, upTo)
  const k = D.claims
  const alloc = allocations(D)[financialYear]
  const rows: LedgerRow[] = []
  for (let s = 0; s < SCHEMES; s += 1) {
    if (schemeFilter >= 0 && s !== schemeFilter) continue
    let approved = 0
    let disbursed = 0
    for (let c = 0; c < k.n; c += 1) {
      if (k.scheme[c] !== s || k.kind[c] !== KIND_APPROVED) continue
      const decided = monthOfDay(k.dec[c])
      if (decided >= fyFirst && decided <= end) approved += k.amount[c]
      if (k.pay[c] === 1) {
        const paidMonth = monthOfDay(k.end[c])
        if (paidMonth >= fyFirst && paidMonth <= end) disbursed += k.amount[c]
      }
    }
    // Funds are released in four equal instalments, at the start of each quarter.
    let instalments = 0
    for (const offset of [0, 3, 6, 9]) if (fyFirst + offset <= end) instalments += 1
    rows.push({
      schemeIndex: s,
      allocation: alloc[s],
      released: Math.round((alloc[s] / 4) * instalments),
      approved,
      disbursed,
      expenditure: Math.round(disbursed * (1 + KSU_ADMIN_RATE)),
    })
  }
  return rows
}

export const FINANCIAL_YEAR_MONTHS = FY_MONTHS

export interface Computed {
  D: KsuData
  scope: Scope
  win: Win
  prevWin: Win | null
  reg: RegResult
  clm: ClmResult
  prevReg: RegResult | null
  prevClm: ClmResult | null
}

export function computeKsu(filters: KsuFilters): Computed {
  const D = getKsuData()
  const scope = scopeOf(filters)
  const win = windowOf(filters)
  const prevWin = previousWindow(win)
  return {
    D,
    scope,
    win,
    prevWin,
    reg: computeReg(D, scope, win),
    clm: computeClaims(D, scope, win),
    prevReg: prevWin ? computeReg(D, scope, prevWin) : null,
    prevClm: prevWin ? computeClaims(D, scope, prevWin) : null,
  }
}
