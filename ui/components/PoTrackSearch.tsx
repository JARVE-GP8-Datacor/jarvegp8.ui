"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircleIcon, HashIcon, SearchIcon, XIcon } from "./Icon";

export function PoTrackSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = value.trim().toUpperCase();
    if (!id) {
      setError("Enter a tracking ID to search.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/po/${encodeURIComponent(id)}/status`);
      if (res.ok) {
        router.push(`/po/${encodeURIComponent(id)}`);
      } else if (res.status === 404) {
        setError("No order found with that ID.");
      } else {
        setError(`Error looking up order (${res.status}).`);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
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
          Enter your tracking ID — e.g. <code>PO-XXXXXXXX</code>
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
            placeholder="PO-XXXXXXXX"
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
        <button type="submit" className="btn-primary btn-primary--lg" disabled={loading}>
          <SearchIcon size={15} />
          {loading ? "Searching…" : "Search"}
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
