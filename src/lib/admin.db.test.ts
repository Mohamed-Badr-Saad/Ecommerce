import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AdminAuthorizationError, getAdminDashboard, logAdminActivity } from "./admin";
import { prisma } from "./prisma";

const adminEmail = `admin-foundation-${crypto.randomUUID()}@talie.test`;
const customerEmail = `admin-customer-${crypto.randomUUID()}@talie.test`;
let adminId = "";
let customerId = "";

describe("admin dashboard persistence", () => {
  beforeAll(async () => {
    const [admin, customer] = await Promise.all([
      prisma.user.create({ data: { name: "Foundation Admin", email: adminEmail, role: "ADMIN", adminRole: "SUPER_ADMIN", emailVerified: true } }),
      prisma.user.create({ data: { name: "Foundation Customer", email: customerEmail, role: "CUSTOMER", emailVerified: true } }),
    ]);
    adminId = admin.id;
    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.adminActivityLog.deleteMany({ where: { adminId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, customerId] } } });
    await prisma.$disconnect();
  });

  it("records validated activity only for administrators", async () => {
    const entry = await logAdminActivity(adminId, { action: "VIEW_DASHBOARD", entityType: "DASHBOARD", details: { source: "test" } });
    expect(entry.adminId).toBe(adminId);
    await expect(logAdminActivity(customerId, { action: "EDIT_PRODUCT", entityType: "PRODUCT" })).rejects.toThrow(AdminAuthorizationError);
  });

  it("returns database-backed commerce and operations metrics", async () => {
    const dashboard = await getAdminDashboard();
    expect(dashboard.metrics.activeProducts).toBeGreaterThan(0);
    expect(dashboard.metrics.customerCount).toBeGreaterThan(0);
    expect(dashboard.metrics.paidRevenue).toBeGreaterThanOrEqual(0);
    expect(dashboard.recentOrders.length).toBeLessThanOrEqual(6);
    expect(dashboard.recentActivity.some((entry) => entry.admin.name === "Foundation Admin")).toBe(true);
  });
});
