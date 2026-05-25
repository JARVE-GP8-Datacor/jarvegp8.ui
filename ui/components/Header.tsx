"use client";

import Link from "next/link";
import type { CategoryId } from "@/lib/types";
import { ChevronIcon, FilterIcon, SearchIcon, XIcon } from "./Icon";
import { DatacorWordmark } from "./DatacorWordmark";
import { FilterMenu } from "./FilterMenu";

interface HeaderProps {
  query: string;
  setQuery: (q: string) => void;
  category: CategoryId;
  setCategory: (c: CategoryId) => void;
  filterOpen: boolean;
  setFilterOpen: (fn: (o: boolean) => boolean) => void;
  closeFilter: () => void;
  pinnedOnly: boolean;
  setPinnedOnly: (v: boolean) => void;
  showFilter?: boolean;
}

export function Header({
  query,
  setQuery,
  category,
  setCategory,
  filterOpen,
  setFilterOpen,
  closeFilter,
  pinnedOnly,
  setPinnedOnly,
  showFilter = true,
}: HeaderProps) {
  const filterCount = (category !== "all" ? 1 : 0) + (pinnedOnly ? 1 : 0);

  return (
    <header className="portal-header">
      <div className="portal-header__left">
        <Link href="/" aria-label="Go to portal home">
          <DatacorWordmark />
        </Link>
        <span className="portal-header__divider" />
        <span className="portal-header__product">JARVE Portal</span>
      </div>

      <div className="portal-header__search">
        <SearchIcon size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search applications, documents, support…"
          aria-label="Search"
        />
        {query && (
          <button
            className="portal-header__search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear"
          >
            <XIcon />
          </button>
        )}
        <kbd className="portal-header__kbd">⌘K</kbd>
      </div>

      <div className="portal-header__right">
        {showFilter && (
          <div className="filter-wrap">
            <button
              className={`btn-ghost ${filterCount ? "is-active" : ""}`}
              onClick={() => setFilterOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={filterOpen}
            >
              <FilterIcon />
              <span>Filter</span>
              {filterCount > 0 && <span className="filter-pill">{filterCount}</span>}
              <ChevronIcon />
            </button>
            {filterOpen && (
              <FilterMenu
                category={category}
                setCategory={setCategory}
                pinnedOnly={pinnedOnly}
                setPinnedOnly={setPinnedOnly}
                onClose={closeFilter}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
