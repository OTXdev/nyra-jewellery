
import { useCallback, useEffect, useState } from "react"
import { adminLogin, adminRefresh, adminLogout, ApiError } from "./api"

// This is a UI convenience flag only — NOT a credential. The real session
// lives entirely in the HttpOnly `nyra_access_token` / `nyra_refresh_token`
// cookies set by Django, which JavaScript can never read. This flag just
// lets the dashboard remember "the user was logged in last time" so it can
// attempt a silent refresh on load instead of always flashing the login
// screen first. If it's wrong (e.g. the cookie already expired), the
// silent refresh below simply fails and the flag is cleared.
const AUTHED_HINT_KEY = "nyra_admin_authed"

function getAuthedHint(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(AUTHED_HINT_KEY) === "1"
}

function setAuthedHint(value: boolean) {
  if (value) {
    localStorage.setItem(AUTHED_HINT_KEY, "1")
  } else {
    localStorage.removeItem(AUTHED_HINT_KEY)
  }
}

/** Non-secret marker used in place of the old JWT so components that
 * expect a truthy `token: string` keep working unchanged. It is never sent
 * anywhere and carries no authority — the browser's HttpOnly cookies do
 * the actual authenticating. */
const AUTHED_MARKER = "cookie-session"

export function getAdminToken(): string | null {
  return getAuthedHint() ? AUTHED_MARKER : null
}

/**
 * Tracks the admin's logged-in state and exposes login/logout.
 * On mount it tries to silently refresh an existing HttpOnly-cookie
 * session (if the "was logged in" hint is set).
 */
export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!getAuthedHint()) {
      setChecking(false)
      return
    }
    adminRefresh()
      .then(() => {
        setToken(AUTHED_MARKER)
        setAuthedHint(true)
      })
      .catch(() => setAuthedHint(false))
      .finally(() => setChecking(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    await adminLogin(username, password)
    setAuthedHint(true)
    setToken(AUTHED_MARKER)
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminLogout()
    } finally {
      setAuthedHint(false)
      setToken(null)
    }
  }, [])

  return { token, authed: !!token, checking, login, logout }
}

export { ApiError }
