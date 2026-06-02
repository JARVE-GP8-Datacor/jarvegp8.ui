"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, AlertCircleIcon } from "@/components/Icon";

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

interface PoStatusData {
  status: PoStatus;
  confidence_score?: number;
  tokens_used?: number;
  estimated_cost_usd?: number;
  agent_events: AgentEvent[];
  payload?: {
    confidence_score: number;
    interpretation_notes: string[];
  };
  error_message: string | null;
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

function confMod(score: number): string {
  if (score >= 0.85) return "pod-conf--green";
  if (score >= 0.60) return "pod-conf--amber";
  return "pod-conf--red";
}

function costMod(usd: number): string {
  if (usd < 0.03) return "pod-tokens__val--green";
  if (usd < 0.08) return "pod-tokens__val--amber";
  return "pod-tokens__val--red";
}

function tokensMod(n: number): string {
  if (n < 5000)  return "pod-tokens__val--green";
  if (n < 12000) return "pod-tokens__val--amber";
  return "pod-tokens__val--red";
}

// ── Component ──────────────────────────────────────────────────────────────

interface PoDetailPanelProps {
  trackingCode: string;
  onComplete: () => void;
  onFailed?: () => void;
}

export function PoDetailPanel({ trackingCode, onComplete, onFailed }: PoDetailPanelProps) {
  const [data, setData] = useState<PoStatusData | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/po/${encodeURIComponent(trackingCode)}/status`);
      if (!res.ok) return;
      const json: PoStatusData = await res.json();
      setData(json);
      if (!POLLING_STATUSES.has(json.status) && !completedRef.current) {
        completedRef.current = true;
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        if (json.status === "FAILED") {
          onFailed?.();
        } else {
          onComplete();
        }
      }
    } catch { /* silent */ }
  }, [trackingCode, onComplete]);

  useEffect(() => {
    completedRef.current = false;
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  const isPolling = !data || POLLING_STATUSES.has(data.status);
  const isFailed  = !isPolling && data?.status === "FAILED";
  const eventMap  = new Map(data?.agent_events.map((e) => [e.tool, e]) ?? []);
  const lastStepIdx = (() => {
    for (let i = STEP_DEFS.length - 1; i >= 0; i--) {
      if (eventMap.has(STEP_DEFS[i].tool)) return i;
    }
    return -1;
  })();
  const conf = data?.payload?.confidence_score ?? data?.confidence_score;

  return (
    <div className="po-detail-panel">
      {/* AI Agent Progress */}
      <div className="po-detail-panel__section">
        <div className="po-detail-panel__heading">
          AI Agent Progress
          {!isPolling && data && data.agent_events.length > 0 && (
            isFailed
              ? <span className="pod-failed-chip"><AlertCircleIcon size={10} /> Failed</span>
              : <span className="pod-done-chip"><CheckIcon size={10} /> Complete</span>
          )}
        </div>
        <ol className="agent-tl agent-tl--compact">
          {STEP_DEFS.map((step, idx) => {
            const ev      = eventMap.get(step.tool);
            const failed  = isFailed && idx === lastStepIdx;
            const done    = !!ev && !failed && (!isPolling || idx < lastStepIdx);
            const active  = isPolling && idx === lastStepIdx && !!ev;
            const pending = !ev;
            return (
              <li
                key={step.tool}
                className={[
                  "agent-step",
                  failed  ? "agent-step--failed"  : "",
                  done    ? "agent-step--done"    : "",
                  active  ? "agent-step--active"  : "",
                  pending ? "agent-step--pending" : "",
                ].join(" ")}
              >
                <div className="agent-step__node">
                  {failed  ? <AlertCircleIcon size={11} />
                  : done   ? <CheckIcon size={11} />
                  : active ? <span className="agent-step__spinner" />
                  :          <span className="agent-step__num">{idx + 1}</span>}
                </div>
                <div className="agent-step__body">
                  <div className="agent-step__label">{step.label}</div>
                  {ev && <div className="agent-step__summary">{ev.summary}</div>}
                  {failed && data?.error_message && (
                    <div className="agent-step__error">{data.error_message}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {!data && (
          <p className="po-detail-panel__waiting">Waiting for processing to start…</p>
        )}
      </div>

      {/* Interpretation Confidence */}
      {conf !== undefined && (
        <div className="po-detail-panel__section">
          <div className="po-detail-panel__heading">Interpretation Confidence</div>
          <div className="pod-conf-hero pod-conf-hero--compact">
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
          {data?.payload?.interpretation_notes && data.payload.interpretation_notes.length > 0 && (
            <ul className="pod-notes">
              {data.payload.interpretation_notes.map((note, i) => (
                <li key={i} className="pod-note">
                  <AlertCircleIcon size={13} />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
          {(data?.tokens_used !== undefined || data?.estimated_cost_usd !== undefined) && (
            <div className="pod-tokens">
              {data.tokens_used !== undefined && (
                <span>
                  Tokens used:{" "}
                  <strong className={tokensMod(data.tokens_used)}>
                    {data.tokens_used.toLocaleString("en-US")}
                  </strong>
                </span>
              )}
              {data.estimated_cost_usd !== undefined && (
                <span>
                  Est. cost:{" "}
                  <strong className={costMod(data.estimated_cost_usd)}>
                    ${data.estimated_cost_usd.toFixed(4)}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
