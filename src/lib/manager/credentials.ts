import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type ManagerUser = { username: string; passwordHash: string; tenantId: string };
export type ManagerSession = {
  username: string;
  tenantId: string;
  expires: number;
  auth?: "hms";
  propertyId?: string;
  id?: string;
};
export const MANAGER_COOKIE = "patelhms-manager";
export const SESSION_SECONDS = 30 * 60;
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [, salt, value] = hash.split(":");
  if (!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash) || password.length > 256) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(value, "hex"));
}
export function signSession(session: ManagerSession, secret: string) {
  if (secret.length < 32)
    throw new Error("Configure a manager session secret of at least 32 characters.");
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifySession(
  value: string | undefined,
  secret: string,
  users: ManagerUser[],
  now = Date.now(),
  hmsProperties: Record<string, string> = {},
): ManagerSession | null {
  if (!value || value.length > 2048 || secret.length < 32) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      !Number.isFinite(session.expires) ||
      session.expires <= now ||
      typeof session.username !== "string" ||
      !session.username ||
      session.username.length > 100 ||
      !(session.auth === "hms"
        ? Object.hasOwn(hmsProperties, session.tenantId) &&
          hmsProperties[session.tenantId] === session.propertyId
        : users.some((u) => u.username === session.username && u.tenantId === session.tenantId))
    )
      return null;
    return session;
  } catch {
    return null;
  }
}
