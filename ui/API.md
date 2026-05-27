# JARVE GP8 UI — API Reference

> All requests from the browser go to the Next.js proxy routes (`/api/po/…`).  
> The proxy forwards them server-side to the upstream backend, bypassing CORS.  
> Backend base URL is configured via the `BACKEND_URL` environment variable (see `.env.example`).  
> Generated: 2026-05-26

---

## Environment

| Variable | Description | Default |
|---|---|---|
| `UPSTREAM_API` | Full URL of the backend PO endpoint, no trailing slash — set in `.env.local` | `https://eldercare-reflex-companion.ngrok-free.dev/api/po` |

---

## Proxy routes

| Method | Local route | Upstream path |
|---|---|---|
| `GET` | `/api/po` | `$UPSTREAM_API` |
| `POST` | `/api/po/upload` | `$UPSTREAM_API/upload` |
| `GET` | `/api/po/[id]` | `$UPSTREAM_API/<id>` |

All upstream requests include the header `ngrok-skip-browser-warning: true`.

---

## GET /api/po — List purchase orders

Used by: `SubmissionQueue` (initial load + polling)

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "6a14cf082c41f0cd26765d6a",
      "tracking_code": "PO-8782AB3D",
      "original_filename": "pmm-po-demo.pdf",
      "original_mimetype": "application/pdf",
      "project_code": "PMM",
      "status": "PENDING_REVIEW",
      "created_at": "2026-05-25T22:36:56.989Z",
      "updated_at": "2026-05-25T22:37:03.410Z",
      "confidence_score": 0.7,
      "normalized_payload": { },
      "tokens_used": 5776
    }
  ],
  "pagination": { "total": 7, "limit": 50, "skip": 0, "pages": 1 }
}
```

### Status mapping (API → UI)

| API `status` value | UI `SubmissionStatus` | Display |
|---|---|---|
| `INTERPRETING` | `in-progress` | Spinner pill |
| `UPLOADING` | `in-progress` | Spinner pill |
| `PROCESSING` | `in-progress` | Spinner pill |
| `PENDING_REVIEW` | `completed` | Green pill + "View PO" button |
| `FAILED` | `failed` | Red pill |
| `ERROR` | `failed` | Red pill |

### Field mapping (API → `Submission`)

| `Submission` field | API field | Notes |
|---|---|---|
| `id` | `tracking_code` | Falls back to `_id`, then `uid()` |
| `name` | `original_filename` | Falls back to `filename`, `file_name`, `name` |
| `ext` | derived from `original_filename` | Lowercased extension after last `.` |
| `status` | `status` (mapped via table above) | |
| `submittedAt` | `created_at` | `new Date(created_at).getTime()` |
| `size` | `size` or `file_size` | Defaults to `0` if absent |

---

## POST /api/po/upload — Upload a PO file

Used by: submit button in `app/submit/page.tsx`

### Request

`Content-Type: multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | string | yes | Filename only (e.g. `invoice.pdf`) — NOT binary |
| `project_code` | string | conditional | Sent as `pmm` when `product=pennentmill`; omitted for other products |

### Response

Returns the upstream response body and status code unchanged.

---

## GET /api/po/[id] — Get single purchase order

Used by: `app/po-form/page.tsx` (loads form data on mount)

### Parameters

| Parameter | In | Notes |
|---|---|---|
| `id` | URL path | The `tracking_code` value from the list endpoint (e.g. `PO-8782AB3D`) |

### Response

Same shape as a single item from the list endpoint (see above).

### Field mapping (API → `PoFormData`)

| `PoFormData` field | API path | Notes |
|---|---|---|
| `purchaseOrderNumber` | `normalized_payload.header.po_number` | |
| `orderDate` | `normalized_payload.header.issue_date` | |
| `currency` | `normalized_payload.header.currency` | |
| `paymentTerms` | `normalized_payload.header.payment_terms` | |
| `deliveryDate` | `normalized_payload.header.delivery_date` | |
| `supplierCode` | `normalized_payload.project_specific.supplier_code` | |
| `supplierName` | `normalized_payload.parties.seller.name` | |
| `supplierAddress` | `normalized_payload.parties.seller.address` | |
| `buyerFirstName` | `normalized_payload.parties.buyer.name` | First word of full name |
| `buyerLastName` | `normalized_payload.parties.buyer.name` | Remaining words after first |
| `buyerEmail` | `normalized_payload.parties.buyer.contact_email` | |
| `buyerAddress` | `normalized_payload.parties.buyer.address` | |
| `shippingMethod` | `normalized_payload.project_specific.shipping_method` | |
| `commercialTerms` | `normalized_payload.project_specific.commercial_terms` | |
| `lineItems[]` | `normalized_payload.line_items[]` | See line item mapping below |
| `comments` | `normalized_payload.interpretation_notes` | `join('\n')` |
| `createdDate` | `created_at` | |
| `updatedDate` | `updated_at` | |

### Line item mapping

| `PoLineItem` field | API path | Notes |
|---|---|---|
| `lineNumber` | `line_number` | |
| `sku` | `sku` | |
| `description` | `description` | |
| `quantity` | `quantity` | |
| `unit` | `unit` | |
| `unitPrice` | `unit_price` | |
| `total` | `total` | Displayed as Extended; recalculated on edit as Qty × Unit Price |
| `flags` | `flags` | |

---

## Error handling

| Scenario | Behavior |
|---|---|
| `GET /api/po` fails on initial load | Queue shows empty; `queueLoading` clears |
| `GET /api/po` fails during polling | Silently ignored; next interval retries |
| `POST /api/po/upload` fails | Submission row status → `failed` (red pill) |
| `GET /api/po/[id]` fails in PO Form | Falls back to `mockPoFromSubmissionId(id)` — no error shown to the user |
