# JARVE GP8 — UI

> Next.js portal for submitting and tracking Purchase Orders across Datacor product lines.  
> Stack: Next.js 16.2.6 · React 19 · TypeScript (strict) · Turbopack  
> Generated: 2026-05-26

---

## Overview

| Screen | Path | Purpose |
|---|---|---|
| Portal home | `/` | Product catalog with PO tracking search |
| Submit | `/submit?product=<id>` | Upload a PO file for a specific product |
| Order detail | `/orders/[id]` | Read-only PO tracking timeline |
| PO Form | `/po-form?id=<tracking_code>&file=<name>` | Full PO review / approval form (popup) |

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
│   ├── globals.css       All styles (~2 300 lines)
│   ├── tokens.css        Design tokens
│   ├── orders/[id]/      PO tracking detail
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

No `.env` file is required. The upstream API base URL is hardcoded in the proxy route handlers (`app/api/po/`). To point to a different backend, update the `UPSTREAM` constant in each route file.

| File | Constant | Default |
|---|---|---|
| `app/api/po/route.ts` | `UPSTREAM` | `https://eldercare-reflex-companion.ngrok-free.dev/api/po` |
| `app/api/po/upload/route.ts` | `UPSTREAM` | `https://eldercare-reflex-companion.ngrok-free.dev/api/po/upload` |
| `app/api/po/[id]/route.ts` | `UPSTREAM_BASE` | `https://eldercare-reflex-companion.ngrok-free.dev/api/po/` |

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
