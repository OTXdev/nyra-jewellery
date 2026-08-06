"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Download,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react"
import { useStore } from "@/components/store/store-provider"
import { useAdminAuth } from "@/lib/admin-auth"
import {
  ApiError,
  deleteOrders,
  fetchAdminOrders,
  fetchAdminStats,
  fetchCategories,
  fetchSiteSettings,
  resetAdminRevenue,
  updateAdminAccount,
  updateCategoryImage,
  updateOrderStatus as apiUpdateOrderStatus,
  updateSiteImage,
  updateSiteSettings,
  type AdminStats,
  type ApiCategory,
  type ProductWritePayload,
  type SiteSettings,
} from "@/lib/api"
import { CATEGORY_LABELS } from "@/lib/data"
import { formatDZD } from "@/lib/format"
import { setSiteImages } from "@/lib/site-images"
import type { Category, Order, OrderStatus, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

type Tab = "overview" | "orders" | "products" | "settings"

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-accent/30 text-accent-foreground",
  confirmed: "bg-primary/15 text-primary",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
}

// ---------------------------------------------------------------------------
// Root component — handles auth gate
// ---------------------------------------------------------------------------

export function AdminDashboard() {
  const { token, authed, checking, login, logout } = useAdminAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (checking) {
    return <div className="py-24 text-center text-muted-foreground">Loading…</div>
  }

  if (!authed || !token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutDashboard className="size-6" />
          </div>
          <h1 className="text-center font-serif text-2xl">Admin Access</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Log in to manage the store.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setErr(null)
              setSubmitting(true)
              try {
                await login(username, password)
              } catch (error) {
                setErr(error instanceof ApiError ? error.message : "Login failed. Please try again.")
              } finally {
                setSubmitting(false)
              }
            }}
            className="mt-6 space-y-3"
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="input text-center"
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input text-center"
              autoComplete="current-password"
            />
            {err && <p className="text-center text-xs text-destructive">{err}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Enter dashboard"}
            </button>
          </form>
          <Link href="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
            Back to store
          </Link>
        </div>
      </div>
    )
  }

  return <Dashboard token={token} onLogout={logout} />
}

// ---------------------------------------------------------------------------
// Main dashboard shell
// ---------------------------------------------------------------------------

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { products, deleteProduct, productsLoading } = useStore()
  const [tab, setTab] = useState<Tab>("overview")
  const [editing, setEditing] = useState<Product | "new" | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetchAdminOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false))
    fetchAdminStats(token)
      .then(setStats)
      .catch(() => setStats(null))
  }, [token])

  async function handleStatusChange(id: number, status: OrderStatus) {
    const updated = await apiUpdateOrderStatus(token, id, status)
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
  }

  async function handleResetRevenue() {
    const updated = await resetAdminRevenue(token)
    setStats(updated)
  }

  async function handleBulkDelete(ids: number[]) {
    await deleteOrders(token, ids)
    setOrders((prev) => prev.filter((o) => !ids.includes(o.id)))
    // Refresh stats too so the totals reflect the deletions.
    fetchAdminStats(token).then(setStats).catch(() => {})
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "products", label: "Products" },
    { id: "settings", label: "Settings" },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage products and orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
            View store
          </Link>
          <button onClick={onLogout} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
            Log out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total revenue" value={stats ? formatDZD(stats.totalRevenue) : "…"} icon={ShoppingCart} />
        <Stat
          label="Orders"
          value={stats ? `${stats.totalOrders}` : "…"}
          sub={stats ? `${stats.ordersByStatus.new ?? 0} new` : undefined}
          icon={Package}
        />
        <Stat label="Products" value={stats ? `${stats.totalProducts}` : `${products.length}`} icon={LayoutDashboard} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <Overview orders={orders} loading={ordersLoading} onResetRevenue={handleResetRevenue} />
        )}
        {tab === "orders" && (
          <OrdersTable
            orders={orders}
            loading={ordersLoading}
            onStatus={handleStatusChange}
            onBulkDelete={handleBulkDelete}
          />
        )}
        {tab === "products" && (
          <ProductsTable
            products={products}
            loading={productsLoading}
            onEdit={setEditing}
            onNew={() => setEditing("new")}
            onDelete={(slug) => deleteProduct(slug)}
          />
        )}
        {tab === "settings" && <SettingsPanel token={token} />}
      </div>

      {editing && <ProductEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-5 text-primary" />
      </div>
      <p className="mt-2 font-serif text-2xl">{value}</p>
      {sub && <p className="text-xs text-primary">{sub}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function Overview({
  orders,
  loading,
  onResetRevenue,
}: {
  orders: Order[]
  loading: boolean
  onResetRevenue: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmReset() {
    setResetting(true)
    setError(null)
    try {
      await onResetRevenue()
      setConfirming(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset revenue. Please try again.")
    } finally {
      setResetting(false)
    }
  }

  const recent = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg">Revenue control</h2>
            <p className="text-xs text-muted-foreground">
              Cancelled orders are never counted. Reset the revenue figure to 0 for a fresh start.
            </p>
          </div>
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="size-4" /> Reset revenue
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-xl">Reset revenue?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will set the total revenue to 0. All orders except the ones still marked as{" "}
              <span className="font-medium text-foreground">new</span> will stop counting toward revenue.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={resetting}
                className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={resetting}
                className="rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "Yes, reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-lg">Recent orders</h2>
          <ul className="mt-4 divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{o.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.orderNumber} · {o.wilaya} · {o.deliveryMethod === "stopdesk" ? "Au bureau" : o.deliveryMethod === "home" ? "À domicile" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">{formatDZD(o.total)}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", STATUS_STYLES[o.status])}>
                    {o.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Orders tab
// ---------------------------------------------------------------------------

function exportOrdersToExcel(orders: Order[]) {
  // Build CSV content (opens natively in Excel; no dependency needed).
  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const headers = [
    "Order #",
    "Date",
    "Customer",
    "Phone",
    "Wilaya",
    "Commune",
    "Address",
    "Delivery Method",
    "Items",
    "Subtotal (DA)",
    "Delivery (DA)",
    "Total (DA)",
    "Status",
    "Notes",
  ]

  const rows = orders.map((o) => {
    const itemsSummary = o.items
      .map((i) => `${i.name} x${i.quantity}${i.size ? ` (${i.size})` : ""}`)
      .join(" | ")
    const methodLabel = o.deliveryMethod === "stopdesk" ? "Au bureau" : o.deliveryMethod === "home" ? "À domicile" : ""
    return [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString("fr-DZ"),
      o.fullName,
      o.phone,
      o.wilaya,
      o.commune,
      o.address,
      methodLabel,
      itemsSummary,
      o.subtotal,
      o.deliveryFee,
      o.total,
      o.status,
      o.notes ?? "",
    ].map(escape)
  })

  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `nyra-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

function OrdersTable({
  orders,
  loading,
  onStatus,
  onBulkDelete,
}: {
  orders: Order[]
  loading: boolean
  onStatus: (id: number, s: OrderStatus) => void
  onBulkDelete: (ids: number[]) => Promise<void>
}) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter)
  const allVisibleSelected = visible.length > 0 && visible.every((o) => selected.has(o.id))

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visible.forEach((o) => next.delete(o.id))
      } else {
        visible.forEach((o) => next.add(o.id))
      }
      return next
    })
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setDeleting(true)
    setError(null)
    try {
      await onBulkDelete(ids)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the selected orders.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Loading orders…</p>
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value)
                setSelected(new Set())
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk delete */}
          <button
            onClick={handleBulkDelete}
            disabled={selected.size === 0 || deleting}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"
          >
            <Trash2 className="size-4" /> Delete ({selected.size})
          </button>
          <button
            onClick={() => exportOrdersToExcel(visible)}
            disabled={visible.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-50"
          >
            <Download className="size-4" /> Export CSV (Excel)
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {orders.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No orders yet. Orders placed in the store will appear here.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No orders with the selected status.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Header row with select-all */}
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-card px-5 py-2 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAll}
              className="size-4 accent-primary"
            />
            <span>
              {visible.length} order{visible.length !== 1 ? "s" : ""} · {selected.size} selected
            </span>
          </div>

          {visible.map((o) => (
            <div
              key={o.id}
              className={cn(
                "rounded-3xl border bg-card p-5 shadow-sm transition-colors",
                selected.has(o.id) ? "border-primary" : "border-border",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <div>
                    <p className="font-medium">
                      {o.fullName} · <span className="text-muted-foreground">{o.phone}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString()} · {o.address}, {o.commune}, {o.wilaya} · {o.deliveryMethod === "stopdesk" ? "Au bureau" : o.deliveryMethod === "home" ? "À domicile" : ""}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-primary">{formatDZD(o.total)}</p>
              </div>
              <ul className="ml-7 mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {o.items.map((i) => (
                  <li key={`${i.productId}-${i.size ?? "na"}`} className="rounded-full bg-secondary px-2.5 py-1">
                    {i.name} x{i.quantity}
                  </li>
                ))}
              </ul>
              <div className="ml-7 mt-4 flex flex-wrap items-center gap-2">
                <select
                  value={o.status}
                  onChange={(e) => onStatus(o.id, e.target.value as OrderStatus)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs"
                >
                  <option value="new">New</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className={cn("rounded-full px-3 py-1 text-xs capitalize", STATUS_STYLES[o.status])}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Products tab
// ---------------------------------------------------------------------------

function ProductsTable({
  products,
  loading,
  onEdit,
  onNew,
  onDelete,
}: {
  products: Product[]
  loading: boolean
  onEdit: (p: Product) => void
  onNew: () => void
  onDelete: (slug: string) => void
}) {
  return (
    <div>
      <button
        onClick={onNew}
        className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" /> Add product
      </button>
      {loading ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Loading products…</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                <Image src={p.images[0] || "/placeholder.svg"} alt={p.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[p.category]} · {p.availability === "in-stock" ? "In stock" : "Out of stock"}
                </p>
              </div>
              <span className="text-sm font-medium text-primary">{formatDZD(p.price)}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(p)}
                  aria-label="Edit"
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => onDelete(p.slug)}
                  aria-label="Delete"
                  className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

function SettingsPanel({ token }: { token: string }) {
  return (
    <div className="space-y-6">
      <AccountSettings token={token} />
      <ContactSettings token={token} />
      <HomepageImageSettings token={token} />
      <CategoryImageSettings token={token} />
    </div>
  )
}

// -- Account Settings --------------------------------------------------------

function AccountSettings({ token }: { token: string }) {
  const [form, setForm] = useState({ username: "", currentPassword: "", newPassword: "", confirmPassword: "" })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(null)
    setError(null)

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.")
      return
    }

    const payload: Record<string, string> = {}
    if (form.username.trim()) payload.username = form.username.trim()
    if (form.newPassword) {
      payload.current_password = form.currentPassword
      payload.new_password = form.newPassword
    }
    if (Object.keys(payload).length === 0) {
      setError("Enter a new username or password to save.")
      return
    }

    setSaving(true)
    try {
      const result = await updateAdminAccount(token, payload)
      setSuccess(`Account updated. Your username is now "${result.username}".`)
      setForm({ username: "", currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      const ae = err as ApiError
      if (ae?.errors) {
        const msgs = Object.values(ae.errors as Record<string, string[]>)
          .flat()
          .join(" ")
        setError(msgs || ae.message)
      } else {
        setError(ae?.message || "Could not update account. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-lg">Account Settings</h2>
          <p className="text-xs text-muted-foreground">Change your username or password.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">New username (optional)</span>
          <input
            className="input"
            placeholder="Leave blank to keep current"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />
        </label>

        <div className="border-t border-border pt-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4 text-muted-foreground" /> Change password
          </p>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Current password</span>
              <input
                type="password"
                className="input"
                placeholder="Required when setting a new password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">New password</span>
                <input
                  type="password"
                  className="input"
                  placeholder="Min. 8 characters"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Confirm new password</span>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save account"}
          </button>
        </div>
      </form>
    </div>
  )
}

// -- Contact Information -----------------------------------------------------

function ContactSettings({ token }: { token: string }) {
  const [form, setForm] = useState<SiteSettings>({
    phone: "",
    phone_display: "",
    email: "",
    address: "",
    instagram: "",
    tiktok: "",
    hero_image: null,
    about_image: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => setForm(s))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    setSaving(true)
    try {
      const updated = await updateSiteSettings(token, form)
      setForm(updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading contact settings…</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Settings className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-lg">Contact Information</h2>
          <p className="text-xs text-muted-foreground">
            Changes appear immediately in the store footer.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Phone (digits, e.g. 213555000000)</span>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="213555000000"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Phone display (e.g. +213 555 00 00 00)</span>
            <input
              className="input"
              value={form.phone_display}
              onChange={(e) => setForm({ ...form, phone_display: e.target.value })}
              placeholder="+213 555 00 00 00"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="hello@example.com"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Address</span>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="City, Country"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Instagram URL</span>
            <input
              type="url"
              className="input"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">TikTok URL</span>
            <input
              type="url"
              className="input"
              value={form.tiktok}
              onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
              placeholder="https://tiktok.com/@..."
            />
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">Contact information saved successfully.</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save contact info"}
          </button>
        </div>
      </form>
    </div>
  )
}

// -- Homepage Images ---------------------------------------------------------

function HomepageImageSettings({ token }: { token: string }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<"hero_image" | "about_image" | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleImageChange(field: "hero_image" | "about_image", file: File) {
    const reader = new FileReader()
    reader.onload = () =>
      setPreviews((p) => ({ ...p, [field]: reader.result as string }))
    reader.readAsDataURL(file)

    setUploading(field)
    setErrors((e) => ({ ...e, [field]: "" }))
    try {
      const updated = await updateSiteImage(token, field, file)
      setSettings(updated)
      // Update the reactive store so the hero/about image on the storefront
      // changes instantly, without a page refresh.
      if (updated[field]) {
        setSiteImages(field === "hero_image" ? { hero: updated[field] } : { about: updated[field] })
      }
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [field]: err instanceof ApiError ? err.message : "Upload failed. Please try again.",
      }))
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading images…</p>
      </div>
    )
  }

  const items: { field: "hero_image" | "about_image"; label: string; hint: string }[] = [
    { field: "hero_image", label: "Homepage hero", hint: "Shown at the top of the homepage." },
    { field: "about_image", label: "About page", hint: "Shown on the About page." },
  ]

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImageIcon className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-lg">Homepage Images</h2>
          <p className="text-xs text-muted-foreground">
            Upload or replace the images used on the homepage hero and the About page.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((item) => {
          const current = settings?.[item.field]
          const previewSrc = previews[item.field] || current || "/placeholder.svg"
          const isUploading = uploading === item.field
          return (
            <div key={item.field} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary">
                <Image
                  src={previewSrc}
                  alt={item.label}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <span className="text-xs text-muted-foreground">Uploading…</span>
                  </div>
                )}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
                <ImageIcon className="size-3.5" /> Change image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageChange(item.field, file)
                    e.target.value = ""
                  }}
                />
              </label>
              {errors[item.field] && (
                <p className="text-xs text-destructive">{errors[item.field]}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -- Category Images ---------------------------------------------------------

function CategoryImageSettings({ token }: { token: string }) {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleImageChange(slug: string, file: File) {
    const reader = new FileReader()
    reader.onload = () =>
      setPreviews((p) => ({ ...p, [slug]: reader.result as string }))
    reader.readAsDataURL(file)

    setUploading(slug)
    setErrors((e) => ({ ...e, [slug]: "" }))
    try {
      const updated = await updateCategoryImage(token, slug, file)
      setCategories((prev) =>
        prev.map((c) => (c.slug === slug ? { ...c, image: updated.image } : c)),
      )
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [slug]: err instanceof ApiError ? err.message : "Upload failed. Please try again.",
      }))
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImageIcon className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-lg">Category Images</h2>
          <p className="text-xs text-muted-foreground">
            Upload or replace the image shown for each category on the homepage.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => {
          const previewSrc = previews[cat.slug] || cat.image || "/placeholder.svg"
          const isUploading = uploading === cat.slug
          return (
            <div key={cat.slug} className="space-y-2">
              <p className="text-sm font-medium capitalize">{cat.name}</p>
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-secondary">
                <Image
                  src={previewSrc}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <span className="text-xs text-muted-foreground">Uploading…</span>
                  </div>
                )}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
                <ImageIcon className="size-3.5" /> Change image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageChange(cat.slug, file)
                    e.target.value = ""
                  }}
                />
              </label>
              {errors[cat.slug] && (
                <p className="text-xs text-destructive">{errors[cat.slug]}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product editor modal
// ---------------------------------------------------------------------------

interface EditorForm {
  name: string
  description: string
  categorySlug: Category
  price: number
  oldPrice: number | ""
  material: string
  inStock: boolean
  isNew: boolean
  isBestSeller: boolean
  onPromotion: boolean
}

function ProductEditor({
  initial,
  onClose,
}: {
  initial: Product | "new"
  onClose: () => void
}) {
  const { addProduct, updateProduct } = useStore()
  const isNew = initial === "new"

  const [categories, setCategories] = useState<{ id: number; slug: Category; name: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    isNew ? null : (initial as Product).images[0] || null,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats.map((c) => ({ id: c.id, slug: c.slug as Category, name: c.name }))))
      .catch(() => setCategories([]))
  }, [])

  const base: EditorForm =
    initial === "new"
      ? {
          name: "",
          description: "",
          categorySlug: "rings",
          price: 0,
          oldPrice: "",
          material: "",
          inStock: true,
          isNew: true,
          isBestSeller: false,
          onPromotion: false,
        }
      : {
          name: initial.name,
          description: initial.description,
          categorySlug: initial.category,
          price: initial.price,
          oldPrice: initial.oldPrice ?? "",
          material: initial.material,
          inStock: initial.availability === "in-stock",
          isNew: initial.isNew,
          isBestSeller: initial.isBestSeller,
          onPromotion: initial.onPromotion,
        }

  const [form, setForm] = useState<EditorForm>(base)

  async function save() {
    setError(null)
    const category = categories.find((c) => c.slug === form.categorySlug)
    if (!category) {
      setError("Categories are still loading — please wait a moment and try again.")
      return
    }
    const payload: ProductWritePayload = {
      name: form.name,
      description: form.description,
      category: category.id,
      price: Number(form.price),
      old_price: form.oldPrice === "" ? null : Number(form.oldPrice),
      material: form.material,
      in_stock: form.inStock,
      is_new: form.isNew,
      is_best_seller: form.isBestSeller,
      on_promotion: form.onPromotion,
    }

    setSaving(true)
    try {
      if (isNew) {
        await addProduct(payload, imageFile)
      } else {
        await updateProduct((initial as Product).slug, payload, imageFile)
      }
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the product. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-xl">
        <h2 className="font-serif text-xl">{isNew ? "Add product" : "Edit product"}</h2>
        <div className="mt-4 space-y-3">
          <div className="block text-sm">
            <span className="mb-1 block font-medium">Product photo</span>
            <div className="flex items-center gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                <Image
                  src={imagePreview || "/placeholder.svg"}
                  alt={form.name || "Product photo"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary">
                  <Plus className="size-3.5" /> Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setImageFile(file)
                      const reader = new FileReader()
                      reader.onload = () => setImagePreview(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
                <p className="text-xs text-muted-foreground">JPG or PNG, square images look best.</p>
              </div>
            </div>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Price (DZD)</span>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Old price (optional)</span>
              <input
                type="number"
                className="input"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value ? Number(e.target.value) : "" })}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Category</span>
              <select
                className="input"
                value={form.categorySlug}
                onChange={(e) => setForm({ ...form, categorySlug: e.target.value as Category })}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Availability</span>
              <select
                className="input"
                value={form.inStock ? "in-stock" : "out-of-stock"}
                onChange={(e) => setForm({ ...form, inStock: e.target.value === "in-stock" })}
              >
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Material</span>
            <input className="input" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              rows={3}
              className="input resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} />
              New
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
              />
              Best seller
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.onPromotion}
                onChange={(e) => setForm({ ...form, onPromotion: e.target.checked })}
              />
              On promotion
            </label>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!form.name.trim() || saving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  )
}
