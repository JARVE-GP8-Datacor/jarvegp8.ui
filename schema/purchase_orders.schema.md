# Purchase Orders — MongoDB Schema

> Source: PMM (Sivado) entity model  
> Target: MongoDB (NoSQL)  
> Generated: 2026-05-25

---

## Collections overview

| Collection | Purpose |
|---|---|
| `purchase_orders` | Main PO document with embedded line items |
| `purchase_order_types` | Lookup: PO type catalog |
| `purchase_order_status_types` | Lookup: PO status catalog |

---

## Collection: `purchase_orders`

Line items (`details`) are embedded inside each PO document. They are never queried independently without the header.

### Header fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | MongoDB internal ID |
| `purchaseOrderId` | string (UUID) | yes | Original PMM GUID — used for sync |
| `purchaseOrderNumber` | string | yes | Unique visible PO number |
| `orderDate` | Date | yes | |
| `purchaseOrderTypeId` | string (UUID) | no | Ref → `purchase_order_types` |
| `purchaseOrderStatusTypeId` | string (UUID) | no | Ref → `purchase_order_status_types` |
| `masterSupplierId` | string (UUID) | no | Ref → supplier |
| `organizationUnitId` | string (UUID) | no | Business Unit |
| `currencyUnitId` | string (UUID) | no | |
| `exchangeRateTypeId` | string (UUID) | no | |
| `paymentTermsTypeId` | string (UUID) | no | |
| `payByTypeId` | string (UUID) | no | |
| `shippingMethodTypeId` | string (UUID) | no | |
| `buyerId` | string (UUID) | no | Buyer user ID |
| `buyerFirstName` | string | no | |
| `buyerLastName` | string | no | |
| `commercialTerms` | string | no | e.g. "NET30" |
| `supplierContractNumber` | string | no | |
| `source` | string | no | Origin system (e.g. "AGVANCE") |
| `sourceReference` | string | no | Origin system record ID |
| `masterNoteId` | string (UUID) | no | |
| `integrationStatusId` | string (UUID) | no | |
| `isDeleted` | bool | yes | Soft delete flag — default `false` |
| `audit.createdBy` | string | yes | |
| `audit.createdDate` | Date | yes | |
| `audit.lastUpdatedBy` | string | yes | |
| `audit.lastUpdatedDate` | Date | yes | |
| `details` | array | yes | See below — min 0 items |

### Embedded array: `details[]`

| Field | Type | Required | Notes |
|---|---|---|---|
| `purchaseOrderDetailId` | string (UUID) | yes | Original PMM GUID |
| `sequenceNumber` | number | yes | Line number (1, 2, 3…) |
| `warehouseItemId` | string (UUID) | yes | Item/product |
| `warehouseId` | string (UUID) | no | Destination warehouse |
| `supplierItemId` | string (UUID) | no | Supplier's item reference |
| `orderQuantity` | number | no | |
| `openQuantity` | number | no | Remaining quantity to receive |
| `catchQuantity` | number | no | Default 0 |
| `orderUomId` | string (UUID) | no | Unit of measure |
| `unitPrice` | number | no | |
| `extendedPrice` | number | no | orderQuantity × unitPrice |
| `otherCharges` | number | no | |
| `basis` | number | no | Nullable |
| `futuresPrice` | number | no | Nullable |
| `referenceMonth` | string | no | For futures price |
| `referenceYear` | string | no | For futures price |
| `requiredDate` | Date | no | |
| `effectivePeriodStartDate` | Date | no | Contract effective start |
| `effectivePeriodEndDate` | Date | no | Contract effective end |
| `invoiceOrganizationUnitId` | string (UUID) | no | BU to invoice |
| `remitToAddressId` | string (UUID) | no | |
| `shipFromAddressId` | string (UUID) | no | Supplier ship-from address |
| `supplierContactId` | string (UUID) | no | |
| `receivingContactId` | string (UUID) | no | |
| `primaryContactMethodTypeId` | string (UUID) | no | |
| `secondaryContactMethodTypeId` | string (UUID) | no | |
| `supplierPrimaryContactMethodTypeId` | string (UUID) | no | |
| `supplierSecondaryContactMethodTypeId` | string (UUID) | no | |
| `masterNoteId` | string (UUID) | no | |
| `isDeleted` | bool | yes | Soft delete — default `false` |
| `audit.createdBy` | string | yes | |
| `audit.createdDate` | Date | yes | |
| `audit.lastUpdatedBy` | string | yes | |
| `audit.lastUpdatedDate` | Date | yes | |

---

## Collection: `purchase_order_types`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `purchaseOrderTypeId` | string (UUID) | yes | PMM GUID |
| `name` | string | yes | e.g. "Standard" |
| `description` | string | no | |
| `sortSequence` | number | no | Display order |
| `isDeleted` | bool | yes | Default `false` |
| `audit.createdBy` | string | yes | |
| `audit.createdDate` | Date | yes | |
| `audit.lastUpdatedBy` | string | yes | |
| `audit.lastUpdatedDate` | Date | yes | |

---

## Collection: `purchase_order_status_types`

Identical structure to `purchase_order_types`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `purchaseOrderStatusTypeId` | string (UUID) | yes | PMM GUID |
| `name` | string | yes | e.g. "Open", "Closed", "Cancelled" |
| `description` | string | no | |
| `sortSequence` | number | no | |
| `isDeleted` | bool | yes | Default `false` |
| `audit.createdBy` | string | yes | |
| `audit.createdDate` | Date | yes | |
| `audit.lastUpdatedBy` | string | yes | |
| `audit.lastUpdatedDate` | Date | yes | |

---

## Indexes

| Collection | Fields | Options | Purpose |
|---|---|---|---|
| `purchase_orders` | `purchaseOrderId` | unique | PMM sync |
| `purchase_orders` | `purchaseOrderNumber` | unique | Business key lookup |
| `purchase_orders` | `masterSupplierId` | — | Filter by supplier |
| `purchase_orders` | `organizationUnitId` | — | Filter by BU |
| `purchase_orders` | `orderDate` (desc) | — | Date range queries |
| `purchase_orders` | `isDeleted, orderDate` | compound | Active records list |
| `purchase_orders` | `details.purchaseOrderDetailId` | — | Find PO by line ID (sync) |
| `purchase_order_types` | `purchaseOrderTypeId` | unique | Lookup |
| `purchase_order_status_types` | `purchaseOrderStatusTypeId` | unique | Lookup |

---

## Design decisions

| Decision | Reason |
|---|---|
| `details[]` embedded in PO | A PO is always read with its lines — no independent line queries |
| PMM GUIDs kept as separate field | Allows bidirectional sync without losing MongoDB's native `_id` |
| `audit` as sub-document | Keeps the root document clean; 4 audit fields grouped consistently |
| Lookup catalogs as separate collections | Short, stable lists — resolved by point lookup, not embedded in every PO |
| `isDeleted` on both header and each line | Allows independent soft-delete of header vs individual lines |
| UUIDs stored as strings | Simpler interop with PMM; use BSON UUID type if native Mongo perf is needed |
