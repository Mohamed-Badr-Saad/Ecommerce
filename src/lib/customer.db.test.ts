import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAddressForUser, deleteAddressForUser, setDefaultAddressForUser, toggleWishlistForUser } from "./customer";
import { prisma } from "./prisma";

const ownerEmail = "customer-domain-owner@talie.test";
const otherEmail = "customer-domain-other@talie.test";
let ownerId = "";
let otherId = "";

describe("customer persistence authorization", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, otherEmail] } } });
    const [owner, other] = await Promise.all([
      prisma.user.create({ data: { name: "Owner", email: ownerEmail } }),
      prisma.user.create({ data: { name: "Other", email: otherEmail } }),
    ]);
    ownerId = owner.id;
    otherId = other.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, otherEmail] } } });
    await prisma.$disconnect();
  });

  it("keeps exactly one default address and blocks cross-user deletion", async () => {
    const first = await createAddressForUser(ownerId, { firstName: "Mariam", lastName: "Hassan", street: "12 Nile Street", city: "Cairo", governorate: "Cairo", phone: "01000000000" });
    const second = await createAddressForUser(ownerId, { firstName: "Mariam", lastName: "Hassan", street: "8 Garden Road", city: "Giza", governorate: "Giza", phone: "01000000000", isDefault: true });
    expect(await deleteAddressForUser(otherId, second.id)).toBe(false);
    await setDefaultAddressForUser(ownerId, first.id);
    const defaults = await prisma.address.count({ where: { userId: ownerId, isDefault: true } });
    expect(defaults).toBe(1);
  });

  it("toggles one wishlist item without duplicates", async () => {
    expect((await toggleWishlistForUser(ownerId, "safa-draped-abaya")).added).toBe(true);
    expect((await toggleWishlistForUser(ownerId, "safa-draped-abaya")).added).toBe(false);
    expect(await prisma.wishlistItem.count({ where: { wishlist: { userId: ownerId } } })).toBe(0);
  });
});
