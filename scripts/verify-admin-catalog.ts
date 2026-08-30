import "dotenv/config";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://localhost:3000";
const stamp = Date.now();
const email = `browser-catalog-${stamp}@talie.test`;
const password = "AdminCatalog123!";
const slug = `browser-catalog-${stamp}`;
const artifacts = path.resolve("artifacts/chunk-8");
const errors: string[] = [];
let userId: string | undefined;
let productId: string | undefined;

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await mkdir(artifacts, { recursive: true });
  await page.goto(`${baseUrl}/sign-up`);
  await page.getByLabel("Full name").fill("Catalog Browser Admin");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);
  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN", adminRole: "CONTENT_MANAGER" } });
  userId = user.id;
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto(`${baseUrl}/sign-in?callbackURL=/admin/catalog`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin\/catalog$/);

  await page.getByLabel("Title").fill("Browser Catalog Piece");
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Description").fill("A browser-tested modest layering piece with a graceful drape.");
  await page.getByLabel("Price").fill("1250");
  await page.getByLabel("Base SKU").fill(`BROWSER-${stamp}`);
  await page.getByRole("button", { name: "Create draft" }).click();
  await page.waitForURL(/\/admin\/catalog\/[^/]+$/);
  productId = page.url().split("/").pop();
  await page.getByRole("heading", { name: "Browser Catalog Piece" }).waitFor();

  await page.getByPlaceholder("Title", { exact: true }).fill("Burgundy / M");
  await page.getByPlaceholder("SKU").fill(`BROWSER-${stamp}-M`);
  await page.getByPlaceholder("Color").fill("Burgundy");
  await page.getByPlaceholder("Size").fill("M");
  await page.getByRole("button", { name: "Add variant" }).click();
  await page.getByText(`BROWSER-${stamp}-M`).waitFor();
  await page.getByPlaceholder("UploadThing URL or /local-image.svg").fill("/products/set-oxblood.svg");
  await page.getByPlaceholder("Alt text (defaults to product title)").fill("Burgundy modest layering piece");
  await page.getByRole("button", { name: "Add image" }).click();
  await page.getByText("Primary · /products/set-oxblood.svg").waitFor();
  await page.screenshot({ path: path.join(artifacts, "catalog-product-editor.png"), fullPage: true });

  await page.getByRole("link", { name: "Content", exact: true }).click();
  await page.getByRole("heading", { name: "Content" }).waitFor();
  await page.getByText("Media library").waitFor();
  await page.getByText("Policy content", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "content-management.png"), fullPage: true });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.info(JSON.stringify({ passed: true, productCrud: true, variantInventory: true, imageAssociation: true, contentWorkspace: true, screenshots: artifacts }));
} finally {
  await browser.close();
  if (productId) await prisma.product.deleteMany({ where: { id: productId } });
  if (userId) await prisma.adminActivityLog.deleteMany({ where: { adminId: userId } });
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
}
