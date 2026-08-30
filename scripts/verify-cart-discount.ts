import "dotenv/config";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.COMMERCE_BASE_URL ?? "http://localhost:3000";
const email = `browser-discount-${Date.now()}@talie.test`;
const artifacts = path.resolve("artifacts/chunk-5");
const product = await prisma.product.findUniqueOrThrow({
  where: { slug: "lina-textured-kimono" },
  include: { variants: { orderBy: { displayOrder: "asc" }, take: 1 } },
});
const variant = product.variants[0];
let cartToken: string | undefined;
let orderNumber: string | undefined;

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await mkdir(artifacts, { recursive: true });
  await page.goto(`${baseUrl}/products/lina-textured-kimono`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByText("Added to your bag.").waitFor();
  await page.getByRole("link", { name: "Shopping bag, 1 items" }).click();
  await page.getByRole("heading", { name: "Order summary" }).waitFor();
  await page.getByText("Total discount").waitFor();
  await page.getByText("EGP 300", { exact: false }).waitFor();

  await page.getByRole("button", { name: "Increase Lina Textured Kimono quantity" }).click();
  await page.getByRole("group", { name: "Quantity for Lina Textured Kimono" }).getByText("2", { exact: true }).waitFor();
  await page.getByText("EGP 600", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Decrease Lina Textured Kimono quantity" }).click();
  await page.getByRole("group", { name: "Quantity for Lina Textured Kimono" }).getByText("1", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "cart-quantity-discount.png"), fullPage: true });

  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByText("Total discount").waitFor();
  await page.getByLabel("First name").fill("Discount");
  await page.getByLabel("Last name").fill("Checkout");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number").fill("01012345678");
  await page.getByLabel("Street address").fill("12 Nile Street");
  await page.getByLabel("City / area").fill("Dokki");
  await page.getByLabel("Governorate").click();
  await page.getByRole("option", { name: "Giza" }).click();
  await page.getByLabel("Cash on delivery").check();
  await page.screenshot({ path: path.join(artifacts, "checkout-discount.png"), fullPage: true });
  await page.getByRole("button", { name: "Place COD order" }).click();
  await page.getByText("Order confirmed", { exact: true }).waitFor();

  orderNumber = page.url().match(/order-confirmation\/([^?]+)/)?.[1];
  if (!orderNumber) throw new Error("Order number was missing from the confirmation URL.");
  const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber } });
  if (order.subtotal.toFixed(2) !== "1990.00" || order.discount.toFixed(2) !== "300.00" || order.total.toFixed(2) !== "1775.00") {
    throw new Error("Persisted order markdown totals were incorrect.");
  }
  console.info(JSON.stringify({ passed: true, quantityControls: true, subtotal: order.subtotal.toFixed(2), discount: order.discount.toFixed(2), total: order.total.toFixed(2), screenshots: artifacts }));
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
