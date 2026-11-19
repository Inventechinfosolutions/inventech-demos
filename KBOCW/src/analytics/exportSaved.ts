import { executeSync } from "@/analytics/api"
import { exportReport } from "@/analytics/exporters"
import type { ExportFormat } from "@/analytics/exporters"
import { reportDefinition } from "@/analytics/store"
import type { User } from "@/analytics/types"

/** Runs a saved report as the current user and exports the result. Role and district limits apply. */
export async function exportSavedReport(id: string, format: ExportFormat, user: User) {
  const def = reportDefinition(id)
  if (!def) throw new Error("The report no longer exists.")
  const { outcome, prepared } = executeSync({ def, user })
  if (!outcome.ok) throw new Error(outcome.issues[0]?.message ?? "The report could not be run.")
  await exportReport(format, { def: { ...prepared.def, id: def.id, name: def.name, description: def.description }, result: outcome.result, user, vizType: def.visualization.type, showLabels: def.visualization.showLabels, stacked: def.visualization.stacked })
}
