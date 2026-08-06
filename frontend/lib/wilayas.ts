"use client"

import { useEffect, useState } from "react"
import { fetchWilayas } from "./api"
import type { Wilaya } from "./types"

/** Fetches the 58 wilayas (with live delivery fees) from the backend once. */
export function useWilayas() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchWilayas()
      .then((data) => {
        if (!cancelled) setWilayas(data)
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the wilaya list. Please refresh the page.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { wilayas, loading, error }
}
