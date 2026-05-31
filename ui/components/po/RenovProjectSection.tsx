import type { RenovMappingContext } from "./ProjectSpecificSection";

interface Props {
  data: RenovMappingContext;
  onChange: (key: string, val: string) => void;
}

export function RenovProjectSection({ data, onChange }: Props) {
  return (
    <div className="pod-field-grid">
      <PodField   label="Licensed Product"   value={data.licensed_product}               onChange={(v) => onChange("licensed_product", v)} />
      <PodField   label="Quote Number"        value={data.quote_number}          mono     onChange={(v) => onChange("quote_number", v)} />
      <PodField   label="License Start"       value={data.license_start_date}    type="date" onChange={(v) => onChange("license_start_date", v)} />
      <PodField   label="License End"         value={data.license_end_date}      type="date" onChange={(v) => onChange("license_end_date", v)} />
      <SelectField
        label="Invoice To"
        value={data.invoice_to ?? ""}
        options={[
          { value: "",         label: "— not set —" },
          { value: "partner",  label: "Partner / Reseller" },
          { value: "end_user", label: "End User" },
        ]}
        onChange={(v) => onChange("invoice_to", v)}
      />
      <PodField   label="Payment Schedule"    value={data.payment_schedule}               onChange={(v) => onChange("payment_schedule", v)} />
      <PodField   label="Reseller Name"       value={data.reseller_name}                  onChange={(v) => onChange("reseller_name", v)} />
      <PodField   label="End User Name"       value={data.end_user_name}                  onChange={(v) => onChange("end_user_name", v)} />
      <PodField   label="PO Channel"          value={data.po_channel}                     onChange={(v) => onChange("po_channel", v)} />
      <CheckField
        label="Tax Exempt"
        checked={data.tax_exempt ?? false}
        onChange={(v) => onChange("tax_exempt", String(v))}
      />
    </div>
  );
}

function PodField({ label, value, mono = false, type = "text", onChange }: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pod-field">
      <div className="pod-field__label">{label}</div>
      <input
        type={type}
        className={`pod-field__input${mono ? " pod-field__input--mono" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="pod-field">
      <div className="pod-field__label">{label}</div>
      <select
        className="pod-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function CheckField({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="pod-field pod-field--check">
      <div className="pod-field__label">{label}</div>
      <input
        type="checkbox"
        className="pod-field__checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
