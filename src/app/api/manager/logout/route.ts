import { cookies } from "next/headers";
import { requestOrigin } from "@/lib/api/origin";
import { isManagerHost, managerSession } from "@/lib/manager/session";
import { revokeSession } from "@/lib/manager/sessionStore";
import { websiteDataRoot } from "@/lib/website/storage";
import { MANAGER_COOKIE } from "@/lib/manager/credentials";
import { removeManagerConnection } from "@/lib/manager/connections";
export async function POST(request: Request) {
  if (
    !isManagerHost(request.headers.get("host")) ||
    request.headers.get("origin") !== requestOrigin(request)
  )
    return Response.json({ error: "Invalid request." }, { status: 403 });
  const session = await managerSession();
  const root = websiteDataRoot();
  if (session && root) {
    await revokeSession(root, session.id);
    if (session.id) removeManagerConnection(session.id);
  }
  (await cookies()).set(MANAGER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
