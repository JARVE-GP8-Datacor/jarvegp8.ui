import { XIcon } from "../Icon";
import { fmtBytes, isAccepted, type StagedFile } from "@/lib/submit-types";

interface StagedListProps {
  staged: StagedFile[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function StagedList({ staged, onRemove, onClear }: StagedListProps) {
  if (staged.length === 0) return null;

  return (
    <div className="staged">
      <div className="staged__head">
        <span className="staged__head-label">
          Staged files · <span>{staged.length}</span>
        </span>
        <button className="link-btn" type="button" onClick={onClear}>
          Clear all
        </button>
      </div>
      <ul className="staged__list">
        {staged.map((f) => {
          const iconKind = isAccepted(f.ext) ? f.ext : "unknown";
          return (
            <li key={f.id} className={`staged-row ${f.valid ? "" : "is-invalid"}`}>
              <div className={`file-icon file-icon--${iconKind}`}>{(f.ext || "?").toUpperCase()}</div>
              <div className="staged-row__meta">
                <div className="staged-row__name" title={f.name}>
                  {f.name}
                </div>
                <div className="staged-row__sub">
                  {f.valid ? `Ready · ${fmtBytes(f.size)}` : f.reason}
                </div>
              </div>
              <div className="staged-row__size">{f.valid ? "" : fmtBytes(f.size)}</div>
              <button
                className="icon-x"
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onRemove(f.id)}
              >
                <XIcon />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
