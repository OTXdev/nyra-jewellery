/**
 * Canonical production base URL for the storefront.
 *
 * Set NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_BASE_URL) to the deployed origin
 * (e.g. "https://nyrajewellery.com") once the site is live. Until then we fall
 * back to the local dev origin so the sitemap/robots logic stays identical and
 * does not need rewriting when the domain is configured.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "http://localhost:3000"
).replace(/\/$/, "")
