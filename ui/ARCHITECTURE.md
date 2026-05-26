# JARVE GP8 UI — Architecture

> Generated: 2026-05-26

---

## Pages (App Router)

| Route | File | Layout | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Root (`app/layout.tsx`) | Portal: Header + PoTrackSearch + ProductGrid |
| `/submit?product=<id>` | `app/submit/page.tsx` | Root | File upload + submission queue with auto-refresh |
| `/orders/[id]` | `app/orders/[id]/page.tsx` | Root | PO tracking detail (read-only) |
| `/po-form?id=<code>&file=<name>` | `app/po-form/page.tsx` | Standalone (`app/po-form/layout.tsx`) | PO review form — opened as popup |

---

## Component tree

### Shared

| Component | File | Purpose |
|---|---|---|
| `Header` | `components/Header.tsx` | Top bar; JARVE GP8 wordmark links to `/` |
| `DatacorWordmark` | `components/DatacorWordmark.tsx` | Logo text — NOT a link itself (Link wrapper is in Header) |
| `ProductGrid` | `components/ProductGrid.tsx` | Grid / list view switcher for product catalog |
| `ProductTile` | `components/ProductTile.tsx` | Card view — navigates to `/submit?product=<id>` |
| `ProductRow` | `components/ProductRow.tsx` | List-row view — same navigation |
| `PoTrackSearch` | `components/PoTrackSearch.tsx` | 10-character tracking ID input → `/orders/<id>` |
| `FilterMenu` | `components/FilterMenu.tsx` | Category filter dropdown |
| `Icon` | `components/Icon.tsx` | All SVG icons (HashIcon, AlertCircleIcon, CheckIcon, …) |
| `LaunchToast` | `components/LaunchToast.tsx` | Transient notification toast |

### Submit page (`components/submit/`)

| Component | Purpose |
|---|---|
| `Dropzone` | Single-file drag-and-drop area (no `multiple` attribute) |
| `StagedList` | Shows the one staged file with validation status |
| `SubmissionQueue` | Polling table — loads from `GET /api/po`, auto-refreshes every 5 s when `?product=` is present |
| `ProductContext` | Banner showing selected product logo/name; reads `?product=` via `useSearchParams()` wrapped in `<Suspense>` |

### PO Form popup (`components/po-form/`)

| Component | Purpose |
|---|---|
| `PoFormHeader` | Sticky popup header with Print / Close actions |
| `FormField` | Labeled text input and textarea |
| `LineItemsTable` | Editable line items — auto-calculates Extended = Qty × Unit Price |
| `AppliedChargesTable` | Applied charges section |
| `UdfsTable` | User-defined fields section |

---

## Lib modules (`lib/`)

| File | Exports | Notes |
|---|---|---|
| `types.ts` | `Product`, `Category`, `LogoId`, `ViewMode`, `ProductStatus` | Core domain types |
| `data.ts` | `PRODUCTS`, `CATEGORIES`, `LOGOS` | Static catalog data |
| `submit-types.ts` | `StagedFile`, `Submission`, `SubmissionStatus`, utilities | Also exports `uid()`, `getExt()`, `fmtBytes()`, `relativeTime()` |
| `po-form-data.ts` | `PoFormData`, `PoLineItem`, `mockPoFromSubmissionId()`, `formatCurrency()` | PO form types + fallback mock |
| `po-data.ts` | `PO_RECORDS`, `DEFAULT_PO_ID` | Legacy mock records — key format is 10 chars (e.g. `PO-2026-01`) |
| `po-types.ts` | PO tracking types | Used by orders detail page |

---

## Data flow — Submit page

```
User drops file
    └─ Dropzone → addFile()
           └─ if staged empty: setStaged([entry])
              if staged has file: setPendingFile(entry) → show replace modal
                  └─ Confirm → setStaged([pending]), clear pendingFile
                  └─ Cancel  → clear pendingFile (discard new)

User clicks Submit
    └─ submit()
           ├─ setStaged([])                   — clear immediately (optimistic)
           ├─ add in-progress row             — prepend to submissions state
           └─ POST /api/po/upload (FormData)
                  ├─ ok  → update row status → "completed"
                  └─ err → update row status → "failed"

Auto-refresh (when ?product= present)
    └─ setInterval(fetchQueue, 5000)
           └─ GET /api/po
                  └─ merge:
                       existing rows → update status if changed
                       new rows      → prepend to top
```

---

## Data flow — PO Form popup

```
Submission queue row (status=completed) → "View PO" button
    └─ window.open('/po-form?id=<tracking_code>&file=<name>',
                   'po-form-<id>',
                   'width=1240,height=900')

po-form/page.tsx mounts
    └─ GET /api/po/<tracking_code>
           ├─ ok  → mapApiToForm() → populate all fields
           └─ err → mockPoFromSubmissionId(id)  (silent fallback)

User edits fields (all editable in real time)

Submit PO
    └─ resolution = "approved"
       status pill → "Approved" (green)
       footer → success message
       buttons → only "Close"

Discard & Close
    └─ resolution = "discarded"
       status pill → "Discarded" (red)
       window closes after 900 ms
```

---

## Routing rules

| Trigger | Destination | Notes |
|---|---|---|
| Product tile / row click | `/submit?product=<id>` | `router.push()` |
| Tracking ID search (10 chars) | `/orders/<id>` | Validated client-side before navigation |
| JARVE GP8 wordmark | `/` | `<Link href="/">` wrapper in `Header.tsx` |
| "View PO" button | `/po-form?id=...&file=...` | `window.open()` — named popup, reuses same window per PO ID |
| "Change product" in ProductContext | `/` | `<Link href="/">` |

---

## Product catalog

| id | Name | Category | Logo file |
|---|---|---|---|
| `erp` | Datacor ERP | distribution | `datacor-erp.png` |
| `feedmill` | Feed Mill Manager | production | `feed-mill-manager.jpg` |
| `pennentmill` | Pennent Mill Manager | production | `pennent-mill-manager.jpg` |
| `salesforce` | Salesforce | customer | `salesforce.png` |

---

## Tracking ID rules

| Rule | Value |
|---|---|
| Exact length | 10 characters |
| Input placeholder | `XXXXXXXXXX` |
| Hint text | `Enter your 10-character tracking ID — e.g. XXXXXXXXXX` |
| Validation error | `Tracking IDs are exactly 10 characters.` |

---

## CSS conventions (`app/globals.css`)

| Class | Purpose |
|---|---|
| `.track-card` | `display:flex; flex-wrap:wrap` — responsive PO search card |
| `.track-card__copy` | `flex:1 1 220px` — copy column |
| `.track-form` | `flex:1 1 300px` — input column |
| `.track-input` | `flex:1 1 180px; min-width:0` — tracking ID input |
| `.track-error` | Error message row (`flex-basis:100%`) |
| `.submit-product` | Product context banner on submit page |
| `.replace-overlay / .replace-modal` | File-replacement confirmation dialog |
| `.queue-view-btn` | "View PO" button — only visible on `completed` rows |
| `.qstatus--inprogress/completed/failed` | Submission queue status pills |
| `.popup-header` | Sticky header for PO form popup |
| `.form-body / .form-section / .form-grid` | PO form layout grid |
| `.lines-table / .compact-table` | Editable tables inside PO form |
| `.form-footer` | Sticky footer inside PO form |
| `.status-pill--discarded` | Red pill for discarded PO (`#fde8e8 / #9b1c1c`) |

---

## Design decisions

| Decision | Reason |
|---|---|
| Next.js API routes as CORS proxy | Browser cannot call ngrok directly (CORS blocked); server-side fetch has no restriction |
| `flex-wrap` on `.track-card` instead of CSS Grid | Grid `minmax(0,1fr) auto` collapsed copy text at intermediate viewport widths |
| `window.open()` for PO Form | Full standalone screen; named target reuses the same popup window per PO ID |
| `useSearchParams()` in `<Suspense>` for ProductContext | Required by Next.js 15+ — component using hook must be inside a Suspense boundary |
| Submit page reads `?product=` in `useEffect` (not `useSearchParams`) | Avoids adding another Suspense boundary at the page level |
| `fileRef?: File` on `StagedFile` | Stores actual File object in React state so upload can read binary; not serialized anywhere |
| `file` FormData field = filename string, not binary | Backend stores files separately; only the name is passed in the upload request |
| `tracking_code` as primary ID for submissions | Stable across page reloads; `_id` is the fallback. Using `uid()` caused IDs to change on every fetch |
| Auto-refresh only when `?product=` is present | Without a product context there is no active submission session; polling would waste requests |
| Single file at a time in Dropzone | Product constraint; adding a second file shows a "Replace?" confirmation modal |
