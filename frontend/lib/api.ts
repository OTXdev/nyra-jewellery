import type {
  Category,
  Collection,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  Wilaya,
} from "./types"

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  errors?: unknown
  constructor(message: string, status: number, errors?: unknown) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

interface FetchOptions extends RequestInit {
  token?: string | null
}

async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, headers, ...rest } = options
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  })

  if (res.status === 204) return null

  let data: any = null
  try {
    data = await res.json()
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = data?.detail || "Something went wrong. Please try again."
    throw new ApiError(message, res.status, data?.errors)
  }

  return data
}

// ---------------------------------------------------------------------------
// Mappers: backend JSON -> frontend types
// ---------------------------------------------------------------------------

function slugOf(value: any): string | null {
  if (!value) return null
  return typeof value === "string" ? value : value.slug ?? null
}

function nameOf(value: any, collectionNamesBySlug?: Record<string, string>): string | null {
  if (!value) return null
  if (typeof value === "string") {
    return collectionNamesBySlug?.[value] ?? value
  }
  return value.name ?? null
}

export function mapApiProduct(p: any, collectionNamesBySlug?: Record<string, string>): Product {
  const images: string[] = Array.isArray(p.images)
    ? p.images.map((img: any) => img.image).filter(Boolean)
    : p.primary_image
      ? [p.primary_image]
      : []

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: (slugOf(p.category) as Product["category"]) ?? "rings",
    collection: nameOf(p.collection, collectionNamesBySlug),
    price: p.price,
    oldPrice: p.old_price ?? undefined,
    images: images.length ? images : p.primary_image ? [p.primary_image] : [],
    description: p.description ?? "",
    material: p.material ?? "",
    availability: p.in_stock ? "in-stock" : "out-of-stock",
    isNew: !!p.is_new,
    isBestSeller: !!p.is_best_seller,
    onPromotion: !!p.on_promotion,
    popularity: p.rating ? Math.round(Number(p.rating) * 20) : 0,
    createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
    sizes: Array.isArray(p.sizes) ? p.sizes : undefined,
    relatedProducts: Array.isArray(p.related_products)
      ? p.related_products.map((rp: any) => mapApiProduct(rp, collectionNamesBySlug))
      : undefined,
  }
}

export function mapApiCollection(c: any): Collection {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image ?? null,
    featured: !!c.featured,
  }
}

export function mapApiWilaya(w: any): Wilaya {
  return {
    id: w.id,
    code: w.code,
    name: w.name,
    deliveryFee: w.delivery_fee,
    stopdeskFee: w.stopdesk_fee ?? null,
  }
}

function mapApiOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.order_number,
    createdAt: o.created_at,
    fullName: o.customer_name,
    phone: o.phone,
    wilaya: o.wilaya,
    commune: o.commune,
    address: o.address,
    notes: o.notes || undefined,
    items: (o.items || []).map(
      (it: any): OrderLine => ({
        productId: it.product,
        name: it.product_name,
        price: it.price,
        quantity: it.quantity,
        size: it.size || undefined,
        lineTotal: it.line_total,
      }),
    ),
    subtotal: o.subtotal,
    deliveryFee: o.delivery_fee,
    total: o.total,
    status: o.status,
  }
}

// ---------------------------------------------------------------------------
// Public catalog
// ---------------------------------------------------------------------------

export interface ApiCategory {
  id: number
  name: string
  slug: Category
  description: string
  image: string | null
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const data = await apiFetch("/categories/")
  const list = Array.isArray(data) ? data : data.results
  return (list || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image ?? null,
  }))
}

export async function fetchCollections(): Promise<Collection[]> {
  const data = await apiFetch("/collections/")
  const list = Array.isArray(data) ? data : data.results
  return (list || []).map(mapApiCollection)
}

export async function fetchWilayas(): Promise<Wilaya[]> {
  const data = await apiFetch("/wilayas/")
  const list = Array.isArray(data) ? data : data.results
  return (list || []).map(mapApiWilaya)
}

/**
 * Fetches all products (paginated on the backend) and flattens them into one
 * array — the storefront filters/sorts client-side. Pass query params to
 * narrow the request instead if you'd rather filter server-side.
 */
export async function fetchAllProducts(collectionNamesBySlug?: Record<string, string>): Promise<Product[]> {
  const results: any[] = []
  let path: string | null = "/products/?page_size=100"
  while (path) {
    const data: any = await apiFetch(path)
    if (Array.isArray(data)) {
      results.push(...data)
      break
    }
    results.push(...(data.results || []))
    path = data.next ? data.next.replace(API_BASE, "") : null
  }
  return results.map((p) => mapApiProduct(p, collectionNamesBySlug))
}

export async function fetchProduct(slug: string, collectionNamesBySlug?: Record<string, string>): Promise<Product> {
  const data = await apiFetch(`/products/${slug}/`)
  return mapApiProduct(data, collectionNamesBySlug)
}

export interface CreateOrderPayload {
  customer_name: string
  phone: string
  wilaya_id: number
  commune: string
  address: string
  notes?: string
  items: { product_id: number; quantity: number; size?: string }[]
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const data = await apiFetch("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return mapApiOrder(data)
}

export interface ContactPayload {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export async function createContactMessage(payload: ContactPayload) {
  return apiFetch("/contact/", { method: "POST", body: JSON.stringify(payload) })
}

// ---------------------------------------------------------------------------
// Site settings (public read, admin write)
// ---------------------------------------------------------------------------

export interface SiteSettings {
  phone: string
  phone_display: string
  email: string
  address: string
  instagram: string
  tiktok: string
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return apiFetch("/site-settings/")
}

export async function updateSiteSettings(token: string, payload: Partial<SiteSettings>): Promise<SiteSettings> {
  return apiFetch("/site-settings/", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------

export interface TokenPair {
  access: string
  refresh: string
}

export async function adminLogin(username: string, password: string): Promise<TokenPair> {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
  return { access: data.access, refresh: data.refresh }
}

export async function adminRefresh(refresh: string): Promise<string> {
  const data = await apiFetch("/auth/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  })
  return data.access
}

// ---------------------------------------------------------------------------
// Admin: products
// ---------------------------------------------------------------------------

export interface ProductWritePayload {
  name: string
  description: string
  category: number
  collection?: number | null
  price: number
  old_price?: number | null
  material: string
  in_stock: boolean
  is_new: boolean
  is_best_seller: boolean
  on_promotion: boolean
  sizes?: string[] | null
}

export async function createProduct(token: string, payload: ProductWritePayload) {
  return apiFetch("/products/", { method: "POST", token, body: JSON.stringify(payload) })
}

export async function updateProduct(token: string, slug: string, payload: Partial<ProductWritePayload>) {
  return apiFetch(`/products/${slug}/`, { method: "PATCH", token, body: JSON.stringify(payload) })
}

export async function deleteProduct(token: string, slug: string) {
  return apiFetch(`/products/${slug}/`, { method: "DELETE", token })
}

export async function uploadProductImage(
  token: string,
  productId: number,
  file: File,
  isPrimary = false,
) {
  const form = new FormData()
  form.append("product", String(productId))
  form.append("image", file)
  form.append("is_primary", String(isPrimary))
  return apiFetch("/admin/product-images/", { method: "POST", token, body: form })
}

/** Upload or replace the image for a category. */
export async function updateCategoryImage(token: string, slug: string, imageFile: File) {
  const form = new FormData()
  form.append("image", imageFile)
  return apiFetch(`/categories/${slug}/`, { method: "PATCH", token, body: form })
}

// ---------------------------------------------------------------------------
// Admin: orders
// ---------------------------------------------------------------------------

export async function fetchAdminOrders(token: string, status?: OrderStatus): Promise<Order[]> {
  const qs = status ? `?status=${status}` : ""
  const data = await apiFetch(`/admin/orders/${qs}`, { token })
  const list = Array.isArray(data) ? data : data.results
  return (list || []).map(mapApiOrder)
}

export async function updateOrderStatus(token: string, id: number, status: OrderStatus): Promise<Order> {
  const data = await apiFetch(`/admin/orders/${id}/`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  })
  return mapApiOrder(data)
}

// ---------------------------------------------------------------------------
// Admin: contact messages + stats
// ---------------------------------------------------------------------------

export async function fetchAdminContactMessages(token: string) {
  const data = await apiFetch("/admin/contact-messages/", { token })
  return Array.isArray(data) ? data : data.results
}

export async function markContactMessageRead(token: string, id: number) {
  return apiFetch(`/admin/contact-messages/${id}/read/`, { method: "PATCH", token })
}

export interface AdminStats {
  totalRevenue: number
  totalOrders: number
  ordersByStatus: Record<string, number>
  totalProducts: number
  unreadMessages: number
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const data = await apiFetch("/admin/stats/", { token })
  return {
    totalRevenue: data.total_revenue,
    totalOrders: data.total_orders,
    ordersByStatus: data.orders_by_status,
    totalProducts: data.total_products,
    unreadMessages: data.unread_messages,
  }
}

// ---------------------------------------------------------------------------
// Admin: account management
// ---------------------------------------------------------------------------

export interface AdminAccountUpdatePayload {
  username?: string
  current_password?: string
  new_password?: string
}

export async function updateAdminAccount(token: string, payload: AdminAccountUpdatePayload) {
  return apiFetch("/admin/account/", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
}
