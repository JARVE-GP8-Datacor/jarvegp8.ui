/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES, LOGOS } from "@/lib/data";
import type { Product } from "@/lib/types";
import { ArrowIcon, PinIcon } from "./Icon";

interface ProductTileProps {
  product: Product;
  onLaunch: (p: Product) => void;
  onTogglePin: (id: string) => void;
}

export function ProductTile({ product, onTogglePin }: ProductTileProps) {
  const router = useRouter();
  const logo = LOGOS[product.logo];
  const cat = CATEGORIES.find((c) => c.id === product.category);

  return (
    <article className="tile tile--color tile--chevron" onClick={() => router.push(product.project_code ? `/submit?project_code=${product.project_code}` : `/submit`)}>
      <svg className="tile__chev" viewBox="0 0 120 120" aria-hidden="true">
        <polygon points="60,0 120,0 90,30 30,60 90,90 120,120 60,120 0,60" fill="currentColor" />
      </svg>
      <button
        className={`tile__pin ${product.pinned ? "is-pinned" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(product.id);
        }}
        aria-label={product.pinned ? "Unpin" : "Pin"}
        title={product.pinned ? "Unpin" : "Pin"}
      >
        <PinIcon filled={product.pinned} />
      </button>
      <div className="tile__logo-area">
        <img src={logo.src} alt={logo.alt} className="tile__logo-img" />
      </div>
      <div className="tile__body">
        <p className="tile__tagline">{product.tagline}</p>
        <div className="tile__foot">
          <span className={`tag tag--${product.category}`}>{cat?.label ?? product.category}</span>
          {product.status === "new" && <span className="tag tag--new">New</span>}
          <span className="tile__launch">
            <span>Launch</span>
            <ArrowIcon size={12} />
          </span>
        </div>
      </div>
    </article>
  );
}
