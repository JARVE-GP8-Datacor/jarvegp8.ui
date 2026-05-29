"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowIcon, CalendarBlankIcon, ChevronIcon } from "../Icon";
import { fmtBytes, isAccepted, relativeTime, type Submission } from "@/lib/submit-types";
import { PoDetailPanel } from "./PoDetailPanel";

interface SubmissionQueueProps {
  submissions: Submission[];
  freshIds: Set<string>;
  loading?: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onDetailComplete: (id: string) => void;
  onDetailFailed: (id: string) => void;
}

export function SubmissionQueue({
  submissions,
  freshIds,
  loading = false,
  expandedId,
  onToggleExpand,
  onDetailComplete,
  onDetailFailed,
}: SubmissionQueueProps) {
  const total      = submissions.length;
  const inProgress = submissions.filter((s) => s.status === "in-progress").length;
  const completed  = submissions.filter((s) => s.status === "completed").length;

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!total) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 15000);
    return () => window.clearInterval(t);
  }, [total]);

  return (
    <section className="card">
      <header className="card__header">
        <div className="card__title-group">
          <span className="card__kicker">Step 2</span>
          <h2 className="card__title">Submission queue</h2>
          <p className="card__sub">
            <span>{total}</span> submissions · <span>{inProgress}</span> in progress ·{" "}
            <span>{completed}</span> completed
          </p>
        </div>
      </header>

      {loading ? (
        <div className="queue-empty">
          <div className="queue-empty__title" style={{ color: "var(--portal-text-faint)" }}>
            Loading submissions…
          </div>
        </div>
      ) : total === 0 ? (
        <div className="queue-empty">
          <div className="queue-empty__icon">
            <CalendarBlankIcon />
          </div>
          <div className="queue-empty__title">No submissions yet</div>
          <div className="queue-empty__hint">
            Attach files above and click <strong style={{ color: "var(--portal-text)" }}>Submit</strong> — they&apos;ll appear here.
          </div>
        </div>
      ) : (
        <table className="queue-table">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th>File name</th>
              <th className="col-status">Status</th>
              <th className="col-action"></th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((row) => {
              const iconKind  = isAccepted(row.ext) ? row.ext : "unknown";
              const isDone    = row.status === "completed";
              const isFailed  = row.status === "failed";
              const isExpanded = expandedId === row.id;
              const trackingCode = row.poId ?? row.id;

              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={[
                      freshIds.has(row.id) ? "is-new" : "",
                      "queue-row--expandable",
                    ].join(" ")}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest(".col-action")) return;
                      onToggleExpand(row.id);
                    }}
                  >
                    <td>
                      <div className="queue-id-cell">
                        <span className="queue-toggle" aria-expanded={isExpanded}>
                          <ChevronIcon
                            size={12}
                            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
                          />
                        </span>
                        <span className="queue-id">{row.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="queue-name">
                        <div className={`file-icon file-icon--${iconKind}`}>
                          {row.ext.toUpperCase()}
                        </div>
                        <div className="queue-name__text">
                          <div className="queue-name__primary" title={row.name}>
                            {row.name}
                          </div>
                          <div className="queue-name__sub">
                            {fmtBytes(row.size)} · submitted {relativeTime(row.submittedAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="col-status">
                      <span className={`qstatus ${isDone ? "qstatus--completed" : isFailed ? "qstatus--failed" : "qstatus--inprogress"}`}>
                        <span className="qstatus__dot" />
                        {isDone ? "Completed" : isFailed ? "Failed" : "In progress"}
                      </span>
                    </td>
                    <td className="col-action">
                      {!isFailed && (
                        <Link
                          href={`/po/${encodeURIComponent(trackingCode)}`}
                          className="queue-view-btn"
                          title="View full PO detail"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.status === "in-progress" ? "Track" : "View PO"}
                          <ArrowIcon size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="queue-detail-row">
                      <td colSpan={4}>
                        <PoDetailPanel
                          trackingCode={trackingCode}
                          onComplete={() => onDetailComplete(row.id)}
                          onFailed={() => onDetailFailed(row.id)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
