"use client";

import { useEffect } from "react";
import { CATEGORIES } from "@/lib/data";
import type { CategoryId } from "@/lib/types";
import { CheckIcon, PinIcon } from "./Icon";

interface FilterMenuProps {
  category: CategoryId;
  setCategory: (c: CategoryId) => void;
  pinnedOnly: boolean;
  setPinnedOnly: (v: boolean) => void;
  onClose: () => void;
}

export function FilterMenu({
  category,
  setCategory,
  pinnedOnly,
  setPinnedOnly,
  onClose,
}: FilterMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="menu-scrim" onClick={onClose} />
      <div className="filter-menu" role="menu">
        <div className="filter-menu__title">Show</div>
        <label className="filter-menu__toggle">
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={(e) => setPinnedOnly(e.target.checked)}
          />
          <PinIcon filled={pinnedOnly} />
          <span>Pinned only</span>
        </label>
        <div className="filter-menu__sep" />
        <div className="filter-menu__title">Category</div>
        <ul className="filter-menu__list">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                className={`filter-menu__item ${category === c.id ? "is-selected" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                <span>{c.label}</span>
                {category === c.id && <CheckIcon />}
              </button>
            </li>
          ))}
        </ul>
        <div className="filter-menu__footer">
          <button
            className="link-btn"
            onClick={() => {
              setCategory("all");
              setPinnedOnly(false);
            }}
          >
            Reset
          </button>
          <button className="btn-primary" onClick={onClose}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
