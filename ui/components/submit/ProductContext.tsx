/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LOGOS, PRODUCTS } from "@/lib/data";

function ProductContextInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const product = PRODUCTS.find((p) => p.id === productId) ?? null;

  if (!product) return null;

  const logo = LOGOS[product.logo];

  return (
    <div className="submit-product">
      <div className="submit-product__logo-wrap">
        <img src={logo.src} alt={logo.alt} className="submit-product__logo" />
      </div>
      <div className="submit-product__info">
        <span className="submit-product__label">Submitting for</span>
        <strong className="submit-product__name">{product.name}</strong>
        <span className="submit-product__tagline">{product.tagline}</span>
      </div>
      <Link href="/" className="submit-product__change">
        Change product
      </Link>
    </div>
  );
}

export function ProductContext() {
  return (
    <Suspense fallback={null}>
      <ProductContextInner />
    </Suspense>
  );
}
