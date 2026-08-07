"use client"

import { useSyncExternalStore } from "react"

export interface SiteImages {
  hero: string
  about: string
}

// No bundled fallback images — only the images uploaded by the admin are shown.
let state: SiteImages = { hero: "", about: "" }

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

/**
 * Hook that returns the current hero/about image URLs and re-renders
 * whenever they are updated (e.g. after an admin upload) — instantly,
 * no page refresh required.
 */
export function useSiteImages(): SiteImages {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Update the reactive image URLs (hero and/or about). */
export function setSiteImages(partial: Partial<SiteImages>) {
  state = { ...state, ...partial }
  emit()
}
