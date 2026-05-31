import type { PmmMappingContext } from "./ProjectSpecificSection";

interface Props {
  data: PmmMappingContext;
  onChange: (key: string, val: string) => void;
}

export function PmmProjectSection({ data, onChange }: Props) {
  return (
    <div className="pod-field-grid">
      <PodField label="Supplier Code"      value={data.supplier_code}       mono onChange={(v) => onChange("supplier_code", v)} />
      <PodField label="Organization Unit"  value={data.organization_unit}        onChange={(v) => onChange("organization_unit", v)} />
      <PodField label="Warehouse"          value={data.warehouse}                onChange={(v) => onChange("warehouse", v)} />
      <PodField label="PO Type"            value={data.purchase_order_type}      onChange={(v) => onChange("purchase_order_type", v)} />
      <PodField label="Shipping Method"    value={data.shipping_method}          onChange={(v) => onChange("shipping_method", v)} />
      <PodField label="Payment Terms"      value={data.pmm_payment_terms}        onChange={(v) => onChange("pmm_payment_terms", v)} />
      <PodField label="Commercial Terms"   value={data.commercial_terms}         onChange={(v) => onChange("commercial_terms", v)} />
    </div>
  );
}

function PodField({ label, value, mono = false, onChange }: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pod-field">
      <div className="pod-field__label">{label}</div>
      <input
        type="text"
        className={`pod-field__input${mono ? " pod-field__input--mono" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
