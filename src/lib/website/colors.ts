import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { websiteDataRoot } from "./storage";
import type { LogoPalette } from "../branding/logoPalette";

export function validateWebsiteColors(value: unknown): LogoPalette {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid colors.");
  const record = value as Record<string, unknown>;
  const keys = ["primaryColor", "secondaryColor", "accentColor"] as const;
  if (
    Object.keys(record).length !== 3 ||
    keys.some(
      (key) => typeof record[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(record[key] as string),
    )
  )
    throw new Error("Use six-digit hex color codes.");
  return Object.fromEntries(
    keys.map((key) => [key, (record[key] as string).toLowerCase()]),
  ) as LogoPalette;
}
function filename(tenantId: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId)) throw new Error("Invalid tenant identifier.");
  const root = websiteDataRoot();
  if (!root) throw new Error("Website storage is not configured.");
  return join(root, "website", `${tenantId}.colors.json`);
}
export async function loadWebsiteColors(tenantId: string, propertyId: string) {
  if (!websiteDataRoot()) return null;
  try {
    const record = JSON.parse(await readFile(filename(tenantId), "utf8"));
    if (record.propertyId !== propertyId) return null;
    return validateWebsiteColors(record.colors);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function saveWebsiteColors(tenantId: string, propertyId: string, colors: LogoPalette) {
  if (!websiteDataRoot()) throw new Error("Production color persistence is not configured.");
  const target = filename(tenantId);
  await mkdir(join(websiteDataRoot()!, "website"), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(
    temporary,
    JSON.stringify({ propertyId, colors: validateWebsiteColors(colors) }),
    { mode: 0o600 },
  );
  await rename(temporary, target);
}
