import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Reset password" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; token?: string }> }) {
  const { error, token } = await searchParams;
  return <AuthForm mode="reset" token={token} resetError={error || (!token ? "INVALID_TOKEN" : undefined)} />;
}
