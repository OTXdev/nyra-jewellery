"use client"

import { useCallback, useEffect, useState } from "react"
import { adminLogin, adminRefresh, ApiError } from "./api"

const ACCESS_KEY = "nyra_admin_access"
const REFRESH_KEY = "nyra_admin_refresh"

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_KEY)
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_KEY)
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/**
 * Tracks the admin's logged-in state and exposes login/logout.
 * On mount it tries to silently refresh an existing session.
 */
export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const refresh = getRefreshToken()
    if (!refresh) {
      setChecking(false)
      return
    }
    adminRefresh(refresh)
      .then((access) => {
        localStorage.setItem(ACCESS_KEY, access)
        setToken(access)
      })
      .catch(() => clearTokens())
      .finally(() => setChecking(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { access, refresh } = await adminLogin(username, password)
    setTokens(access, refresh)
    setToken(access)
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setToken(null)
  }, [])

  return { token, authed: !!token, checking, login, logout }
}

export { ApiError }
