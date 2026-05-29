import { NextRequest, NextResponse } from "next/server";

const UPSTREAM =
  process.env.UPSTREAM_API ?? "https://eldercare-reflex-companion.ngrok-free.dev/api/po";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();
  const url = qs ? `${UPSTREAM}?${qs}` : UPSTREAM;

  const res = await fetch(url, {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
