import {
  KSU_AGE_GROUPS,
  KSU_BENEFITS,
  KSU_DISTRICTS,
  KSU_GENDERS,
  KSU_MONTHS,
  KSU_OCCUPATIONS,
  KSU_REJECT_REASONS,
  KSU_RETURN_REASONS,
  KSU_SCHEMES,
} from "@/data/ksuMasters"

/**
 * Illustrative dataset, generated in the browser from a fixed seed so every visit shows the same
 * figures. Every worker has one synthetic row, so a worker is never counted twice. There are no
 * names, Aadhaar numbers, phone numbers or bank details anywhere in it.
 *
 * Months are numbered from April 2025 as 0. Workers registered before that have negative months.
 * Days count from 1 April 2025. A value of 99 (months) or -1 (days) means "has not happened".
 */

export const KSU_WORKERS = 130000
export const NEVER = 99

export const KIND_REJECTED = 2
export const KIND_APPROVED = 3

export interface KsuData {
  n: number
  dist: Uint8Array
  occ: Uint8Array
  gender: Uint8Array
  age: Uint8Array
  urban: Uint8Array
  /** Month the registration was received. */
  reg: Int8Array
  /** Month the verification decision was made. 99 when still pending. */
  dec: Int8Array
  rejected: Uint8Array
  /** Month the registration lapsed. 99 when it has not. */
  exp: Int8Array
  card: Int8Array
  ksk: Uint8Array
  /** Month of enrolment for each scheme, in the order of the scheme master. 99 when not enrolled. */
  enrol: Int8Array[]
  claims: {
    n: number
    worker: Uint32Array
    scheme: Uint8Array
    benefit: Uint8Array
    recv: Int16Array
    kind: Uint8Array
    /** Day the case was approved or rejected. */
    dec: Int16Array
    /** Day the case was returned for correction, or -1 if it never was. */
    ret: Int16Array
    /** Day payment was initiated. -1 when not applicable. */
    init: Int16Array
    /** Day payment succeeded or failed. -1 when neither has happened. */
    end: Int16Array
    /** 0 not resolved, 1 paid, 2 failed or returned. */
    pay: Uint8Array
    reason: Int8Array
    amount: Int32Array
  }
  /** Facilitation services other than registration support, by district and month. */
  kskOther: Int32Array
  eshram: number[]
  baseline: number[]
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sampler(weights: number[], random: () => number) {
  const total = weights.reduce((sum, value) => sum + value, 0)
  const cumulative: number[] = []
  weights.reduce((sum, value) => {
    cumulative.push(sum + value)
    return sum + value
  }, 0)
  return () => {
    const point = random() * total
    let low = 0
    let high = cumulative.length - 1
    while (low < high) {
      const mid = (low + high) >> 1
      if (cumulative[mid] < point) low = mid + 1
      else high = mid
    }
    return low
  }
}

let cached: KsuData | null = null

export function getKsuData(): KsuData {
  if (cached) return cached
  const random = mulberry32(20260405)
  const n = KSU_WORKERS

  const districtJitter = KSU_DISTRICTS.map(() => 0.65 + random() * 0.7)
  const pickDistrict = sampler(KSU_DISTRICTS.map((district, index) => district.weight * districtJitter[index]), random)
  const pickOccupation = sampler(KSU_OCCUPATIONS.map((item) => item.weight), random)
  const pickGender = sampler(KSU_GENDERS.map((item) => item.weight), random)
  const pickAge = sampler(KSU_AGE_GROUPS.map((item) => item.weight), random)
  // Registrations grow through the extract, with a small dip around the festival months.
  const pickMonth = sampler(KSU_MONTHS.map((month) => (0.8 + month.index * 0.035) * ([5, 6].includes(month.index) ? 0.9 : 1)), random)
  const gigOccupation = KSU_OCCUPATIONS.findIndex((item) => item.id === "gig")
  const newsOccupation = KSU_OCCUPATIONS.findIndex((item) => item.id === "newsmilk")

  const dist = new Uint8Array(n)
  const occ = new Uint8Array(n)
  const gender = new Uint8Array(n)
  const age = new Uint8Array(n)
  const urban = new Uint8Array(n)
  const reg = new Int8Array(n)
  const dec = new Int8Array(n)
  const rejected = new Uint8Array(n)
  const exp = new Int8Array(n).fill(NEVER)
  const card = new Int8Array(n).fill(NEVER)
  const ksk = new Uint8Array(n)
  const enrol = KSU_SCHEMES.map(() => new Int8Array(n).fill(NEVER))

  for (let i = 0; i < n; i += 1) {
    const d = pickDistrict()
    dist[i] = d
    occ[i] = pickOccupation()
    gender[i] = pickGender()
    age[i] = pickAge()
    urban[i] = random() < KSU_DISTRICTS[d].urban ? 1 : 0
    reg[i] = random() < 0.35 ? -24 + Math.floor(random() * 24) : pickMonth()

    const speed = random()
    let delay = speed < 0.55 ? 0 : speed < 0.8 ? 1 : speed < 0.93 ? 2 : 3
    if (random() < 0.025) delay = 4 + Math.floor(random() * 5)
    dec[i] = reg[i] + delay
    const isRejected = random() < 0.07
    rejected[i] = isRejected ? 1 : 0
    if (isRejected) continue

    if (random() < 0.16) exp[i] = dec[i] + 8 + Math.floor(random() * 21)
    if (random() < 0.84) card[i] = dec[i] + Math.floor(random() * 3)
    ksk[i] = random() < (urban[i] ? 0.2 : 0.34) ? 1 : 0

    const lag = () => {
      const r = random()
      return r < 0.6 ? 0 : r < 0.9 ? 1 : 2
    }
    if (random() < 0.9) enrol[0][i] = dec[i] + lag()
    if (occ[i] === gigOccupation && random() < 0.85) enrol[1][i] = dec[i] + lag()
    if (occ[i] === newsOccupation && random() < 0.8) enrol[2][i] = dec[i] + lag()
  }
  // Rejected registrations were still received, so they may be facilitated.
  for (let i = 0; i < n; i += 1) if (rejected[i]) ksk[i] = random() < 0.25 ? 1 : 0

  // Applications and claims
  // Chance of a case in each month a worker is enrolled and valid.
  const monthlyRate = [0.0032, 0.0038, 0.0042]
  const benefitPickers = KSU_SCHEMES.map((scheme) => {
    const items = KSU_BENEFITS.map((benefit, index) => ({ benefit, index })).filter((item) => item.benefit.schemeId === scheme.id)
    const pick = sampler(items.map((item) => item.benefit.weight), random)
    return () => items[pick()].index
  })
  const rows: {
    worker: number
    scheme: number
    benefit: number
    recv: number
    kind: number
    dec: number
    ret: number
    init: number
    end: number
    pay: number
    reason: number
    amount: number
  }[] = []
  const tail = (mean: number, cap: number) => Math.min(cap, Math.floor(-Math.log(1 - random()) * mean))

  for (let i = 0; i < n; i += 1) {
    if (rejected[i]) continue
    for (let s = 0; s < KSU_SCHEMES.length; s += 1) {
      const start = enrol[s][i]
      if (start === NEVER || start > 17) continue
      const lastMonth = exp[i] === NEVER ? 17 : Math.min(17, exp[i] - 1)
      const firstMonth = Math.max(0, start)
      const months = lastMonth - firstMonth + 1
      if (months <= 0) continue
      const chance = 1 - Math.pow(1 - monthlyRate[s], months)
      const attempts = random() < chance ? (random() < 0.04 ? 2 : 1) : 0
      for (let k = 0; k < attempts; k += 1) {
        const from = KSU_MONTHS[firstMonth].startDay
        const to = KSU_MONTHS[lastMonth].endDay
        const recv = from + Math.floor(random() * (to - from + 1))
        const benefitIndex = benefitPickers[s]()
        const benefit = KSU_BENEFITS[benefitIndex]
        const amount = benefit.min === benefit.max ? benefit.min : benefit.min + Math.floor((random() * (benefit.max - benefit.min)) / 500) * 500

        const row = { worker: i, scheme: s, benefit: benefitIndex, recv, kind: KIND_APPROVED, dec: -1, ret: -1, init: -1, end: -1, pay: 0, reason: -1, amount }
        const outcome = random()
        if (outcome < 0.08) {
          // Returned for correction. Most are corrected and approved. The rest are closed when the worker does not respond.
          row.ret = recv + 3 + Math.floor(random() * 16)
          row.reason = KSU_RETURN_REASONS[Math.floor(random() * KSU_RETURN_REASONS.length)]
          if (random() < 0.55) row.dec = row.ret + 6 + tail(10, 60)
          else {
            row.kind = KIND_REJECTED
            row.dec = row.ret + 45 + Math.floor(random() * 46)
          }
        } else if (outcome < 0.16) {
          row.kind = KIND_REJECTED
          row.dec = recv + 5 + Math.floor(random() * 36)
          row.reason = KSU_REJECT_REASONS[Math.floor(random() * KSU_REJECT_REASONS.length)]
        } else {
          row.dec = recv + 4 + tail(11, 80)
        }
        if (row.kind === KIND_APPROVED) {
          row.init = row.dec + 1 + tail(6, 40)
          const payment = random()
          if (payment < 0.94) {
            row.pay = 1
            row.end = row.init + 2 + Math.floor(random() * 9)
          } else if (payment < 0.98) {
            row.pay = 2
            row.end = row.init + 3 + Math.floor(random() * 10)
          }
        }
        rows.push(row)
      }
    }
  }
  rows.sort((left, right) => left.recv - right.recv || left.worker - right.worker)
  const total = rows.length
  const claims = {
    n: total,
    worker: new Uint32Array(total),
    scheme: new Uint8Array(total),
    benefit: new Uint8Array(total),
    recv: new Int16Array(total),
    kind: new Uint8Array(total),
    dec: new Int16Array(total),
    ret: new Int16Array(total),
    init: new Int16Array(total),
    end: new Int16Array(total),
    pay: new Uint8Array(total),
    reason: new Int8Array(total),
    amount: new Int32Array(total),
  }
  rows.forEach((row, index) => {
    claims.worker[index] = row.worker
    claims.scheme[index] = row.scheme
    claims.benefit[index] = row.benefit
    claims.recv[index] = row.recv
    claims.kind[index] = row.kind
    claims.dec[index] = row.dec
    claims.ret[index] = row.ret
    claims.init[index] = row.init
    claims.end[index] = row.end
    claims.pay[index] = row.pay
    claims.reason[index] = row.reason
    claims.amount[index] = row.amount
  })

  const weightTotal = KSU_DISTRICTS.reduce((sum, district) => sum + district.weight, 0)
  const kskOther = new Int32Array(KSU_DISTRICTS.length * 18)
  KSU_DISTRICTS.forEach((district, d) => {
    for (let t = 0; t < 18; t += 1) {
      kskOther[d * 18 + t] = Math.round((district.weight / weightTotal) * 900 * (0.75 + random() * 0.5) * (0.9 + t * 0.012))
    }
  })
  const eshram = KSU_DISTRICTS.map((district) => Math.round((district.weight / weightTotal) * 6200000 * (0.9 + random() * 0.2)))
  const baseline = KSU_DISTRICTS.map((district) => Math.round((district.weight / weightTotal) * 700000))

  cached = { n, dist, occ, gender, age, urban, reg, dec, rejected, exp, card, ksk, enrol, claims, kskOther, eshram, baseline }
  return cached
}

export const claimRef = (index: number) => `KS-CLM-${String(index + 1).padStart(6, "0")}`
export const maskedWorker = (index: number) => `SYN-W-••••${String(1000 + ((index * 7919) % 9000)).slice(-4)}`
