"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAddressForUser, deleteAddressForUser, setDefaultAddressForUser, toggleWishlistForUser, updateProfileForUser } from "@/lib/customer";
import { getCurrentSession } from "@/lib/session";

async function authenticatedUserId(callbackURL = "/account") {
  const session = await getCurrentSession();
  if (!session) redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
  if (session.user.banned) redirect("/sign-in?error=ACCOUNT_UNAVAILABLE");
  return session.user.id;
}

export async function updateProfileAction(formData: FormData) {
  const userId = await authenticatedUserId("/account/profile");
  await updateProfileForUser(userId, { name: formData.get("name"), phone: formData.get("phone") });
  revalidatePath("/account");
  redirect("/account/profile?saved=1");
}

export async function createAddressAction(formData: FormData) {
  const userId = await authenticatedUserId("/account/addresses");
  await createAddressForUser(userId, {
    label: formData.get("label"), firstName: formData.get("firstName"), lastName: formData.get("lastName"),
    street: formData.get("street"), apartment: formData.get("apartment"), city: formData.get("city"),
    governorate: formData.get("governorate"), postalCode: formData.get("postalCode"), phone: formData.get("phone"),
    isDefault: formData.get("isDefault") === "on",
  });
  revalidatePath("/account/addresses");
  redirect("/account/addresses?saved=1");
}

export async function deleteAddressAction(addressId: string) {
  const userId = await authenticatedUserId("/account/addresses");
  await deleteAddressForUser(userId, addressId);
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(addressId: string) {
  const userId = await authenticatedUserId("/account/addresses");
  await setDefaultAddressForUser(userId, addressId);
  revalidatePath("/account/addresses");
}

export async function toggleWishlistAction(productSlug: string) {
  const userId = await authenticatedUserId(`/products/${productSlug}`);
  await toggleWishlistForUser(userId, productSlug);
  revalidatePath("/account/wishlist");
  revalidatePath(`/products/${productSlug}`);
  revalidatePath("/shop");
}
