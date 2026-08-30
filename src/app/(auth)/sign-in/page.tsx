import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";
import { safeInternalPath } from "@/lib/internal-navigation";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const { callbackURL } = await searchParams;
  const safeCallback = safeInternalPath(callbackURL, "/shop");
  return <AuthForm mode="sign-in" callbackURL={safeCallback} />;
}
