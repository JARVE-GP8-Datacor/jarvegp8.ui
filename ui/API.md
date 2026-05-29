# JARVE GP3 UI — API Reference

> All requests from the browser go to the Next.js proxy routes (`/api/po/…`).  
> The proxy forwards them server-side to the upstream backend, bypassing CORS.  
> Backend base URL is configured via the `UPSTREAM_API` environment variable (see `.env.example`).  
> Updated: 2026-05-29

---

## Environment

| Variable | Description | Default |
|---|---|---|
| `UPSTREAM_API` | Full URL of the backend PO endpoint, no trailing slash — set in `.env.local` | `https://eldercare-reflex-companion.ngrok-free.dev/api/po` |

---

## Proxy routes

| Method | Local route | Upstream path | Notes |
|---|---|---|---|
| `GET` | `/api/po` | `$UPSTREAM_API` | Forwards all query params (e.g. `?project_code=pmm`) |
| `POST` | `/api/po/upload` | `$UPSTREAM_API/upload` | Forwards all query params; body is `multipart/form-data` |
| `GET` | `/api/po/[id]` | `$UPSTREAM_API/<id>` | |
| `PATCH` | `/api/po/[id]` | `$UPSTREAM_API/<id>` | Sends updated `normalized_payload` |
| `GET` | `/api/po/[id]/status` | `$UPSTREAM_API/<id>/status` | Used by tracking page + PoDetailPanel + PoTrackSearch |
| `POST` | `/api/po/[id]/approve` | `$UPSTREAM_API/<id>/approve` | Triggers PO submission to ERP |
| `POST` | `/api/po/[id]/reprocess` | `$UPSTREAM_API/<id>/reprocess` | Re-runs AI interpretation |

All upstream requests include the header `ngrok-skip-browser-warning: true`.  
Routes for `/[id]/status`, `/[id]/approve`, and `/[id]/reprocess` also include `X-Tenant-ID`.

---

## GET /api/po — List purchase orders

Used by: `SubmissionQueue` (initial load + polling every 5 s)

### Query params

| Param | Required | Notes |
|---|---|---|
| `project_code` | yes | Filters results to the active product (e.g. `erp`, `pmm`, `fmm`, `salesforce`) |

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "6a14cf082c41f0cd26765d6a",
      "tracking_code": "PO-86D5F616",
      "original_filename": "pmm-po-demo.pdf",
      "original_mimetype": "application/pdf",
      "project_code": "pmm",
      "status": "PENDING_REVIEW",
      "created_at": "2026-05-25T22:36:56.989Z",
      "updated_at": "2026-05-25T22:37:03.410Z",
      "confidence_score": 0.7,
      "normalized_payload": {},
      "tokens_used": 5776
    }
  ],
  "pagination": { "total": 7, "limit": 50, "skip": 0, "pages": 1 }
}
```

### Status mapping (API → UI)

| API `status` value | UI `SubmissionStatus` | Display |
|---|---|---|
| `RECEIVED` | `in-progress` | Spinner pill |
| `INTERPRETING` | `in-progress` | Spinner pill |
| `PENDING_REVIEW` | `completed` | Green pill + "View PO" button |
| `AUTO_APPROVED` | `completed` | Green pill + "View PO" button |
| `APPROVED` | `completed` | Green pill + "View PO" button |
| `PUSHED` | `completed` | Green pill + "View PO" button |
| `FAILED` | `failed` | Red pill — "View PO" button is hidden |
| `ERROR` | `failed` | Red pill — "View PO" button is hidden |

### Field mapping (API → `Submission`)

| `Submission` field | API field | Notes |
|---|---|---|
| `id` | `tracking_code` | Falls back to `po_id → _id → id` |
| `name` | `original_filename` | Falls back to `filename`, `file_name`, `name` |
| `ext` | derived from `original_filename` | Lowercased extension after last `.` |
| `status` | `status` (mapped via table above) | |
| `submittedAt` | `created_at` | `new Date(created_at).getTime()` |
| `size` | `size` or `file_size` | Defaults to `0` if absent |

---

## POST /api/po/upload — Upload a PO file

Used by: submit button in `app/submit/page.tsx`

### Query params

| Param | Required | Notes |
|---|---|---|
| `project_code` | yes | Sent for all products — `erp`, `pmm`, `fmm`, or `salesforce` |

### Request

`Content-Type: multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `file` | File (binary) | The actual file binary sent as FormData |

### Response

Returns the upstream response body and status unchanged.  
The UI extracts the new PO ID with priority: `tracking_code → po_id → _id → id`.

---

## GET /api/po/[id]/status — Get PO status

Used by: `PoTrackSearch` (validate tracking ID), `PoDetailPanel` (2 s poll), `app/orders/[id]` (tracking page load)

### Parameters

| Parameter | In | Notes |
|---|---|---|
| `id` | URL path | The `tracking_code` (e.g. `PO-86D5F616`) |

### Response

```json
{
  "status": "PENDING_REVIEW",
  "tracking_code": "PO-86D5F616",
  "project_code": "pmm",
  "confidence_score": 0.7,
  "agent_events": [
    { "tool": "extract_header", "timestamp": "2026-05-25T22:37:00Z", "summary": "Extracted header fields" }
  ],
  "normalized_payload": {
    "header": {
      "po_number": "PO-2026-0042",
      "issue_date": "2026-05-01",
      "currency": "USD",
      "payment_terms": "Net 30",
      "delivery_date": "2026-06-01"
    },
    "parties": {
      "buyer":  { "name": "Acme Corp", "address": "...", "contact": "...", "tax_id": "..." },
      "seller": { "name": "Vendor Inc", "address": "...", "contact": "...", "tax_id": "..." }
    },
    "line_items": [
      {
        "line_number": 1,
        "description": "Widget A",
        "sku": "SKU-001",
        "quantity": 10,
        "unit": "EA",
        "unit_price": 25.00,
        "total": 250.00,
        "flags": []
      }
    ],
    "project_specific": {}
  },
  "error_message": null
}
```

### Confidence score thresholds (FE display)

| `confidence_score` | Label |
|---|---|
| ≥ 0.85 | High confidence — safe to approve |
| ≥ 0.60 | Moderate confidence — review recommended |
| < 0.60 | Low confidence — manual review required |

---

## GET /api/po/[id] — Get single purchase order

Used by: `app/po/[id]/page.tsx` (detail + edit page)

Same response shape as `GET /api/po/{id}/status`.

### Field mapping (API → editable form)

| Form section | API path | Notes |
|---|---|---|
| PO Number | `normalized_payload.header.po_number` | |
| Issue Date | `normalized_payload.header.issue_date` | Rendered as `<input type="date">` |
| Currency | `normalized_payload.header.currency` | |
| Payment Terms | `normalized_payload.header.payment_terms` | |
| Delivery Date | `normalized_payload.header.delivery_date` | Rendered as `<input type="date">` |
| Buyer (4 fields) | `normalized_payload.parties.buyer.*` | name, address, contact, tax_id |
| Seller (4 fields) | `normalized_payload.parties.seller.*` | name, address, contact, tax_id |
| Line Items | `normalized_payload.line_items[]` | description, sku, quantity, unit, unit_price — all editable; total is read-only |
| Project Info | `normalized_payload.project_specific` | Only shown when object has at least one key |

---

## PATCH /api/po/[id] — Update PO

Used by: "Update" button in `app/po/[id]/page.tsx`

### Request

`Content-Type: application/json`

```json
{
  "normalized_payload": { /* edited payload object */ }
}
```

### Response

Returns the upstream response body and status unchanged.

---

## POST /api/po/[id]/approve — Approve / submit PO

Used by: "Submit PO" button in `app/po/[id]/page.tsx`

No request body required. Returns upstream response unchanged.

---

## POST /api/po/[id]/reprocess — Reprocess PO

Triggers re-running the AI interpretation pipeline. No request body required.

---

## Error handling

| Scenario | Behavior |
|---|---|
| `GET /api/po` fails on initial load | Queue shows empty; loading clears |
| `GET /api/po` fails during polling | Silently ignored; next interval retries |
| `POST /api/po/upload` fails | Submission row status → `failed` (red pill) |
| `GET /api/po/[id]/status` returns 404 in PoTrackSearch | Shows "No order found with that ID." error message |
| `GET /api/po/[id]/status` fails on tracking page | Shows inline error with HTTP status code |
| `PATCH /api/po/[id]` fails | Error shown in console; button re-enabled |
| `POST /api/po/[id]/approve` fails | Error shown in console |
