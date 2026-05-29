"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CheckIcon, AlertCircleIcon } from "@/components/Icon";
import type { CategoryId } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

type PoStatus =
  | "RECEIVED" | "INTERPRETING"
  | "AUTO_APPROVED" | "PENDING_REVIEW" | "REVIEWING"
  | "APPROVED" | "PUSHING" | "PUSHED" | "FAILED";

interface PoParty {
  name: string;
  address: string;
  tax_id: string | null;
  contact_email: string | null;
}

interface PoLineItem {
  line_number: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  sku: string | null;
  confidence_score: number;
  flags: string[];
}

interface PoPayload {
  header: {
    po_number: string;
    issue_date: string;
    currency: string;
    payment_terms: string;
    delivery_date: string;
  };
  parties: { buyer: PoParty; seller: PoParty };
  line_items: PoLineItem[];
  project_specific: Record<string, string>;
  confidence_score: number;
  interpretation_notes: string[];
}

interface PoStatusData {
  po_id: string;
  tracking_code: string;
  project_code: string;
  status: PoStatus;
  confidence_score?: number;
  agent_events: { tool: string; timestamp: string; summary: string }[];
  payload?: PoPayload;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const POLLING_STATUSES = new Set<PoStatus>(["RECEIVED", "INTERPRETING"]);

function statusLabel(s: PoStatus): string {
  const map: Record<PoStatus, string> = {
    RECEIVED: "Received", INTERPRETING: "Interpreting",
    AUTO_APPROVED: "Auto-Approved", PENDING_REVIEW: "Pending Review",
    REVIEWING: "Reviewing", APPROVED: "Approved",
    PUSHING: "Pushing", PUSHED: "Pushed", FAILED: "Failed",
  };
  return map[s] ?? s;
}

function statusMod(s: PoStatus): string {
  if (POLLING_STATUSES.has(s) || s === "PUSHING") return "pod-badge--blue";
  if (s === "AUTO_APPROVED" || s === "APPROVED" || s === "PUSHED") return "pod-badge--green";
  if (s === "PENDING_REVIEW") return "pod-badge--amber";
  if (s === "REVIEWING") return "pod-badge--orange";
  if (s === "FAILED") return "pod-badge--red";
  return "";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function fmtNum(n: number, dec = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [category,     setCategory]     = useState<CategoryId>("all");
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [pinnedOnly,   setPinnedOnly]   = useState(false);
  const [data,         setData]         = useState<PoStatusData | null>(null);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [copied,       setCopied]       = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "reprocess" | "update" | null>(null);
  const [toast,        setToast]        = useState("");
  const [editedPayload, setEditedPayload] = useState<PoPayload | null>(null);
  const [isDirty,      setIsDirty]      = useState(false);

  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/po/${id}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PoStatusData = await res.json();
      setData(json);
      setFetchError(null);
      if (!POLLING_STATUSES.has(json.status)) {
        if (pollInterval.current) { clearInterval(pollInterval.current); pollInterval.current = null; }
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
    pollInterval.current = setInterval(fetchStatus, 2000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (data?.payload && !isDirty) {
      setEditedPayload(data.payload);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.payload]);

  const copyTracking = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.tracking_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const doApprove = async () => {
    setActionLoading("approve");
    try {
      const res = await fetch(`/api/po/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed_by: "current_user" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("PO submitted to PMM successfully");
      fetchStatus();
    } catch { showToast("Submit failed — please retry"); }
    finally { setActionLoading(null); }
  };

  const doReprocess = async () => {
    setActionLoading("reprocess");
    try {
      const res = await fetch(`/api/po/${id}/reprocess`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Reprocessing started");
      if (!pollInterval.current) pollInterval.current = setInterval(fetchStatus, 2000);
      fetchStatus();
    } catch { showToast("Reprocess failed — please retry"); }
    finally { setActionLoading(null); }
  };

  const doUpdate = async () => {
    if (!editedPayload) return;
    setActionLoading("update");
    try {
      const res = await fetch(`/api/po/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: editedPayload }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("PO updated successfully");
      setIsDirty(false);
    } catch { showToast("Update failed — please retry"); }
    finally { setActionLoading(null); }
  };

  const setHeader = (key: keyof PoPayload["header"], val: string) => {
    setEditedPayload((p) => p ? { ...p, header: { ...p.header, [key]: val } } : p);
    setIsDirty(true);
  };

  const setParty = (role: "buyer" | "seller", key: keyof PoParty, val: string) => {
    setEditedPayload((p) => p ? {
      ...p, parties: { ...p.parties, [role]: { ...p.parties[role], [key]: val } },
    } : p);
    setIsDirty(true);
  };

  const setLineField = (lineNum: number, key: keyof PoLineItem, val: string) => {
    setEditedPayload((p) => p ? {
      ...p,
      line_items: p.line_items.map((l) =>
        l.line_number === lineNum
          ? { ...l, [key]: ["quantity", "unit_price", "total", "confidence_score"].includes(key) ? Number(val) : val }
          : l
      ),
    } : p);
    setIsDirty(true);
  };

  const setProjectField = (key: string, val: string) => {
    setEditedPayload((p) => p ? { ...p, project_specific: { ...p.project_specific, [key]: val } } : p);
    setIsDirty(true);
  };

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading) return (
    <Shell category={category} setCategory={setCategory}
      filterOpen={filterOpen} setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
      closeFilter={() => setFilterOpen(false)} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly}>
      <div className="pod-loading"><div className="pod-spinner" /><p>Loading PO details…</p></div>
    </Shell>
  );

  if (fetchError || !data) return (
    <Shell category={category} setCategory={setCategory}
      filterOpen={filterOpen} setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
      closeFilter={() => setFilterOpen(false)} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly}>
      <div className="pod-error">
        <AlertCircleIcon size={32} />
        <p>{fetchError ?? "PO not found"}</p>
        <button className="btn-ghost" onClick={() => { setLoading(true); fetchStatus(); }}>Retry</button>
      </div>
    </Shell>
  );

  const isPolling  = POLLING_STATUSES.has(data.status);
  const canSubmit  = (["AUTO_APPROVED", "PENDING_REVIEW", "REVIEWING"] as PoStatus[]).includes(data.status);
  const canReprocess = (["FAILED", "PENDING_REVIEW"] as PoStatus[]).includes(data.status);

  return (
    <Shell category={category} setCategory={setCategory}
      filterOpen={filterOpen} setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
      closeFilter={() => setFilterOpen(false)} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly}>

      {/* Breadcrumb */}
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/submit">Submit POs</Link>
        <span className="crumbs__sep">/</span>
        <span className="crumbs__current">{data.tracking_code}</span>
      </nav>

      {/* Header bar */}
      <div className="pod-head">
        <div className="pod-head__left">
          <div className="pod-head__title-row">
            <h1 className="pod-head__tracking">{data.tracking_code}</h1>
            <button className={`pod-copy ${copied ? "is-copied" : ""}`} onClick={copyTracking} title="Copy tracking code">
              {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <span className="pod-project-tag">{data.project_code}</span>
          </div>
          <div className="pod-head__sub">
            <span className={`pod-badge ${statusMod(data.status)} ${isPolling || data.status === "PUSHING" ? "pod-badge--pulse" : ""}`}>
              <span className="pod-badge__dot" />
              {statusLabel(data.status)}
            </span>
            <span className="pod-head__ts">Uploaded {fmtDate(data.created_at)}</span>
          </div>
        </div>
        <div className="pod-head__actions">
          {canReprocess && (
            <button className="btn-ghost" onClick={doReprocess} disabled={actionLoading !== null}>
              <RefreshIcon size={13} className={actionLoading === "reprocess" ? "spin" : ""} />
              Reprocess
            </button>
          )}
          {editedPayload && (
            <button
              className={`btn-ghost ${isDirty ? "btn-ghost--highlight" : ""}`}
              onClick={doUpdate}
              disabled={actionLoading !== null || !isDirty}
            >
              {actionLoading === "update" ? <span className="pod-btn-spinner" /> : <SaveIcon size={13} />}
              Update
            </button>
          )}
          {canSubmit && (
            <button className="btn-primary" onClick={doApprove} disabled={actionLoading !== null}>
              {actionLoading === "approve" ? <span className="pod-btn-spinner" /> : <CheckIcon size={13} />}
              Submit PO
            </button>
          )}
        </div>
      </div>

      {/* PO form — all sections visible at once */}
      {editedPayload && (
        <>
          {/* Header */}
          <div className="card">
            <header className="card__header">
              <h2 className="card__title">PO Header</h2>
            </header>
            <div className="pod-field-grid">
              <PodField label="PO Number"     value={editedPayload.header.po_number}     mono onChange={(v) => setHeader("po_number", v)} />
              <PodField label="Issue Date"    value={editedPayload.header.issue_date}    type="date" onChange={(v) => setHeader("issue_date", v)} />
              <PodField label="Currency"      value={editedPayload.header.currency}           onChange={(v) => setHeader("currency", v)} />
              <PodField label="Payment Terms" value={editedPayload.header.payment_terms}      onChange={(v) => setHeader("payment_terms", v)} />
              <PodField label="Delivery Date" value={editedPayload.header.delivery_date} type="date" onChange={(v) => setHeader("delivery_date", v)} />
            </div>
          </div>

          {/* Parties */}
          <div className="card">
            <header className="card__header">
              <h2 className="card__title">Parties</h2>
            </header>
            <div className="pod-parties">
              <PartyCard title="Buyer"  party={editedPayload.parties.buyer}  onChange={(k, v) => setParty("buyer",  k, v)} />
              <PartyCard title="Seller" party={editedPayload.parties.seller} onChange={(k, v) => setParty("seller", k, v)} />
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <header className="card__header">
              <h2 className="card__title">Line Items</h2>
              <span className="card__count">{editedPayload.line_items.length}</span>
            </header>
            <div className="pod-lines">
              <table className="lines-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>SKU</th>
                    <th className="num">Qty</th>
                    <th>Unit</th>
                    <th className="num">Unit Price</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {editedPayload.line_items.map((item) => (
                    <tr key={item.line_number} className={item.flags.length > 0 ? "tr--flagged" : ""}>
                      <td className="seq">{item.line_number}</td>
                      <td>
                        <input className="cell-input" value={item.description} onChange={(e) => setLineField(item.line_number, "description", e.target.value)} />
                        {item.flags.map((f) => <span key={f} className="flag-tag">{f.replace(/_/g, " ")}</span>)}
                      </td>
                      <td>
                        <input className="cell-input cell-input--mono" value={item.sku ?? ""} onChange={(e) => setLineField(item.line_number, "sku", e.target.value)} />
                      </td>
                      <td className="num">
                        <input className="cell-input cell-input--num" type="number" value={item.quantity} onChange={(e) => setLineField(item.line_number, "quantity", e.target.value)} onWheel={(e) => e.currentTarget.blur()} />
                      </td>
                      <td>
                        <input className="cell-input" value={item.unit} onChange={(e) => setLineField(item.line_number, "unit", e.target.value)} />
                      </td>
                      <td className="num">
                        <input className="cell-input cell-input--num" type="number" value={item.unit_price} onChange={(e) => setLineField(item.line_number, "unit_price", e.target.value)} onWheel={(e) => e.currentTarget.blur()} />
                      </td>
                      <td className="num">
                        <span className="cell-readonly">{item.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="label">Grand Total</td>
                    <td />
                    <td className="num">
                      {editedPayload.header.currency}{" "}
                      {fmtNum(editedPayload.line_items.reduce((s, i) => s + i.total, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Project-specific */}
          {Object.keys(editedPayload.project_specific).length > 0 && (
            <div className="card">
              <header className="card__header">
                <h2 className="card__title">Project Info</h2>
              </header>
              <div className="pod-field-grid">
                {Object.entries(editedPayload.project_specific).map(([k, v]) => (
                  <PodField
                    key={k}
                    label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={String(v)}
                    onChange={(val) => setProjectField(k, val)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </Shell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

type ShellProps = {
  category: CategoryId; setCategory: (c: CategoryId) => void;
  filterOpen: boolean; setFilterOpen: (fn: (o: boolean) => boolean) => void;
  closeFilter: () => void;
  pinnedOnly: boolean; setPinnedOnly: (v: boolean) => void;
  children: React.ReactNode;
};
function Shell({ children, category, setCategory, filterOpen, setFilterOpen, closeFilter, pinnedOnly, setPinnedOnly }: ShellProps) {
  return (
    <div className="portal">
      <Header category={category} setCategory={setCategory} filterOpen={filterOpen} setFilterOpen={setFilterOpen} closeFilter={closeFilter} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly} showFilter={false} />
      <div className="portal__body">{children}</div>
    </div>
  );
}

function PodField({ label, value, mono = false, type = "text", onChange }: {
  label: string; value: string; mono?: boolean; type?: string; onChange?: (v: string) => void;
}) {
  return (
    <div className="pod-field">
      <div className="pod-field__label">{label}</div>
      {onChange ? (
        <input
          type={type}
          className={`pod-field__input${mono ? " pod-field__input--mono" : ""}`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className={`pod-field__value${mono ? " pod-field__value--mono" : ""}`}>{value || "—"}</div>
      )}
    </div>
  );
}

function PartyCard({ title, party, onChange }: {
  title: string;
  party: PoParty;
  onChange: (key: keyof PoParty, val: string) => void;
}) {
  return (
    <div className="pod-party">
      <div className="pod-party__role">{title}</div>
      <input className="pod-field__input pod-party__input" value={party.name}                onChange={(e) => onChange("name",          e.target.value)} placeholder="Name" />
      <input className="pod-field__input pod-party__input" value={party.address ?? ""}       onChange={(e) => onChange("address",       e.target.value)} placeholder="Address" />
      <input className="pod-field__input pod-party__input" value={party.tax_id ?? ""}        onChange={(e) => onChange("tax_id",        e.target.value)} placeholder="Tax ID" />
      <input className="pod-field__input pod-party__input" value={party.contact_email ?? ""} onChange={(e) => onChange("contact_email", e.target.value)} placeholder="Contact email" />
    </div>
  );
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function RefreshIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function SaveIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
