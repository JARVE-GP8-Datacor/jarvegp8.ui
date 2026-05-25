/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";
import { LOGOS } from "@/lib/data";
import type { Product } from "@/lib/types";
import { XIcon } from "./Icon";

interface LaunchToastProps {
  product: Product | null;
  onDismiss: () => void;
}

export function LaunchToast({ product, onDismiss }: LaunchToastProps) {
  useEffect(() => {
    if (!product) return;
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [product, onDismiss]);

  if (!product) return null;
  const logo = LOGOS[product.logo];
  return (
    <div className="toast">
      <div className="toast__logo">
        <img src={logo.src} alt={logo.alt} />
      </div>
      <div className="toast__body">
        <strong>Launching {product.name}…</strong>
        <span>Opening in new tab</span>
      </div>
      <button className="icon-btn" onClick={onDismiss} aria-label="Dismiss">
        <XIcon />
      </button>
    </div>
  );
}
