# Retail Shopping App Solution

## Overview

This repository contains a small npm-workspace monorepo with:

- `bff/` — NestJS Backend for Frontend API
- `mobile/` — Expo / React Native TypeScript client

The solution is intentionally BFF-first: the mobile app consumes already-shaped product, cart, and checkout payloads so the client can stay thin and focused on rendering state.

## Repo structure

```text
.
├── bff/
│   ├── src/
│   └── test/
├── mobile/
│   ├── src/
│   └── __tests__/
└── SOLUTION.md
```

## Key assumptions

- There is a single anonymous customer journey per app session. No auth is required.
- A cart is considered inactive if there have been no cart mutations or checkout attempts for 2 minutes.
- Reserved stock is represented by active cart quantities held in memory.
- Checkout is simulated and completes immediately if stock is available.
- When checkout fails because stock is unavailable, the cart is closed and its reservations are released. The app shows the failure reason and starts a fresh cart session so the customer can continue.
- The app targets Expo Go / simulator usage. A browser-style app shell is not required.

## Architectural choices

### Why a workspace monorepo?

The brief asks for both applications in one repository. npm workspaces keep the setup lightweight for reviewers while still allowing each app to own its dependencies and tests.

### Why shaped BFF payloads?

The BFF returns cart summaries, applied discounts, inactivity expiry timestamps, and checkout summaries in a single response. This keeps pricing and reservation logic on the server, where it is easier to test and reason about.

### Reservation model

Instead of persisting a separate reservation entity, active cart quantities act as reservations. Availability for a given cart is calculated as:

```text
stockOnHand - reservedByOtherActiveCarts
```

This keeps the in-memory model simple while still satisfying the reservation lifecycle requirement.

## Discount engine

The BFF seeds two active discounts:

1. **10% off orders over £100**
   - Applied after any line-level discounts.
2. **2 mugs for £20**
   - Each qualifying pair of `Stoneware Coffee Mug` items is repriced to £20.

The BFF returns:
- `subtotal`
- `discountTotal`
- `total`
- `appliedDiscounts[]`

This means the mobile app does not need its own pricing engine.

## In-memory persistence

### Seeded on startup
- Product catalogue (5 products)
- Discount catalogue (2 discounts)

### Runtime only
- Carts (`Map<string, Cart>`)
- Reservation state (derived from active cart contents)

### Reservation expiry
- A background interval runs every 5 seconds.
- Any cart inactive for more than 2 minutes is removed.
- Removing the cart automatically releases its reserved stock.

## API summary

### Catalogue
- `GET /api/catalog/products`
- `GET /api/catalog/products/:productId`

### Discounts
- `GET /api/discounts`
- `GET /api/discounts/:discountId`

### Cart / session
- `POST /api/sessions`
- `GET /api/cart/:cartId`
- `POST /api/cart/:cartId/items`
- `PATCH /api/cart/:cartId/items/:productId`
- `DELETE /api/cart/:cartId/items/:productId`
- `POST /api/cart/:cartId/checkout`

### Optional helper
- `GET /api/health`

## How to run

### 1) Install dependencies

From the repo root:

```bash
npm install
```

### 2) Run the BFF

```bash
npm run start:dev -w bff
```

The API starts on:

```text
http://localhost:3000
```

### 3) Run the mobile app

Set the BFF base URL for Expo:

```bash
export EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

Then start the app:

```bash
npm run start -w mobile
```

You can then open it in:
- iOS simulator
- Android emulator
- Expo Go on a device

## How to run tests

From the repo root:

```bash
npm test
```

Or run each suite separately:

```bash
npm run test -w bff
npm run test -w mobile
```

## Testing strategy

### BFF
The BFF tests focus on the highest-risk business logic:
- discount calculation
- stock reservation conflicts across carts
- stock decrement on checkout
- reservation release after failed checkout
- reservation release after cart expiry

### Mobile
The mobile tests focus on user-visible behaviour:
- cart totals render correctly
- checkout screen shows a successful order summary
- clear error messaging is shown when API actions fail

## Error handling

### API
- Validation errors return meaningful messages via Nest's validation pipe.
- Stock conflicts return user-actionable messages.
- Missing or expired carts return a clear not-found / expired message.

### App
- API failures are caught and surfaced as readable inline messages.
- Checkout failure resets the session cleanly so the customer can continue.
- Loading and empty states are rendered explicitly instead of blank screens.

## Notes for reviewers

- No database is used.
- No external payment provider is used.
- Product stock levels mutate during runtime as checkouts succeed.
- Because storage is in-memory, restarting the BFF resets products, discounts, and carts to their seed state.
