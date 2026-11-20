import { useEffect, useRef, useState } from "react"

/**
 * Loads a value once. The department pages use it for the overview at the default scope,
 * which stays fixed while the filters below it change.
 */
export function useBaseline<T>(load: () => Promise<T>): T | null {
  const [value, setValue] = useState<T | null>(null)
  const loader = useRef(load)
  useEffect(() => {
    let cancelled = false
    loader.current()
      .then((next) => {
        if (!cancelled) setValue(next)
      })
      .catch(() => {
        if (!cancelled) setValue(null)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return value
}
