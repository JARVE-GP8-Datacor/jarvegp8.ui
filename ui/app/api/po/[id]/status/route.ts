import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_BASE =
  `${process.env.UPSTREAM_API ?? "https://eldercare-reflex-companion.ngrok-free.dev/api/po"}/`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await fetch(`${UPSTREAM_BASE}${encodeURIComponent(id)}/status`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        "X-Tenant-ID": process.env.TENANT_ID ?? "demo",
      },
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), upstream: UPSTREAM_BASE },
      { status: 502 }
    );
  }
}
