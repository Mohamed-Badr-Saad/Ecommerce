import "dotenv/config";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.COMMERCE_BASE_URL ?? "http://localhost:3000";
const email = `browser-commerce-${Date.now()}@talie.test`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifacts = path.resolve("artifacts/chunk-5");

const product = await prisma.product.findUniqueOrThrow({
  where: { slug: "safa-draped-abaya" },
  include: { variants: { orderBy: { displayOrder: "asc" }, take: 1 } },
});
const variant = product.variants[0];
let cartToken: string | undefined;
let orderNumber: string | undefined;
const errors: string[] = [];

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await mkdir(artifacts, { recursive: true });
  await page.goto(`${baseUrl}/products/safa-draped-abaya`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByText("Added to your bag.").waitFor();
  await page.getByRole("link", { name: "Shopping bag, 1 items" }).click();
  await page.getByRole("heading", { name: "Shopping bag" }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "cart-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 500, height: 900 });
  await page.screenshot({ path: path.join(artifacts, "cart-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByRole("heading", { name: "Checkout" }).waitFor();

  await page.getByLabel("First name").fill("Browser");
  await page.getByLabel("Last name").fill("Checkout");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number").fill("01012345678");
  await page.getByLabel("Street address").fill("12 Nile Street");
  await page.getByLabel("City / area").fill("Dokki");
  await page.getByLabel("Governorate").click();
  await page.getByRole("option", { name: "Giza" }).click();
  await page.getByText("EGP 85").last().waitFor();
  await page.getByLabel("Cash on delivery").check();
  await page.screenshot({ path: path.join(artifacts, "checkout-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 500, height: 900 });
  await page.screenshot({ path: path.join(artifacts, "checkout-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Place order — pay on delivery" }).click();
  await page.getByText("Order confirmed").waitFor();
  const match = page.url().match(/order-confirmation\/([^?]+)/);
  orderNumber = match?.[1];
  if (!orderNumber) throw new Error("Order confirmation URL did not contain an order number.");
  await page.screenshot({ path: path.join(artifacts, "confirmation-desktop.png"), fullPage: true });
  const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber }, include: { items: true, payments: true } });
  if (order.paymentMethod !== "COD" || order.items.length !== 1 || order.payments[0]?.status !== "PENDING") throw new Error("Persisted COD order did not match the completed checkout.");
  if (errors.length) throw new Error(`Browser console errors: ${errors.join(" | ")}`);
  console.info(JSON.stringify({ passed: true, orderNumber, total: order.total.toFixed(2), screenshots: artifacts }));
} finally {
  const cookies = await context.cookies();
  cartToken = cookies.find((cookie) => cookie.name === "talie_cart")?.value;
  await browser.close();
  if (orderNumber) await prisma.order.deleteMany({ where: { orderNumber } });
  if (cartToken) await prisma.cart.deleteMany({ where: { sessionToken: cartToken } });
  await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: product.stockQuantity } });
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stockQuantity: variant.stockQuantity } });
  await prisma.$disconnect();
}
