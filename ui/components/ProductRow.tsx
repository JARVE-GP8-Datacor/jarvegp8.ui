/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES, LOGOS } from "@/lib/data";
import type { Product } from "@/lib/types";
import { ArrowIcon, PinIcon } from "./Icon";

interface ProductRowProps {
  product: Product;
  onLaunch: (p: Product) => void;
  onTogglePin: (id: string) => void;
}

export function ProductRow({ product, onTogglePin }: ProductRowProps) {
  const router = useRouter();
  const logo = LOGOS[product.logo];
  const cat = CATEGORIES.find((c) => c.id === product.category);

  return (
    <article className="row" onClick={() => router.push(product.project_code ? `/submit?project_code=${product.project_code}` : `/submit`)}>
      <div className="row__logo">
        <img src={logo.src} alt={logo.alt} />
      </div>
      <div className="row__name">
        <h3>{product.name}</h3>
        <p>{product.tagline}</p>
      </div>
      <div className="row__cat">
        <span className={`tag tag--${product.category}`}>{cat?.label}</span>
      </div>
      <div className="row__used">{product.lastUsed}</div>
      <div className="row__ver">{product.version}</div>
      <button
        className={`row__pin ${product.pinned ? "is-pinned" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(product.id);
        }}
        aria-label={product.pinned ? "Unpin" : "Pin"}
      >
        <PinIcon filled={product.pinned} />
      </button>
      <span className="row__arrow">
        <ArrowIcon />
      </span>
    </article>
  );
}
