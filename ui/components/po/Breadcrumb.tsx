import Link from "next/link";

interface CrumbsProps {
  current: string;
}

export function Breadcrumb({ current }: CrumbsProps) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link href="/">Portal</Link>
      <span className="crumbs__sep">/</span>
      <Link href="/orders">Orders</Link>
      <span className="crumbs__sep">/</span>
      <span className="crumbs__current">{current}</span>
    </nav>
  );
}
