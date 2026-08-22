import { PaymobWebhookError, processPaymobWebhook } from "@/lib/paymob-webhook";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) return Response.json({ error: "Payload too large." }, { status: 413 });

  try {
    const text = await request.text();
    if (text.length > 64_000) return Response.json({ error: "Payload too large." }, { status: 413 });
    const result = await processPaymobWebhook(JSON.parse(text), new URL(request.url).searchParams.get("hmac") ?? "");
    return Response.json({ received: true, outcome: result.outcome });
  } catch (error) {
    if (error instanceof PaymobWebhookError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[paymob] Webhook processing failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ error: "Callback processing failed." }, { status: 503 });
  }
}
