"use client"

import { useSyncExternalStore } from "react"

export const HERO_FALLBACK = "/images/hero.png"
export const ABOUT_FALLBACK = "/images/about.png"

export interface SiteImages {
  hero: string
  about: string
}

let state: SiteImages = { hero: HERO_FALLBACK, about: ABOUT_FALLBACK }

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
