import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_BASE =
  `${process.env.UPSTREAM_API ?? "https://eldercare-reflex-companion.ngrok-free.dev/api/po"}/`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${UPSTREAM_BASE}${encodeURIComponent(id)}`, {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.text();

  const res = await fetch(`${UPSTREAM_BASE}${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "ngrok-skip-browser-warning": "true",
      "X-Tenant-ID": process.env.TENANT_ID ?? "demo",
      "Content-Type": "application/json",
    },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
