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
  /**
   * Historical parameter from the localStorage-JWT days. Admin auth is now
   * HttpOnly-cookie based (the browser attaches it automatically via
   * `credentials: "include"`), so this is no longer read or required — it's
   * kept only so existing call sites throughout the admin dashboard don't
   * all need to be rewritten. Do not put a real JWT in it.
   */
  token?: string | null
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Caches the in-flight request so concurrent unsafe calls don't all fire
// their own GET /auth/csrf/ before the cookie lands.
let csrfCookieRequest: Promise<void> | null = null

/** Ensures the (JS-readable, non-HttpOnly) `csrftoken` cookie is set, so it
 * can be echoed back in the `X-CSRFToken` header on unsafe requests. This
 * carries no secret — it only proves the request came from a page that
 * could read this site's cookies, which is the point of CSRF protection. */
async function ensureCsrfCookie(): Promise<void> {
  if (readCookie("csrftoken")) return
  if (!csrfCookieRequest) {
    csrfCookieRequest = fetch(`${API_BASE}/auth/csrf/`, { credentials: "include" })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfCookieRequest = null
      })
  }
  return csrfCookieRequest
}

async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token: _token, headers, method, ...rest } = options
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData
  const httpMethod = (method || "GET").toUpperCase()

  if (UNSAFE_METHODS.has(httpMethod)) {
    await ensureCsrfCookie()
  }
  const csrfToken = readCookie("csrftoken")

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    method: httpMethod,
    // Admin auth cookies (HttpOnly) are sent automatically by the browser
    // whenever this is set — no JWT ever touches JavaScript.
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(UNSAFE_METHODS.has(httpMethod) && csrfToken ? { "X-CSRFToken": csrfToken } : {}),
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
    deliveryMethod: o.delivery_method || undefined,
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
    isGiftEligible: o.is_gift_eligible,
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

export interface CollectionWritePayload {
  name: string
  description?: string
  featured?: boolean
}

export async function createCollection(token: string, payload: CollectionWritePayload): Promise<Collection> {
  const data = await apiFetch("/collections/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
  return mapApiCollection(data)
}

export async function updateCollection(
  token: string,
  slug: string,
  payload: Partial<CollectionWritePayload>,
): Promise<Collection> {
  const data = await apiFetch(`/collections/${slug}/`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })
  return mapApiCollection(data)
}

export async function deleteCollection(token: string, slug: string) {
  return apiFetch(`/collections/${slug}/`, { method: "DELETE", token })
}

/** Upload or replace the image for a collection. */
export async function updateCollectionImage(token: string, slug: string, imageFile: File): Promise<Collection> {
  const form = new FormData()
  form.append("image", imageFile)
  const data = await apiFetch(`/collections/${slug}/`, {
    method: "PATCH",
    token,
    body: form,
  })
  return mapApiCollection(data)
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
  idempotency_key: string
  customer_name: string
  phone: string
  wilaya_id: number
  commune: string
  address?: string
  delivery_method?: "home" | "stopdesk"
  notes?: string
  items: {
    product_id: number
    quantity: number
    size?: string
  }[]
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
  hero_image: string | null
  about_image: string | null
  free_delivery_threshold: number
  free_gift_threshold: number
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return apiFetch("/site-settings/")
}

export async function updateSiteSettings(token: string, payload: Partial<SiteSettings>): Promise<SiteSettings> {
  // Remove image fields; they are updated separately via updateSiteImage
  // Sending string URLs for image fields causes validation errors.
  const { hero_image, about_image, ...data } = payload as any;
  return apiFetch("/site-settings/", {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  })
}

/** Upload or replace the homepage hero / about image. */
export async function updateSiteImage(
  token: string,
  field: "hero_image" | "about_image",
  file: File,
): Promise<SiteSettings> {
  const form = new FormData()
  form.append(field, file)
  return apiFetch("/site-settings/", {
    method: "PATCH",
    token,
    body: form,
  })
}

/** Reset the admin revenue figure (marks all non-''new'' orders as excluded). */
export async function resetAdminRevenue(token: string): Promise<AdminStats> {
  const data = await apiFetch("/admin/stats/", { method: "POST", token })
  return {
    totalRevenue: data.total_revenue,
    totalOrders: data.total_orders,
    ordersByStatus: data.orders_by_status,
    totalProducts: data.total_products,
    unreadMessages: data.unread_messages,
  }
}

// ---------------------------------------------------------------------------
// Admin auth
//
// The access/refresh JWTs live in HttpOnly cookies set directly by Django —
// they are never present in these response bodies and never touch
// JavaScript. These functions only carry non-secret admin identity info.
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: number
  username: string
  email: string
}

export async function adminLogin(username: string, password: string): Promise<AdminUser> {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
  return data.user
}

/** Silently refreshes the admin session using only the HttpOnly refresh
 * cookie — resolves once the access cookie has been reissued. */
export async function adminRefresh(): Promise<void> {
  await apiFetch("/auth/refresh/", { method: "POST" })
}

export async function adminLogout(): Promise<void> {
  await apiFetch("/auth/logout/", { method: "POST" })
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

/** Delete a product image by its backend id. */
export async function deleteProductImage(token: string, imageId: number) {
  return apiFetch(`/admin/product-images/${imageId}/`, { method: "DELETE", token })
}

/** Fetch a product's images with their backend ids (for admin image management). */
export async function fetchProductImages(
  token: string,
  slug: string,
): Promise<{ id: number; image: string }[]> {
  const data = await apiFetch(`/products/${slug}/`, { token })
  return (data?.images || []).map((img: any) => ({ id: img.id, image: img.image }))
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

/** Bulk-delete orders by id. Expects {"ids": number[]}. */
export async function deleteOrders(token: string, ids: number[]) {
  return apiFetch("/admin/orders/bulk-delete/", {
    method: "POST",
    token,
    body: JSON.stringify({ ids }),
  })
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