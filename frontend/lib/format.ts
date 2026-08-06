export function formatDA(value: number): string {
  return `${new Intl.NumberFormat('fr-DZ').format(Math.round(value))} DA`
}

// Alias used across the app
export const formatDZD = formatDA

export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}
