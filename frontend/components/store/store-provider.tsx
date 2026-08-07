"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  updateProduct as apiUpdateProduct,
  fetchAllProducts,
  fetchCollections,
  type ProductWritePayload,
} from "@/lib/api"
import { getAdminToken } from "@/lib/admin-auth"
import type { CartItem, Collection, Product } from "@/lib/types"

const CART_KEY = "nyra_cart_v1"

interface DeliveryStatus {
  freeDelivery: boolean
  freeGift: boolean
  nextThreshold: number | null
  nextLabel: string | null
  remaining: number
}

// Marketing thresholds only — the *actual* delivery cost charged on an order
// comes from the wilaya's real fee (see /api/wilayas/), applied at checkout.
const FREE_DELIVERY_THRESHOLD = 7000
const FREE_GIFT_THRESHOLD = 10000

interface StoreContextValue {
  hydrated: boolean
  // catalog
  products: Product[]
  collections: Collection[]
  productsLoading: boolean
  productsError: string | null
  refreshProducts: () => Promise<void>
  getProduct: (idOrSlug: string | number) => Product | undefined
  addProduct: (payload: ProductWritePayload, imageFiles?: File[] | null) => Promise<void>
  updateProduct: (slug: string, payload: Partial<ProductWritePayload>, imageFiles?: File[] | null) => Promise<void>
  deleteProduct: (slug: string) => Promise<void>
  // cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: number, size?: string) => void
  updateQuantity: (productId: number, quantity: number, size?: string) => void
  clearCart: () => void
  cartCount: number
  subtotal: number
  delivery: DeliveryStatus
}

const StoreContext = createContext<StoreContextValue | null>(null)

function sameLine(a: CartItem, productId: number, size?: string) {
  return a.productId === productId && (a.size ?? null) === (size ?? null)
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])

  const loadCatalog = useCallback(async () => {
    setProductsLoading(true)
    setProductsError(null)
    try {
      const cols = await fetchCollections()
      setCollections(cols)
      const namesBySlug: Record<string, string> = {}
      cols.forEach((c) => (namesBySlug[c.slug] = c.name))
      const prods = await fetchAllProducts(namesBySlug)
      setProducts(prods)
    } catch {
      setProductsError("Impossible de charger le catalogue. Vérifiez votre connexion et réessayez.")
    } finally {
      setProductsLoading(false)
    }
  }, [])

  // Fetch catalog from the backend on mount.
  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  // Cart still lives in localStorage — it's device-local until checkout.
  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY)
      if (c) setCart(JSON.parse(c))
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart, hydrated])

  const getProduct = useCallback(
    (idOrSlug: string | number) => products.find((p) => p.id === idOrSlug || p.slug === idOrSlug),
    [products],
  )

  const addProduct = useCallback(
    async (payload: ProductWritePayload, imageFiles?: File[] | null) => {
      const token = getAdminToken()
      if (!token) throw new Error("Session administrateur expirée. Veuillez vous reconnecter.")
      const created = await apiCreateProduct(token, payload)
      if (imageFiles && imageFiles.length > 0) {
        const { uploadProductImage } = await import("@/lib/api")
        for (let i = 0; i < imageFiles.length; i++) {
          await uploadProductImage(token, created.id, imageFiles[i], i === 0)
        }
      }
      await loadCatalog()
    },
    [loadCatalog],
  )

  const updateProduct = useCallback(
    async (slug: string, payload: Partial<ProductWritePayload>, imageFiles?: File[] | null) => {
      const token = getAdminToken()
      if (!token) throw new Error("Session administrateur expirée. Veuillez vous reconnecter.")
      const updated = await apiUpdateProduct(token, slug, payload)
      if (imageFiles && imageFiles.length > 0) {
        const { uploadProductImage } = await import("@/lib/api")
        for (let i = 0; i < imageFiles.length; i++) {
          await uploadProductImage(token, updated.id, imageFiles[i], false)
        }
      }
      await loadCatalog()
    },
    [loadCatalog],
  )

  const deleteProduct = useCallback(
    async (slug: string) => {
      const token = getAdminToken()
      if (!token) throw new Error("Session administrateur expirée. Veuillez vous reconnecter.")
      await apiDeleteProduct(token, slug)
      setProducts((prev) => prev.filter((p) => p.slug !== slug))
    },
    [],
  )

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => sameLine(i, item.productId, item.size))
      if (existing) {
        return prev.map((i) =>
          sameLine(i, item.productId, item.size) ? { ...i, quantity: i.quantity + item.quantity } : i,
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeFromCart = useCallback((productId: number, size?: string) => {
    setCart((prev) => prev.filter((i) => !sameLine(i, productId, size)))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number, size?: string) => {
    setCart((prev) =>
      prev
        .map((i) => (sameLine(i, productId, size) ? { ...i, quantity: Math.max(1, quantity) } : i))
        .filter((i) => i.quantity > 0),
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart])

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, i) => {
        const p = products.find((pr) => pr.id === i.productId)
        return sum + (p ? p.price * i.quantity : 0)
      }, 0),
    [cart, products],
  )

  const delivery = useMemo<DeliveryStatus>(() => {
    const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD
    const freeGift = subtotal >= FREE_GIFT_THRESHOLD
    const next = !freeDelivery
      ? { threshold: FREE_DELIVERY_THRESHOLD, label: "Livraison gratuite" }
      : !freeGift
        ? { threshold: FREE_GIFT_THRESHOLD, label: "Livraison gratuite + Petit cadeau offert" }
        : null
    return {
      freeDelivery,
      freeGift,
      nextThreshold: next?.threshold ?? null,
      nextLabel: next?.label ?? null,
      remaining: next ? next.threshold - subtotal : 0,
    }
  }, [subtotal])

  const value: StoreContextValue = {
    hydrated,
    products,
    collections,
    productsLoading,
    productsError,
    refreshProducts: loadCatalog,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    subtotal,
    delivery,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore doit être utilisé dans StoreProvider")
  return ctx
}
