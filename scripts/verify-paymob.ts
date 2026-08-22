import "dotenv/config";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.PAYMOB_E2E_BASE_URL ?? "http://localhost:3100";
const email = `browser-paymob-${Date.now()}@talie.test`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifacts = path.resolve("artifacts/chunk-6");
const product = await prisma.product.findUniqueOrThrow({
  where: { slug: "safa-draped-abaya" },
  include: { variants: { orderBy: { displayOrder: "asc" }, take: 1 } },
});
const variant = product.variants[0];
let cartToken: string | undefined;

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
});
const page = await context.newPage();

try {
  await mkdir(artifacts, { recursive: true });
  await page.goto(`${baseUrl}/products/safa-draped-abaya`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByText("Added to your bag.").waitFor();
  await page.getByRole("link", { name: "Shopping bag, 1 items" }).click();
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("First name").fill("Paymob");
  await page.getByLabel("Last name").fill("Checkout");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number").fill("01012345678");
  await page.getByLabel("Street address").fill("12 Nile Street");
  await page.getByLabel("City / area").fill("Dokki");
  await page.getByLabel("Governorate").click();
  await page.getByRole("option", { name: "Giza" }).click();
  await page.getByRole("button", { name: "Continue to secure payment" }).click();
  await page.waitForURL(/(?:accept\.paymob\.com\/unifiedcheckout|eg\.checkout\.paymob\.com)/i, { timeout: 30_000 });
  if (await page.getByText("403 Forbidden", { exact: true }).isVisible()) throw new Error("Paymob blocked the automated browser before rendering hosted checkout.");
  await page.screenshot({ path: path.join(artifacts, "paymob-hosted-checkout.png"), fullPage: true });

  const order = await prisma.order.findFirstOrThrow({ where: { customerEmail: email }, include: { payments: true } });
  if (order.paymentStatus !== "PENDING" || !order.reservationExpiresAt || !order.payments[0]?.providerIntentionId) {
    throw new Error("The Paymob order was not reserved and linked to an Intention.");
  }
  console.info(JSON.stringify({ passed: true, orderNumber: order.orderNumber, hostedCheckout: new URL(page.url()).host, screenshot: artifacts }));
} finally {
  const cookies = await context.cookies();
  cartToken = cookies.find((cookie) => cookie.name === "talie_cart")?.value;
  await browser.close();
  await prisma.order.deleteMany({ where: { customerEmail: email } });
  if (cartToken) await prisma.cart.deleteMany({ where: { sessionToken: cartToken } });
  await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: product.stockQuantity } });
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stockQuantity: variant.stockQuantity } });
  await prisma.$disconnect();
}
