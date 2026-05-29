# JARVE GP3 UI — Architecture

> Updated: 2026-05-29

---

## Pages (App Router)

| Route | File | Layout | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Root (`app/layout.tsx`) | Portal: Header + PoTrackSearch + ProductGrid |
| `/submit?project_code=<code>` | `app/submit/page.tsx` | Root | File upload + submission queue with inline PoDetailPanel |
| `/orders/[id]` | `app/orders/[id]/page.tsx` | Root | PO tracking timeline — loads real data from `/api/po/{id}/status` |
| `/po/[id]` | `app/po/[id]/page.tsx` | Root | Full PO detail + inline editing (single scrollable view) |
| `/po-form?id=<tracking_code>` | `app/po-form/page.tsx` | Standalone (`app/po-form/layout.tsx`) | PO review form — opened as popup |

---

## Component tree

### Shared

| Component | File | Purpose |
|---|---|---|
| `Header` | `components/Header.tsx` | Top bar — logo + "JARVE Portal" + link to `/`. No props, no search, no filter. |
| `DatacorWordmark` | `components/DatacorWordmark.tsx` | Logo SVG — NOT a link itself (Link wrapper is in Header) |
| `ProductGrid` | `components/ProductGrid.tsx` | Grid / list view switcher; no filter or search props |
| `ProductTile` | `components/ProductTile.tsx` | Card view — `router.push('/submit?project_code=<code>')` |
| `ProductRow` | `components/ProductRow.tsx` | List-row view — same navigation |
| `PoTrackSearch` | `components/PoTrackSearch.tsx` | Tracking ID input → calls `GET /api/po/{id}/status` → navigates to `/orders/{id}` |
| `Icon` | `components/Icon.tsx` | All SVG icons |
| `LaunchToast` | `components/LaunchToast.tsx` | Transient notification toast |

### PO tracking page (`components/po/`)

| Component | Purpose |
|---|---|
| `Breadcrumb` | Portal / Orders / {tracking_code} |
| `PoPageHeader` | PO number + status pill + vendor + amount + dates |
| `EtaStrip` | "Expected next step" banner |
| `StageTracker` | 5-stage tracker: PO Received → Under Review → Processing → Invoiced → Completed (Paid) |

### Submit page (`components/submit/`)

| Component | Purpose |
|---|---|
| `Dropzone` | Single-file drag-and-drop area (no `multiple` attribute) |
| `StagedList` | Shows the one staged file with validation status |
| `SubmissionQueue` | Queue table — loads `GET /api/po?project_code=<code>`, polling every 5 s; uses `<React.Fragment key>` for key safety |
| `PoDetailPanel` | Inline expand panel — AI Agent Progress + Confidence score; polls `/api/po/{id}/status` every 2 s while `RECEIVED` or `INTERPRETING` |
| `ProductContext` | Banner showing selected product logo/name; reads `?project_code=` via `useSearchParams()` in `<Suspense>` |

### PO Form popup (`components/po-form/`)

| Component | Purpose |
|---|---|
| `PoFormHeader` | Sticky popup header with Print / Close actions |
| `FormField` | Labeled text input and textarea |
| `LineItemsTable` | Editable line items |
| `AppliedChargesTable` | Applied charges section |
| `UdfsTable` | User-defined fields section |

---

## Lib modules (`lib/`)

| File | Exports | Notes |
|---|---|---|
| `types.ts` | `Product`, `Category`, `LogoId`, `ViewMode`, `ProductStatus` | `Product` includes `project_code?: string` |
| `data.ts` | `PRODUCTS`, `CATEGORIES`, `LOGOS` | All 4 products have `project_code` |
| `submit-types.ts` | `StagedFile`, `Submission`, `SubmissionStatus`, utilities | Also exports `uid()`, `getExt()`, `fmtBytes()`, `relativeTime()` |
| `po-form-data.ts` | `PoFormData`, `PoLineItem`, `mockPoFromSubmissionId()`, `formatCurrency()` | PO form types + fallback mock |
| `po-data.ts` | `PO_RECORDS` | Legacy mock records (no longer used for navigation) |
| `po-types.ts` | `PoSummary`, `PoStage`, `PoStageState` | Used by orders tracking page |

---

## Data flow — Submit page

```
User drops file
    └─ Dropzone → addFile()
           └─ if staged empty: setStaged([entry])
              if staged has file: setPendingFile(entry) → show replace modal

User clicks Submit
    └─ submit()
           ├─ POST /api/po/upload?project_code=<code>   — file as FormData binary
           └─ upload response: extract poId with priority tracking_code → po_id → _id → id
                  └─ open PoDetailPanel inline on that row automatically

Auto-refresh (when ?project_code= present)
    └─ setInterval(fetchQueue, 5000)
           └─ GET /api/po?project_code=<code>
                  └─ merge: update existing rows, prepend new rows
                     ID match uses same priority: tracking_code → po_id → _id → id
```

---

## Data flow — Orders / Tracking page

```
Navigate to /orders/[id]
    └─ fetch GET /api/po/{id}/status (single load)
           └─ buildSummary(id, apiResponse)
                  └─ maps status → stage index (0–4)
                     maps seller.name → vendor
                     maps sum(line_items.total) → amount
                     maps project_code → PRODUCTS lookup → project banner
```

### Status → stage mapping

| API status | Stage index | Label |
|---|---|---|
| `RECEIVED` / `INTERPRETING` | 0 | PO Received |
| `AUTO_APPROVED` / `PENDING_REVIEW` / `REVIEWING` | 1 | Under Review |
| `APPROVED` / `PUSHING` | 2 | Processing |
| `PUSHED` | 3 | Invoiced |
| (stage 4) | 4 | Completed (Paid) |

---

## Data flow — PO Form popup

```
Submission queue row → "View PO" button (hidden on failed rows)
    └─ <Link href="/po/{id}">

/po/[id] mounts
    └─ GET /api/po/{id}/status
           └─ populate all editable fields (header, parties, line_items, project_specific)

User edits fields → isDirty = true → "Update" button highlighted

Update PO
    └─ PATCH /api/po/{id}  with normalized_payload

Submit PO
    └─ POST /api/po/{id}/approve
```

---

## Routing rules

| Trigger | Destination | Notes |
|---|---|---|
| Product tile / row click | `/submit?project_code=<code>` | `router.push()` |
| Tracking ID search | `/orders/<id>` | Calls API to validate; navigates on 200 |
| JARVE Portal wordmark / text | `/` | `<Link href="/">` in `Header.tsx` |
| "View PO" button | `/po/<id>` | Hidden when submission status = failed |
| "Submit another PO →" on tracking page | `/submit?project_code=<code>` | Derived from `project_code` in API response |

---

## Product catalog

| id | Name | project_code | Logo file |
|---|---|---|---|
| `erp` | Datacor ERP | `erp` | `datacor-erp.png` |
| `feedmill` | Feed Mill Manager | `fmm` | `feed-mill-manager.jpg` |
| `pennentmill` | Pennent Mill Manager | `pmm` | `pennent-mill-manager.jpg` |
| `salesforce` | Salesforce | `salesforce` | `salesforce.png` |

---

## Tracking ID format

| Rule | Value |
|---|---|
| Format | `PO-XXXXXXXX` (8 hex chars after prefix) |
| Example | `PO-86D5F616` |
| Length | 11 characters |
| Validation | None client-side — API call validates existence |

---

## CSS conventions (selected classes)

| Class | Purpose |
|---|---|
| `.queue-row--expandable` | Clickable queue row |
| `.queue-detail-row` | Expanded inline PoDetailPanel row |
| `.po-detail-panel` | Inline AI progress + confidence panel |
| `.agent-tl--compact / .agent-step--done/active/pending` | AI timeline |
| `.pod-conf-hero--compact / .pod-conf-score / .pod-conf-pct` | Confidence display |
| `.pod-field__input / .pod-field__input--mono` | Editable inputs in `/po/[id]` |
| `.cell-input / .cell-input--num / .cell-input--mono` | Table line item inputs |
| `.cell-readonly` | Total column (read-only, right-aligned) |
| `.btn-ghost--highlight` | "Update" button when `isDirty=true` |
| `.po-project-banner` | Project name + "Submit another PO" link on tracking page |
| `.qstatus--inprogress/completed/failed` | Submission queue status pills |

---

## Design decisions

| Decision | Reason |
|---|---|
| Next.js API routes as CORS proxy | Browser cannot call ngrok directly; server-side fetch has no restriction |
| `project_code` as URL query param | Backend requires it server-side on upload and list; not form body |
| `projectCodeRef` on submit page | Ensures `fetchQueue` closure always reads current value without stale ref |
| `useSearchParams()` in `<Suspense>` for ProductContext | Required by Next.js 15+ |
| `<React.Fragment key={row.id}>` in SubmissionQueue | `<>` shorthand does not accept `key` prop |
| `value ?? ""` on all PO inputs | Backend can return `null` for optional fields; null triggers React warning |
| `onWheel blur` on number inputs | Prevents scroll wheel from changing Qty / Unit Price values |
| `tracking_code` priority in ID extraction | Stable ID; avoids duplicate rows when API returns `_id` (MongoDB ObjectId) alongside `tracking_code` |
| Single file at a time in Dropzone | Product constraint; adding a second file shows "Replace?" confirmation modal |
