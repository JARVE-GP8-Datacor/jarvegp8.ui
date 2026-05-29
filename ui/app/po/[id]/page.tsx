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

interface AgentEvent {
  tool: string;
  timestamp: string;
  summary: string;
}

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
  agent_events: AgentEvent[];
  payload?: PoPayload;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STEP_DEFS = [
  { tool: "started",            label: "Starting interpretation" },
  { tool: "extract_header",     label: "Reading PO header" },
  { tool: "extract_parties",    label: "Identifying buyer & seller" },
  { tool: "extract_line_items", label: "Extracting line items" },
  { tool: "evaluate_quality",   label: "Evaluating quality" },
] as const;

const POLLING_STATUSES = new Set<PoStatus>(["RECEIVED", "INTERPRETING"]);

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  return `${Math.round(secs / 3600)}h ago`;
}

function statusLabel(s: PoStatus): string {
  const map: Record<PoStatus, string> = {
    RECEIVED:       "Received",
    INTERPRETING:   "Interpreting",
    AUTO_APPROVED:  "Auto-Approved",
    PENDING_REVIEW: "Pending Review",
    REVIEWING:      "Reviewing",
    APPROVED:       "Approved",
    PUSHING:        "Pushing",
    PUSHED:         "Pushed",
    FAILED:         "Failed",
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

function confMod(score: number): string {
  if (score >= 0.85) return "pod-conf--green";
  if (score >= 0.60) return "pod-conf--amber";
  return "pod-conf--red";
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
  return n.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [query,       setQuery]       = useState("");
  const [category,    setCategory]    = useState<CategoryId>("all");
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [pinnedOnly,  setPinnedOnly]  = useState(false);
  const [data,        setData]        = useState<PoStatusData | null>(null);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<"header" | "parties" | "lines" | "project">("header");
  const [copied,      setCopied]      = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "reprocess" | "update" | null>(null);
  const [toast,       setToast]       = useState("");
  const [editedPayload, setEditedPayload] = useState<PoPayload | null>(null);
  const [isDirty,     setIsDirty]     = useState(false);

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

  // Initialize editable payload once data loads
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
      showToast("PO approved successfully");
      fetchStatus();
    } catch { showToast("Approve failed — please retry"); }
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
      const res = await fetch(`/api/po/${id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ normalized_payload: editedPayload }),
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
      ...p,
      parties: { ...p.parties, [role]: { ...p.parties[role], [key]: val } },
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
    setEditedPayload((p) => p ? {
      ...p,
      project_specific: { ...p.project_specific, [key]: val },
    } : p);
    setIsDirty(true);
  };

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading) return (
    <Shell query={query} setQuery={setQuery} category={category} setCategory={setCategory}
      filterOpen={filterOpen} setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
      closeFilter={() => setFilterOpen(false)} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly}>
      <div className="pod-loading">
        <div className="pod-spinner" />
        <p>Loading PO details…</p>
      </div>
    </Shell>
  );

  if (fetchError || !data) return (
    <Shell query={query} setQuery={setQuery} category={category} setCategory={setCategory}
      filterOpen={filterOpen} setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
      closeFilter={() => setFilterOpen(false)} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly}>
      <div className="pod-error">
        <AlertCircleIcon size={32} />
        <p>{fetchError ?? "PO not found"}</p>
        <button className="btn-ghost" onClick={() => { setLoading(true); fetchStatus(); }}>Retry</button>
      </div>
    </Shell>
  );

  // ── Derived state ──────────────────────────────────────────────────────

  const isPolling = POLLING_STATUSES.has(data.status);
  const eventMap = new Map(data.agent_events.map((e) => [e.tool, e]));
  const lastStepIdx = (() => {
    for (let i = STEP_DEFS.length - 1; i >= 0; i--) {
      if (eventMap.has(STEP_DEFS[i].tool)) return i;
    }
    return -1;
  })();

  const canSubmit    = (["AUTO_APPROVED", "PENDING_REVIEW", "REVIEWING"] as PoStatus[]).includes(data.status);
  const canReprocess = (["FAILED", "PENDING_REVIEW"] as PoStatus[]).includes(data.status);
  const conf = data.payload?.confidence_score ?? data.confidence_score;

  return (
    <Shell query={query} setQuery={setQuery} category={category} setCategory={setCategory}
      filterOpen={filterOpen} setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
      closeFilter={() => setFilterOpen(false)} pinnedOnly={pinnedOnly} setPinnedOnly={setPinnedOnly}>

      {/* Breadcrumb */}
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/submit">Submit POs</Link>
        <span className="crumbs__sep">/</span>
        <span className="crumbs__current">{data.tracking_code}</span>
      </nav>

      {/* ── Section 1: Header bar ── */}
      <div className="pod-head">
        <div className="pod-head__left">
          <div className="pod-head__title-row">
            <h1 className="pod-head__tracking">{data.tracking_code}</h1>
            <button
              className={`pod-copy ${copied ? "is-copied" : ""}`}
              onClick={copyTracking}
              title="Copy tracking code"
            >
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
              {actionLoading === "approve"
                ? <span className="pod-btn-spinner" />
                : <CheckIcon size={13} />}
              Submit PO
            </button>
          )}
        </div>
      </div>

      {/* ── Section 2: AI Agent Progress ── */}
      <div className="card">
        <header className="card__header">
          <h2 className="card__title">AI Agent Progress</h2>
          {!isPolling && data.agent_events.length > 0 && (
            <span className="pod-done-chip"><CheckIcon size={11} /> Complete</span>
          )}
        </header>
        <ol className="agent-tl">
          {STEP_DEFS.map((step, idx) => {
            const ev      = eventMap.get(step.tool);
            const done    = !!ev && (!isPolling || idx < lastStepIdx);
            const active  = isPolling && idx === lastStepIdx && !!ev;
            const pending = !ev;

            return (
              <li
                key={step.tool}
                className={[
                  "agent-step",
                  done    ? "agent-step--done"    : "",
                  active  ? "agent-step--active"  : "",
                  pending ? "agent-step--pending" : "",
                ].join(" ")}
              >
                <div className="agent-step__node">
                  {done   ? <CheckIcon size={13} />
                  : active ? <span className="agent-step__spinner" />
                  :          <span className="agent-step__num">{idx + 1}</span>}
                </div>
                <div className="agent-step__body">
                  <div className="agent-step__label">{step.label}</div>
                  {ev && <div className="agent-step__summary">{ev.summary}</div>}
                  {ev && <div className="agent-step__ts">{relativeTime(ev.timestamp)}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Section 3: Confidence Score ── */}
      {data.payload && conf !== undefined && (
        <div className="card">
          <header className="card__header">
            <h2 className="card__title">Interpretation Confidence</h2>
          </header>
          <div className="pod-conf-hero">
            <div className={`pod-conf-score ${confMod(conf)}`}>
              {Math.round(conf * 100)}<span className="pod-conf-pct">%</span>
            </div>
            <div className="pod-conf-desc">
              {conf >= 0.85
                ? "High confidence — safe to approve"
                : conf >= 0.60
                ? "Moderate confidence — review recommended"
                : "Low confidence — manual review required"}
            </div>
          </div>
          {data.payload.interpretation_notes.length > 0 && (
            <ul className="pod-notes">
              {data.payload.interpretation_notes.map((note, i) => (
                <li key={i} className="pod-note">
                  <AlertCircleIcon size={14} />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Section 4: PO Details ── */}
      {data.payload && (
        <div className="card">
          <div className="pod-tabs">
            {(["header", "parties", "lines", "project"] as const).map((tab) => (
              <button
                key={tab}
                className={`pod-tab ${activeTab === tab ? "pod-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {{ header: "Header", parties: "Parties", lines: "Line Items", project: "Project Info" }[tab]}
                {tab === "lines" && (
                  <span className="pod-tab-count">{data.payload!.line_items.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "header" && editedPayload && (
            <div className="pod-field-grid">
              <PodField label="PO Number"     value={editedPayload.header.po_number}     mono onChange={(v) => setHeader("po_number", v)} />
              <PodField label="Issue Date"    value={editedPayload.header.issue_date}    onChange={(v) => setHeader("issue_date", v)} />
              <PodField label="Currency"      value={editedPayload.header.currency}      onChange={(v) => setHeader("currency", v)} />
              <PodField label="Payment Terms" value={editedPayload.header.payment_terms} onChange={(v) => setHeader("payment_terms", v)} />
              <PodField label="Delivery Date" value={editedPayload.header.delivery_date} onChange={(v) => setHeader("delivery_date", v)} />
            </div>
          )}

          {activeTab === "parties" && editedPayload && (
            <div className="pod-parties">
              <PartyCard title="Buyer"  party={editedPayload.parties.buyer}  onChange={(k, v) => setParty("buyer",  k, v)} />
              <PartyCard title="Seller" party={editedPayload.parties.seller} onChange={(k, v) => setParty("seller", k, v)} />
            </div>
          )}

          {activeTab === "lines" && editedPayload && (
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
                    <th className="num">Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {editedPayload.line_items.map((item) => (
                    <tr key={item.line_number} className={item.flags.length > 0 ? "tr--flagged" : ""}>
                      <td className="seq">{item.line_number}</td>
                      <td>
                        <input className="cell-input" value={item.description} onChange={(e) => setLineField(item.line_number, "description", e.target.value)} />
                        {item.flags.map((f) => (
                          <span key={f} className="flag-tag">{f.replace(/_/g, " ")}</span>
                        ))}
                      </td>
                      <td>
                        <input className="cell-input cell-input--mono" value={item.sku ?? ""} onChange={(e) => setLineField(item.line_number, "sku", e.target.value)} />
                      </td>
                      <td className="num">
                        <input className="cell-input cell-input--num" type="number" value={item.quantity} onChange={(e) => setLineField(item.line_number, "quantity", e.target.value)} />
                      </td>
                      <td>
                        <input className="cell-input" value={item.unit} onChange={(e) => setLineField(item.line_number, "unit", e.target.value)} />
                      </td>
                      <td className="num">
                        <input className="cell-input cell-input--num" type="number" value={item.unit_price} onChange={(e) => setLineField(item.line_number, "unit_price", e.target.value)} />
                      </td>
                      <td className="num">
                        <input className="cell-input cell-input--num" type="number" value={item.total} onChange={(e) => setLineField(item.line_number, "total", e.target.value)} />
                      </td>
                      <td className="num">
                        <span className={`line-conf ${
                          item.confidence_score >= 0.85 ? "line-conf--hi"
                          : item.confidence_score >= 0.60 ? "line-conf--mid"
                          : "line-conf--lo"
                        }`}>
                          {Math.round(item.confidence_score * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="label">Grand Total</td>
                    <td className="num">
                      {editedPayload.header.currency}{" "}
                      {fmtNum(editedPayload.line_items.reduce((s, i) => s + i.total, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {activeTab === "project" && editedPayload && (
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
          )}
        </div>
      )}

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </Shell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

type ShellProps = {
  query: string; setQuery: (q: string) => void;
  category: CategoryId; setCategory: (c: CategoryId) => void;
  filterOpen: boolean; setFilterOpen: (fn: (o: boolean) => boolean) => void;
  closeFilter: () => void;
  pinnedOnly: boolean; setPinnedOnly: (v: boolean) => void;
  children: React.ReactNode;
};
function Shell({ children, ...hp }: ShellProps) {
  return (
    <div className="portal">
      <Header {...hp} showFilter={false} />
      <div className="portal__body">{children}</div>
    </div>
  );
}

function PodField({ label, value, mono = false, onChange }: {
  label: string;
  value: string;
  mono?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="pod-field">
      <div className="pod-field__label">{label}</div>
      {onChange ? (
        <input
          className={`pod-field__input${mono ? " pod-field__input--mono" : ""}`}
          value={value}
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
      <input className="pod-field__input pod-party__input" value={party.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Name" />
      <input className="pod-field__input pod-party__input" value={party.address ?? ""} onChange={(e) => onChange("address", e.target.value)} placeholder="Address" />
      <input className="pod-field__input pod-party__input" value={party.tax_id ?? ""} onChange={(e) => onChange("tax_id", e.target.value)} placeholder="Tax ID" />
      <input className="pod-field__input pod-party__input" value={party.contact_email ?? ""} onChange={(e) => onChange("contact_email", e.target.value)} placeholder="Contact email" />
    </div>
  );
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function RefreshIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function SaveIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
