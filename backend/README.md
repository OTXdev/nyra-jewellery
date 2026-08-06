# Nyra Jewellery — Backend API

Django + Django REST Framework backend for the Nyra Jewellery Next.js storefront.
Cash on Delivery only (no online payment). JWT-protected admin API for the
dashboard; a public, unauthenticated API for the storefront.

## Tech stack

- Python 3.12, Django 5, Django REST Framework
- PostgreSQL
- JWT auth via `djangorestframework-simplejwt`
- `django-cors-headers` for CORS
- Pillow for image handling

## Project layout

```
nyra_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── nyra/              # project settings, root urls
└── store/             # the one app: models, serializers, views, urls, admin
    └── management/commands/
        ├── seed_wilayas.py   # seeds the 58 wilayas + default delivery fees
        └── create_admin.py   # creates/updates the initial admin user
```

## Setup

1. **Create a virtualenv and install dependencies**

   ```bash
   python3 -m venv venv
   source venv/bin/activate       # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # then edit .env — at minimum set DJANGO_SECRET_KEY, DB_* credentials,
   # CORS_ALLOWED_ORIGINS, and ADMIN_PASSWORD
   ```

   For a quick local test without installing Postgres, set `DB_ENGINE=sqlite`
   in `.env` — the project will use a local `db.sqlite3` file instead.

3. **Create the PostgreSQL database** (skip if using `DB_ENGINE=sqlite`)

   ```bash
   createdb nyra_db
   # or, from psql:
   # CREATE DATABASE nyra_db;
   # CREATE USER nyra_user WITH PASSWORD 'nyra2026';
   # GRANT ALL PRIVILEGES ON DATABASE nyra_db TO nyra_user;
   ```

4. **Run migrations**

   ```bash
   python manage.py migrate
   ```

5. **Seed the 58 wilayas** (with default COD delivery fees — editable later
   from the Django admin or the admin API)

   ```bash
   python manage.py seed_wilayas
   ```

6. **Create the initial admin user** (used to log in to the admin dashboard)

   ```bash
   python manage.py create_admin
   # uses ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env,
   # or pass explicitly: python manage.py create_admin --username admin --email admin@nyra.dz --password ChangeMe123
   ```

7. **Run the dev server**

   ```bash
   python manage.py runserver
   ```

   API root: `http://localhost:8000/api/`
   Django admin fallback UI: `http://localhost:8000/admin/`

## Authentication (admin dashboard)

```
POST /api/auth/login/      { "username": "...", "password": "..." }  -> { access, refresh, user }
POST /api/auth/refresh/    { "refresh": "..." }                       -> { access }
```

Only staff/superuser accounts can log in. Send the access token as
`Authorization: Bearer <token>` on all `/api/admin/...` requests.

## Public API (no auth)

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/categories/` | |
| GET | `/api/categories/{slug}/` | |
| GET | `/api/collections/` | |
| GET | `/api/collections/{slug}/` | |
| GET | `/api/products/` | filters: `?category=slug`, `?collection=slug`, `?search=text`, `?on_promotion=true`, `?is_new=true`, `?is_best_seller=true`, `?ordering=price` / `-price` / `-created_at`; paginated |
| GET | `/api/products/{slug}/` | includes images + related products from the same category |
| GET | `/api/wilayas/` | all 58 wilayas with delivery fees |
| POST | `/api/orders/` | create a Cash on Delivery order — see below |
| POST | `/api/contact/` | submit a contact message |

### Placing an order

```json
POST /api/orders/
{
  "customer_name": "Sara B.",
  "phone": "0555123456",
  "wilaya_id": 16,
  "commune": "Bab Ezzouar",
  "address": "12 rue des Fleurs",
  "notes": "Ring gift-wrapped please",
  "items": [
    { "product_id": 1, "quantity": 1, "size": "7" },
    { "product_id": 2, "quantity": 2 }
  ]
}
```

`subtotal`, `delivery_fee`, and `total` are always recomputed on the server
from current product prices and the selected wilaya's fee — any
client-supplied amounts are ignored. The response includes the generated
`order_number` (e.g. `NYRA-2EB3YD`).

## Admin API (JWT required, staff users only)

| Method | Endpoint | Notes |
|---|---|---|
| GET/POST/PUT/PATCH/DELETE | `/api/products/`, `/api/products/{slug}/` | write access requires staff auth (same URLs as public read) |
| GET/POST/PUT/PATCH/DELETE | `/api/categories/`, `/api/collections/` | same pattern |
| POST | `/api/admin/product-images/` | multipart upload: `product`, `image`, `is_primary`, `order` |
| DELETE | `/api/admin/product-images/{id}/` | remove a product photo |
| GET | `/api/admin/orders/` | filter with `?status=new` etc. |
| GET | `/api/admin/orders/{id}/` | |
| PATCH | `/api/admin/orders/{id}/` or `/api/admin/orders/{id}/status/` | update order status |
| GET | `/api/admin/contact-messages/` | |
| PATCH | `/api/admin/contact-messages/{id}/read/` | mark as read |
| GET | `/api/admin/stats/` | revenue total, order counts by status, product count, unread messages |

Product/category/collection writes reuse the public read URLs: `GET` is open
to everyone, `POST`/`PUT`/`PATCH`/`DELETE` require a staff JWT.

## Notes

- All prices are **integers in Algerian Dinar (DA)** — no decimals.
- Product and category slugs are used for public lookups; IDs are used
  internally (orders, images, admin operations).
- `OrderItem` snapshots `product_name` and `price` at order time, so later
  edits to a product never rewrite order history.
- Uploaded media is served from `/media/` in development
  (`MEDIA_ROOT` / `MEDIA_URL` in `nyra/settings.py`); put a real file server
  or storage backend (e.g. S3) in front of it for production.
- Every model is registered in the Django admin (`/admin/`) as a fallback
  management UI alongside the REST API.
