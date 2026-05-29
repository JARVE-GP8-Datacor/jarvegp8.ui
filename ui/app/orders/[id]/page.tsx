"use client";

import { use, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/po/Breadcrumb";
import { PoPageHeader } from "@/components/po/PoPageHeader";
import { EtaStrip } from "@/components/po/EtaStrip";
import { StageTracker } from "@/components/po/StageTracker";
import type { PoStage, PoSummary } from "@/lib/po-types";

// ── Stage mapping ──────────────────────────────────────────────────────────

const STAGE_DEFS: { key: string; label: string }[] = [
  { key: "received",   label: "PO Received" },
  { key: "review",     label: "Under Review" },
  { key: "processing", label: "Processing" },
  { key: "invoiced",   label: "Invoiced" },
  { key: "completed",  label: "Completed (Paid)" },
];

const STATUS_STAGE_IDX: Record<string, number> = {
  RECEIVED:       0,
  INTERPRETING:   0,
  AUTO_APPROVED:  1,
  PENDING_REVIEW: 1,
  REVIEWING:      1,
  APPROVED:       2,
  PUSHING:        2,
  PUSHED:         3,
  FAILED:         0,
};

const STATUS_LABEL: Record<string, string> = {
  RECEIVED:       "Received",
  INTERPRETING:   "Interpreting",
  AUTO_APPROVED:  "Auto Approved",
  PENDING_REVIEW: "Pending Review",
  REVIEWING:      "Under Review",
  APPROVED:       "Approved",
  PUSHING:        "Processing",
  PUSHED:         "Invoiced",
  FAILED:         "Failed",
};

const NEXT_STEP: Record<string, { message: string; highlight: string }> = {
  RECEIVED:       { message: "Waiting for AI interpretation to begin", highlight: "" },
  INTERPRETING:   { message: "AI agent is interpreting the document with", highlight: "Processing" },
  AUTO_APPROVED:  { message: "Preparing for approval review with",        highlight: "Procurement" },
  PENDING_REVIEW: { message: "Approval review with",                      highlight: "Procurement" },
  REVIEWING:      { message: "Under active review with",                  highlight: "Procurement" },
  APPROVED:       { message: "Approved — pushing to ERP with",            highlight: "Integration" },
  PUSHING:        { message: "Syncing data to ERP via",                   highlight: "Integration" },
  PUSHED:         { message: "Order received by",                         highlight: "ERP system" },
  FAILED:         { message: "Processing failed — check",                 highlight: "error details" },
};

// ── API types ──────────────────────────────────────────────────────────────

interface ApiParty { name: string; address?: string; contact?: string; tax_id?: string; }
interface ApiLineItem { line_number: number; description: string; quantity: number; unit_price: number; total: number; }
interface ApiPayload {
  header: { po_number: string; issue_date: string; currency: string; payment_terms: string; delivery_date: string; };
  parties: { buyer: ApiParty; seller: ApiParty };
  line_items: ApiLineItem[];
}
interface ApiStatus {
  status: string;
  tracking_code: string;
  normalized_payload?: ApiPayload;
  error_message: string | null;
}

// ── Mapping ────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function buildSummary(id: string, api: ApiStatus): PoSummary {
  const stageIdx = STATUS_STAGE_IDX[api.status] ?? 0;
  const doneCount = stageIdx; // stages before current are done
  const total = STAGE_DEFS.length;
  const progressPct = Math.round((doneCount / total) * 100);

  const stages: PoStage[] = STAGE_DEFS.map((def, i) => ({
    key: def.key,
    label: def.label,
    sub: i < stageIdx ? "Complete" : i === stageIdx ? "In progress" : "—",
    state: i < stageIdx ? "done" : i === stageIdx ? "current" : "upcoming",
  }));

  const payload = api.normalized_payload;
  const seller = payload?.parties.seller.name ?? "—";
  const lineTotal = payload?.line_items.reduce((s, l) => s + (l.total || 0), 0) ?? 0;
  const currency = payload?.header.currency ?? "USD";
  const amount = lineTotal > 0 ? fmtCurrency(lineTotal, currency) : "—";
  const issueDate = payload?.header.issue_date ?? "—";
  const deliveryDate = payload?.header.delivery_date ?? "—";

  const nextStep = NEXT_STEP[api.status] ?? { message: "Processing", highlight: "" };

  return {
    id: api.tracking_code ?? id,
    vendor: seller,
    amount,
    createdBy: "—",
    createdOn: issueDate,
    requiredBy: deliveryDate,
    statusLabel: STATUS_LABEL[api.status] ?? api.status,
    stages,
    eta: {
      message: nextStep.message,
      highlight: nextStep.highlight,
      progress: `${progressPct}%`,
      progressLabel: `${doneCount} of ${total} stages complete`,
    },
    callout: {
      kicker: api.error_message ? "FAILED" : `${STATUS_LABEL[api.status] ?? api.status} — IN PROGRESS`,
      message: api.error_message ?? `Order is currently ${(STATUS_LABEL[api.status] ?? api.status).toLowerCase()}.`,
      detail: `Tracking ID: ${api.tracking_code ?? id}`,
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PoTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [po, setPo] = useState<PoSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/po/${encodeURIComponent(id)}/status`)
      .then(async (res) => {
        if (!res.ok) { setError(`PO not found (${res.status})`); return; }
        const data: ApiStatus = await res.json();
        setPo(buildSummary(id, data));
      })
      .catch(() => setError("Network error — could not load PO."));
  }, [id]);

  if (error) return (
    <div className="portal">
      <Header />
      <div className="portal__body">
        <Breadcrumb current={id} />
        <p style={{ color: "var(--ds-red)", padding: "2rem 0" }}>{error}</p>
      </div>
    </div>
  );

  if (!po) return (
    <div className="portal">
      <Header />
      <div className="portal__body">
        <Breadcrumb current={id} />
        <div className="pod-loading"><div className="pod-spinner" /><p>Loading…</p></div>
      </div>
    </div>
  );

  const doneCount = po.stages.filter((s) => s.state === "done").length;
  const progressPct = Math.round((doneCount / po.stages.length) * 100);

  return (
    <div className="portal">
      <Header />
      <div className="portal__body">
        <Breadcrumb current={po.id} />
        <PoPageHeader po={po} />
        <div className="po-layout">
          <div className="po-main">
            <EtaStrip eta={po.eta} />
            <StageTracker stages={po.stages} callout={po.callout} progressPct={progressPct} />
          </div>
        </div>
      </div>
    </div>
  );
}
