import type { PoSummary } from "./po-types";

export const PO_RECORDS: Record<string, PoSummary> = {
  "PO-2026-01": {
    id: "PO-2026-01",
    vendor: "Vertex Specialty Chemicals",
    amount: "$48,720.00",
    createdBy: "Sarah Chen",
    createdOn: "May 18, 2026",
    requiredBy: "Jun 12, 2026",
    statusLabel: "Under review",
    stages: [
      { key: "received",   label: "PO Received",  sub: "May 18 · 9:42 AM",        state: "done" },
      { key: "review",     label: "Under Review", sub: "In progress · est. 1 day", state: "current" },
      { key: "processing", label: "Processing",   sub: "—",                        state: "upcoming" },
      { key: "invoiced",   label: "Invoiced",     sub: "—",                        state: "upcoming" },
      { key: "completed",  label: "Completed", sublabel: "(Paid)", sub: "—",       state: "upcoming" },
    ],
    eta: {
      message: "Approval review with",
      highlight: "Procurement",
      progress: "2 of 5",
      progressLabel: "Stages complete",
    },
    callout: {
      kicker: "Awaiting · Under review",
      message: "Procurement is verifying pricing and vendor terms.",
      detail: "Reviewer: Marcus Lee · Started 12 hrs ago",
    },
  },
};

export const DEFAULT_PO_ID = "PO-2026-01";
