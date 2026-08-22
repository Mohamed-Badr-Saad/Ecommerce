import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const PAYMOB_BASE_URL = "https://accept.paymob.com";

const paymobConfigSchema = z.object({
  secretKey: z.string().min(1),
  publicKey: z.string().min(1),
  hmacSecret: z.string().min(1),
  integrationId: z.coerce.number().int().positive(),
  callbackBaseUrl: z.url(),
});

const intentionResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  intention_order_id: z.union([z.string(), z.number()]),
  client_secret: z.string().min(1),
  status: z.string().optional(),
  confirmed: z.boolean().optional(),
});

export type PaymobIntentionInput = {
  amountCents: number;
  orderNumber: string;
  checkoutToken: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  address: { apartment?: string | null; street: string; city: string; governorate: string; postalCode?: string | null };
  items: { name: string; amountCents: number; description?: string; quantity: number }[];
};

export class PaymobError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "PaymobError";
  }
}

function getPaymobConfig() {
  return paymobConfigSchema.parse({
    secretKey: process.env.PAYMOB_SECRET_KEY,
    publicKey: process.env.PAYMOB_PUBLIC_KEY,
    hmacSecret: process.env.PAYMOB_HMAC_SECRET,
    integrationId: process.env.PAYMOB_INTEGRATION_ID,
    callbackBaseUrl: process.env.PAYMOB_CALLBACK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
  });
}

export async function createPaymobIntention(input: PaymobIntentionInput) {
  const config = getPaymobConfig();
  const callbackBaseUrl = config.callbackBaseUrl.replace(/\/$/, "");
  const returnUrl = new URL("/payment/return", callbackBaseUrl);
  returnUrl.searchParams.set("orderNumber", input.orderNumber);
  returnUrl.searchParams.set("token", input.checkoutToken);

  const response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
    method: "POST",
    headers: { Authorization: `Token ${config.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "EGP",
      payment_methods: [config.integrationId],
      items: input.items.map((item) => ({
        name: item.name,
        amount: item.amountCents,
        description: item.description ?? item.name,
        quantity: item.quantity,
      })),
      billing_data: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
        phone_number: input.customer.phone,
        apartment: input.address.apartment || "NA",
        floor: "NA",
        street: input.address.street,
        building: "NA",
        shipping_method: "NA",
        postal_code: input.address.postalCode || "NA",
        city: input.address.city,
        state: input.address.governorate,
        country: "EGY",
      },
      extras: { order_number: input.orderNumber },
      special_reference: input.orderNumber,
      expiration: 3600,
      notification_url: `${callbackBaseUrl}/api/payments/paymob/webhook`,
      redirection_url: returnUrl.toString(),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new PaymobError("Paymob rejected the payment request.", response.status);
  const parsed = intentionResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new PaymobError("Paymob returned an unexpected response.");

  return {
    intentionId: String(parsed.data.id),
    intentionOrderId: String(parsed.data.intention_order_id),
    checkoutUrl: `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(config.publicKey)}&clientSecret=${encodeURIComponent(parsed.data.client_secret)}`,
    metadata: {
      id: String(parsed.data.id),
      intentionOrderId: String(parsed.data.intention_order_id),
      status: parsed.data.status ?? "intended",
      confirmed: parsed.data.confirmed ?? false,
    },
  };
}

const hmacPaths = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
  "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
  "is_standalone_payment", "is_voided", "order.id", "owner", "pending", "source_data.pan",
  "source_data.sub_type", "source_data.type", "success",
] as const;

function valueAtPath(object: Record<string, unknown>, path: string) {
  let value: unknown = object;
  for (const segment of path.split(".")) {
    if (typeof value !== "object" || value === null || !(segment in value)) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

export function verifyPaymobTransactionHmac(object: Record<string, unknown>, receivedHmac: string) {
  if (!/^[a-f\d]{128}$/i.test(receivedHmac)) return false;
  const values = hmacPaths.map((path) => valueAtPath(object, path));
  if (values.some((value) => value === undefined)) return false;
  const hmacSecret = z.string().min(1).parse(process.env.PAYMOB_HMAC_SECRET);
  const computed = createHmac("sha512", hmacSecret)
    .update(values.map(String).join(""))
    .digest("hex");
  return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(receivedHmac.toLowerCase(), "hex"));
}

export function getPaymobIntegrationId() {
  return getPaymobConfig().integrationId;
}

export function egpToCents(value: number) {
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new PaymobError("The payment amount is invalid.");
  return cents;
}
