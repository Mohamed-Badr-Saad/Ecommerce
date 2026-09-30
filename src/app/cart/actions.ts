"use server";

import { revalidatePath } from "next/cache";

import { addCartItem, applyCartDiscountCode, removeCartDiscountCode, removeCartItem, updateCartItem } from "@/lib/cart";

export type CartActionState = { error?: string; success?: string };

export async function addToCartAction(productId: string, _state: CartActionState, formData: FormData): Promise<CartActionState> {
  try {
    await addCartItem(productId, String(formData.get("variantId") || "") || null, formData.get("quantity") ?? 1);
    revalidatePath("/", "layout");
    return { success: "Added to your bag." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to add this item." };
  }
}

export async function updateCartItemAction(itemId: string, formData: FormData) {
  await updateCartItem(itemId, formData.get("quantity"));
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string) {
  await removeCartItem(itemId);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function applyDiscountCodeAction(_state: CartActionState, formData: FormData): Promise<CartActionState> {
  try {
    const result = await applyCartDiscountCode(formData.get("code"));
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { success: `${result.code} applied.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We could not apply this code." };
  }
}

export async function removeDiscountCodeAction() {
  await removeCartDiscountCode();
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
