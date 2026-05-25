import { NextResponse } from "next/server";

const UPSTREAM = "https://eldercare-reflex-companion.ngrok-free.dev/api/po/";

export async function GET() {
  const res = await fetch(UPSTREAM, {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
