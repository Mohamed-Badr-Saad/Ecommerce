import { timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Called by Vercel on a schedule (see vercel.json "crons") to keep the free Supabase
 * database from being paused: Supabase pauses free projects after 7 days without database
 * activity, and a few real queries a day prevent that. Only Vercel (which sends the
 * CRON_SECRET as a Bearer token) can call it.
 */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !provided) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(provided);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // A real read from a store table, so it counts as database activity.
    const products = await prisma.product.count({ where: { status: "ACTIVE" } });
    return Response.json({ ok: true, activeProducts: products, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[keep-alive] Database check failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ ok: false }, { status: 500 });
  }
}
