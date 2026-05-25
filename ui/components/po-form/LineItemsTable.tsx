"use client";

import { formatCurrency, type PoLineItem } from "@/lib/po-form-data";

interface LineItemsTableProps {
  items: PoLineItem[];
  onChange: (index: number, patch: Partial<PoLineItem>) => void;
}

export function LineItemsTable({ items, onChange }: LineItemsTableProps) {
  const subtotal = items.reduce((sum, it) => sum + it.extendedPrice, 0);

  return (
    <table className="lines-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Description</th>
          <th className="num">Qty</th>
          <th>UOM</th>
          <th className="num">Unit price</th>
          <th className="num">Extended</th>
          <th>Warehouse</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, idx) => (
          <tr key={it.sequenceNumber}>
            <td className="seq">{it.sequenceNumber}</td>
            <td>
              <input className="cell-input is-mono" value={it.itemNumber} onChange={(e) => onChange(idx, { itemNumber: e.target.value })} />
            </td>
            <td>
              <input className="cell-input" value={it.itemDescription} onChange={(e) => onChange(idx, { itemDescription: e.target.value })} />
            </td>
            <td>
              <input className="cell-input is-num" value={it.orderQuantity.toFixed(2)} onChange={(e) => onChange(idx, { orderQuantity: Number(e.target.value) || 0 })} />
            </td>
            <td>
              <input className="cell-input" value={it.orderUOM} onChange={(e) => onChange(idx, { orderUOM: e.target.value })} />
            </td>
            <td>
              <input
                className="cell-input is-num"
                value={formatCurrency(it.unitPrice)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^\d.]/g, "")) || 0;
                  onChange(idx, { unitPrice: n });
                }}
              />
            </td>
            <td className="computed">{formatCurrency(it.extendedPrice)}</td>
            <td>
              <input className="cell-input is-mono" value={it.warehouse} onChange={(e) => onChange(idx, { warehouse: e.target.value })} />
            </td>
            <td>
              <input className="cell-input" type="date" value={it.requiredDate} onChange={(e) => onChange(idx, { requiredDate: e.target.value })} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={6} className="label">Subtotal</td>
          <td className="num">{formatCurrency(subtotal)}</td>
          <td colSpan={2}></td>
        </tr>
      </tfoot>
    </table>
  );
}
