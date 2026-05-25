import { redirect } from "next/navigation";
import { DEFAULT_PO_ID } from "@/lib/po-data";

export default function OrdersIndexPage() {
  redirect(`/orders/${DEFAULT_PO_ID}`);
}
