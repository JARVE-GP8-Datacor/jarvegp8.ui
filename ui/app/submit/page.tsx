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
  type SubmissionStatus,
} from "@/lib/submit-types";
import type { CategoryId } from "@/lib/types";

const PO_API_BASE = "/api/po/";
const NGROK_HEADERS = {};

function mapApiSubmission(r: Record<string, unknown>): Submission {
  const name = String(r.original_filename ?? r.filename ?? r.file_name ?? r.name ?? "document.pdf");
  const rawStatus = String(r.status ?? "").toUpperCase();
  const status: SubmissionStatus =
    rawStatus === "INTERPRETING" || rawStatus === "UPLOADING" || rawStatus === "PROCESSING"
      ? "in-progress"
      : rawStatus === "FAILED" || rawStatus === "ERROR"
      ? "failed"
      : "completed"; // PENDING_REVIEW and anything else = processed/completed
  return {
    id: String(r.tracking_code ?? r._id ?? r.id ?? r.submission_id ?? uid()),
    name,
    size: Number(r.size ?? r.file_size ?? 0),
    ext: getExt(name) || "pdf",
    status,
    submittedAt: r.created_at
      ? new Date(String(r.created_at)).getTime()
      : r.timestamp
      ? Number(r.timestamp) * 1000
      : Date.now(),
  };
}

export default function SubmitPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const [productId, setProductId] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [pendingFile, setPendingFile] = useState<StagedFile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const seqRef = useRef(1);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setProductId(new URLSearchParams(window.location.search).get("product"));
  }, []);

  const fetchQueue = (opts: { initial?: boolean } = {}) =>
    fetch(PO_API_BASE, { headers: NGROK_HEADERS })
      .then((res) => res.json())
      .then((data: unknown) => {
        const list: unknown[] = Array.isArray(data)
          ? data
          : Array.isArray((data as Record<string, unknown>).data)
          ? (data as Record<string, unknown>).data as unknown[]
          : Array.isArray((data as Record<string, unknown>).submissions)
          ? (data as Record<string, unknown>).submissions as unknown[]
          : [];
        const fetched = list.map((item) => mapApiSubmission(item as Record<string, unknown>));
        setSubmissions((prev) => {
          if (opts.initial) return fetched;
          // merge: update existing rows + prepend genuinely new ones
          const fetchedMap = new Map(fetched.map((s) => [s.id, s]));
          const updated = prev.map((s) => fetchedMap.get(s.id) ?? s);
          const existingIds = new Set(prev.map((s) => s.id));
          const newRows = fetched.filter((s) => !existingIds.has(s.id));
          return [...newRows, ...updated];
        });
      })
      .catch(() => { /* silent — keep current state */ });

  useEffect(() => {
    fetchQueue({ initial: true }).finally(() => setQueueLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (productId !== "pennentmill") return;
    const t = window.setInterval(() => fetchQueue(), 5000);
    return () => window.clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

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
      fileRef: f,
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
    const f = staged.find((s) => s.valid);
    if (!f) return;

    const subId = formatSubmissionId(seqRef.current);
    seqRef.current += 1;

    const newSubmission: Submission = {
      id: subId,
      name: f.name,
      size: f.size,
      ext: f.ext,
      status: "in-progress",
      submittedAt: Date.now(),
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setFreshIds(new Set([subId]));
    const clearHighlight = setTimeout(() => setFreshIds(new Set()), 500);
    completionTimersRef.current.push(clearHighlight);
    setStaged([]);
    showToast("File submitted — uploading…");

    const body = new FormData();
    body.append("file", f.name);
    if (productId === "pennentmill") {
      body.append("project_code", "pmm");
    }

    fetch(`${PO_API_BASE}upload`, {
      method: "POST",
      headers: NGROK_HEADERS,
      body,
    })
      .then((res) => {
        const status: Submission["status"] = res.ok ? "completed" : "failed";
        setSubmissions((prev) =>
          prev.map((s) => (s.id === subId ? { ...s, status } : s))
        );
        if (res.ok) showToast("Upload complete");
        else showToast(`Upload failed · server returned ${res.status}`);
      })
      .catch(() => {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === subId ? { ...s, status: "failed" } : s))
        );
        showToast("Upload failed · network error");
      });
  }, [staged, showToast, productId]);

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

        <SubmissionQueue submissions={submissions} freshIds={freshIds} loading={queueLoading} />
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
