import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in?callbackURL=/account");
  if (session.user.banned) redirect("/sign-in?error=ACCOUNT_UNAVAILABLE");
  return session;
}
