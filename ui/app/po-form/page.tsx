"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PaperclipIcon, CheckIcon } from "@/components/Icon";
import { FormField, TextareaField } from "@/components/po-form/FormField";
import { LineItemsTable } from "@/components/po-form/LineItemsTable";
import { AppliedChargesTable } from "@/components/po-form/AppliedChargesTable";
import { UdfsTable } from "@/components/po-form/UdfsTable";
import { PoFormHeader } from "@/components/po-form/PoFormHeader";
import { mockPoFromSubmissionId, type PoFormData, type PoLineItem } from "@/lib/po-form-data";

function PoFormView() {
  const params = useSearchParams();
  const id = params.get("id");
  const file = params.get("file");

  const initial = useMemo(() => mockPoFromSubmissionId(id), [id]);
  const [form, setForm] = useState<PoFormData>(initial);

  useEffect(() => { setForm(initial); }, [initial]);
  useEffect(() => {
    document.title = `${form.purchaseOrderNumber} · PO Form · JARVE GP8 Portal`;
  }, [form.purchaseOrderNumber]);

  const update = <K extends keyof PoFormData>(key: K, value: PoFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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

  return (
    <>
      <PoFormHeader onClose={() => window.close()} onPrint={() => window.print()} />

      <main className="form-body">
        <header className="form-head">
          <div className="form-head__source">
            <PaperclipIcon size={13} strokeWidth={1.75} />
            Generated from submission <code>{id ?? "SUB-2026-00001"}</code>
            <span style={{ color: "var(--portal-text-faint)" }}>·</span>
            <span>{file ?? "document.pdf"}</span>
          </div>
          <div className="form-head__title-row">
            <h1 className="form-head__num">{form.purchaseOrderNumber}</h1>
            <span className="status-pill">
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
            <strong>Ready for review.</strong> Save your edits, or submit to push this PO to{" "}
            <code style={{ fontFamily: "var(--cc-font-mono)", fontSize: 12, color: "var(--ds-gray-7)" }}>
              POST /api/PurchaseOrder
            </code>
            .
          </div>
          <div className="form-footer__actions">
            <button className="btn-ghost" type="button" onClick={() => window.close()}>
              Discard &amp; close
            </button>
            <button className="btn-ghost" type="button">
              Save draft
            </button>
            <button className="btn-primary" type="button">
              <CheckIcon />
              Submit PO
            </button>
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
