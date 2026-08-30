import "dotenv/config";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://localhost:3000";
const stamp = Date.now();
const adminEmail = `browser-operations-admin-${stamp}@talie.test`;
const customerEmail = `browser-operations-customer-${stamp}@talie.test`;
const password = "AdminOperations123!";
const artifacts = path.resolve("artifacts/chunk-9");
let adminId: string | undefined;
let customerId: string | undefined;
let reviewId: string | undefined;

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

try {
  await mkdir(artifacts, { recursive: true });
  await page.goto(`${baseUrl}/sign-up`);
  await page.getByLabel("Full name").fill("Operations Browser Admin");
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);
  const admin = await prisma.user.update({ where: { email: adminEmail }, data: { role: "ADMIN", adminRole: "SUPER_ADMIN" } });
  adminId = admin.id;
  const customer = await prisma.user.create({ data: { name: "Browser Operations Customer", email: customerEmail, role: "CUSTOMER", emailVerified: true } });
  customerId = customer.id;
  const product = await prisma.product.findFirstOrThrow({ where: { status: "ACTIVE" } });
  const review = await prisma.review.create({ data: { productId: product.id, customerId, rating: 5, title: "Browser moderation review", content: "This browser fixture verifies the complete protected review moderation workflow." } });
  reviewId = review.id;

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto(`${baseUrl}/sign-in?callbackURL=/admin/customers`);
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin\/customers$/);
  const customerRow = page.getByRole("row").filter({ hasText: customerEmail });
  await customerRow.getByPlaceholder("Suspension reason").fill("Browser workflow verification");
  await customerRow.getByRole("button", { name: "Suspend" }).click();
  await customerRow.getByText("suspended", { exact: true }).waitFor();
  await customerRow.getByRole("button", { name: "Restore" }).click();
  await customerRow.getByRole("button", { name: "Suspend" }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "customers.png"), fullPage: true });

  await page.getByRole("link", { name: "Reviews", exact: true }).click();
  await page.getByText("Browser moderation review", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await page.getByText("approved", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(artifacts, "reviews.png"), fullPage: true });

  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await page.getByRole("heading", { name: "Analytics" }).waitFor();
  await page.getByText("Revenue trend").waitFor();
  await page.screenshot({ path: path.join(artifacts, "analytics.png"), fullPage: true });

  await page.getByRole("link", { name: "Orders", exact: true }).click();
  const csv = await page.request.get(`${baseUrl}/api/admin/orders.csv`);
  if (csv.status() !== 200 || !csv.headers()["content-type"]?.includes("text/csv")) throw new Error("Protected orders CSV did not download.");
  const firstOrder = page.locator("tbody a").first();
  if (await firstOrder.count()) {
    await firstOrder.click();
    await page.getByText("Printable order", { exact: true }).click();
    await page.getByText("Order document", { exact: true }).waitFor();
  }

  await page.goto(`${baseUrl}/admin/settings`);
  await page.getByRole("heading", { name: "Settings" }).waitFor();
  await page.getByLabel("Store name").waitFor();
  await page.goto(`${baseUrl}/admin/activity`);
  await page.getByRole("heading", { name: "Activity" }).waitFor();
  await page.getByText("approved review", { exact: false }).waitFor();
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.info(JSON.stringify({ passed: true, customerAccess: true, reviewModeration: true, analytics: true, protectedCsv: true, printableOrder: true, settings: true, activity: true, screenshots: artifacts }));
} finally {
  await browser.close();
  if (reviewId) await prisma.review.deleteMany({ where: { id: reviewId } });
  if (customerId) await prisma.user.deleteMany({ where: { id: customerId } });
  if (adminId) await prisma.adminActivityLog.deleteMany({ where: { adminId } });
  if (adminId) await prisma.user.deleteMany({ where: { id: adminId } });
  await prisma.$disconnect();
}
