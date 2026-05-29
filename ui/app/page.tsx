"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { LaunchToast } from "@/components/LaunchToast";
import { PoTrackSearch } from "@/components/PoTrackSearch";
import { ProductGrid } from "@/components/ProductGrid";
import { PRODUCTS } from "@/lib/data";
import type { Product, ViewMode } from "@/lib/types";

export default function PortalPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [launching, setLaunching] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  const togglePin = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)),
    );
  };

  return (
    <div className="portal">
      <Header />
      <div className="portal__body">
        <PoTrackSearch />
        <ProductGrid
          products={products}
          view={view}
          setView={setView}
          onLaunch={setLaunching}
          onTogglePin={togglePin}
        />
      </div>
      <LaunchToast product={launching} onDismiss={() => setLaunching(null)} />
    </div>
  );
}
