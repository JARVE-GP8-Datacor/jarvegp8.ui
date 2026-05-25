"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { LaunchToast } from "@/components/LaunchToast";
import { ProductGrid } from "@/components/ProductGrid";
import { PRODUCTS } from "@/lib/data";
import type { CategoryId, Product, ViewMode } from "@/lib/types";

export default function PortalPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [launching, setLaunching] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (pinnedOnly && !p.pinned) return false;
      if (q) {
        const hay = `${p.name} ${p.tagline} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, query, category, pinnedOnly]);

  const togglePin = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)),
    );
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setPinnedOnly(false);
  };

  return (
    <div className="portal">
      <Header
        query={query}
        setQuery={setQuery}
        category={category}
        setCategory={setCategory}
        filterOpen={filterOpen}
        setFilterOpen={(fn) => setFilterOpen(fn(filterOpen))}
        closeFilter={() => setFilterOpen(false)}
        pinnedOnly={pinnedOnly}
        setPinnedOnly={setPinnedOnly}
      />
      <div className="portal__body">
        <ProductGrid
          products={filtered}
          view={view}
          setView={setView}
          query={query}
          category={category}
          pinnedOnly={pinnedOnly}
          onClearFilters={clearFilters}
          onLaunch={setLaunching}
          onTogglePin={togglePin}
        />
      </div>
      <LaunchToast product={launching} onDismiss={() => setLaunching(null)} />
    </div>
  );
}
