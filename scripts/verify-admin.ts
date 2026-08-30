import "dotenv/config";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://localhost:3000";
const email = `browser-admin-${Date.now()}@talie.test`;
const password = "AdminBrowser123!";
const artifacts = path.resolve("artifacts/chunk-7");
const errors: string[] = [];
let userId: string | undefined;

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await mkdir(artifacts, { recursive: true });
  await page.goto(`${baseUrl}/sign-up`);
  await page.getByLabel("Full name").fill("Browser Administrator");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto(`${baseUrl}/admin`);
  await page.getByText("404 · Not found", { exact: true }).waitFor();

  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN", adminRole: "SUPER_ADMIN" } });
  userId = user.id;
  await page.goto(`${baseUrl}/account`);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(`${baseUrl}/`);
  await page.goto(`${baseUrl}/sign-in?callbackURL=/admin`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await page.getByText("Paid revenue").waitFor();
  await page.getByText("Recent orders").waitFor();
  await page.screenshot({ path: path.join(artifacts, "admin-dashboard-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 500, height: 900 });
  await page.screenshot({ path: path.join(artifacts, "admin-dashboard-mobile.png"), fullPage: true });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.info(JSON.stringify({ passed: true, customerDenied: true, administratorAllowed: true, screenshots: artifacts }));
} finally {
  await browser.close();
  const testUser = userId ? { id: userId } : await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (testUser) await prisma.adminActivityLog.deleteMany({ where: { adminId: testUser.id } });
  if (testUser) await prisma.user.delete({ where: { id: testUser.id } }).catch(() => undefined);
  await prisma.$disconnect();
}
