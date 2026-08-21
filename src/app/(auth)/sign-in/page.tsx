import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const { callbackURL } = await searchParams;
  const safeCallback = callbackURL?.startsWith("/") && !callbackURL.startsWith("//") ? callbackURL : "/account";
  return <AuthForm mode="sign-in" callbackURL={safeCallback} />;
}
