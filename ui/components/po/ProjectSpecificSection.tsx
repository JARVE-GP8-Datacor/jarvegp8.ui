import { PmmProjectSection } from "./PmmProjectSection";
import { RenovProjectSection } from "./RenovProjectSection";

// Typed shapes for each project's project_specific block.
// These mirror the backend types — kept here to avoid importing BE types into the FE.

export interface PmmMappingContext {
  supplier_code?: string;
  organization_unit?: string;
  warehouse?: string;
  purchase_order_type?: string;
  shipping_method?: string;
  pmm_payment_terms?: string;
  commercial_terms?: string;
}

export interface RenovMappingContext {
  po_channel?: string;
  invoice_to?: "partner" | "end_user" | "";
  licensed_product?: string;
  license_start_date?: string;
  license_end_date?: string;
  reseller_name?: string;
  end_user_name?: string;
  quote_number?: string;
  payment_schedule?: string;
  tax_exempt?: boolean;
}

interface Props {
  projectCode: string;
  projectSpecific: Record<string, unknown>;
  onChange: (key: string, val: string) => void;
}

export function ProjectSpecificSection({ projectCode, projectSpecific, onChange }: Props) {
  const code = projectCode.toUpperCase();

  if (code === "RENOV") {
    return (
      <div className="card">
        <header className="card__header">
          <h2 className="card__title">Renovations Info</h2>
        </header>
        <RenovProjectSection
          data={projectSpecific as RenovMappingContext}
          onChange={onChange}
        />
      </div>
    );
  }

  if (code === "PMM") {
    return (
      <div className="card">
        <header className="card__header">
          <h2 className="card__title">PMM Info</h2>
        </header>
        <PmmProjectSection
          data={projectSpecific as PmmMappingContext}
          onChange={onChange}
        />
      </div>
    );
  }

  // Generic fallback for projects without a typed section
  const entries = Object.entries(projectSpecific);
  if (entries.length === 0) return null;

  return (
    <div className="card">
      <header className="card__header">
        <h2 className="card__title">Project Info</h2>
      </header>
      <div className="pod-field-grid">
        {entries.map(([k, v]) => (
          <div key={k} className="pod-field">
            <div className="pod-field__label">
              {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
            <input
              type="text"
              className="pod-field__input"
              value={String(v ?? "")}
              onChange={(e) => onChange(k, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
