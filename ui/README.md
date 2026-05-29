# JARVE GP3 — UI

> Next.js portal for submitting and tracking Purchase Orders across Datacor product lines.  
> Stack: Next.js 16.2.6 · React 19 · TypeScript (strict) · Turbopack  
> Updated: 2026-05-29

---

## Overview

| Screen | Path | Purpose |
|---|---|---|
| Portal home | `/` | Product catalog with PO tracking search |
| Submit | `/submit?project_code=<code>` | Upload a PO file for a specific product |
| Order detail | `/orders/[id]` | Real-time PO tracking timeline (loads from API) |
| PO detail / edit | `/po/[id]` | Full PO review and inline editing (single scrollable view) |
| PO Form | `/po-form?id=<tracking_code>` | PO review popup (standalone window) |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |

---

## Setup

```bash
cd ui
npm install
```

---

## Running

| Command | Description |
|---|---|
| `npm run dev` | Dev server at http://localhost:3001 (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve production build on port 3001 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting |

---

## Project structure

```
ui/
├── app/                  Next.js App Router
│   ├── page.tsx          Portal home
│   ├── layout.tsx        Root layout (title, fonts)
│   ├── globals.css       All styles (~3 000+ lines)
│   ├── tokens.css        Design tokens
│   ├── orders/[id]/      PO tracking timeline (real API data)
│   ├── po/[id]/          PO detail + inline editing
│   ├── po-form/          PO review popup (standalone layout)
│   ├── submit/           File upload + submission queue
│   └── api/po/           Next.js proxy routes (CORS bridge)
├── components/           React components (feature-grouped)
├── lib/                  Types, utilities, static data
└── public/logos/         Product logo images
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full component tree and data-flow diagram.  
See [API.md](API.md) for all endpoints consumed by the UI.

---

## Environment

Copy `.env.example` to `.env.local` and set the backend URL:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `UPSTREAM_API` | yes | Full URL of the backend PO endpoint, no trailing slash (e.g. `https://your-host.ngrok-free.app/api/po`) |

`.env.local` is gitignored. Never commit it.  
All proxy route handlers (`app/api/po/`) read `process.env.UPSTREAM_API` at runtime.

---

## Accepted file types

Defined in `lib/submit-types.ts`:

| Extension | MIME |
|---|---|
| `.pdf` | `application/pdf` |
| `.csv` | `text/csv` |
| `.xls` | `application/vnd.ms-excel` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

Maximum file size: **25 MB**.
