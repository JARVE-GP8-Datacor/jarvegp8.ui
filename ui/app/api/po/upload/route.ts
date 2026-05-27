import { NextRequest, NextResponse } from "next/server";

const UPSTREAM =
  `${process.env.UPSTREAM_API ?? "https://eldercare-reflex-companion.ngrok-free.dev/api/po"}/upload`;

export async function POST(req: NextRequest) {
  const body = await req.formData();

  const res = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "ngrok-skip-browser-warning": "true" },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
