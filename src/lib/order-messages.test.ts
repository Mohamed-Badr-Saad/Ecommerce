import { describe, expect, it } from "vitest";

import { buildOrderEmail, buildWhatsAppOrderMessage, orderStatusCopy, toWhatsAppNumber, whatsAppLink } from "./order-messages";

const order = {
  orderNumber: "TL-261002-ABC123",
  status: "SHIPPED",
  customerName: "Mariam Hassan",
  paymentMethod: "COD",
  paymentStatus: "UNPAID",
  shippingCost: 85,
  discount: 0,
  total: 2275,
  trackingNumber: "BOSTA-998877",
  trackingUrl: "https://bosta.co/track/998877",
  items: [{ title: "Safa Draped Abaya", variantTitle: "Oxblood / M", quantity: 1, total: 2190 }],
};

describe("order update messages", () => {
  it("turns Egyptian mobile numbers into WhatsApp's international format", () => {
    expect(toWhatsAppNumber("01012345678")).toBe("201012345678");
    expect(toWhatsAppNumber("+20 101 234 5678")).toBe("201012345678");
    expect(toWhatsAppNumber("00201012345678")).toBe("201012345678");
    expect(toWhatsAppNumber("1012345678")).toBe("201012345678");
    expect(toWhatsAppNumber("123")).toBeNull();
    expect(whatsAppLink("01012345678", "Hi & bye")).toBe("https://wa.me/201012345678?text=Hi%20%26%20bye");
  });

  it("writes a shipped WhatsApp update with tracking, items and the order link", () => {
    const text = buildWhatsAppOrderMessage(order, "https://shop.example/order-confirmation/TL-261002-ABC123");
    expect(text).toContain("Hello Mariam");
    expect(text).toContain("Your order is on its way");
    expect(text).toContain("Tracking number: BOSTA-998877");
    expect(text).toContain("https://bosta.co/track/998877");
    expect(text).toContain("1 × Safa Draped Abaya (Oxblood / M)");
    expect(text).toContain("https://shop.example/order-confirmation/TL-261002-ABC123");
  });

  it("mentions cash on delivery only while it is still unpaid", () => {
    expect(orderStatusCopy({ ...order, status: "CONFIRMED" }).message).toMatch(/in cash when it arrives/);
    expect(orderStatusCopy({ ...order, status: "DELIVERED", paymentStatus: "PAID" }).message).not.toMatch(/in cash/);
  });

  it("escapes customer-provided text in the email HTML", () => {
    const email = buildOrderEmail({ ...order, customerName: '<b onclick="x">Mariam</b>', trackingUrl: "javascript:alert(1)" }, "https://shop.example/o");
    expect(email.subject).toBe("Your order TL-261002-ABC123 is on its way");
    expect(email.html).not.toContain("<b onclick");
    expect(email.html).not.toContain("javascript:");
    expect(email.text).toContain("Tracking number: BOSTA-998877");
  });
});
