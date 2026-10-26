import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { websiteDataRoot } from "../website/storage";
import type { HmsConnection } from "../../services/patelHms/integrationTypes";
import type { Tenant } from "../../types/hotel";

export type WebsiteConnection = HmsConnection & { checkInTime?: string; checkOutTime?: string };
const scoped = new WeakMap<Tenant, WebsiteConnection>();
export function bindManagerConnection(tenant: Tenant, id: string) {
  const connection = readConnection(`session-${id}`);
  if (!connection) throw new Error("Manager API connection unavailable. Sign in again.");
  scoped.set(tenant, connection);
}
export function managerConnection(tenant: Tenant) {
  return scoped.get(tenant);
}
export function removeManagerConnection(id: string) {
  try {
    unlinkSync(filename(`session-${id}`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
function key() {
  const secret = process.env.WEBSITE_MANAGER_SESSION_SECRET || "";
  if (secret.length < 32) throw new Error("Configure the manager session secret.");
  return createHash("sha256").update(`hms-connections:${secret}`).digest();
}
function filename(id: string) {
  const root = websiteDataRoot();
  if (!root) throw new Error("Configure website storage.");
  return join(root, "hms-connections", createHash("sha256").update(id).digest("hex") + ".json");
}
export function readConnection(id: string): WebsiteConnection | undefined {
  try {
    const record = JSON.parse(readFileSync(filename(id), "utf8"));
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(record.iv, "base64"));
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(Buffer.from(record.tag, "base64"));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(record.data, "base64")),
        decipher.final(),
      ]).toString("utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
export function saveConnection(id: string, connection: WebsiteConnection) {
  const target = filename(id);
  mkdirSync(join(websiteDataRoot()!, "hms-connections"), { recursive: true, mode: 0o700 });
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(id));
  const data = Buffer.concat([cipher.update(JSON.stringify(connection), "utf8"), cipher.final()]);
  const temp = target + "." + randomUUID() + ".tmp";
  writeFileSync(
    temp,
    JSON.stringify({
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: data.toString("base64"),
    }),
    { mode: 0o600 },
  );
  renameSync(temp, target);
}
