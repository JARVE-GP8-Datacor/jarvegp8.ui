import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    UPSTREAM_API: process.env.UPSTREAM_API ?? "(not set)",
    PO_API_URL: process.env.PO_API_URL ?? "(not set)",
    TENANT_ID: process.env.TENANT_ID ?? "(not set)",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
