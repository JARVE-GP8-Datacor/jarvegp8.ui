import type { UserDefinedField } from "@/lib/po-form-data";

export function UdfsTable({ fields }: { fields: UserDefinedField[] }) {
  return (
    <table className="compact-table">
      <thead>
        <tr>
          <th>Property name</th>
          <th>Type</th>
          <th>Value</th>
          <th>Level</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f, i) => (
          <tr key={i}>
            <td>{f.propertyName}</td>
            <td>{f.propertyType}</td>
            <td>{f.value}</td>
            <td>{f.level}{f.lineRef ? ` · ${f.lineRef}` : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
