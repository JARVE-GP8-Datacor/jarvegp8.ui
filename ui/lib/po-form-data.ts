export interface PoLineItem {
  sequenceNumber: number;
  itemNumber: string;
  itemDescription: string;
  orderQuantity: number;
  orderUOM: string;
  unitPrice: number;
  extendedPrice: number;
  warehouse: string;
  requiredDate: string;
}

export interface AppliedCharge {
  name: string;
  type: string;
  description: string;
  assign: "Manual" | "Automatic";
  distribution: "Header" | "Value" | "Quantity";
  amount: number;
}

export interface UserDefinedField {
  propertyName: string;
  propertyType: "String" | "Number" | "Date" | "Boolean";
  value: string;
  level: "Header" | "Line";
  lineRef?: string;
}

export interface PoFormData {
  purchaseOrderNumber: string;
  orderDate: string;
  organizationUnit: string;
  status: string;
  poType: string;
  source: string;
  sourceReference: string;
  currency: string;
  exchangeRateType: string;
  supplierCode: string;
  supplierName: string;
  supplierLegalName: string;
  buyerFirstName: string;
  buyerLastName: string;
  shippingMethod: string;
  paymentTerms: string;
  payBy: string;
  commercialTerms: string;
  lineItems: PoLineItem[];
  appliedCharges: AppliedCharge[];
  userDefinedFields: UserDefinedField[];
  comments: string;
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
  totalAmount: string;
  vendorDisplay: string;
}

export function mockPoFromSubmissionId(submissionId: string | null): PoFormData {
  const match = submissionId ? /^SUB-(\d{4})-(\d+)$/.exec(submissionId) : null;
  const poNumber = match ? `PO-${match[1]}-${match[2]}` : "PO-2026-00001";

  return {
    purchaseOrderNumber: poNumber,
    orderDate: "2026-05-25",
    organizationUnit: "MAIN",
    status: "Open",
    poType: "Standard",
    source: "ERP_EXTERNAL",
    sourceReference: "EXT-REF-9876",
    currency: "USD",
    exchangeRateType: "Spot",
    supplierCode: "SUP001",
    supplierName: "Acme Chemicals Inc",
    supplierLegalName: "Acme Chemicals LLC",
    buyerFirstName: "Juan",
    buyerLastName: "Pérez",
    shippingMethod: "Truck",
    paymentTerms: "Net30",
    payBy: "Check",
    commercialTerms: "FOB",
    lineItems: [
      {
        sequenceNumber: 1,
        itemNumber: "ITEM-001",
        itemDescription: "Ammonium Nitrate 50lb Bag",
        orderQuantity: 100,
        orderUOM: "BAG",
        unitPrice: 45.5,
        extendedPrice: 4550,
        warehouse: "WH-MAIN",
        requiredDate: "2026-06-01",
      },
      {
        sequenceNumber: 2,
        itemNumber: "ITEM-014",
        itemDescription: "Potassium Sulfate, granular",
        orderQuantity: 5,
        orderUOM: "PALLET",
        unitPrice: 45,
        extendedPrice: 225,
        warehouse: "WH-MAIN",
        requiredDate: "2026-06-05",
      },
    ],
    appliedCharges: [
      {
        name: "Insurance",
        type: "Insurance",
        description: "Seguro de carga",
        assign: "Automatic",
        distribution: "Value",
        amount: 75,
      },
      {
        name: "Freight",
        type: "Freight",
        description: "Flete terrestre · line 1",
        assign: "Manual",
        distribution: "Quantity",
        amount: 150,
      },
    ],
    userDefinedFields: [
      { propertyName: "ProjectCode", propertyType: "String", value: "PROJ-2026-Q2", level: "Header" },
      { propertyName: "CustomField1", propertyType: "String", value: "valor_personalizado", level: "Line", lineRef: "ITEM-001" },
    ],
    comments: "Pedido urgente Q2 — ship as soon as inventory allows.",
    createdBy: "api_user",
    createdDate: "2026-05-25 10:00",
    lastUpdatedBy: "api_user",
    lastUpdatedDate: "2026-05-25 10:00",
    totalAmount: "$4,775.00",
    vendorDisplay: "Acme Chemicals Inc",
  };
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
