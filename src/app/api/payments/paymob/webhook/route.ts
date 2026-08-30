import { PaymobWebhookError, processPaymobWebhook } from "@/lib/paymob-webhook";
import { PayloadTooLargeError, readBoundedText } from "@/lib/bounded-body";

const maximumWebhookBytes = 64_000;

export async function POST(request: Request) {
  try {
    const text = await readBoundedText(request, maximumWebhookBytes);
    const result = await processPaymobWebhook(JSON.parse(text), new URL(request.url).searchParams.get("hmac") ?? "");
    return Response.json({ received: true, outcome: result.outcome });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return Response.json({ error: "Payload too large." }, { status: 413 });
    if (error instanceof PaymobWebhookError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[paymob] Webhook processing failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ error: "Callback processing failed." }, { status: 503 });
  }
}
