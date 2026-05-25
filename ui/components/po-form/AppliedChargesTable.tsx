import { formatCurrency, type AppliedCharge } from "@/lib/po-form-data";

interface AppliedChargesTableProps {
  charges: AppliedCharge[];
}

export function AppliedChargesTable({ charges }: AppliedChargesTableProps) {
  return (
    <table className="compact-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Description</th>
          <th>Assign</th>
          <th>Distribution</th>
          <th className="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        {charges.map((c, i) => (
          <tr key={i}>
            <td><span className="cost-tag">{c.name}</span></td>
            <td>{c.type}</td>
            <td>{c.description}</td>
            <td>{c.assign}</td>
            <td>{c.distribution}</td>
            <td className="num">{formatCurrency(c.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
