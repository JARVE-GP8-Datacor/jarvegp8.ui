import type { PoSummary } from "@/lib/po-types";

interface PoPageHeaderProps {
  po: PoSummary;
}

export function PoPageHeader({ po }: PoPageHeaderProps) {
  return (
    <header className="po-head">
      <div>
        <div className="po-head__title">
          <h1 className="po-head__num">{po.id}</h1>
          <span className="status-pill">
            <span className="status-pill__dot" />
            {po.statusLabel}
          </span>
        </div>
        <p className="po-head__sub">
          Issued to <strong>{po.vendor}</strong>
          <span className="dot">·</span>
          <strong>{po.amount}</strong>
          <span className="dot">·</span>
          Created {po.createdOn} by {po.createdBy}
          <span className="dot">·</span>
          Required by {po.requiredBy}
        </p>
      </div>
    </header>
  );
}
