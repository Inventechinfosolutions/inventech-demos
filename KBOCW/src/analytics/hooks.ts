import { useEffect, useRef, useState } from "react"
import { executeQuery } from "@/analytics/api"
import type { ExecuteArgs, ExecuteResult } from "@/analytics/api"
import type { RuntimeContext } from "@/analytics/runtime"
import { useCurrentUser } from "@/analytics/session"
import type { ReportDefinition } from "@/analytics/types"

interface QueryInput {
  def: ReportDefinition | null
  context?: RuntimeContext
  log?: ExecuteArgs["log"]
  /** Delay before running, so typing in a filter does not run one query per key press. */
  debounce?: number
}

/**
 * Runs a report definition through the mock analytics API and keeps the last result on screen while the next one loads.
 * The effect depends on the serialised definition and context, not on the store, so logging an execution never re-runs it.
 */
export function useQuery({ def, context, log, debounce = 100 }: QueryInput) {
  const user = useCurrentUser()
  const [state, setState] = useState<{ data: ExecuteResult | null; loading: boolean }>({ data: null, loading: Boolean(def) })
  const latest = useRef({ def, context, log })
  useEffect(() => {
    latest.current = { def, context, log }
  })
  const key = JSON.stringify([def, context, user.id])

  useEffect(() => {
    const current = latest.current
    if (!current.def) {
      setState({ data: null, loading: false })
      return
    }
    let cancelled = false
    setState((previous) => ({ ...previous, loading: true }))
    const timer = window.setTimeout(() => {
      executeQuery({ def: current.def as ReportDefinition, user, context: current.context, log: current.log }).then((data) => {
        if (!cancelled) setState({ data, loading: false })
      })
    }, debounce)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [key, user, debounce])

  return state
}
