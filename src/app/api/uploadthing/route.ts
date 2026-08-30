import { NextResponse } from "next/server";

function removed() {
  return NextResponse.json({ error: "Media uploads have moved to Supabase Storage." }, { status: 410 });
}

export const GET = removed;
export const POST = removed;
