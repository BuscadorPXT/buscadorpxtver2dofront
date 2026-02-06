# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Buscador PXT v2 — a product search and supplier management platform that syncs data from Google Sheets. Monorepo with separate `backend/` and `frontend/` directories.

## Tech Stack

- **Backend:** NestJS 11 (TypeScript), TypeORM, PostgreSQL 16, JWT auth, WebSockets (Socket.IO), Google Sheets API
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, shadcn/ui (Radix UI, new-york style, JSX not TSX), React Router 7, React Hook Form + Zod
- **Package Manager:** pnpm (backend v10.13.1, frontend v10.4.1)
- **Deployment:** Docker (multi-stage builds), CapRover, GitHub Actions CI/CD

## Development Commands

### Backend (`cd backend`)
```bash
pnpm start:dev          # Dev server with watch mode (port 3001)
pnpm build              # Compile TypeScript (nest build)
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier formatting
pnpm test               # Jest unit tests
pnpm test:watch         # Jest watch mode
pnpm test:cov           # Jest with coverage
pnpm test:e2e           # E2E tests (jest-e2e.json config)
pnpm test:debug         # Debug tests with inspector
pnpm migrate            # Run SQL migrations (run-migrations.js)
pnpm seed               # Run database seeders (ts-node src/database/run-seeds.ts)
```

### Frontend (`cd frontend`)
```bash
pnpm dev                # Vite dev server (port 5173)
pnpm build              # Production build
pnpm build:prod         # Explicit production mode build
pnpm preview            # Preview production build
pnpm lint               # ESLint check
```

### Docker
```bash
docker compose up       # Start all services (backend, frontend, postgres)
```

## Architecture

### Backend (NestJS Modular)

~28 NestJS modules with standard Controller → Service → Entity pattern. Key modules:

- **Auth/Users** — JWT authentication (Passport), bcryptjs password hashing, session tracking
- **Products/Suppliers** — Core domain entities synced from Google Sheets
- **Sheets** — Google Sheets API integration with cron-based sync (`@nestjs/schedule`)
- **Cache** — In-memory + disk-based caching with optional AES-256 encryption
- **Notifications** — Multi-channel: email (Mailjet), WhatsApp (Z-API), WebSocket push
- **Presence** — User sessions, page views, geolocation tracking, analytics
- **Subscriptions/Plans** — User subscription management with time-based access
- **Upload** — File uploads to AWS S3/Cloudflare R2
- **Partners** — Partner management system

Database: 16 TypeORM entities, 30 SQL migrations in `backend/migrations/` executed by `run-migrations.js` (tracks applied migrations in a DB table). Migrations also run automatically via `docker-entrypoint.sh` on container start.

WebSocket gateway broadcasts cache updates to connected clients in real-time.

### Frontend (React SPA)

- **Path alias:** `@` maps to `src/` (configured in vite.config.js)
- **UI Components:** `src/components/ui/` — shadcn/ui components (Radix + Tailwind, JSX files, not TSX)
- **Pages:** `src/pages/` — route-level components
- **Hooks:** `src/hooks/` — custom hooks (useHoursCheck, usePageTracking, etc.)
- **Contexts:** `src/contexts/` — AuthContext, ThemeContext (React Context API)
- **Services:** `src/services/` — Axios-based API client layer
- **Routing:** React Router with protected routes; admin routes under `/admin/*`

### Key Integration Points

- Google Sheets → Backend cron sync → Products/Suppliers DB → WebSocket → Frontend cache update
- Encryption key must match between `ENCRYPTION_KEY` (backend) and `VITE_ENCRYPTION_KEY` (frontend)
- Socket.IO used for real-time cache invalidation notifications

## Code Style

- **Backend:** Single quotes, trailing commas (Prettier). ESLint v9 flat config with TypeScript + Prettier integration.
- **Frontend:** ESLint v9 flat config with React hooks rules. No separate Prettier config.
- **Language:** Backend uses TypeScript (.ts), Frontend uses JavaScript (.jsx) — not TypeScript.

## Environment Setup

Both `backend/.env.example` and `frontend/.env.example` contain required variables. Key ones:
- Database connection (DB_HOST, DB_PORT, etc.)
- JWT_SECRET
- Google Sheets credentials (GOOGLE_SHEETS_SPREADSHEET_ID, service account)
- ENCRYPTION_KEY / VITE_ENCRYPTION_KEY (must match, 32+ chars for AES-256)
- ENABLE_ENCRYPTION / VITE_ENABLE_ENCRYPTION (set false for dev)
- CACHE_DIRECTORY (./cache locally, /app/cache in Docker)

## CI/CD

GitHub Actions deploys to CapRover. Commit message conventions trigger deployments:
- `[frontend]` or `[deploy]` in commit message → deploys frontend
- `[backend]` or `[deploy]` in commit message → deploys backend
