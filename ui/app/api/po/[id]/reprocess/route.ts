import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_BASE =
  `${process.env.UPSTREAM_API ?? "https://eldercare-reflex-companion.ngrok-free.dev/api/po"}/`;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`${UPSTREAM_BASE}${encodeURIComponent(id)}/reprocess`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true",
      "X-Tenant-ID": process.env.TENANT_ID ?? "demo",
    },
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
