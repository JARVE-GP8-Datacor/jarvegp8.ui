export const ACCEPTED_EXTENSIONS = ["pdf", "csv", "xls", "xlsx"] as const;
export type AcceptedExt = (typeof ACCEPTED_EXTENSIONS)[number];

export const ACCEPT_ATTR = [
  ".pdf",
  ".csv",
  ".xls",
  ".xlsx",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

export const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export interface StagedFile {
  id: string;
  name: string;
  size: number;
  ext: string;
  valid: boolean;
  reason: string;
}

export type SubmissionStatus = "in-progress" | "completed";

export interface Submission {
  id: string;
  name: string;
  size: number;
  ext: string;
  status: SubmissionStatus;
  submittedAt: number;
}

export function isAccepted(ext: string): ext is AcceptedExt {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext);
}

export function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

export function fmtBytes(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}

export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  return h + "h ago";
}

let _seq = 0;
export function uid(): string {
  _seq += 1;
  return "f-" + _seq.toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export function formatSubmissionId(seq: number, year = 2026): string {
  return `SUB-${year}-${String(seq).padStart(5, "0")}`;
}
