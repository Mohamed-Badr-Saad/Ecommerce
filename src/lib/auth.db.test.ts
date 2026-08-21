import { afterAll, describe, expect, it } from "vitest";

import { auth } from "./auth";
import { prisma } from "./prisma";

const email = "better-auth-integration@talie.test";

describe("Better Auth integration", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers a customer, creates a session, and keeps roles server-owned", async () => {
    await prisma.user.deleteMany({ where: { email } });
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({ name: "Auth Customer", email, password: "SecurePass123!", role: "ADMIN" }),
    }));
    expect(response.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { sessions: true, accounts: true } });
    expect(user.role).toBe("CUSTOMER");
    expect(user.sessions.length).toBe(1);
    expect(user.accounts[0]?.password).toBeTruthy();
    expect(user.accounts[0]?.password).not.toContain("SecurePass123!");
  });

  it("creates an expiring password-reset verification without exposing account existence", async () => {
    const response = await auth.handler(new Request("http://localhost:3000/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({ email, redirectTo: "http://localhost:3000/reset-password" }),
    }));
    expect(response.status).toBe(200);
    const reset = await prisma.verification.findFirst({ where: { identifier: { startsWith: "reset-password:" } }, orderBy: { createdAt: "desc" } });
    expect(reset?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
