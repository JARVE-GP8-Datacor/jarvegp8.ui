// ============================================================
// MongoDB initialization script — Purchase Orders
// Source: PMM (Sivado) entity model
// Run with: mongosh <connection-string> init_purchase_orders.js
// ============================================================

// Change this to the target database name
const DB_NAME = "your_database_name";

const db = connect(`mongodb://localhost:27017/${DB_NAME}`);

// ============================================================
// COLLECTION: purchase_order_types
// ============================================================

db.createCollection("purchase_order_types", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["purchaseOrderTypeId", "name", "isDeleted", "audit"],
      properties: {
        purchaseOrderTypeId: { bsonType: "string", description: "PMM GUID — required" },
        name:                { bsonType: "string", description: "Type name — required" },
        description:         { bsonType: "string" },
        sortSequence:        { bsonType: "number" },
        isDeleted:           { bsonType: "bool" },
        audit: {
          bsonType: "object",
          required: ["createdBy", "createdDate", "lastUpdatedBy", "lastUpdatedDate"],
          properties: {
            createdBy:       { bsonType: "string" },
            createdDate:     { bsonType: "date" },
            lastUpdatedBy:   { bsonType: "string" },
            lastUpdatedDate: { bsonType: "date" }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.purchase_order_types.createIndex({ purchaseOrderTypeId: 1 }, { unique: true, name: "idx_po_type_id" });

print("Created collection: purchase_order_types");

// ============================================================
// COLLECTION: purchase_order_status_types
// ============================================================

db.createCollection("purchase_order_status_types", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["purchaseOrderStatusTypeId", "name", "isDeleted", "audit"],
      properties: {
        purchaseOrderStatusTypeId: { bsonType: "string", description: "PMM GUID — required" },
        name:                      { bsonType: "string", description: "Status name — required" },
        description:               { bsonType: "string" },
        sortSequence:              { bsonType: "number" },
        isDeleted:                 { bsonType: "bool" },
        audit: {
          bsonType: "object",
          required: ["createdBy", "createdDate", "lastUpdatedBy", "lastUpdatedDate"],
          properties: {
            createdBy:       { bsonType: "string" },
            createdDate:     { bsonType: "date" },
            lastUpdatedBy:   { bsonType: "string" },
            lastUpdatedDate: { bsonType: "date" }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.purchase_order_status_types.createIndex(
  { purchaseOrderStatusTypeId: 1 },
  { unique: true, name: "idx_po_status_type_id" }
);

print("Created collection: purchase_order_status_types");

// ============================================================
// COLLECTION: purchase_orders
// ============================================================

db.createCollection("purchase_orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["purchaseOrderId", "purchaseOrderNumber", "orderDate", "isDeleted", "audit", "details"],
      properties: {

        // --- Identity ---
        purchaseOrderId:     { bsonType: "string", description: "PMM GUID — required, unique" },
        purchaseOrderNumber: { bsonType: "string", description: "Visible PO number — required, unique" },
        orderDate:           { bsonType: "date",   description: "Order date — required" },

        // --- Type / Status ---
        purchaseOrderTypeId:       { bsonType: "string" },
        purchaseOrderStatusTypeId: { bsonType: "string" },

        // --- Parties ---
        masterSupplierId:   { bsonType: "string" },
        organizationUnitId: { bsonType: "string" },
        buyerId:            { bsonType: "string" },
        buyerFirstName:     { bsonType: "string" },
        buyerLastName:      { bsonType: "string" },

        // --- Financial ---
        currencyUnitId:      { bsonType: "string" },
        exchangeRateTypeId:  { bsonType: "string" },
        paymentTermsTypeId:  { bsonType: "string" },
        payByTypeId:         { bsonType: "string" },
        shippingMethodTypeId: { bsonType: "string" },

        // --- Other ---
        commercialTerms:       { bsonType: "string" },
        supplierContractNumber:{ bsonType: "string" },
        source:                { bsonType: "string" },
        sourceReference:       { bsonType: "string" },
        masterNoteId:          { bsonType: "string" },
        integrationStatusId:   { bsonType: "string" },

        // --- Soft delete ---
        isDeleted: { bsonType: "bool" },

        // --- Audit ---
        audit: {
          bsonType: "object",
          required: ["createdBy", "createdDate", "lastUpdatedBy", "lastUpdatedDate"],
          properties: {
            createdBy:       { bsonType: "string" },
            createdDate:     { bsonType: "date" },
            lastUpdatedBy:   { bsonType: "string" },
            lastUpdatedDate: { bsonType: "date" }
          }
        },

        // --- Embedded line items ---
        details: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["purchaseOrderDetailId", "sequenceNumber", "warehouseItemId", "isDeleted", "audit"],
            properties: {

              // Identity
              purchaseOrderDetailId: { bsonType: "string" },
              sequenceNumber:        { bsonType: "number" },

              // Item / warehouse
              warehouseItemId: { bsonType: "string" },
              warehouseId:     { bsonType: "string" },
              supplierItemId:  { bsonType: "string" },

              // Quantities
              orderQuantity: { bsonType: "number" },
              openQuantity:  { bsonType: "number" },
              catchQuantity: { bsonType: "number" },
              orderUomId:    { bsonType: "string" },

              // Pricing
              unitPrice:      { bsonType: ["number", "null"] },
              extendedPrice:  { bsonType: ["number", "null"] },
              otherCharges:   { bsonType: ["number", "null"] },
              basis:          { bsonType: ["number", "null"] },
              futuresPrice:   { bsonType: ["number", "null"] },
              referenceMonth: { bsonType: "string" },
              referenceYear:  { bsonType: "string" },

              // Dates
              requiredDate:             { bsonType: ["date", "null"] },
              effectivePeriodStartDate: { bsonType: ["date", "null"] },
              effectivePeriodEndDate:   { bsonType: ["date", "null"] },

              // Addresses / contacts
              invoiceOrganizationUnitId:           { bsonType: "string" },
              remitToAddressId:                    { bsonType: "string" },
              shipFromAddressId:                   { bsonType: "string" },
              supplierContactId:                   { bsonType: "string" },
              receivingContactId:                  { bsonType: "string" },
              primaryContactMethodTypeId:          { bsonType: "string" },
              secondaryContactMethodTypeId:        { bsonType: "string" },
              supplierPrimaryContactMethodTypeId:  { bsonType: "string" },
              supplierSecondaryContactMethodTypeId:{ bsonType: "string" },

              masterNoteId: { bsonType: "string" },
              isDeleted:    { bsonType: "bool" },

              audit: {
                bsonType: "object",
                required: ["createdBy", "createdDate", "lastUpdatedBy", "lastUpdatedDate"],
                properties: {
                  createdBy:       { bsonType: "string" },
                  createdDate:     { bsonType: "date" },
                  lastUpdatedBy:   { bsonType: "string" },
                  lastUpdatedDate: { bsonType: "date" }
                }
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// --- Indexes ---
db.purchase_orders.createIndex(
  { purchaseOrderId: 1 },
  { unique: true, name: "idx_po_pmm_id" }
);
db.purchase_orders.createIndex(
  { purchaseOrderNumber: 1 },
  { unique: true, name: "idx_po_number" }
);
db.purchase_orders.createIndex(
  { masterSupplierId: 1 },
  { name: "idx_po_supplier" }
);
db.purchase_orders.createIndex(
  { organizationUnitId: 1 },
  { name: "idx_po_org_unit" }
);
db.purchase_orders.createIndex(
  { orderDate: -1 },
  { name: "idx_po_order_date" }
);
db.purchase_orders.createIndex(
  { isDeleted: 1, orderDate: -1 },
  { name: "idx_po_active_by_date" }
);
db.purchase_orders.createIndex(
  { "details.purchaseOrderDetailId": 1 },
  { name: "idx_po_detail_id" }
);

print("Created collection: purchase_orders");

// ============================================================
// SAMPLE DATA — remove before production use
// ============================================================

const now = new Date();

db.purchase_order_types.insertOne({
  purchaseOrderTypeId: "00000000-0000-0000-0000-000000000001",
  name: "Standard",
  description: "Standard purchase order",
  sortSequence: 1,
  isDeleted: false,
  audit: { createdBy: "system", createdDate: now, lastUpdatedBy: "system", lastUpdatedDate: now }
});

db.purchase_order_status_types.insertMany([
  {
    purchaseOrderStatusTypeId: "00000000-0000-0000-0000-000000000010",
    name: "Open",
    description: "Order is open",
    sortSequence: 1,
    isDeleted: false,
    audit: { createdBy: "system", createdDate: now, lastUpdatedBy: "system", lastUpdatedDate: now }
  },
  {
    purchaseOrderStatusTypeId: "00000000-0000-0000-0000-000000000011",
    name: "Closed",
    description: "Order is closed",
    sortSequence: 2,
    isDeleted: false,
    audit: { createdBy: "system", createdDate: now, lastUpdatedBy: "system", lastUpdatedDate: now }
  },
  {
    purchaseOrderStatusTypeId: "00000000-0000-0000-0000-000000000012",
    name: "Cancelled",
    description: "Order was cancelled",
    sortSequence: 3,
    isDeleted: false,
    audit: { createdBy: "system", createdDate: now, lastUpdatedBy: "system", lastUpdatedDate: now }
  }
]);

db.purchase_orders.insertOne({
  purchaseOrderId: "aaaaaaaa-0000-0000-0000-000000000001",
  purchaseOrderNumber: "PO-2026-00001",
  orderDate: new Date("2026-05-25"),
  purchaseOrderTypeId: "00000000-0000-0000-0000-000000000001",
  purchaseOrderStatusTypeId: "00000000-0000-0000-0000-000000000010",
  masterSupplierId: "bbbbbbbb-0000-0000-0000-000000000001",
  organizationUnitId: "cccccccc-0000-0000-0000-000000000001",
  currencyUnitId: "dddddddd-0000-0000-0000-000000000001",
  exchangeRateTypeId: null,
  paymentTermsTypeId: null,
  payByTypeId: null,
  shippingMethodTypeId: null,
  buyerId: "eeeeeeee-0000-0000-0000-000000000001",
  buyerFirstName: "John",
  buyerLastName: "Doe",
  commercialTerms: "NET30",
  supplierContractNumber: "CTR-2026-001",
  source: "MANUAL",
  sourceReference: null,
  masterNoteId: null,
  integrationStatusId: null,
  isDeleted: false,
  audit: {
    createdBy: "jdoe",
    createdDate: now,
    lastUpdatedBy: "jdoe",
    lastUpdatedDate: now
  },
  details: [
    {
      purchaseOrderDetailId: "ffffffff-0000-0000-0000-000000000001",
      sequenceNumber: 1,
      warehouseItemId: "11111111-0000-0000-0000-000000000001",
      warehouseId: "22222222-0000-0000-0000-000000000001",
      supplierItemId: null,
      orderQuantity: 500,
      openQuantity: 500,
      catchQuantity: 0,
      orderUomId: "33333333-0000-0000-0000-000000000001",
      unitPrice: 12.50,
      extendedPrice: 6250.00,
      otherCharges: 0,
      basis: null,
      futuresPrice: null,
      referenceMonth: null,
      referenceYear: null,
      requiredDate: new Date("2026-06-01"),
      effectivePeriodStartDate: null,
      effectivePeriodEndDate: null,
      invoiceOrganizationUnitId: "cccccccc-0000-0000-0000-000000000001",
      remitToAddressId: null,
      shipFromAddressId: null,
      supplierContactId: null,
      receivingContactId: null,
      primaryContactMethodTypeId: null,
      secondaryContactMethodTypeId: null,
      supplierPrimaryContactMethodTypeId: null,
      supplierSecondaryContactMethodTypeId: null,
      masterNoteId: null,
      isDeleted: false,
      audit: {
        createdBy: "jdoe",
        createdDate: now,
        lastUpdatedBy: "jdoe",
        lastUpdatedDate: now
      }
    }
  ]
});

print("Sample data inserted.");
print("Done. Database '" + DB_NAME + "' is ready.");
