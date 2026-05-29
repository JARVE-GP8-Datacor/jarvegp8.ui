"use client";

import Link from "next/link";
import { DatacorWordmark } from "./DatacorWordmark";

export function Header() {
  return (
    <header className="portal-header">
      <div className="portal-header__left">
        <Link href="/" aria-label="Go to portal home">
          <DatacorWordmark />
        </Link>
        <span className="portal-header__divider" />
        <span className="portal-header__product">JARVE Portal</span>
      </div>
    </header>
  );
}
