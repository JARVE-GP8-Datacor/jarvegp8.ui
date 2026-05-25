import { CheckIcon, ChevronMotif } from "../Icon";
import type { PoStage, PoSummary } from "@/lib/po-types";

interface StageTrackerProps {
  stages: PoStage[];
  callout: PoSummary["callout"];
  progressPct: number;
}

function StageItem({ stage, index }: { stage: PoStage; index: number }) {
  return (
    <li className={`stage stage--${stage.state}`}>
      <div className="stage__node">
        {stage.state === "done" ? <CheckIcon className="stage__check" /> : index + 1}
      </div>
      <div className="stage__label">
        {stage.label}
        {stage.sublabel && (
          <>
            <br />
            <span className="stage__sublabel">{stage.sublabel}</span>
          </>
        )}
      </div>
      <div className="stage__sub">{stage.sub}</div>
    </li>
  );
}

export function StageTracker({ stages, callout, progressPct }: StageTrackerProps) {
  const doneCount = stages.filter((s) => s.state === "done").length;
  return (
    <section className="card tracker">
      <ChevronMotif className="tracker__chev" />

      <div className="tracker__meta">
        <h2 className="tracker__title">Order progress</h2>
        <div className="tracker__progress">
          <strong>{progressPct}%</strong> · {doneCount} of {stages.length} stages complete
        </div>
      </div>

      <ol className="stages">
        {stages.map((s, i) => (
          <StageItem key={s.key} stage={s} index={i} />
        ))}
      </ol>

      <div className="stage-detail">
        <div className="stage-detail__icon">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <div className="stage-detail__copy">
          <div className="stage-detail__kicker">{callout.kicker}</div>
          <div className="stage-detail__msg">
            {callout.message} <span>· {callout.detail}</span>
          </div>
        </div>
        <div className="stage-detail__cta">
          <button className="btn-ghost" type="button">
            Add note
          </button>
          <button className="btn-primary" type="button">
            Nudge reviewer
          </button>
        </div>
      </div>
    </section>
  );
}
