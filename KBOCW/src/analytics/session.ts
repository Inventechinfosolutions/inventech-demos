import { useSyncExternalStore } from "react"
import { DEFAULT_USER_ID, USERS, userById } from "@/analytics/users"
import type { User } from "@/analytics/types"

// The signed-in role for the demonstration. Kept outside React so the portal header can read it too.

const KEY = "kbocw.analytics.user"
const listeners = new Set<() => void>()

function read() {
  try {
    const stored = window.localStorage.getItem(KEY)
    if (stored && userById(stored)) return stored
  } catch {
    // storage unavailable
  }
  return DEFAULT_USER_ID
}

let current = typeof window === "undefined" ? DEFAULT_USER_ID : read()

export function getCurrentUserId() {
  return current
}

export function getCurrentUser(): User {
  return userById(current) ?? USERS[0]
}

export function setCurrentUserId(id: string) {
  if (!userById(id) || id === current) return
  current = id
  try {
    window.localStorage.setItem(KEY, id)
  } catch {
    // storage unavailable
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useCurrentUser(): User {
  const id = useSyncExternalStore(subscribe, getCurrentUserId, () => DEFAULT_USER_ID)
  return userById(id) ?? USERS[0]
}
