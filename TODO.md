# TODO: Admin — images, revenue, filtering, bulk delete

## Feature Set 1 — Homepage/About images + revenue ✅

- [x] Add `hero_image`/`about_image` fields to `SiteSettings` model
- [x] Migration `0006` (image fields only) applied
- [x] Extend `SiteSettingsSerializer` with image fields (absolute URLs)
- [x] Update `AdminStatsView` revenue = sum of **DELIVERED** orders only
- [x] Revenue reset (POST) **deletes** all delivered orders → revenue becomes 0
- [x] Removed unused `excluded_from_revenue` field/model/column
- [x] Extend `SiteSettings` type + `resetAdminRevenue()` + `updateSiteImage()` in `api.ts`
- [x] Add reactive image store `lib/site-images.ts` (useSyncExternalStore)
- [x] Hero/about images now update **INSTANTLY** (no refresh) via `setSiteImages()`
- [x] Add "Homepage Images" section + "Reset revenue" button w/ confirmation popup

## Feature Set 2 — Order filtering + selection delete ✅

- [x] Backend: `bulk_delete` action on `/api/admin/orders/bulk-delete/`
- [x] Frontend: `deleteOrders()` in `api.ts`
- [x] Frontend: status filter buttons (All/New/Confirmed/Shipped/Delivered/Cancelled)
- [x] Frontend: per-order + select-all checkboxes
- [x] Frontend: "Delete (n)" bulk-delete button updates list + stats

## Verify ✅

- [x] Backend `manage.py check` clean
- [x] Migration applied (image fields), stale `excluded_from_revenue` column dropped
- [x] Frontend `tsc --noEmit` passes (no type errors)
