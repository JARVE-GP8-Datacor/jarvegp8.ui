"use client";

import type { Product, ViewMode } from "@/lib/types";
import { GridIcon, ListIcon, PinIcon } from "./Icon";
import { ProductRow } from "./ProductRow";
import { ProductTile } from "./ProductTile";

interface ProductGridProps {
  products: Product[];
  view: ViewMode;
  setView: (v: ViewMode) => void;
  onLaunch: (p: Product) => void;
  onTogglePin: (id: string) => void;
}

export function ProductGrid({
  products,
  view,
  setView,
  onLaunch,
  onTogglePin,
}: ProductGridProps) {
  const pinned = products.filter((p) => p.pinned);
  const others = products.filter((p) => !p.pinned);

  return (
    <main className="grid-area">
      <div className="grid-area__header">
        <div className="grid-area__title">
          <h2>My applications</h2>
        </div>
        <div className="grid-area__tools">
          <div className="view-toggle" role="tablist">
            <button
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              aria-label="Grid"
            >
              <GridIcon />
            </button>
            <button
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
              aria-label="List"
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <>
          {pinned.length > 0 && (
            <>
              <div className="grid-section">
                <span><PinIcon filled /> Pinned</span>
                <span className="grid-section__count">{pinned.length}</span>
              </div>
              <div className="tiles">
                {pinned.map((p) => (
                  <ProductTile key={p.id} product={p} onLaunch={onLaunch} onTogglePin={onTogglePin} />
                ))}
              </div>
            </>
          )}
          {others.length > 0 && (
            <>
              <div className="grid-section">
                <span>All applications</span>
                <span className="grid-section__count">{others.length}</span>
              </div>
              <div className="tiles">
                {others.map((p) => (
                  <ProductTile key={p.id} product={p} onLaunch={onLaunch} onTogglePin={onTogglePin} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="list">
          <div className="list__head">
            <span>Application</span>
            <span>Category</span>
            <span>Last used</span>
            <span>Version</span>
            <span />
            <span />
          </div>
          {products.map((p) => (
            <ProductRow key={p.id} product={p} onLaunch={onLaunch} onTogglePin={onTogglePin} />
          ))}
        </div>
      )}
    </main>
  );
}
