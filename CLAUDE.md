# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start both servers (Windows — opens two cmd windows)
start.bat

# Or from root using concurrently
npm run dev

# Backend only (port 3001, ts-node-dev with hot reload)
npm run dev --prefix backend

# Frontend only (port 5173, Vite)
npm run dev --prefix frontend

# Database
npm run db:push          # Push schema changes to SQLite
npm run db:studio        # Open Prisma Studio GUI

# First-time setup
npm run setup            # installs deps for both + db:push

# Production build
npm run build --prefix backend    # tsc → dist/
npm run build --prefix frontend   # tsc + vite build
```

There are no automated tests in this project.

## Architecture

Full-stack TypeScript monorepo. Backend and frontend are independent npm workspaces under `/backend` and `/frontend`. The root `package.json` just runs them together with `concurrently`.

### Backend (`backend/src/`)

Express + Prisma (SQLite). All routes are under `/api`. The database file lives at the **project root**: `trading-journal.db`.

**Important CJS constraint**: Backend uses CommonJS (`ts-node-dev --transpile-only`). Never add `.js` extensions to local imports and never use `import.meta.url` — `__dirname` is available natively.

Route layout:
- `routes/auth.ts` — register, login, `GET /me`, `PATCH /me`
- `routes/trades.ts` — full CRUD + screenshot upload (multer) + CSV import/export
- `routes/analytics.ts` — all aggregation endpoints (summary, equity curve, daily P&L, per-strategy, hourly, per-symbol, R:R distribution)
- `routes/strategies.ts` — strategy CRUD

`middleware/auth.ts` — `requireAuth` middleware extracts the JWT and attaches `req.userId` (string). All trade/analytics/strategy routes require this.

`utils/calculations.ts` — all PnL math, win rate, drawdown, expectancy, profit factor. Analytics routes call these helpers rather than computing inline.

`lib/prisma.ts` — singleton Prisma client (logs queries in development).

### Frontend (`frontend/src/`)

React 18 + React Router v6 + TanStack React Query + Tailwind CSS.

**Proxy**: Vite forwards `/api` and `/uploads` to `http://localhost:3001`, so all `axios` calls use relative paths like `/api/trades`.

**Auth flow**: `hooks/useAuth.ts` stores the JWT in `localStorage`. `lib/api.ts` injects it as a Bearer token on every request and auto-logouts on 401. `App.tsx` wraps protected routes in `<RequireAuth>`.

**Server state**: All server data goes through React Query hooks in `hooks/useTrades.ts` and `hooks/useAnalytics.ts`. Cache key namespacing uses the `tradeKeys` pattern defined in `useTrades.ts`. Mutations invalidate the relevant query keys after success.

**Forms**: React Hook Form + Zod for all forms. Always pass the inferred Zod type as the generic to `useForm<T>` — without it, `formState.errors` types are too wide and cause TS errors.

**Types**: All shared types live in `types/index.ts` — `Trade`, `TradeFormData`, `Strategy`, `AnalyticsSummary`, filter types, enums (`Direction`, `TradeMode`, `TradeResult`, `MistakeTag`).

**UI primitives**: `components/ui/` — `Button`, `Input` (also exports `Select`, `Textarea`), `Modal`, `Badge`. `Modal` uses `max-h-[90vh]` + `overflow-y-auto` on the body so it never overflows the viewport.

**Charts**: All in `components/charts/` using Recharts. Data is fetched directly in `AnalyticsPage` via `useAnalytics` hooks.

### Database Schema (key points)

- `Trade.tags` and `Trade.mistakeTags` are stored as JSON arrays in SQLite.
- `Trade.result` (WIN/LOSS/BREAKEVEN/OPEN) and financials (`pnl`, `rr`, etc.) are **computed on the backend** at save time via `calculations.ts`, not stored raw from the client.
- `Strategy` has a unique constraint on `(userId, name)`.

### Environment Variables

Backend reads from `backend/.env`:
```
DATABASE_URL="file:../trading-journal.db"
JWT_SECRET="..."
PORT=3001
UPLOAD_DIR="./uploads"
```
