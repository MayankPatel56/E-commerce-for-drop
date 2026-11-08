# Project Audit: Indicore Originals

## 1. Tech Stack, Folder Structure & Pages

- **Tech Stack:**
  - **Framework:** Next.js 16 (App Router)
  - **Language:** TypeScript
  - **Database:** PostgreSQL (via Supabase)
  - **ORM:** Prisma
  - **Styling:** Tailwind CSS + Shadcn UI
  - **Auth:** NextAuth.js
  - **State Management:** React Context (Cart) + Local State
  - **Deployment:** Vercel

- **Structure:**
  - `src/app/`: Next.js App Router (pages and API routes)
  - `src/components/`: Shared UI (shadcn) and Domain components (store, admin, preloader)
  - `src/lib/`: DB connection, auth logic, rate-limiting, and utilities
  - `src/types/`: Types for NextAuth and other entities
  - `prisma/`: Prisma schema and migrations

- **Pages:**
  - **Homepage (`/`)**: Dynamic (Client Component `HomePageClient`)
  - **Shop (`/shop`)**: Dynamic (Client Component `HomePageClient`)
  - **Product Detail (`/shop/products/[slug]`)**: Dynamic (Client Component `HomePageClient` + `ProductDetail`)
  - **Checkout (`/checkout`)**: Dynamic (Client Component `HomePageClient` + `CheckoutPage`)
  - **Admin Panel (`/admin`)**: Dynamic (Client Component `HomePageClient` + `AdminDashboard`)
  - **Other Pages**: About, Contact, FAQ, Customer Dashboard, Returns, Terms, Privacy (all integrated into `HomePageClient`)

## 2. Rendering Strategy
- **Homepage & Product Pages:** These are **Client-Side Rendered (CSR)** wrappers. The root page components (`src/app/page.tsx`, `src/app/shop/page.tsx`, `src/app/shop/products/[slug]/page.tsx`) wrap `HomePageClient.tsx` in a `Suspense` boundary. `HomePageClient` manages all view switching state, rendering the actual content based on the active state.

## 3. Vercel Build/Prerender Error (Invalid URL)
- The build succeeded locally without errors.
- **Root Cause (Hypothesis):** The Invalid URL error during Vercel builds is typically caused by:
  1. `process.env.NEXTAUTH_URL` or `NEXT_PUBLIC_SUPABASE_URL` being undefined or misconfigured in Vercel project environment variables.
  2. Middleware or API routes attempting to access environment variables that are only available at build time in specific environments.
  3. Incorrect URL formatting (e.g., missing protocol or trailing slashes) in environment variables.

## 4. Environment Variables (.env)
Required variables for the project:

```env
# Database (Prisma)
DATABASE_URL="postgresql://..." # Pooling connection
DIRECT_URL="postgresql://..."   # Direct connection for migrations

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Admin Setup
SEED_ADMIN_PASSWORD="..."

# Telegram Notifications
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."
```

## 5. Order Flow
- **Checkout:** `CheckoutPage.tsx` handles address collection and cart summary. Calls `POST /api/orders` on submit.
- **COD Flow:**
  - `CheckoutPage` fetches settings from `/api/checkout/settings` to validate order total against COD min/max.
  - `POST /api/orders` creates an order in `pending` status.
  - `POST /api/admin/orders/[id]/verify-cod` allows an admin to manually verify the order with the customer, transitioning status from `pending` to `confirmed`.
- **Admin Management:**
  - Admin Dashboard (`/api/admin/orders`) allows status updates (Confirmed → Shipped → Delivered → Returned).
  - Status transitions are enforced by `VALID_TRANSITIONS` in `src/app/api/admin/orders/[id]/status/route.ts`.

## 6. Supabase/Prisma Config
- **Connection:** Uses `DATABASE_URL` for general Prisma client queries (configured for connection pooling) and `DIRECT_URL` for migration-related tasks (push/migrate).
- **Issue:** Prisma on serverless platforms (like Vercel) requires the connection pooler (port 6543 for Supabase) to avoid exhaustion of database connections.

## 7. Build Errors/Warnings
- `npm run build` completed successfully:
  ```
  ✓ Compiled successfully in 73s
  ✓ Generating static pages using 7 workers (50/50) in 952ms
  ```
- *No build-time errors or warnings were reported.*

## 8. Top 10 Problems (Prioritized)

1. **[CRITICAL] CSR Architecture for SEO:** Entire app depends on `HomePageClient`. This is extremely poor for SEO and initial load performance. Needs refactoring to actual Page components.
2. **[HIGH] Vercel Build Environment:** Unstable environment configuration leads to the observed "Invalid URL" issues. Needs hardcoded validation or standard Vercel variable mapping.
3. **[HIGH] Prisma Connection Handling:** Verify connection pooler reliability. If connection limit is hit, application fails silently on database queries.
4. **[MEDIUM] Missing Type Safety in API Responses:** Many API routes return `NextResponse.json` without strict Zod return-type validation.
5. **[MEDIUM] Product Detail Page Cache:** Product detail is cached for 60s per slug. If product data is updated in admin, user sees stale info for 1 minute.
6. **[MEDIUM] Hardcoded Telegram Bot Logic:** If Telegram fails, the order creation might also fail depending on error handling in the order route.
7. **[LOW] Missing `.env.example`:** Developers must guess which variables are required.
8. **[LOW] `ignoreBuildErrors: true`:** TypeScript type errors are suppressed in `next.config.ts`.
9. **[LOW] Preloader Implementation:** The preloader is implemented as a global component in `layout.tsx`. Ensure it does not block interactivity.
10. **[LOW] Admin Dashboard Performance:** The admin panel fetches full order lists. As orders grow, this will slow down drastically without better filtering.
