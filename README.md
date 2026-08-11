# Mini ERP + CRM Operations Portal

Full-stack case study submission: customer CRM, product/inventory management, and a sales challan
flow with transactional stock control, for a wholesale/distribution company.

## Tech Stack

**Backend:** Node.js, TypeScript, Express.js, PostgreSQL, Prisma ORM, JWT auth, Zod validation
**Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, Axios
**Deployment:** Vercel (frontend), Render (backend), Supabase/Neon (Postgres) — AWS is optional/bonus

## Project Structure

```
erp-crm/
├── server/              # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── routes/      # auth, customers, products, challans
│       ├── middleware/  # auth guard, role guard, error handler
│       └── index.ts
├── client/               # React + Vite frontend
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/      # auth context
│       └── api/          # axios client
├── postman_collection.json
├── docker-compose.yml
└── README.md
```

## Architecture Overview

- **Auth**: JWT-based. On login, the API issues a signed token containing `id`, `role`, `email`.
  The frontend stores it in `localStorage` and attaches it as a `Bearer` header via an Axios
  interceptor. `requireAuth` middleware verifies the token on every protected route;
  `requireRole(...)` restricts specific routes to specific roles (Admin/Sales/Warehouse/Accounts).
- **Customer CRM**: standard CRUD + a `FollowUp` sub-resource so each customer has an append-only
  timeline of notes, each attributed to the user who logged it.
- **Products & Inventory**: product CRUD, plus a `StockMovement` table that is the *only* sanctioned
  way stock quantity changes. Every IN/OUT writes a movement row (product, qty, type, reason,
  createdBy, timestamp) inside the same DB transaction that updates `product.stock`, so the
  running total and the audit trail can never drift apart.
- **Sales Challans** (core business logic): challan creation and confirmation run inside a single
  Prisma `$transaction`:
  1. Every line item's product is checked for existence.
  2. If the challan is being confirmed (not saved as Draft), every line item is checked against
     current stock. If any item doesn't have enough stock, the entire transaction is rolled back
     and the API returns `400` with a message naming the specific product and shortfall — stock
     is never partially decremented.
  3. Each `ChallanItem` stores a **snapshot** of the product's name, SKU, and unit price at the
     time of the challan, rather than only a `productId` foreign key — so historical challans stay
     accurate even if the product is later renamed or repriced.
  4. Only on `CONFIRMED` does stock actually decrement, with a paired `StockMovement` (`OUT`,
     reason = `Challan <number> confirmed`).
  5. Draft challans can be confirmed later via `POST /challans/:id/confirm`, which re-validates
     stock at confirmation time (stock may have changed since the draft was created).
  6. Cancelling a `CONFIRMED` challan reverses the stock (an `IN` movement) so inventory stays
     correct.
  - Challan numbers are auto-generated as `CH-<year>-<sequence>`.

## Local Setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local, or a free hosted one — see below)

### 1. Database
Easiest path: create a free Postgres instance on [Neon](https://neon.tech) or
[Supabase](https://supabase.com) and copy its connection string. Or run Postgres locally / via
Docker (see `docker-compose.yml`).

### 2. Backend
```bash
cd server
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string, set JWT_SECRET to any long random string
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
The API runs on `http://localhost:4000` by default. `npm run prisma:seed` creates one test user
per role (see credentials below) plus two sample products and one sample customer.

### 3. Frontend
```bash
cd client
cp .env.example .env
# edit .env if your API isn't on localhost:4000
npm install
npm run dev
```
The app runs on `http://localhost:5173`.

### Test Login Credentials
All seeded users share the password `Password@123`.

| Role      | Email               |
|-----------|----------------------|
| Admin     | admin@erp.test       |
| Sales     | sales@erp.test       |
| Warehouse | warehouse@erp.test   |
| Accounts  | accounts@erp.test    |

## Environment Variables

**server/.env**
| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `PORT` | API port (default 4000) |
| `CLIENT_ORIGIN` | Frontend origin, for CORS |

**client/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the deployed/local backend |

## Deployment

1. **Database**: create a Postgres instance on Neon or Supabase, copy the connection string.
2. **Backend → Render**: new Web Service from this repo's `server/` directory.
   - Build command: `npm install && npm run build && npx prisma migrate deploy`
   - Start command: `npm start`
   - Add the same env vars as `.env.example`, pointing `DATABASE_URL` at your hosted Postgres and
     `CLIENT_ORIGIN` at your deployed frontend URL.
3. **Frontend → Vercel**: import the repo, set root directory to `client/`, add `VITE_API_URL`
   pointing at your Render backend URL, deploy.
4. **AWS (bonus, optional)**: the above free-tier path satisfies all mandatory requirements; AWS
   deployment (e.g. EC2 + RDS + S3 for product images) was treated as a stretch goal and not
   pursued for this submission to stay within the 48-hour window and avoid incurring cost.

## API Reference

See `postman_collection.json` for a full, ready-to-import collection covering every endpoint below.

| Method | Route | Roles | Notes |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns JWT + user |
| GET | `/customers` | Any authed | search, status, type, page, pageSize |
| GET | `/customers/:id` | Any authed | Includes follow-up timeline |
| POST | `/customers` | Admin, Sales | |
| PUT | `/customers/:id` | Admin, Sales | |
| POST | `/customers/:id/follow-ups` | Admin, Sales | |
| GET | `/products` | Any authed | search, lowStock, page, pageSize |
| GET | `/products/:id` | Any authed | Includes stock movement history |
| POST | `/products` | Admin, Warehouse | |
| PUT | `/products/:id` | Admin, Warehouse | |
| POST | `/products/:id/stock-movements` | Admin, Warehouse | Only sanctioned way to change stock |
| GET | `/challans` | Any authed | status, page, pageSize |
| GET | `/challans/:id` | Any authed | |
| POST | `/challans` | Admin, Sales | body: `{ customerId, items[], status }` |
| POST | `/challans/:id/confirm` | Admin, Sales | Re-validates stock, decrements it |
| POST | `/challans/:id/cancel` | Admin, Sales | Reverses stock if was confirmed |

## Known Limitations / Not Implemented

- Invoice generation (invoices module) and purchase orders were out of scope for the 48-hour
  window — the assignment's core-required modules (auth/roles, customer CRM, product/inventory,
  sales challan) are fully implemented; invoicing was mentioned in business context but not listed
  under "Core Modules Required."
- No automated test suite (unit/integration tests) due to time constraints — manual verification
  was done via Postman and the UI for every happy-path and error-path scenario described in the
  assignment (insufficient stock, negative stock prevention, snapshot integrity).
- Bonus items not implemented: GitHub Actions CI/CD, invoice PDF export, AWS S3 product image
  upload. Docker Compose (for local Postgres) is included as a partial bonus.
- Password reset / forgot-password flow is out of scope — only login was required.
- No rate limiting or request logging middleware (would add `express-rate-limit` and `morgan` for
  a production deployment).

## Assumptions Made

- "Admin" role has access to all modules (customer CRM, products, challans) since the spec didn't
  explicitly restrict it.
- Accounts role has read-only access to challans (for reconciliation) but not create/edit, since
  challan creation is described as a "sales user" action.
- Challan numbers reset their sequence per calendar year (`CH-2026-0001`, `CH-2027-0001`, ...).
- Cancelling a confirmed challan reverses stock (treated as an implicit business rule, since
  otherwise cancelled orders would permanently under-report available inventory).
- SKU is immutable after product creation (editable fields exclude SKU) to keep it a stable
  identifier for stock movements and challan snapshots.
