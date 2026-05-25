import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PO Form · JARVE GP8 Portal",
};

export default function PoFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
