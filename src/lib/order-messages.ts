import { formatEgp } from "./storefront";

/**
 * Customer-facing order update text, shared by the admin's "Send WhatsApp update" button
 * and the automatic order emails so both always say the same thing.
 */

type Amount = number | { toString(): string };

export type OrderForMessage = {
  orderNumber: string;
  status: string;
  customerName: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingCost: Amount;
  discount: Amount;
  total: Amount;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: { title: string; variantTitle: string | null; quantity: number; total: Amount }[];
};

const amount = (value: Amount) => Number(value.toString());

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

/** Only plain web links are passed on to customers. */
export function safeHttpUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export type StatusCopy = { subject: string; headline: string; message: string };

/** Headline and short explanation for the order's current status. */
export function orderStatusCopy(order: Pick<OrderForMessage, "orderNumber" | "status" | "paymentMethod" | "paymentStatus" | "total">): StatusCopy {
  const n = order.orderNumber;
  const dueOnDelivery = order.paymentMethod === "COD" && order.paymentStatus !== "PAID";
  const payment = dueOnDelivery ? ` You'll pay ${formatEgp(amount(order.total))} in cash when it arrives.` : "";
  switch (order.status) {
    case "PROCESSING":
      return { subject: `We're preparing your order ${n}`, headline: "We're preparing your order", message: `Your pieces for order ${n} are being carefully prepared and packed.${payment}` };
    case "SHIPPED":
      return { subject: `Your order ${n} is on its way`, headline: "Your order is on its way", message: `Order ${n} has left our studio and is on its way to you.${payment}` };
    case "DELIVERED":
      return { subject: `Your order ${n} has arrived`, headline: "Your order has arrived", message: `Order ${n} has been delivered. We hope you love your pieces — thank you for shopping with Talié.` };
    case "CANCELLED":
    case "REFUNDED":
      return { subject: `Your order ${n} was cancelled`, headline: "Your order was cancelled", message: `Order ${n} has been cancelled. If this is unexpected, just reply and we'll help.` };
    default:
      return { subject: `Thank you for your order ${n}`, headline: "Thank you for your order", message: `We've received order ${n} and we're getting it ready.${payment}` };
  }
}

function itemLines(order: OrderForMessage) {
  return order.items.map((item) => `• ${item.quantity} × ${item.title}${item.variantTitle ? ` (${item.variantTitle})` : ""} — ${formatEgp(amount(item.total))}`);
}

/** Plain-text update the admin can send on WhatsApp in one click. */
export function buildWhatsAppOrderMessage(order: OrderForMessage, orderUrl: string) {
  const copy = orderStatusCopy(order);
  const tracking = order.status === "SHIPPED" && order.trackingNumber
    ? ["", `Tracking number: ${order.trackingNumber}`, ...(safeHttpUrl(order.trackingUrl) ? [`Track it here: ${safeHttpUrl(order.trackingUrl)}`] : [])]
    : [];
  return [
    `Hello ${firstName(order.customerName)} 🤍`,
    "",
    `*${copy.headline}*`,
    copy.message,
    ...tracking,
    "",
    "Your order:",
    ...itemLines(order),
    `Delivery: ${amount(order.shippingCost) ? formatEgp(amount(order.shippingCost)) : "Free"}`,
    ...(amount(order.discount) > 0 ? [`Discount: −${formatEgp(amount(order.discount))}`] : []),
    `*Total: ${formatEgp(amount(order.total))}*`,
    "",
    `View your order: ${orderUrl}`,
    "",
    "— Talié",
  ].join("\n");
}

/**
 * Turns a customer phone number into the international digits WhatsApp expects.
 * Egyptian mobiles may be typed as 01XXXXXXXXX, 1XXXXXXXXX, +201XXXXXXXXX or 00201XXXXXXXXX.
 */
export function toWhatsAppNumber(phone: string | null | undefined) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^01[0125]\d{8}$/.test(digits)) digits = `2${digits}`;
  else if (/^1[0125]\d{8}$/.test(digits)) digits = `20${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

export function whatsAppLink(phone: string | null | undefined, text?: string) {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

/** The automatic order-update email (HTML + plain text), in the same style as the password email. */
export function buildOrderEmail(order: OrderForMessage, orderUrl: string) {
  const copy = orderStatusCopy(order);
  const trackingUrl = order.status === "SHIPPED" ? safeHttpUrl(order.trackingUrl) : null;
  const showTracking = order.status === "SHIPPED" && Boolean(order.trackingNumber);
  const name = firstName(order.customerName);

  const text = [
    `Hello ${name},`,
    "",
    copy.message,
    ...(showTracking ? ["", `Tracking number: ${order.trackingNumber}`, ...(trackingUrl ? [`Track your parcel: ${trackingUrl}`] : [])] : []),
    "",
    "Your order:",
    ...itemLines(order),
    `Delivery: ${amount(order.shippingCost) ? formatEgp(amount(order.shippingCost)) : "Free"}`,
    ...(amount(order.discount) > 0 ? [`Discount: −${formatEgp(amount(order.discount))}`] : []),
    `Total: ${formatEgp(amount(order.total))}`,
    "",
    `View your order: ${orderUrl}`,
    "",
    "— Talié",
  ].join("\n");

  const rows = order.items.map((item) => `<tr><td style="padding:8px 0;font-size:14px;line-height:1.5">${item.quantity} × ${escapeHtml(item.title)}${item.variantTitle ? `<br><span style="color:#735f59;font-size:12px">${escapeHtml(item.variantTitle)}</span>` : ""}</td><td align="right" style="padding:8px 0;font-size:14px;white-space:nowrap">${escapeHtml(formatEgp(amount(item.total)))}</td></tr>`).join("");
  const summary = [
    ["Delivery", amount(order.shippingCost) ? formatEgp(amount(order.shippingCost)) : "Free"],
    ...(amount(order.discount) > 0 ? [["Discount", `−${formatEgp(amount(order.discount))}`]] : []),
  ].map(([label, value]) => `<tr><td style="padding:4px 0;font-size:14px;color:#735f59">${escapeHtml(label)}</td><td align="right" style="padding:4px 0;font-size:14px">${escapeHtml(value)}</td></tr>`).join("");
  const trackingBlock = showTracking
    ? `<p style="margin:0 0 24px;padding:14px 16px;background:#f5eee7;font-size:14px;line-height:1.6">Tracking number: <strong>${escapeHtml(order.trackingNumber ?? "")}</strong>${trackingUrl ? `<br><a href="${escapeHtml(trackingUrl)}" style="color:#741f2c">Track your parcel</a>` : ""}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5eee7;color:#2d1718;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.message)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5eee7;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf5;border:1px solid #dbc8b7">
          <tr><td style="padding:40px">
            <p style="margin:0 0 26px;color:#741f2c;font-family:Georgia,serif;font-size:34px;letter-spacing:2px">Talié</p>
            <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-weight:500;line-height:1.2">${escapeHtml(copy.headline)}</h1>
            <p style="margin:0 0 12px;font-size:16px;line-height:1.7">Hello ${escapeHtml(name)},</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7">${escapeHtml(copy.message)}</p>
            ${trackingBlock}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #dbc8b7;border-bottom:1px solid #dbc8b7;margin:0 0 12px">${rows}</table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">${summary}<tr><td style="padding:8px 0 0;font-size:16px;font-weight:700">Total</td><td align="right" style="padding:8px 0 0;font-size:16px;font-weight:700">${escapeHtml(formatEgp(amount(order.total)))}</td></tr></table>
            <p style="margin:0 0 30px"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#741f2c;color:#ffffff;padding:14px 24px;text-decoration:none;font-size:15px;font-weight:700">View your order</a></p>
            <p style="margin:0;color:#735f59;font-size:13px;line-height:1.7">Order ${escapeHtml(order.orderNumber)} · Questions? Just reply to this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject: copy.subject, text, html };
}
