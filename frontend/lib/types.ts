export type Category = "rings" | "necklaces" | "bracelets" | "earrings" | "sets"

export type Availability = "in-stock" | "out-of-stock"

export interface Product {
  id: number
  name: string
  slug: string
  category: Category
  collection: string | null
  price: number
  oldPrice?: number
  images: string[]
  description: string
  material: string
  // Not modeled on the backend yet — kept optional so existing UI that
  // references them doesn't crash; they simply won't render if empty.
  color?: string
  care?: string
  availability: Availability
  isNew: boolean
  isBestSeller: boolean
  onPromotion: boolean
  popularity: number
  createdAt: number
  // Backend sizes are free-form strings (e.g. ring sizes "6", "7", "8").
  sizes?: string[]
  relatedProducts?: Product[]
}

export interface Collection {
  id: number
  name: string
  slug: string
  description: string
  image: string | null
  featured: boolean
}

export interface CartItem {
  productId: number
  quantity: number
  size?: string
}

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled"

export interface OrderLine {
  productId: number | null
  name: string
  price: number
  quantity: number
  size?: string
  lineTotal: number
}

/** An order as returned by the backend after creation / in the admin list. */
export interface Order {
  id: number
  orderNumber: string
  createdAt: string
  fullName: string
  phone: string
  wilaya: string
  commune: string
  address: string
  // Delivery method: 'home' | 'stopdesk'
  deliveryMethod?: "home" | "stopdesk"
  notes?: string
  items: OrderLine[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  // Server-computed surprise-gift eligibility (stored subtotal >= threshold).
  // The gift is a store-owner surprise; there is no customer gift selection.
  isGiftEligible?: boolean
}

export interface Wilaya {
  id: number
  code: string
  name: string
  deliveryFee: number
  stopdeskFee?: number | null
}

export interface DeliveryOffer {
  id: string
  threshold: number
  label: string
}
