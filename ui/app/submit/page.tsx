"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PaperclipIcon, SendIcon } from "@/components/Icon";
import { Dropzone } from "@/components/submit/Dropzone";
import { ProductContext } from "@/components/submit/ProductContext";
import { StagedList } from "@/components/submit/StagedList";
import { SubmissionQueue } from "@/components/submit/SubmissionQueue";
import {
  MAX_BYTES,
  formatSubmissionId,
  getExt,
  isAccepted,
  uid,
  type StagedFile,
  type Submission,
} from "@/lib/submit-types";
import type { CategoryId } from "@/lib/types";

export default function SubmitPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [pendingFile, setPendingFile] = useState<StagedFile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const seqRef = useRef(1);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      completionTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const buildEntry = (f: File): StagedFile => {
    const ext = getExt(f.name);
    const supportedType = isAccepted(ext);
    const withinSize = f.size <= MAX_BYTES;
    const valid = supportedType && withinSize;
    return {
      id: uid(),
      name: f.name,
      size: f.size,
      ext: ext || "unknown",
      valid,
      reason: !supportedType
        ? `Unsupported type · ${ext ? "." + ext : "no extension"}`
        : !withinSize
        ? "Exceeds 25 MB limit"
        : "",
    };
  };

  const commitEntry = useCallback((entry: StagedFile) => {
    setStaged([entry]);
    if (!entry.valid) showToast("File rejected · unsupported type or too large");
  }, [showToast]);

  const addFiles = useCallback(
    (files: FileList) => {
      const f = files[0];
      if (!f) return;
      const entry = buildEntry(f);
      if (staged.length > 0) {
        setPendingFile(entry);
      } else {
        commitEntry(entry);
      }
    },
    [staged.length, commitEntry]
  );

  const removeStaged = useCallback((id: string) => {
    setStaged((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearStaged = useCallback(() => setStaged([]), []);

  const submit = useCallback(() => {
    const valid = staged.filter((s) => s.valid);
    if (valid.length === 0) return;

    const newSubmissions: Submission[] = valid.map((f) => {
      const id = formatSubmissionId(seqRef.current);
      seqRef.current += 1;
      return {
        id,
        name: f.name,
        size: f.size,
        ext: f.ext,
        status: "in-progress",
        submittedAt: Date.now(),
      };
    });

    setSubmissions((prev) => [...newSubmissions.reverse(), ...prev]);
    const newIds = new Set(newSubmissions.map((s) => s.id));
    setFreshIds(newIds);
    const clearHighlight = setTimeout(() => setFreshIds(new Set()), 500);
    completionTimersRef.current.push(clearHighlight);

    newSubmissions.forEach((row) => {
      const delay = 2500 + Math.random() * 2500;
      const t = setTimeout(() => {
        setSubmissions((prev) => prev.map((s) => (s.id === row.id ? { ...s, status: "completed" } : s)));
      }, delay);
      completionTimersRef.current.push(t);
    });

    setStaged((prev) => prev.filter((s) => !s.valid));
    showToast(`${valid.length} file${valid.length === 1 ? "" : "s"} submitted`);
  }, [staged, showToast]);

  const validCount = staged.filter((s) => s.valid).length;
  const totalCount = staged.length;
  let hint: React.ReactNode = "No files attached yet.";
  if (totalCount > 0 && validCount === totalCount) {
    hint = (
      <>
        <strong>{validCount}</strong> file{validCount === 1 ? "" : "s"} ready to submit.
      </>
    );
  } else if (totalCount > 0) {
    hint = (
      <>
        <strong>{validCount}</strong> of <strong>{totalCount}</strong> ready ·{" "}
        {totalCount - validCount} need attention.
      </>
    );
  }

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
        showFilter={false}
      />

      <div className="portal__body">
        <ProductContext />

        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Portal</Link>
          <span className="crumbs__sep">/</span>
          <span className="crumbs__current">Submit POs</span>
        </nav>

        <header className="page-head">
          <h1 className="page-head__title">Submit purchase orders</h1>
          <p className="page-head__sub">
            Attach one or more PO documents and submit them for processing. Each file is queued individually and tracked through completion below.
          </p>
        </header>

        <section className="card">
          <header className="card__header">
            <div className="card__title-group">
              <span className="card__kicker">Step 1</span>
              <h2 className="card__title">Attach PO documents</h2>
              <p className="card__sub">
                Supported file types: PDF, CSV, XLS, XLSX · 25&nbsp;MB max per file
              </p>
            </div>
          </header>

          <Dropzone onFiles={addFiles} />
          <StagedList staged={staged} onRemove={removeStaged} onClear={clearStaged} />

          <div className="attach-actions">
            <div className="attach-actions__hint">{hint}</div>
            <div className="attach-actions__buttons">
              <AttachButton onAttach={addFiles} />
              <button
                className="btn-primary btn-primary--lg"
                type="button"
                disabled={validCount === 0}
                onClick={submit}
              >
                <SendIcon />
                Submit
              </button>
            </div>
          </div>
        </section>

        <SubmissionQueue submissions={submissions} freshIds={freshIds} />
      </div>

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>

      {pendingFile && (
        <div className="replace-overlay" role="dialog" aria-modal="true" aria-labelledby="replace-title">
          <div className="replace-modal">
            <p className="replace-modal__title" id="replace-title">Replace current file?</p>
            <p className="replace-modal__body">
              <strong>{staged[0]?.name}</strong> will be replaced with{" "}
              <strong>{pendingFile.name}</strong>.
            </p>
            <div className="replace-modal__actions">
              <button
                className="btn-ghost"
                onClick={() => setPendingFile(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  commitEntry(pendingFile);
                  setPendingFile(null);
                }}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachButton({ onAttach }: { onAttach: (files: FileList) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv,.xls,.xlsx"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onAttach(e.target.files);
          e.target.value = "";
        }}
      />
      <button className="btn-ghost" type="button" onClick={() => inputRef.current?.click()}>
        <PaperclipIcon />
        Attach files
      </button>
    </>
  );
}
