import { datasetById } from "@/analytics/catalog"
import { runReport } from "@/analytics/engine"
import type { RunOutcome } from "@/analytics/engine"
import { prepare } from "@/analytics/runtime"
import type { Prepared, RuntimeContext } from "@/analytics/runtime"
import { logAudit, logExecution } from "@/analytics/store"
import type { ExecutionRecord, QueryResult, ReportDefinition, User } from "@/analytics/types"

// Mock analytics API. In a deployment these calls go to the analytics service. The report is sent as a
// structured definition, never as free text or SQL, and the service applies the same governance checks.

export interface ExecuteArgs {
  def: ReportDefinition
  user: User
  context?: RuntimeContext
  log?: { kind: ExecutionRecord["kind"]; reportId: string | null; reportName: string } | null
}

export interface ExecuteResult {
  outcome: RunOutcome
  prepared: Prepared
  /** KPI cards under financial year comparison: one result for each year. */
  comparison?: { years: string[]; results: RunOutcome[] }
}

const delay = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

const deniedAt = new Map<string, number>()
function noteDenied(user: User, datasetId: string) {
  const key = `${user.id}:${datasetId}`
  const last = deniedAt.get(key) ?? 0
  if (Date.now() - last < 60_000) return
  deniedAt.set(key, Date.now())
  const dataset = datasetById(datasetId)
  logAudit(user, "access.denied", "dataset", datasetId, `Tried to open ${dataset?.name ?? datasetId}. The dataset is not available to this role.`)
}

export function executeSync(args: ExecuteArgs): ExecuteResult {
  const prepared = prepare(args.def, args.context)
  const outcome = runReport(prepared.def, args.user, prepared.extras)
  if (!outcome.ok && outcome.issues.some((issue) => issue.code === "no-access")) noteDenied(args.user, args.def.datasetId)

  let comparison: ExecuteResult["comparison"]
  if (outcome.ok && prepared.comparing && args.def.visualization.type === "kpi" && args.context?.global) {
    const years = prepared.comparing
    const results = years.map((year) => {
      const single = prepare(args.def, { ...args.context, global: { ...args.context!.global!, financialYears: [year], compare: false } })
      return runReport(single.def, args.user, single.extras)
    })
    comparison = { years, results }
  }
  if (outcome.ok && args.log) {
    logExecution({
      userId: args.user.id,
      reportId: args.log.reportId,
      reportName: args.log.reportName,
      datasetId: args.def.datasetId,
      kind: args.log.kind,
      durationMs: outcome.result.durationMs,
      rowCount: outcome.result.rows.length,
      filters: outcome.result.appliedFilters.map((filter) => filter.label),
      snapshot: args.def,
    })
  }
  return { outcome, prepared, comparison }
}

export async function executeQuery(args: ExecuteArgs): Promise<ExecuteResult> {
  await delay(45 + Math.round(Math.random() * 70))
  return executeSync(args)
}

export type { QueryResult }
