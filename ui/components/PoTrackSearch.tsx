"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircleIcon, HashIcon, SearchIcon, XIcon } from "./Icon";
import { PO_RECORDS } from "@/lib/po-data";

export function PoTrackSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = value.trim().toUpperCase();
    if (!id) {
      setError("Enter a tracking ID to search.");
      return;
    }
    if (id.length !== 10) {
      setError("Tracking IDs are exactly 10 characters. Check and try again.");
      return;
    }
    if (!PO_RECORDS[id]) {
      setError("No order found with that ID.");
      return;
    }
    router.push(`/orders/${id}`);
  };

  return (
    <section className="track-card">
      <svg className="track-card__chev" viewBox="0 0 120 120" aria-hidden="true">
        <polygon
          points="60,0 120,0 90,30 30,60 90,90 120,120 60,120 0,60"
          fill="currentColor"
        />
      </svg>

      <div className="track-card__copy">
        <div className="track-card__kicker">Track an order</div>
        <div className="track-card__title">Look up a PO by tracking ID</div>
        <div className="track-card__hint">
          Enter the tracking ID from your confirmation email — e.g.{" "}
          <code>PO-2026-01</code>
        </div>
      </div>

      <form
        className="track-form"
        onSubmit={onSubmit}
        role="search"
        aria-label="Track an order"
      >
        <div className={`track-input ${error ? "is-error" : ""}`}>
          <HashIcon />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder="PO-YYYY-NN"
            aria-label="Tracking ID"
            aria-invalid={error ? "true" : "false"}
            spellCheck={false}
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              className="track-input__clear"
              onClick={() => {
                setValue("");
                setError("");
              }}
              aria-label="Clear"
            >
              <XIcon />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary btn-primary--lg">
          <SearchIcon size={15} />
          Search
        </button>

        {error && (
          <div className="track-error" role="alert">
            <AlertCircleIcon />
            <span>{error}</span>
          </div>
        )}
      </form>
    </section>
  );
}
