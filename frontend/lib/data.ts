import type { Product } from "./types"

export const CATEGORY_LABELS: Record<Product["category"], string> = {
  rings: "Rings",
  necklaces: "Necklaces",
  bracelets: "Bracelets",
  sets: "Jewelry Sets",
}

// Ring sizes shown as quick-filter chips on the shop page. Backend sizes are
// free-form strings, so these are just the common values offered as presets.
export const RING_SIZES = ["6", "7", "8", "9", "10", "11", "12"]

export const BRAND = {
  name: "Nyra Jewellery",
  whatsapp: "213555000000",
  whatsappDisplay: "+213 555 00 00 00",
  email: "hello@nyrajewellery.com",
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
}
