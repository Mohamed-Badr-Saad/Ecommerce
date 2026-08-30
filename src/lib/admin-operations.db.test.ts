import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getAdminAnalytics, getAdminCustomers, getAdminReviews, moderateReview, setCustomerBan } from "./admin-operations";
import { prisma } from "./prisma";

const suffix = crypto.randomUUID().slice(0, 8);
let customerId = "";
let reviewId = "";

describe("admin customer and moderation operations", () => {
  beforeAll(async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { status: "ACTIVE" } });
    const customer = await prisma.user.create({ data: { name: "Operations Customer", email: `operations-${suffix}@talie.test`, role: "CUSTOMER", emailVerified: true } });
    customerId = customer.id;
    const review = await prisma.review.create({ data: { productId: product.id, customerId, rating: 4, title: "Thoughtful fit", content: "A useful and sufficiently detailed customer review for moderation testing." } });
    reviewId = review.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { id: reviewId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.$disconnect();
  });

  it("lists customers and safely suspends then restores a customer", async () => {
    expect((await getAdminCustomers()).some((customer) => customer.id === customerId)).toBe(true);
    expect((await setCustomerBan(customerId, true, "Automated operations test")).banned).toBe(true);
    expect((await setCustomerBan(customerId, false)).banned).toBe(false);
  });

  it("moderates reviews and exposes analytics", async () => {
    expect((await getAdminReviews()).some((review) => review.id === reviewId)).toBe(true);
    expect((await moderateReview(reviewId, { status: "APPROVED" })).status).toBe("APPROVED");
    const analytics = await getAdminAnalytics();
    expect(analytics.months).toHaveLength(12);
    expect(analytics.customerCount).toBeGreaterThan(0);
  });
});
