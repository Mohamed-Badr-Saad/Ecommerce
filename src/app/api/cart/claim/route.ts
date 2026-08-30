import { auth } from "@/lib/auth";
import { getMutableCartId } from "@/lib/cart";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.banned) return Response.json({ error: "Authentication required." }, { status: 401 });
  await getMutableCartId();
  return Response.json({ claimed: true });
}
