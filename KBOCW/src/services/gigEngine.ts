import raw from "@/data/gig-workers.json" with { type: "json" }
import { formatCount, formatCrore, formatInr, formatLakh, formatLongDate } from "@/lib/format"
import { GIG_STATUS_GROUPS } from "@/lib/gigQuery"
import type { GigFilterKey, GigFilters } from "@/types/gig"

// ---- Shape of the extract --------------------------------------------------------------------
interface Named { id: string; name: string }
interface RawMonth { index: number; label: string; short: string; startDay: number; days: number; quarter: number; financialYear: string }
interface RawAggregator { id: string; name: string; sectorId: string; start: number; reporting: boolean; dupRate: number; validationRate: number; returns: number[] }
interface RawScheme { id: string; name: string; operational: boolean }
interface RawReturns { aggregatorId: string; submitted: (string | null)[]; decl: number[]; dep: number[]; rec: number[]; recStatus: number[]; received: (string | null)[] }
interface RawData {
  meta: {
    title: string
    source: string
    reportingDate: string
    lastRefreshed: string
    illustrativeNote: string
    boundaryNote: string
    locationNote: string
    activityRuleNote: string
    feeNote: string
    schemeNote: string
    benchmark: { text: string; source: string; date: string; url: string }
  }
  totalDays: number
  months: RawMonth[]
  quarters: { index: number; label: string; short: string; financialYear: string; from: string; to: string; due: string }[]
  districts: { id: string; name: string; drawn: boolean }[]
  cities: { id: string; name: string; districtId: string }[]
  sectors: Named[]
  aggregators: RawAggregator[]
  genders: Named[]
  ageGroups: Named[]
  grievanceCategories: Named[]
  accidentTypes: Named[]
  schemes: RawScheme[]
  config: {
    sectorBase: number[]
    sectorTicket: number[]
    levelFactor: number[]
    seasonFactor: number[]
    platformShare: number[]
    feeRates: { sectorId: string; ratePct: number; effectiveFrom: string }[]
    returnWindowDays: number
    grievanceTargetDays: number
    claimTargetDays: number
    exceptionRules: { shortfallShare: number; highShortfallRupees: number; highRecordCount: number; validationShare: number }
  }
  fund: { openingBalance: number; monthly: { stateGrant: number; centralGrant: number; donations: number; otherReceipts: number; admin: number; programme: number; otherExpenditure: number; otherAdjustment: number }[] }
  returns: RawReturns[]
  sources: { id: string; name: string; updated: string; cadenceDays: number }[]
  workers: { rows: number[][] }
  applications: { rows: number[][] }
  grievances: { rows: number[][] }
  accidents: { rows: number[][] }
  trainings: number[][]
}

export const D = raw as unknown as RawData

export const NM = 12
export const NA = D.aggregators.length
export const ND = D.districts.length
export const NS = D.sectors.length
export const NSCHEME = D.schemes.length
export const NCAT = D.grievanceCategories.length
export const NTYPE = D.accidentTypes.length
export const MONTHS = D.months

// ---- Formatting helpers ----------------------------------------------------------------------
export const count = (value: number) => formatCount(value)
export function money(rupees: number): string {
  const absolute = Math.abs(rupees)
  if (absolute >= 10000000) return formatCrore(rupees)
  if (absolute >= 100000) return `${rupees < 0 ? "-" : ""}₹${formatLakh(absolute)}`
  return formatInr(rupees)
}
const EPOCH = Date.parse(`${(raw as unknown as { dataStart: string }).dataStart}T00:00:00Z`)
export const dayIso = (offset: number) => new Date(EPOCH + offset * 86400000).toISOString().slice(0, 10)
export const fmtDate = (iso: string) => formatLongDate(iso)
export const fmtStamp = (stamp: string) => `${formatLongDate(stamp.slice(0, 10))}, ${stamp.slice(11, 16)} IST`
export const isoDayNumber = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - EPOCH) / 86400000)
export const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
export const hashOf = (text: string) => {
  let value = 7
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) >>> 0
  return value
}

export const FILTER_LABEL: Record<GigFilterKey, string> = {
  districtId: "District",
  cityId: "City",
  aggregatorId: "Aggregator",
  sectorId: "Sector",
  activity: "Worker activity",
  gender: "Gender",
  ageGroup: "Age group",
  schemeId: "Scheme",
  grievanceCategory: "Grievance category",
  status: "Reporting or reconciliation status",
}

export const RETURN_LABEL = ["Filed on time", "Filed late", "Overdue, not filed", "Not yet due", "No data in the quarter"]
export const STAGE_LABELS = ["Under scrutiny", "Rejected", "Approved, awaiting payment", "Payment processing", "Disbursed", "Failed or returned"]

// ---- Precomputed columns ---------------------------------------------------------------------
const rows = D.workers.rows
export const N = rows.length
const dist = new Uint8Array(N)
const urban = new Uint8Array(N)
const gender = new Uint8Array(N)
const age = new Uint8Array(N)
const weight = new Uint16Array(N)
const recMonth = new Int8Array(N)
const boardMonth = new Int8Array(N)
const sepMonth = new Int8Array(N)
const level = new Uint8Array(N)
const mask = new Uint16Array(N)
const plat = new Int8Array(N * 3)
const nPlat = new Uint8Array(N)
for (let i = 0; i < N; i += 1) {
  const row = rows[i]
  dist[i] = row[0]
  urban[i] = row[1]
  gender[i] = row[2]
  age[i] = row[3]
  weight[i] = row[4]
  recMonth[i] = row[5]
  boardMonth[i] = row[6]
  sepMonth[i] = row[7]
  level[i] = row[8]
  mask[i] = row[9]
  plat[i * 3] = row[10]
  plat[i * 3 + 1] = row[11]
  plat[i * 3 + 2] = row[12]
  nPlat[i] = 1 + (row[11] >= 0 ? 1 : 0) + (row[12] >= 0 ? 1 : 0)
}
export const workerView = { dist, urban, gender, age, weight, recMonth, boardMonth, sepMonth, mask, plat, nPlat }

const sectorOfAgg = D.aggregators.map((aggregator) => D.sectors.findIndex((sector) => sector.id === aggregator.sectorId))
export const AGG_SECTOR = sectorOfAgg
const dupRate = D.aggregators.map((aggregator) => aggregator.dupRate)
const monthIso = MONTHS.map((month) => ({ start: dayIso(month.startDay), end: dayIso(month.startDay + month.days - 1) }))
export const MONTH_ISO = monthIso
export const dayMonth = (() => {
  const table = new Int8Array(D.totalDays)
  for (const month of MONTHS) for (let day = 0; day < month.days; day += 1) table[month.startDay + day] = month.index
  return table
})()
export const DISTRICT_INDEX = new Map(D.districts.map((district, index) => [district.id, index]))
const CITY_INDEX = new Map(D.cities.map((city, index) => [city.id, index]))
const AGG_INDEX = new Map(D.aggregators.map((aggregator, index) => [aggregator.id, index]))
const SECTOR_INDEX = new Map(D.sectors.map((sector, index) => [sector.id, index]))
const SCHEME_INDEX = new Map(D.schemes.map((scheme, index) => [scheme.id, index]))
const CAT_INDEX = new Map(D.grievanceCategories.map((category, index) => [category.id, index]))
const GENDER_INDEX = new Map(D.genders.map((item, index) => [item.id, index]))
const AGE_INDEX = new Map(D.ageGroups.map((item, index) => [item.id, index]))
export const aggIndexOf = (id: string) => AGG_INDEX.get(id) ?? -1
export const sectorIndexOf = (id: string) => SECTOR_INDEX.get(id) ?? -1

// Fee rate for a sector in a month: the latest entry whose effective date is on or before the month start.
const RATE: number[][] = D.sectors.map((sector) => {
  const entries = D.config.feeRates.filter((entry) => entry.sectorId === sector.id).sort((left, right) => (left.effectiveFrom < right.effectiveFrom ? -1 : 1))
  return MONTHS.map((_, month) => {
    let rate = 0
    for (const entry of entries) if (entry.effectiveFrom <= monthIso[month].start) rate = entry.ratePct / 100
    return rate
  })
})
export const rateFor = (sector: number, month: number) => RATE[sector][month]

// ---- Filters and scope -----------------------------------------------------------------------
export function resolveGigFilters(input: GigFilters): GigFilters {
  const next = { ...input }
  if (next.districtId !== "all" && !DISTRICT_INDEX.has(next.districtId)) next.districtId = "all"
  if (next.cityId !== "all" && !CITY_INDEX.has(next.cityId)) next.cityId = "all"
  if (next.aggregatorId !== "all" && !AGG_INDEX.has(next.aggregatorId)) next.aggregatorId = "all"
  if (next.sectorId !== "all" && !SECTOR_INDEX.has(next.sectorId)) next.sectorId = "all"
  if (next.schemeId !== "all" && !SCHEME_INDEX.has(next.schemeId)) next.schemeId = "all"
  if (next.grievanceCategory !== "all" && !CAT_INDEX.has(next.grievanceCategory)) next.grievanceCategory = "all"
  return next
}

export interface Scope {
  districtOk: Uint8Array
  urbanOnly: boolean
  gender: number
  age: number
  platOk: Uint8Array
  platFilter: boolean
  activity: "all" | "active" | "inactive"
  status: ((aggregator: number, month: number) => boolean) | null
  scheme: number
  category: number
}

export function makeScope(f: GigFilters): Scope {
  const districtOk = new Uint8Array(ND).fill(1)
  let urbanOnly = false
  if (f.districtId !== "all") {
    districtOk.fill(0)
    districtOk[DISTRICT_INDEX.get(f.districtId) as number] = 1
  }
  if (f.cityId !== "all") {
    const city = D.cities[CITY_INDEX.get(f.cityId) as number]
    const cityDistrict = DISTRICT_INDEX.get(city.districtId) as number
    for (let d = 0; d < ND; d += 1) if (d !== cityDistrict) districtOk[d] = 0
    urbanOnly = true
  }
  const platOk = new Uint8Array(NA).fill(1)
  const platFilter = f.aggregatorId !== "all" || f.sectorId !== "all"
  if (platFilter) {
    for (let p = 0; p < NA; p += 1) {
      const byAgg = f.aggregatorId === "all" || AGG_INDEX.get(f.aggregatorId) === p
      const bySector = f.sectorId === "all" || SECTOR_INDEX.get(f.sectorId) === sectorOfAgg[p]
      platOk[p] = byAgg && bySector ? 1 : 0
    }
  }
  let status: Scope["status"] = null
  if (f.status.startsWith("ret-")) {
    const code = { "ret-on-time": 0, "ret-late": 1, "ret-overdue": 2, "ret-not-due": 3 }[f.status] as number
    status = (p, t) => D.aggregators[p].returns[MONTHS[t].quarter] === code
  } else if (f.status.startsWith("rec-")) {
    const code = { "rec-pending": 0, "rec-partial": 1, "rec-done": 2 }[f.status] as number
    status = (p, t) => D.returns[p].recStatus[t] === code
  }
  return {
    districtOk,
    urbanOnly,
    gender: f.gender === "all" ? -1 : (GENDER_INDEX.get(f.gender) ?? -1),
    age: f.ageGroup === "all" ? -1 : (AGE_INDEX.get(f.ageGroup) ?? -1),
    platOk,
    platFilter,
    activity: f.activity === "active" ? "active" : f.activity === "inactive" ? "inactive" : "all",
    status,
    scheme: f.schemeId === "all" ? -1 : (SCHEME_INDEX.get(f.schemeId) ?? -1),
    category: f.grievanceCategory === "all" ? -1 : (CAT_INDEX.get(f.grievanceCategory) ?? -1),
  }
}

export interface Win { months: number[]; first: number; last: number; bits: number; startDay: number; endDay: number }

export function makeWin(first: number, last: number): Win {
  const list: number[] = []
  let bits = 0
  for (let t = first; t <= last; t += 1) {
    list.push(t)
    bits |= 1 << t
  }
  return { months: list, first, last, bits, startDay: MONTHS[first].startDay, endDay: MONTHS[last].startDay + MONTHS[last].days - 1 }
}

export function windowOf(f: GigFilters): Win {
  const list: number[] = []
  for (let t = 0; t < NM; t += 1) if (monthIso[t].end >= f.fromDate && monthIso[t].start <= f.toDate) list.push(t)
  if (list.length === 0) return makeWin(NM - 1, NM - 1)
  return makeWin(list[0], list[list.length - 1])
}

export function previousWin(win: Win): Win | null {
  const length = win.months.length
  const first = win.first - length
  return first >= 0 ? makeWin(first, win.first - 1) : null
}

// ---- Worker, payout and fee results ----------------------------------------------------------
export interface AggStats { records: number; dup: number; unique: number; engagements: number; payout: number; txns: number; payable: number; declared: number; deposited: number; reconciled: number; shortfall: number; excess: number }

export interface WindowResult {
  win: Win
  stock: Float64Array
  newBoard: Float64Array
  separated: Float64Array
  records: Float64Array
  activeMonth: Float64Array
  payout: Float64Array
  txns: Float64Array
  payable: Float64Array
  declared: Float64Array
  deposited: Float64Array
  reconciled: Float64Array
  shortfall: Float64Array
  excess: Float64Array
  aggCountMonth: Float64Array
  unique: number
  active: number
  multi: number
  engagements: number
  platformCounts: number[]
  agg: AggStats[]
  aggMonth: { records: Float64Array; payout: Float64Array; txns: Float64Array; payable: Float64Array; declared: Float64Array; deposited: Float64Array; reconciled: Float64Array; shortfall: Float64Array; excess: Float64Array }
  distUnique: Float64Array
  distActive: Float64Array
  distPayout: Float64Array
  sectorUnique: Float64Array
}

export const sumWin = (series: ArrayLike<number>, win: Win) => {
  let total = 0
  for (const t of win.months) total += series[t]
  return total
}

export function computeWindow(scope: Scope, win: Win): WindowResult {
  const stock = new Float64Array(NM)
  const newBoard = new Float64Array(NM)
  const separated = new Float64Array(NM)
  const records = new Float64Array(NM)
  const activeMonth = new Float64Array(NM)
  const payout = new Float64Array(NM)
  const txns = new Float64Array(NM)
  const payable = new Float64Array(NM)
  const declared = new Float64Array(NM)
  const deposited = new Float64Array(NM)
  const reconciled = new Float64Array(NM)
  const shortfall = new Float64Array(NM)
  const excess = new Float64Array(NM)
  const agg: AggStats[] = Array.from({ length: NA }, () => ({ records: 0, dup: 0, unique: 0, engagements: 0, payout: 0, txns: 0, payable: 0, declared: 0, deposited: 0, reconciled: 0, shortfall: 0, excess: 0 }))
  const aggMonth = {
    records: new Float64Array(NA * NM),
    payout: new Float64Array(NA * NM),
    txns: new Float64Array(NA * NM),
    payable: new Float64Array(NA * NM),
    declared: new Float64Array(NA * NM),
    deposited: new Float64Array(NA * NM),
    reconciled: new Float64Array(NA * NM),
    shortfall: new Float64Array(NA * NM),
    excess: new Float64Array(NA * NM),
  }
  const aggData = new Uint8Array(NA * NM)
  const distUnique = new Float64Array(ND)
  const distActive = new Float64Array(ND)
  const distPayout = new Float64Array(ND)
  const sectorUnique = new Float64Array(NS)
  const platformCounts = [0, 0, 0]
  let unique = 0
  let active = 0
  let multi = 0
  let engagements = 0

  const { activity, status, platFilter, platOk } = scope
  const last = win.last
  const cfg = D.config

  for (let i = 0; i < N; i += 1) {
    const d = dist[i]
    if (!scope.districtOk[d]) continue
    if (scope.urbanOnly && !urban[i]) continue
    if (scope.gender >= 0 && gender[i] !== scope.gender) continue
    if (scope.age >= 0 && age[i] !== scope.age) continue
    const k = nPlat[i]
    let inScope = (1 << k) - 1
    if (platFilter) {
      inScope = 0
      for (let j = 0; j < k; j += 1) if (platOk[plat[i * 3 + j]]) inScope |= 1 << j
      if (inScope === 0) continue
    }
    const w = weight[i]
    const b = boardMonth[i]
    const s = sepMonth[i]
    const mk = mask[i]
    const registeredEnd = b <= last && s > last
    const activeWin = (mk & win.bits) !== 0
    if (activity === "active" && !activeWin) continue
    if (activity === "inactive" && (!registeredEnd || activeWin)) continue

    let primary = -1
    for (let j = 0; j < k; j += 1) {
      if (inScope & (1 << j)) {
        primary = j
        break
      }
    }

    if (b <= 11) {
      newBoard[b] += w
      if (s <= 11) separated[s] += w
      for (let t = b; t < Math.min(NM, s); t += 1) stock[t] += w
    }
    if (registeredEnd) {
      unique += w
      distUnique[d] += w
      sectorUnique[sectorOfAgg[plat[i * 3 + primary]]] += w
      platformCounts[k - 1] += w
      if (k >= 2) multi += w
      for (let j = 0; j < k; j += 1) {
        if (!(inScope & (1 << j))) continue
        const p = plat[i * 3 + j]
        agg[p].unique += w
        agg[p].engagements += w
        engagements += w
      }
    }
    if (activeWin) {
      active += w
      distActive[d] += w
    }

    const rm = recMonth[i]
    const inWinRecord = rm >= win.first && rm <= last
    for (let j = 0; j < k; j += 1) {
      if (!(inScope & (1 << j))) continue
      const p = plat[i * 3 + j]
      if (status && !status(p, rm)) continue
      const dup = Math.round(w * dupRate[p])
      records[rm] += w + dup
      aggMonth.records[p * NM + rm] += w + dup
      aggData[p * NM + rm] = 1
      if (inWinRecord) {
        agg[p].records += w + dup
        agg[p].dup += dup
      }
    }

    if (mk === 0) continue
    const lv = cfg.levelFactor[level[i]]
    const share = cfg.platformShare[k - 1]
    for (let t = 0; t < NM; t += 1) {
      if (!(mk & (1 << t))) continue
      activeMonth[t] += w
      const inWinMonth = t >= win.first && t <= last
      for (let j = 0; j < k; j += 1) {
        if (!(inScope & (1 << j))) continue
        const p = plat[i * 3 + j]
        if (status && !status(p, t)) continue
        const sec = sectorOfAgg[p]
        const pay = Math.round(w * cfg.sectorBase[sec] * lv * cfg.seasonFactor[t] * share)
        const trans = Math.round(pay / cfg.sectorTicket[sec])
        const due = Math.round(pay * RATE[sec][t])
        const decl = Math.round(due * D.returns[p].decl[t])
        const dep = Math.round(decl * D.returns[p].dep[t])
        const rec = Math.round(dep * D.returns[p].rec[t])
        const short = Math.max(0, due - dep)
        const over = Math.max(0, dep - due)
        const cell = p * NM + t
        payout[t] += pay
        txns[t] += trans
        payable[t] += due
        declared[t] += decl
        deposited[t] += dep
        reconciled[t] += rec
        shortfall[t] += short
        excess[t] += over
        aggMonth.payout[cell] += pay
        aggMonth.txns[cell] += trans
        aggMonth.payable[cell] += due
        aggMonth.declared[cell] += decl
        aggMonth.deposited[cell] += dep
        aggMonth.reconciled[cell] += rec
        aggMonth.shortfall[cell] += short
        aggMonth.excess[cell] += over
        aggData[cell] = 1
        if (inWinMonth) {
          const stats = agg[p]
          stats.payout += pay
          stats.txns += trans
          stats.payable += due
          stats.declared += decl
          stats.deposited += dep
          stats.reconciled += rec
          stats.shortfall += short
          stats.excess += over
          distPayout[d] += pay
        }
      }
    }
  }

  const aggCountMonth = new Float64Array(NM)
  for (let p = 0; p < NA; p += 1) for (let t = 0; t < NM; t += 1) if (aggData[p * NM + t]) aggCountMonth[t] += 1

  return {
    win,
    stock,
    newBoard,
    separated,
    records,
    activeMonth,
    payout,
    txns,
    payable,
    declared,
    deposited,
    reconciled,
    shortfall,
    excess,
    aggCountMonth,
    unique,
    active,
    multi,
    engagements,
    platformCounts,
    agg,
    aggMonth,
    distUnique,
    distActive,
    distPayout,
    sectorUnique,
  }
}

// ---- Applications, grievances, accidents and training ----------------------------------------
export interface Events {
  apps: {
    stages: number[][]
    amount: number[]
    beneficiaries: number[]
    monthAmount: Float64Array
    distAmount: Float64Array
    received: number
    scrutiny: number
    rejected: number
    approved: number
    initiated: number
    disbursed: number
    failed: number
    disbursedAmount: number
    failedAmount: number
  }
  grv: {
    cat: number[][]
    monthReceived: Float64Array
    monthResolved: Float64Array
    dist: Float64Array
    received: number
    resolved: number
    pending: number
    escalated: number
    appealsReceived: number
    appealsDisposed: number
    beyond: number
    beyondByCat: number[]
  }
  acc: {
    fatal: Float64Array
    nonFatal: Float64Array
    claimsInitiated: Float64Array
    claimsSettled: Float64Array
    typeFatal: number[]
    typeNon: number[]
    accidents: number
    fatalTotal: number
    claimsInitiatedTotal: number
    claimsSettledTotal: number
    claimsBeyond: number
  }
  trainees: number
}

export function entityInScope(scope: Scope, e: number) {
  if (!scope.districtOk[dist[e]]) return false
  if (scope.urbanOnly && !urban[e]) return false
  if (scope.gender >= 0 && gender[e] !== scope.gender) return false
  if (scope.age >= 0 && age[e] !== scope.age) return false
  return true
}

export function entityPlatformOk(scope: Scope, e: number) {
  if (!scope.platFilter) return true
  for (let j = 0; j < nPlat[e]; j += 1) if (scope.platOk[plat[e * 3 + j]]) return true
  return false
}

export function computeEvents(scope: Scope, win: Win): Events {
  const apps = {
    stages: Array.from({ length: NSCHEME }, () => Array(6).fill(0) as number[]),
    amount: Array(NSCHEME).fill(0) as number[],
    beneficiaries: Array(NSCHEME).fill(0) as number[],
    monthAmount: new Float64Array(NM),
    distAmount: new Float64Array(ND),
    received: 0,
    scrutiny: 0,
    rejected: 0,
    approved: 0,
    initiated: 0,
    disbursed: 0,
    failed: 0,
    disbursedAmount: 0,
    failedAmount: 0,
  }
  for (const row of D.applications.rows) {
    const [e, scheme, month, state, amount] = row
    if (month < win.first || month > win.last) continue
    if (scope.scheme >= 0 && scheme !== scope.scheme) continue
    if (!entityInScope(scope, e) || !entityPlatformOk(scope, e)) continue
    apps.received += 1
    apps.stages[scheme][state - 1] += 1
    if (state === 1) apps.scrutiny += 1
    if (state === 2) apps.rejected += 1
    if (state >= 3) apps.approved += 1
    if (state >= 4) apps.initiated += 1
    if (state === 5) {
      apps.disbursed += 1
      apps.disbursedAmount += amount
      apps.amount[scheme] += amount
      apps.beneficiaries[scheme] += 1
      apps.monthAmount[month] += amount
      apps.distAmount[dist[e]] += amount
    }
    if (state === 6) {
      apps.failed += 1
      apps.failedAmount += amount
    }
  }

  const grv = {
    cat: Array.from({ length: NCAT }, () => [0, 0, 0]),
    monthReceived: new Float64Array(NM),
    monthResolved: new Float64Array(NM),
    dist: new Float64Array(ND),
    received: 0,
    resolved: 0,
    pending: 0,
    escalated: 0,
    appealsReceived: 0,
    appealsDisposed: 0,
    beyond: 0,
    beyondByCat: Array(NCAT).fill(0) as number[],
  }
  for (const row of D.grievances.rows) {
    const [e, p, category, day, , state, appeal] = row
    const month = dayMonth[day]
    if (month < win.first || month > win.last) continue
    if (scope.category >= 0 && category !== scope.category) continue
    if (scope.platFilter && !scope.platOk[p]) continue
    if (!entityInScope(scope, e)) continue
    grv.received += 1
    grv.monthReceived[month] += 1
    grv.dist[dist[e]] += 1
    if (state === 0) {
      grv.resolved += 1
      grv.cat[category][0] += 1
      grv.monthResolved[month] += 1
    } else if (state === 1) {
      grv.pending += 1
      grv.cat[category][1] += 1
    } else {
      grv.escalated += 1
      grv.cat[category][2] += 1
    }
    if (state !== 0 && win.endDay - day > D.config.grievanceTargetDays) {
      grv.beyond += 1
      grv.beyondByCat[category] += 1
    }
    if (appeal >= 1) grv.appealsReceived += 1
    if (appeal === 2) grv.appealsDisposed += 1
  }

  const acc = {
    fatal: new Float64Array(NM),
    nonFatal: new Float64Array(NM),
    claimsInitiated: new Float64Array(NM),
    claimsSettled: new Float64Array(NM),
    typeFatal: Array(NTYPE).fill(0) as number[],
    typeNon: Array(NTYPE).fill(0) as number[],
    accidents: 0,
    fatalTotal: 0,
    claimsInitiatedTotal: 0,
    claimsSettledTotal: 0,
    claimsBeyond: 0,
  }
  for (const row of D.accidents.rows) {
    const [e, p, day, fatal, type, claim] = row
    const month = dayMonth[day]
    if (month < win.first || month > win.last) continue
    if (scope.platFilter && !scope.platOk[p]) continue
    if (!entityInScope(scope, e)) continue
    acc.accidents += 1
    if (fatal) {
      acc.fatal[month] += 1
      acc.fatalTotal += 1
      acc.typeFatal[type] += 1
    } else {
      acc.nonFatal[month] += 1
      acc.typeNon[type] += 1
    }
    if (claim >= 1) {
      acc.claimsInitiated[month] += 1
      acc.claimsInitiatedTotal += 1
    }
    if (claim === 2) {
      acc.claimsSettled[month] += 1
      acc.claimsSettledTotal += 1
    }
    if (claim === 1 && win.endDay - day > D.config.claimTargetDays) acc.claimsBeyond += 1
  }

  let trainees = 0
  for (let d = 0; d < ND; d += 1) {
    if (!scope.districtOk[d]) continue
    for (const t of win.months) trainees += D.trainings[d][t]
  }
  return { apps, grv, acc, trainees }
}

// ---- Welfare fund ledger (not affected by filters) -------------------------------------------
export interface FundSeries {
  opening: number[]
  fee: number[]
  stateGrant: number[]
  centralGrant: number[]
  donations: number[]
  otherReceipts: number[]
  scheme: number[]
  admin: number[]
  programme: number[]
  otherExpenditure: number[]
  adjustments: number[]
  refunds: number[]
  closing: number[]
}

let fundCache: FundSeries | null = null
export function getFund(): FundSeries {
  if (fundCache) return fundCache
  const unfiltered = makeScope(resolveGigFilters({
    financialYear: "",
    fromDate: "",
    toDate: "",
    districtId: "all",
    cityId: "all",
    aggregatorId: "all",
    sectorId: "all",
    activity: "all",
    gender: "all",
    ageGroup: "all",
    schemeId: "all",
    grievanceCategory: "all",
    status: "all",
  }))
  const win = makeWin(0, NM - 1)
  const result = computeWindow(unfiltered, win)
  const events = computeEvents(unfiltered, win)
  const series: FundSeries = {
    opening: [],
    fee: [],
    stateGrant: [],
    centralGrant: [],
    donations: [],
    otherReceipts: [],
    scheme: [],
    admin: [],
    programme: [],
    otherExpenditure: [],
    adjustments: [],
    refunds: [],
    closing: [],
  }
  let balance = D.fund.openingBalance
  for (let t = 0; t < NM; t += 1) {
    const input = D.fund.monthly[t]
    const opening = balance
    const refunds = result.excess[t]
    const adjustment = -refunds + input.otherAdjustment
    const receipts = result.deposited[t] + input.stateGrant + input.centralGrant + input.donations + input.otherReceipts
    const expenditure = events.apps.monthAmount[t] + input.admin + input.programme + input.otherExpenditure
    balance = opening + receipts - expenditure + adjustment
    series.opening.push(opening)
    series.fee.push(result.deposited[t])
    series.stateGrant.push(input.stateGrant)
    series.centralGrant.push(input.centralGrant)
    series.donations.push(input.donations)
    series.otherReceipts.push(input.otherReceipts)
    series.scheme.push(events.apps.monthAmount[t])
    series.admin.push(input.admin)
    series.programme.push(input.programme)
    series.otherExpenditure.push(input.otherExpenditure)
    series.adjustments.push(adjustment)
    series.refunds.push(refunds)
    series.closing.push(balance)
  }
  fundCache = series
  return series
}

// ---- Computation context, cached ------------------------------------------------------------
export interface Ctx {
  f: GigFilters
  scope: Scope
  win: Win
  prev: Win | null
  R: WindowResult
  Rp: WindowResult | null
  E: Events
  Ep: Events | null
}

const cache = new Map<string, Ctx>()
export function computeFor(input: GigFilters): Ctx {
  const f = resolveGigFilters(input)
  const key = JSON.stringify(f)
  const hit = cache.get(key)
  if (hit) return hit
  const scope = makeScope(f)
  const win = windowOf(f)
  const prev = previousWin(win)
  const ctx: Ctx = {
    f,
    scope,
    win,
    prev,
    R: computeWindow(scope, win),
    Rp: prev ? computeWindow(scope, prev) : null,
    E: computeEvents(scope, win),
    Ep: prev ? computeEvents(scope, prev) : null,
  }
  if (cache.size >= 6) cache.delete(cache.keys().next().value as string)
  cache.set(key, ctx)
  return ctx
}

// ---- Labels shared by the overview and the details -------------------------------------------
export const aggName = (p: number) => D.aggregators[p].name
export const sectorName = (index: number) => D.sectors[index].name
export const monthLabel = (t: number) => MONTHS[t].label
export const monthShort = (t: number) => MONTHS[t].short
export const periodText = (win: Win) => (win.first === win.last ? MONTHS[win.first].label : `${MONTHS[win.first].label} to ${MONTHS[win.last].label}`)
export const asOfText = (win: Win) => fmtDate(monthIso[win.last].end)

/** Return status to show for an aggregator: an overdue quarter first, otherwise the latest quarter with data. */
export function latestReturn(aggregator: number, win: Win) {
  const firstQuarter = MONTHS[win.first].quarter
  const lastQuarter = MONTHS[win.last].quarter
  for (let q = lastQuarter; q >= firstQuarter; q -= 1) {
    if (D.aggregators[aggregator].returns[q] === 2) return { quarter: q, state: 2 }
  }
  for (let q = lastQuarter; q >= firstQuarter; q -= 1) {
    const state = D.aggregators[aggregator].returns[q]
    if (state !== 4) return { quarter: q, state }
  }
  return { quarter: lastQuarter, state: 4 }
}

export function statusName(id: string) {
  for (const group of GIG_STATUS_GROUPS) {
    const hit = group.items.find((item) => item.id === id)
    if (hit) return hit.name
  }
  return id
}

export function filterValueName(key: GigFilterKey, value: string): string {
  switch (key) {
    case "districtId": return D.districts.find((item) => item.id === value)?.name ?? value
    case "cityId": return D.cities.find((item) => item.id === value)?.name ?? value
    case "aggregatorId": return D.aggregators.find((item) => item.id === value)?.name ?? value
    case "sectorId": return D.sectors.find((item) => item.id === value)?.name ?? value
    case "activity": return value === "active" ? "Active in the period" : "Registered, no payout in the period"
    case "gender": return D.genders.find((item) => item.id === value)?.name ?? value
    case "ageGroup": return D.ageGroups.find((item) => item.id === value)?.name ?? value
    case "schemeId": return D.schemes.find((item) => item.id === value)?.name ?? value
    case "grievanceCategory": return D.grievanceCategories.find((item) => item.id === value)?.name ?? value
    case "status": return statusName(value)
  }
}
