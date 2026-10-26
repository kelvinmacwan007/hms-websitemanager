import { cookies } from "next/headers";
import { requestOrigin } from "@/lib/api/origin";
import { readLimitedText } from "@/lib/api/body";
import { allowLogin } from "@/lib/manager/loginLimit";
import { websiteDataRoot } from "@/lib/website/storage";
import { hmsWebsiteAccess, sessionPolicy } from "@/lib/manager/access";
import { newSessionId, registerSession } from "@/lib/manager/sessionStore";
import { isManagerHost, managerUsers } from "@/lib/manager/session";
import { authenticateHmsManager } from "@/lib/manager/hmsAuth";
import { saveConnection, type WebsiteConnection } from "@/lib/manager/connections";
import {
  hashPassword,
  verifyPassword,
  signSession,
  MANAGER_COOKIE,
  SESSION_SECONDS,
  type ManagerSession,
} from "@/lib/manager/credentials";

const dummyHash = hashPassword("unavailable-account");
export async function POST(request: Request) {
  if (
    !isManagerHost(request.headers.get("host")) ||
    request.headers.get("origin") !== requestOrigin(request)
  )
    return Response.json({ error: "Invalid sign-in request." }, { status: 403 });
  const root = websiteDataRoot();
  if (!root) return Response.json({ error: "Manager storage is not configured." }, { status: 503 });
  // Never trust client-supplied forwarding headers. The global cap also bounds unknown account keys.
  if (!(await allowLogin(root, "global", 100)))
    return Response.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 },
    );
  const users = managerUsers();
  const hmsMode = process.env.WEBSITE_MANAGER_AUTH === "hms";
  const secret = process.env.WEBSITE_MANAGER_SESSION_SECRET || "";
  if ((!hmsMode && !users.length) || secret.length < 32)
    return Response.json(
      { error: "Manager login is not configured. Contact your administrator." },
      { status: 503 },
    );
  try {
    const raw = await readLimitedText(request, 4096);
    if (raw.length > 4096) throw new Error();
    const body = JSON.parse(raw);
    if (
      typeof body.username !== "string" ||
      !body.username.trim() ||
      body.username.trim().length > 100 ||
      typeof body.password !== "string" ||
      !body.password ||
      body.password.length > 256
    )
      throw new Error();
    if (
      !(await allowLogin(
        root,
        JSON.stringify([
          body.username.trim().toLowerCase(),
          String(body.customerCode || "")
            .trim()
            .toLowerCase(),
        ]),
        10,
      ))
    )
      return Response.json(
        { error: "Too many attempts. Please try again shortly." },
        { status: 429 },
      );
    let session: ManagerSession;
    let connection: WebsiteConnection | undefined;
    if (hmsMode) {
      if (
        typeof body.customerCode !== "string" ||
        !body.customerCode.trim() ||
        body.customerCode.length > 100
      )
        return Response.json({ error: "Enter your PatelHMS customer code." }, { status: 400 });
      let login;
      try {
        login = await authenticateHmsManager(
          body.username.trim(),
          body.password,
          body.customerCode.trim(),
        );
      } catch {
        return Response.json(
          { error: "PatelHMS sign-in is unavailable. Please try again." },
          { status: 502 },
        );
      }
      if (!login)
        return Response.json({ error: "Incorrect PatelHMS credentials." }, { status: 401 });
      login.properties = login.properties.filter((p) =>
        hmsWebsiteAccess(body.username.trim(), p.tenantId, true),
      );
      if (!login.properties.length)
        return Response.json(
          {
            error: "No hotel property is available for this HMS account.",
          },
          { status: 403 },
        );
      const property = body.tenantId
        ? login.properties.find((p) => p.tenantId === body.tenantId)
        : login.properties.length === 1
          ? login.properties[0]
          : undefined;
      if (!property) {
        if (body.tenantId)
          return Response.json({ error: "Property access denied." }, { status: 403 });
        return Response.json(
          { chooseProperty: true, properties: login.properties },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      session = {
        username: body.username.trim(),
        tenantId: property.tenantId,
        propertyId: property.propertyId,
        auth: "hms",
        expires: Math.min(login.expires, Date.now() + SESSION_SECONDS * 1000),
      };
      const configs = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON || "{}");
      const configured = Object.hasOwn(configs, property.tenantId)
        ? configs[property.tenantId]
        : {};
      connection = {
        baseUrl: process.env.PATEL_HMS_API_URL || "https://dev-aiapi.patelhms.com",
        userIdentity: body.username.trim(),
        password: body.password,
        customerCode: body.customerCode.trim(),
        propertyId: property.propertyId,
        currency: configured.currency || process.env.PATEL_HMS_DEFAULT_CURRENCY || "INR",
        propertyPackageId: configured.propertyPackageId,
        checkInTime: configured.checkInTime || process.env.PATEL_HMS_DEFAULT_CHECK_IN || "15:00",
        checkOutTime: configured.checkOutTime || process.env.PATEL_HMS_DEFAULT_CHECK_OUT || "12:00",
      };
    } else {
      const user = users.find((u) => u.username === body.username.trim());
      const valid = verifyPassword(body.password, user?.passwordHash || dummyHash);
      if (!user || !valid)
        return Response.json({ error: "Incorrect username or password." }, { status: 401 });
      session = {
        username: user.username,
        tenantId: user.tenantId,
        expires: Date.now() + SESSION_SECONDS * 1000,
      };
    }
    session.id = newSessionId();
    if (connection) {
      saveConnection(`session-${session.id}`, connection);
      saveConnection(session.tenantId, connection);
    }
    const token = signSession(session, secret);
    const user = users.find(
      (u) => u.username === session.username && u.tenantId === session.tenantId,
    );
    await registerSession(
      root,
      token,
      session.expires,
      sessionPolicy(session.username, session.tenantId, hmsMode ? undefined : user?.passwordHash),
      session.id,
    );
    (await cookies()).set(MANAGER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(1, Math.floor((session.expires - Date.now()) / 1000)),
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Invalid sign-in request." }, { status: 400 });
  }
}
