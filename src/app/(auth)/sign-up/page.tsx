import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";
import { safeInternalPath } from "@/lib/internal-navigation";

export const metadata: Metadata = { title: "Create account" };
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const { callbackURL } = await searchParams;
  return <AuthForm mode="sign-up" callbackURL={safeInternalPath(callbackURL, "/shop")} />;
}
