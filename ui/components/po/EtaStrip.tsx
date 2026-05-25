import { ClockIcon } from "../Icon";
import type { PoSummary } from "@/lib/po-types";

interface EtaStripProps {
  eta: PoSummary["eta"];
}

export function EtaStrip({ eta }: EtaStripProps) {
  return (
    <section className="eta">
      <svg className="eta__chev" viewBox="0 0 240 200" aria-hidden="true">
        <polygon
          points="160,0 240,0 200,50 120,100 200,150 240,200 160,200 80,100"
          fill="#FFC517"
          opacity="0.75"
        />
      </svg>
      <div className="eta__icon">
        <ClockIcon size={22} />
      </div>
      <div className="eta__copy">
        <div className="eta__kicker">Expected next step</div>
        <div className="eta__msg">
          {eta.message} <em>{eta.highlight}</em> · response due May 26
        </div>
      </div>
      <div className="eta__divider" />
      <div className="eta__stat">
        <div className="eta__stat-value">{eta.progress}</div>
        <div className="eta__stat-label">{eta.progressLabel}</div>
      </div>
    </section>
  );
}
