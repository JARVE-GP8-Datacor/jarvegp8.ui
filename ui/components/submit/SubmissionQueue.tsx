"use client";

import { useEffect, useState } from "react";
import { ArrowIcon, CalendarBlankIcon } from "../Icon";
import { fmtBytes, isAccepted, relativeTime, type Submission } from "@/lib/submit-types";

interface SubmissionQueueProps {
  submissions: Submission[];
  freshIds: Set<string>;
}

function openPoForm(row: Submission) {
  window.open(
    `/po-form?id=${encodeURIComponent(row.id)}&file=${encodeURIComponent(row.name)}`,
    `po-form-${row.id}`,
    "width=1240,height=900,resizable=yes,scrollbars=yes"
  );
}

export function SubmissionQueue({ submissions, freshIds }: SubmissionQueueProps) {
  const total = submissions.length;
  const inProgress = submissions.filter((s) => s.status === "in-progress").length;
  const completed = submissions.filter((s) => s.status === "completed").length;

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

      {total === 0 ? (
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
              const iconKind = isAccepted(row.ext) ? row.ext : "unknown";
              const isDone = row.status === "completed";
              return (
                <tr key={row.id} className={freshIds.has(row.id) ? "is-new" : ""}>
                  <td>
                    <span className="queue-id">{row.id}</span>
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
                    <span className={`qstatus ${isDone ? "qstatus--completed" : "qstatus--inprogress"}`}>
                      <span className="qstatus__dot" />
                      {isDone ? "Completed" : "In progress"}
                    </span>
                  </td>
                  <td className="col-action">
                    {isDone && (
                      <button
                        className="queue-view-btn"
                        type="button"
                        onClick={() => openPoForm(row)}
                        title="Open PO form"
                      >
                        View PO
                        <ArrowIcon size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
