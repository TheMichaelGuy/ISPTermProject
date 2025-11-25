// app/api/test/route.ts
import { NextResponse } from "next/server";
import sql from "@/app/lib/db";

export async function GET() {
  const rows = await sql`SELECT NOW()`;
  return NextResponse.json(rows);
}