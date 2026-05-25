"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PaperclipIcon, CheckIcon } from "@/components/Icon";
import { FormField, TextareaField } from "@/components/po-form/FormField";
import { LineItemsTable } from "@/components/po-form/LineItemsTable";
import { AppliedChargesTable } from "@/components/po-form/AppliedChargesTable";
import { UdfsTable } from "@/components/po-form/UdfsTable";
import { PoFormHeader } from "@/components/po-form/PoFormHeader";
import {
  mockPoFromSubmissionId,
  formatCurrency,
  type PoFormData,
  type PoLineItem,
} from "@/lib/po-form-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToForm(r: Record<string, any>): PoFormData {
  const payload = r.normalized_payload ?? {};
  const header = payload.header ?? {};
  const parties = payload.parties ?? {};
  const seller = parties.seller ?? {};
  const buyer = parties.buyer ?? {};
  const specific = payload.project_specific ?? {};
  const lines: Record<string, unknown>[] = payload.line_items ?? [];

  const buyerParts = String(buyer.name ?? "").split(" ");
  const totalAmount = lines.reduce((s: number, l: Record<string, unknown>) => s + Number(l.total ?? 0), 0);

  return {
    purchaseOrderNumber: String(header.po_number ?? r.tracking_code ?? ""),
    orderDate: String(header.issue_date ?? r.created_at?.slice(0, 10) ?? ""),
    organizationUnit: String(specific.warehouse ?? r.project_code ?? ""),
    status: String(r.status ?? "Open"),
    poType: "Standard",
    source: String(r.project_code ?? ""),
    sourceReference: String(r.tracking_code ?? ""),
    currency: String(header.currency ?? "USD"),
    exchangeRateType: "Spot",

    supplierCode: String(specific.supplier_code ?? ""),
    supplierName: String(seller.name ?? ""),
    supplierLegalName: String(seller.name ?? ""),

    buyerFirstName: buyerParts[0] ?? "",
    buyerLastName: buyerParts.slice(1).join(" "),

    shippingMethod: String(specific.shipping_method ?? ""),
    paymentTerms: String(header.payment_terms ?? specific.pmm_payment_terms ?? ""),
    payBy: "",
    commercialTerms: String(specific.commercial_terms ?? ""),

    lineItems: lines.map((l, idx) => ({
      sequenceNumber: Number(l.line_number ?? idx + 1),
      itemNumber: String(l.sku ?? `ITEM-${String(idx + 1).padStart(3, "0")}`),
      itemDescription: String(l.description ?? ""),
      orderQuantity: Number(l.quantity ?? 0),
      orderUOM: String(l.unit ?? ""),
      unitPrice: Number(l.unit_price ?? 0),
      extendedPrice: Number(l.total ?? 0),
      warehouse: String(specific.warehouse ?? ""),
      requiredDate: String(header.delivery_date ?? ""),
    })),

    appliedCharges: [],
    userDefinedFields: [],

    comments: (payload.interpretation_notes as string[] | undefined)?.join("\n") ?? "",

    createdBy: String(r.tenant_id ?? ""),
    createdDate: String(r.created_at ?? ""),
    lastUpdatedBy: String(r.tenant_id ?? ""),
    lastUpdatedDate: String(r.updated_at ?? r.created_at ?? ""),

    totalAmount: formatCurrency(totalAmount),
    vendorDisplay: String(seller.name ?? ""),
  };
}

function PoFormView() {
  const params = useSearchParams();
  const id = params.get("id");
  const file = params.get("file");

  const [form, setForm] = useState<PoFormData>(() => mockPoFromSubmissionId(id));
  const [loading, setLoading] = useState(!!id);
  const [resolution, setResolution] = useState<"approved" | "discarded" | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/po/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        const r = (data as Record<string, unknown>).data ?? data;
        if (r && typeof r === "object") {
          setForm(mapApiToForm(r as Record<string, unknown>));
        }
      })
      .catch(() => { /* keep mock data */ })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    document.title = `${form.purchaseOrderNumber} · PO Form · JARVE GP8 Portal`;
  }, [form.purchaseOrderNumber]);

  const update = <K extends keyof PoFormData>(key: K, value: PoFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    setResolution("approved");
    update("status", "Approved");
  };

  const handleDiscard = () => {
    setResolution("discarded");
    update("status", "Discarded");
    setTimeout(() => window.close(), 900);
  };

  const updateLine = (index: number, patch: Partial<PoLineItem>) => {
    setForm((prev) => {
      const next = prev.lineItems.map((it, i) => {
        if (i !== index) return it;
        const merged = { ...it, ...patch };
        merged.extendedPrice = Number((merged.orderQuantity * merged.unitPrice).toFixed(2));
        return merged;
      });
      return { ...prev, lineItems: next };
    });
  };

  if (loading) {
    return (
      <>
        <PoFormHeader onClose={() => window.close()} onPrint={() => window.print()} />
        <div style={{ padding: "60px 40px", color: "var(--portal-text-muted)", fontSize: 14 }}>
          Loading PO details…
        </div>
      </>
    );
  }

  return (
    <>
      <PoFormHeader onClose={() => window.close()} onPrint={() => window.print()} />

      <main className="form-body">
        <header className="form-head">
          <div className="form-head__source">
            <PaperclipIcon size={13} strokeWidth={1.75} />
            Generated from submission <code>{id ?? "—"}</code>
            <span style={{ color: "var(--portal-text-faint)" }}>·</span>
            <span>{file ?? form.purchaseOrderNumber}</span>
          </div>
          <div className="form-head__title-row">
            <h1 className="form-head__num">{form.purchaseOrderNumber}</h1>
            <span className={`status-pill${resolution === "discarded" ? " status-pill--discarded" : ""}`}>
              <span className="status-pill__dot" />
              {form.status}
            </span>
          </div>
          <div className="form-head__meta">
            <strong>{form.vendorDisplay}</strong>
            <span className="dot">·</span>
            <strong>{form.totalAmount}</strong>
            <span className="dot">·</span>
            Order date {form.orderDate}
            <span className="dot">·</span>
            Required {form.lineItems[0]?.requiredDate ?? "—"}
          </div>
        </header>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Order header</h2>
            <span className="form-section__hint">Populated by the backend · review and adjust</span>
          </header>
          <div className="form-grid">
            <FormField required mono label="Purchase Order Number" value={form.purchaseOrderNumber} onChange={(v) => update("purchaseOrderNumber", v)} />
            <FormField required type="date" label="Order Date" value={form.orderDate} onChange={(v) => update("orderDate", v)} />
            <FormField required label="Organization Unit" value={form.organizationUnit} onChange={(v) => update("organizationUnit", v)} />
            <FormField required label="Status" value={form.status} onChange={(v) => update("status", v)} />
            <FormField label="PO Type" value={form.poType} onChange={(v) => update("poType", v)} />
            <FormField mono label="Source" value={form.source} onChange={(v) => update("source", v)} />
            <FormField mono label="Source Reference" value={form.sourceReference} onChange={(v) => update("sourceReference", v)} />
            <FormField label="Currency" value={form.currency} onChange={(v) => update("currency", v)} />
            <FormField label="Exchange Rate Type" value={form.exchangeRateType} onChange={(v) => update("exchangeRateType", v)} />
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Supplier</h2>
          </header>
          <div className="form-grid">
            <FormField required mono label="Supplier Code" value={form.supplierCode} onChange={(v) => update("supplierCode", v)} />
            <FormField label="Supplier Name" value={form.supplierName} onChange={(v) => update("supplierName", v)} />
            <FormField label="Legal Name" value={form.supplierLegalName} onChange={(v) => update("supplierLegalName", v)} />
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Buyer</h2>
          </header>
          <div className="form-grid form-grid--2">
            <FormField label="First Name" value={form.buyerFirstName} onChange={(v) => update("buyerFirstName", v)} />
            <FormField label="Last Name" value={form.buyerLastName} onChange={(v) => update("buyerLastName", v)} />
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Terms &amp; shipping</h2>
          </header>
          <div className="form-grid form-grid--4">
            <FormField label="Shipping Method" value={form.shippingMethod} onChange={(v) => update("shippingMethod", v)} />
            <FormField label="Payment Terms" value={form.paymentTerms} onChange={(v) => update("paymentTerms", v)} />
            <FormField label="Pay By" value={form.payBy} onChange={(v) => update("payBy", v)} />
            <FormField label="Commercial Terms" value={form.commercialTerms} onChange={(v) => update("commercialTerms", v)} />
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Line items · PurchaseOrderDetails</h2>
            <span className="form-section__hint">{form.lineItems.length} {form.lineItems.length === 1 ? "line" : "lines"}</span>
          </header>
          <LineItemsTable items={form.lineItems} onChange={updateLine} />
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Applied charges · AppliedPurchasingCostCollection</h2>
            <span className="form-section__hint">Header level</span>
          </header>
          <AppliedChargesTable charges={form.appliedCharges} />
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">User-defined fields · UDFs</h2>
          </header>
          <UdfsTable fields={form.userDefinedFields} />
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h2 className="form-section__title">Comments</h2>
          </header>
          <TextareaField value={form.comments} onChange={(v) => update("comments", v)} />
        </section>

        <section className="form-section form-section--audit">
          <header className="form-section__header">
            <h2 className="form-section__title">Audit · read only</h2>
          </header>
          <div className="form-grid form-grid--4">
            <FormField readOnly label="Created by" value={form.createdBy} />
            <FormField readOnly label="Created date" value={form.createdDate} />
            <FormField readOnly label="Last updated by" value={form.lastUpdatedBy} />
            <FormField readOnly label="Last updated date" value={form.lastUpdatedDate} />
          </div>
        </section>

        <div className="form-footer">
          <div className="form-footer__msg">
            {resolution === "approved" && (
              <><strong style={{ color: "#2c7a1f" }}>PO approved.</strong> The purchase order has been submitted successfully.</>
            )}
            {resolution === "discarded" && (
              <><strong style={{ color: "#9b1c1c" }}>Discarded.</strong> Closing this window…</>
            )}
            {!resolution && (
              <>
                <strong>Ready for review.</strong> Save your edits, or submit to push this PO to{" "}
                <code style={{ fontFamily: "var(--cc-font-mono)", fontSize: 12, color: "var(--ds-gray-7)" }}>
                  POST /api/PurchaseOrder
                </code>
                .
              </>
            )}
          </div>
          <div className="form-footer__actions">
            {!resolution && (
              <>
                <button className="btn-ghost" type="button" onClick={handleDiscard}>
                  Discard &amp; close
                </button>
                <button className="btn-ghost" type="button">
                  Save draft
                </button>
                <button className="btn-primary" type="button" onClick={handleSubmit}>
                  <CheckIcon />
                  Submit PO
                </button>
              </>
            )}
            {resolution === "approved" && (
              <button className="btn-ghost" type="button" onClick={() => window.close()}>
                Close
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function PoFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--portal-text-muted)" }}>Loading PO form…</div>}>
      <PoFormView />
    </Suspense>
  );
}
