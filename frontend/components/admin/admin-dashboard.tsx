"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Download,
  Gift,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  Layers,
  Package,
  Pencil,
  Plus,
  Settings,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react"
import { useStore } from "@/components/store/store-provider"
import { useAdminAuth, getAdminToken } from "@/lib/admin-auth"
import {
  ApiError,
  createCollection,
  deleteCollection,
  deleteOrders,
  deleteProductImage,
  fetchAdminOrders,
  fetchAdminStats,
  fetchCategories,
  fetchCollections,
  fetchProductImages,
  fetchSiteSettings,
  updateAdminAccount,
  updateCategoryImage,
  updateCollection,
  updateCollectionImage,
  updateOrderStatus as apiUpdateOrderStatus,
  updateSiteImage,
  updateSiteSettings,
  type AdminStats,
  type ApiCategory,
  type CollectionWritePayload,
  type ProductWritePayload,
  type SiteSettings,
} from "@/lib/api"
import { CATEGORY_LABELS } from "@/lib/data"
import { formatDZD } from "@/lib/format"
import { setSiteImages } from "@/lib/site-images"
import type { Category, Order, OrderStatus, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

type Tab = "overview" | "orders" | "products" | "collections" | "settings"

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-accent/30 text-accent-foreground",
  confirmed: "bg-primary/15 text-primary",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
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
    return <div className="py-24 text-center text-muted-foreground">Chargement…</div>
  }

  if (!authed || !token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutDashboard className="size-6" />
          </div>
          <h1 className="text-center font-serif text-2xl">Accès administrateur</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Connectez-vous pour gérer la boutique.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setErr(null)
              setSubmitting(true)
              try {
                await login(username, password)
              } catch (error) {
                setErr(error instanceof ApiError ? error.message : "Connexion échouée. Veuillez réessayer.")
              } finally {
                setSubmitting(false)
              }
            }}
            className="mt-6 space-y-3"
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              className="input text-center"
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="input text-center"
              autoComplete="current-password"
            />
            {err && <p className="text-center text-xs text-destructive">{err}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Connexion…" : "Entrer dans le tableau de bord"}
            </button>
          </form>
          <Link href="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
            Retour à la boutique
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
  const { products, deleteProduct, productsLoading, collections } = useStore()
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

  async function handleBulkDelete(ids: number[]) {
    await deleteOrders(token, ids)
    setOrders((prev) => prev.filter((o) => !ids.includes(o.id)))
    // Refresh stats too so the totals reflect the deletions.
    fetchAdminStats(token).then(setStats).catch(() => {})
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Aperçu" },
    { id: "orders", label: "Commandes" },
    { id: "products", label: "Produits" },
    { id: "collections", label: "Collections" },
    { id: "settings", label: "Paramètres" },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Gérez les produits et les commandes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
            Voir la boutique
          </Link>
          <button onClick={onLogout} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Chiffre d'affaires" value={stats ? formatDZD(stats.totalRevenue) : "…"} icon={ShoppingCart} />
        <Stat
          label="Commandes"
          value={stats ? `${stats.totalOrders}` : "…"}
          sub={stats ? `${stats.ordersByStatus.new ?? 0} nouvelles` : undefined}
          icon={Package}
        />
        <Stat label="Produits" value={stats ? `${stats.totalProducts}` : `${products.length}`} icon={LayoutDashboard} />
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
         <Overview orders={orders} loading={ordersLoading} />    
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
{tab === "collections" && (
          <CollectionsPanel token={token} collections={collections} products={products} />
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
}: {
  orders: Order[]
  loading: boolean
}) {


  const recent = orders.slice(0, 5)

  return (
    <div className="space-y-6">

      {loading ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Chargement des commandes…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucune commande pour le moment.</p>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-lg">Commandes récentes</h2>
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
                    {STATUS_LABELS[o.status]}
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
    "Commande n°",
    "Date",
    "Client",
    "Téléphone",
    "Wilaya",
    "Commune",
    "Adresse",
    "Mode de livraison",
    "Articles",
    "Sous-total (DA)",
    "Livraison (DA)",
    "Total (DA)",
    "Cadeau surprise",
    "Statut",
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
      o.isGiftEligible ? "Oui" : "",
      STATUS_LABELS[o.status],
      o.notes ?? "",
    ].map(escape)
  })

  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `nyra-commandes-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "new", label: "Nouvelles" },
  { value: "confirmed", label: "Confirmées" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
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
      setError(err instanceof ApiError ? err.message : "Impossible de supprimer les commandes sélectionnées.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Chargement des commandes…</p>
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
            <Trash2 className="size-4" /> Supprimer ({selected.size})
          </button>
          <button
            onClick={() => exportOrdersToExcel(visible)}
            disabled={visible.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-50"
          >
            <Download className="size-4" /> Exporter CSV (Excel)
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {orders.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Aucune commande pour le moment. Les commandes passées dans la boutique apparaîtront ici.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Aucune commande avec ce statut.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Header row with select-all */}
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-card px-5 py-2 text-xs font-medium text-muted-foreground">
<input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAll}
              aria-label="Sélectionner toutes les commandes"
              className="size-4 accent-primary"
            />
            <span>
              {visible.length} commande{visible.length !== 1 ? "s" : ""} · {selected.size} sélectionnée{selected.size !== 1 ? "s" : ""}
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
                    aria-label={`Sélectionner la commande ${o.orderNumber}`}
                    className="mt-1 size-4 accent-primary"
                  />
                  <div>
                    <p className="font-medium">
                      {o.fullName} · <span className="text-muted-foreground">{o.phone}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString("fr-DZ")} · {o.address}, {o.commune}, {o.wilaya} · {o.deliveryMethod === "stopdesk" ? "Au bureau" : o.deliveryMethod === "home" ? "À domicile" : ""}
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
                  <option value="new">Nouvelle</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="shipped">Expédiée</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </select>
<span className={cn("rounded-full px-3 py-1 text-xs capitalize", STATUS_STYLES[o.status])}>{STATUS_LABELS[o.status]}</span>
                {o.isGiftEligible && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-3 py-1 text-xs font-medium text-wine">
                    <Gift className="size-3.5" /> Surprise Gift Eligible
                  </span>
                )}
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
        <Plus className="size-4" /> Ajouter un produit
      </button>
      {loading ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Chargement des produits…</p>
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
                  {CATEGORY_LABELS[p.category]} · {p.availability === "in-stock" ? "En stock" : "Rupture de stock"}
                </p>
              </div>
              <span className="text-sm font-medium text-primary">{formatDZD(p.price)}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(p)}
                  aria-label="Modifier"
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => onDelete(p.slug)}
                  aria-label="Supprimer"
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
// Collections tab
// ---------------------------------------------------------------------------

function CollectionsPanel({
  token,
  collections,
  products,
}: {
  token: string
  collections: import("@/lib/types").Collection[]
  products: Product[]
}) {
  const [loading, setLoading] = useState(true)
  const [localCollections, setLocalCollections] = useState(collections)
  const [editing, setEditing] = useState<import("@/lib/types").Collection | "new" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCollections()
      .then(setLocalCollections)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(c: import("@/lib/types").Collection) {
    if (!confirm(`Supprimer la collection "${c.name}" ?`)) return
    setError(null)
    try {
      await deleteCollection(token, c.slug)
      setLocalCollections((prev) => prev.filter((x) => x.slug !== c.slug))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de supprimer la collection.")
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gérez les collections présentées sur la page d'accueil et la page Collections.
        </p>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" /> Ajouter une collection
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Chargement des collections…
        </p>
      ) : localCollections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-14 text-center">
          <Layers className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-serif text-xl text-primary">Aucune collection</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre première collection pour la présenter sur le site.
          </p>
          <button
            onClick={() => setEditing("new")}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" /> Créer une collection
          </button>
        </div>
      ) : (
        <div className="space-y-3">
{localCollections.map((c) => {
            const count = products.length
              ? products.filter((p) => p.collection === c.name).length
              : 0
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                  <Image
                    src={c.image || "/placeholder.svg"}
                    alt={c.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {c.name}
                    {c.featured && (
                      <span className="ml-2 rounded-full bg-accent/30 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        À la une
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.description || "Aucune description"}
                    {count > 0 ? ` · ${count} produit${count !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(c)}
                    aria-label="Modifier"
                    className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    aria-label="Supprimer"
                    className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <CollectionEditor
          token={token}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setLocalCollections((prev) => {
              const exists = prev.some((x) => x.slug === saved.slug)
              return exists
                ? prev.map((x) => (x.slug === saved.slug ? saved : x))
                : [saved, ...prev]
            })
          }}
        />
      )}
    </div>
  )
}

// -- Collection editor modal ------------------------------------------------

interface CollectionEditorProps {
  token: string
  initial: import("@/lib/types").Collection | "new"
  onClose: () => void
  onSaved: (c: import("@/lib/types").Collection) => void
}

function CollectionEditor({ token, initial, onClose, onSaved }: CollectionEditorProps) {
  const isNew = initial === "new"
  const [name, setName] = useState(isNew ? "" : initial.name)
  const [description, setDescription] = useState(isNew ? "" : initial.description)
  const [featured, setFeatured] = useState(isNew ? false : initial.featured)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(isNew ? null : initial.image)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(f: File) {
    setImageFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function save() {
    setError(null)
    if (!name.trim()) {
      setError("Veuillez saisir un nom pour la collection.")
      return
    }
    setSaving(true)
    try {
      let saved: import("@/lib/types").Collection
      const payload: CollectionWritePayload = {
        name: name.trim(),
        description: description.trim(),
        featured,
      }
      if (isNew) {
        saved = await createCollection(token, payload)
        if (imageFile) {
          saved = await updateCollectionImage(token, saved.slug, imageFile)
        }
      } else {
        saved = await updateCollection(token, initial.slug, payload)
        if (imageFile) {
          saved = await updateCollectionImage(token, saved.slug, imageFile)
        }
      }
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer la collection.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-xl">
        <h2 className="font-serif text-xl">
          {isNew ? "Ajouter une collection" : "Modifier la collection"}
        </h2>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nom</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Image</span>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-secondary">
              <Image
                src={preview || "/placeholder.svg"}
                alt={name || "Image de la collection"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
              <ImageIcon className="size-3.5" /> {preview ? "Changer l'image" : "Ajouter une image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ""
                }}
              />
            </label>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              rows={3}
              className="input resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-primary"
            />
            Mettre en vedette (conseillé)
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
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
      setError("Les nouveaux mots de passe ne correspondent pas.")
      return
    }

    const payload: Record<string, string> = {}
    if (form.username.trim()) payload.username = form.username.trim()
    if (form.newPassword) {
      payload.current_password = form.currentPassword
      payload.new_password = form.newPassword
    }
    if (Object.keys(payload).length === 0) {
      setError("Saisissez un nouveau nom d'utilisateur ou mot de passe à enregistrer.")
      return
    }

    setSaving(true)
    try {
      const result = await updateAdminAccount(token, payload)
      setSuccess(`Compte mis à jour. Votre nom d'utilisateur est désormais "${result.username}".`)
      setForm({ username: "", currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      const ae = err as ApiError
      if (ae?.errors) {
        const msgs = Object.values(ae.errors as Record<string, string[]>)
          .flat()
          .join(" ")
        setError(msgs || ae.message)
      } else {
        setError(ae?.message || "Impossible de mettre à jour le compte. Veuillez réessayer.")
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
          <h2 className="font-serif text-lg">Paramètres du compte</h2>
          <p className="text-xs text-muted-foreground">Changez votre nom d'utilisateur ou votre mot de passe.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Nouveau nom d'utilisateur (facultatif)</span>
          <input
            className="input"
            placeholder="Laisser vide pour conserver"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />
        </label>

        <div className="border-t border-border pt-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4 text-muted-foreground" /> Changer le mot de passe
          </p>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Mot de passe actuel</span>
              <input
                type="password"
                className="input"
                placeholder="Requis pour définir un nouveau mot de passe"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Nouveau mot de passe</span>
                <input
                  type="password"
                  className="input"
                  placeholder="8 caractères min."
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Confirmer le nouveau mot de passe</span>
                <input
                  type="password"
                  className="input"
                  placeholder="Répéter le nouveau mot de passe"
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
            {saving ? "Enregistrement…" : "Enregistrer le compte"}
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
  free_delivery_threshold: 7000,
  free_gift_threshold: 10000,
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
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer les paramètres. Veuillez réessayer.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Chargement des paramètres de contact…</p>
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
          <h2 className="font-serif text-lg">Informations de contact</h2>
          <p className="text-xs text-muted-foreground">
            Les modifications apparaissent immédiatement dans le pied de page de la boutique.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Téléphone (chiffres, ex. 213555000000)</span>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="213555000000"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Affichage téléphone (ex. +213 555 00 00 00)</span>
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
            <span className="mb-1 block font-medium">Adresse</span>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ville, Pays"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">URL Instagram</span>
            <input
              type="url"
              className="input"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">URL TikTok</span>
            <input
              type="url"
              className="input"
              value={form.tiktok}
              onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
              placeholder="https://tiktok.com/@..."
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
  <label className="block text-sm">
    <span className="mb-1 block font-medium">
      Livraison gratuite à partir de (DA)
    </span>
    <input
      type="number"
      min="0"
      className="input"
      value={form.free_delivery_threshold}
      onChange={(e) =>
        setForm({
          ...form,
          free_delivery_threshold: Number(e.target.value),
        })
      }
      placeholder="7000"
    />
  </label>

  <label className="block text-sm">
    <span className="mb-1 block font-medium">
      Cadeau surprise à partir de (DA)
    </span>
    <input
      type="number"
      min="0"
      className="input"
      value={form.free_gift_threshold}
      onChange={(e) =>
        setForm({
          ...form,
          free_gift_threshold: Number(e.target.value),
        })
      }
      placeholder="10000"
    />
  </label>
</div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">Informations de contact enregistrées avec succès.</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer les informations de contact"}
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
        [field]: err instanceof ApiError ? err.message : "Échec du téléchargement. Veuillez réessayer.",
      }))
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Chargement des images…</p>
      </div>
    )
  }

  const items: { field: "hero_image" | "about_image"; label: string; hint: string }[] = [
    { field: "hero_image", label: "Bannière d'accueil", hint: "Affichée en haut de la page d'accueil." },
    { field: "about_image", label: "Page À propos", hint: "Affichée sur la page À propos." },
  ]

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImageIcon className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-lg">Images de la page d'accueil</h2>
          <p className="text-xs text-muted-foreground">
            Téléchargez ou remplacez les images utilisées sur la bannière d'accueil et la page À propos.
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
                    <span className="text-xs text-muted-foreground">Téléchargement…</span>
                  </div>
                )}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
                <ImageIcon className="size-3.5" /> Changer l'image
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
        [slug]: err instanceof ApiError ? err.message : "Échec du téléchargement. Veuillez réessayer.",
      }))
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Chargement des catégories…</p>
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
          <h2 className="font-serif text-lg">Images des catégories</h2>
          <p className="text-xs text-muted-foreground">
            Téléchargez ou remplacez l'image affichée pour chaque catégorie sur la page d'accueil.
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
                    <span className="text-xs text-muted-foreground">Téléchargement…</span>
                  </div>
                )}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
                <ImageIcon className="size-3.5" /> Changer l'image
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

const RING_SIZE_PRESETS = ["12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"]
const STANDARD_SIZE_LABEL = "Taille standard / Ajustable"

function SizeEditor({
  sizes,
  onChange,
}: {
  sizes: string[]
  onChange: (sizes: string[]) => void
}) {
  const hasStandard = sizes.includes(STANDARD_SIZE_LABEL)
  const numericSizes = sizes.filter((s) => s !== STANDARD_SIZE_LABEL)

  function toggleValue(value: string) {
    const exists = sizes.includes(value)
    onChange(exists ? sizes.filter((s) => s !== value) : [...sizes, value])
  }

  function addCustom(value: string) {
    const v = value.trim()
    if (!v) return
    if (sizes.includes(v)) return
    onChange([...sizes, v])
  }

  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Tailles de bague</span>
        <span className="text-xs text-muted-foreground">
          {sizes.length > 0 ? `${sizes.length} taille${sizes.length !== 1 ? "s" : ""} disponibles` : "Aucune taille"}
        </span>
      </div>

      {/* Standard / adjustable preset */}
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hasStandard}
          onChange={() => toggleValue(STANDARD_SIZE_LABEL)}
          className="accent-primary"
        />
        {STANDARD_SIZE_LABEL}
      </label>

      {/* Numeric size preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {RING_SIZE_PRESETS.map((s) => {
          const active = numericSizes.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleValue(s)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary",
              )}
            >
              {s}
            </button>
          )
        })}
      </div>

      {/* Custom size input */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const input = e.currentTarget.elements.namedItem("customSize") as HTMLInputElement
          addCustom(input.value)
          input.value = ""
        }}
      >
        <input
          name="customSize"
          className="input flex-1"
          placeholder="Ajouter une taille (ex. 23, 24…)"
        />
        <button
          type="submit"
          className="rounded-full border border-border px-4 text-sm hover:bg-secondary"
        >
          Ajouter
        </button>
      </form>

      {/* Selected sizes display */}
      {sizes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {s}
              <button
                type="button"
                onClick={() => toggleValue(s)}
                aria-label={`Retirer la taille ${s}`}
                className="text-primary/60 hover:text-primary"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface EditorForm {
  name: string
  description: string
  categorySlug: Category
  collectionSlug: string
  price: number
  oldPrice: number | ""
  material: string
  inStock: boolean
  isNew: boolean
  isBestSeller: boolean
  onPromotion: boolean
  sizes: string[]
}

function ProductEditor({
  initial,
  onClose,
}: {
  initial: Product | "new"
  onClose: () => void
}) {
const { addProduct, updateProduct, collections } = useStore()
  const isNew = initial === "new"

  const [categories, setCategories] = useState<{ id: number; slug: Category; name: string }[]>([])
  const [collectionsList, setCollectionsList] = useState<
    { id: number; slug: string; name: string }[]
  >(() => collections.map((c) => ({ id: c.id, slug: c.slug, name: c.name })))
  // Existing images (with backend id) for an edited product.
  const [existingImages, setExistingImages] = useState<
    { id: number; image: string; _removed?: boolean }[]
  >(isNew ? [] : (initial as Product).images.map((src) => ({ id: -1, image: src })))
  // Newly selected files (with a local preview URL).
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats.map((c) => ({ id: c.id, slug: c.slug as Category, name: c.name }))))
      .catch(() => setCategories([]))
  }, [])

  // For an edited product, load the full image list (with real backend ids) so
  // the admin can remove individual photos.
  useEffect(() => {
    if (isNew) return
    const token = getAdminToken()
    if (!token) return
    fetchProductImages(token, (initial as Product).slug)
      .then((imgs) => {
        if (imgs.length) setExistingImages(imgs)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

const base: EditorForm =
    initial === "new"
      ? {
          name: "",
          description: "",
          categorySlug: "rings",
          collectionSlug: "",
          price: 0,
          oldPrice: "",
          material: "",
          inStock: true,
          isNew: true,
          isBestSeller: false,
          onPromotion: false,
          sizes: [],
        }
      : {
          name: initial.name,
          description: initial.description,
          categorySlug: initial.category,
          collectionSlug: initial.collection
            ? collectionsList.find((c) => c.name === initial.collection)?.slug ?? ""
            : "",
          price: initial.price,
          oldPrice: initial.oldPrice ?? "",
          material: initial.material,
          inStock: initial.availability === "in-stock",
          isNew: initial.isNew,
          isBestSeller: initial.isBestSeller,
          onPromotion: initial.onPromotion,
          sizes: initial.sizes ?? [],
        }

  const [form, setForm] = useState<EditorForm>(base)

  async function save() {
    setError(null)
    const category = categories.find((c) => c.slug === form.categorySlug)
    if (!category) {
      setError("Les catégories sont encore en cours de chargement — veuillez patienter un instant et réessayer.")
      return
    }
const collection = collectionsList.find((c) => c.slug === form.collectionSlug)
    const payload: ProductWritePayload = {
      name: form.name,
      description: form.description,
      category: category.id,
      collection: collection ? collection.id : null,
      price: Number(form.price),
      old_price: form.oldPrice === "" ? null : Number(form.oldPrice),
      material: form.material,
      in_stock: form.inStock,
      is_new: form.isNew,
      is_best_seller: form.isBestSeller,
      on_promotion: form.onPromotion,
      sizes: form.sizes,
    }

    setSaving(true)
    try {
      const newFiles = newImages.map((n) => n.file)
      if (isNew) {
        await addProduct(payload, newFiles)
      } else {
        // Delete any existing images the admin chose to remove.
        const token = getAdminToken()
        if (token) {
          for (const img of existingImages) {
            if (img.id > 0 && img._removed) {
              await deleteProductImage(token, img.id)
            }
          }
        }
        await updateProduct((initial as Product).slug, payload, newFiles)
      }
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer le produit. Veuillez réessayer.")
    } finally {
      setSaving(false)
    }
  }

  function handleAddFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        setNewImages((prev) => [...prev, { file, preview: reader.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  function removeExistingImage(id: number) {
    setExistingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, _removed: true } : img)),
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-xl">
        <h2 className="font-serif text-xl">{isNew ? "Ajouter un produit" : "Modifier le produit"}</h2>
        <div className="mt-4 space-y-3">
          <div className="block text-sm">
            <span className="mb-1 block font-medium">
              Photos du produit {existingImages.length + newImages.length > 0 ? `(${existingImages.filter((i) => !i._removed).length + newImages.length})` : ""}
            </span>
            <div className="flex flex-wrap gap-3">
              {/* Existing photos */}
              {existingImages.map((img) =>
                img._removed ? null : (
                  <div key={img.id} className="group relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                    <Image src={img.image || "/placeholder.svg"} alt={form.name || "Photo du produit"} fill sizes="80px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      aria-label="Retirer la photo"
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ),
              )}
              {/* Newly selected photos */}
              {newImages.map((n, i) => (
                <div key={`new-${i}`} className="group relative size-20 shrink-0 overflow-hidden rounded-2xl border border-primary bg-secondary">
                  {n.preview ? (
                    <Image src={n.preview} alt="Nouvelle photo du produit" fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.6rem] text-muted-foreground">
                      Chargement…
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    aria-label="Retirer la photo"
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              {/* Upload button */}
              <label className="flex size-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Plus className="size-5" />
                <span className="text-[0.6rem] font-medium">Ajouter une photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleAddFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG ou PNG, les images carrées rendent le mieux. La première photo est la principale.
            </p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nom</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Prix (DZD)</span>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Ancien prix (facultatif)</span>
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
              <span className="mb-1 block font-medium">Catégorie</span>
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
              <span className="mb-1 block font-medium">Disponibilité</span>
              <select
                className="input"
                value={form.inStock ? "in-stock" : "out-of-stock"}
                onChange={(e) => setForm({ ...form, inStock: e.target.value === "in-stock" })}
              >
                <option value="in-stock">En stock</option>
                <option value="out-of-stock">Rupture de stock</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Collection (facultatif)</span>
            <select
              className="input"
              value={form.collectionSlug}
              onChange={(e) => setForm({ ...form, collectionSlug: e.target.value })}
            >
              <option value="">Aucune collection</option>
              {collectionsList.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
<label className="block text-sm">
            <span className="mb-1 block font-medium">Matière</span>
            <input className="input" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          </label>
          {form.categorySlug === "rings" ? (
            <SizeEditor
              sizes={form.sizes}
              onChange={(sizes) => setForm({ ...form, sizes })}
            />
          ) : null}
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
              Nouveau
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
              />
              Meilleure vente
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.onPromotion}
                onChange={(e) => setForm({ ...form, onPromotion: e.target.checked })}
              />
              En promotion
            </label>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={!form.name.trim() || saving}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer le produit"}
          </button>
        </div>
      </div>
    </div>
  )
}
