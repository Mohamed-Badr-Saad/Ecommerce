import { timingSafeEqual } from "node:crypto";

import { releaseExpiredPaymentReservations } from "@/lib/reservations";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !provided) return false;
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: "Reservation cleanup is not configured." }, { status: 503 });
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const released = await releaseExpiredPaymentReservations();
  return Response.json({ ok: true, released });
}
