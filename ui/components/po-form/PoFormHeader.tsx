import { DatacorWordmark } from "../DatacorWordmark";

interface PoFormHeaderProps {
  onClose: () => void;
  onPrint: () => void;
}

export function PoFormHeader({ onClose, onPrint }: PoFormHeaderProps) {
  return (
    <header className="popup-header">
      <div className="popup-header__left">
        <DatacorWordmark />
        <span className="popup-header__divider" />
        <span className="popup-header__product">Purchase order</span>
      </div>
      <div className="popup-header__right">
        <button className="btn-ghost" type="button" onClick={onPrint}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print
        </button>
        <button className="btn-ghost" type="button" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Close
        </button>
      </div>
    </header>
  );
}
