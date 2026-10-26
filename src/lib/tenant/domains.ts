import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { websiteDataRoot } from "../website/storage";
import { getWebsitePersistence } from "../website/persistence";
import { hotelSubdomain, validateHotelSubdomain } from "./hotelDomain";

export type DomainRecord = {
  tenantId: string;
  propertyId: string;
  subdomain: string;
  publishedSubdomain?: string;
};
let queue: Promise<unknown> = Promise.resolve();
async function records(): Promise<DomainRecord[]> {
  const root = websiteDataRoot();
  if (!root) return [];
  try {
    const result = JSON.parse(await readFile(join(root, "hotel-domains.json"), "utf8"));
    if (
      !Array.isArray(result) ||
      result.some(
        (r) =>
          !r ||
          typeof r.tenantId !== "string" ||
          typeof r.propertyId !== "string" ||
          !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(r.subdomain) ||
          (r.publishedSubdomain !== undefined &&
            !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(r.publishedSubdomain)),
      )
    )
      throw new Error("Invalid hotel domains registry.");
    return result;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}
async function saveRecords(all: DomainRecord[]) {
  const root = websiteDataRoot();
  if (!root) throw new Error("Configure WEBSITE_DATA_DIR for hotel domain registration.");
  await mkdir(root, { recursive: true });
  const target = join(root, "hotel-domains.json"),
    temp = target + "." + randomUUID() + ".tmp";
  await writeFile(temp, JSON.stringify(all), { mode: 0o600 });
  await rename(temp, target);
}
function mutate<T>(operation: (all: DomainRecord[]) => Promise<T>) {
  const task = queue.catch(() => {}).then(async () => operation(await records()));
  queue = task;
  return task;
}
function occupied(all: DomainRecord[], tenantId: string) {
  const configs = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON || "{}");
  return new Set([
    ...all
      .filter((r) => r.tenantId !== tenantId)
      .flatMap((r) => [r.subdomain, r.publishedSubdomain].filter((s): s is string => Boolean(s))),
    ...Object.keys(configs).filter((key) => key !== tenantId),
    process.env.WEBSITE_MANAGER_HOST?.split(".")[0] || "websites",
  ]);
}
export async function registeredTenant(subdomain: string) {
  const record = (await records()).find((r) => r.publishedSubdomain === subdomain);
  if (!record) return undefined;
  const published = await getWebsitePersistence()?.loadPublished(record.tenantId);
  return published?.propertyId === record.propertyId ? record.tenantId : undefined;
}
export async function hotelDomain(tenantId: string) {
  return (await records()).find((r) => r.tenantId === tenantId);
}
export async function registerHotelDomain(tenantId: string, propertyId: string, name: string) {
  return mutate(async (all) => {
    const existing = all.find((r) => r.tenantId === tenantId);
    if (existing) {
      if (existing.propertyId !== propertyId) throw new Error("Hotel domain ownership changed.");
      return existing.subdomain;
    }
    const subdomain = hotelSubdomain(name, propertyId, occupied(all, tenantId));
    all.push({ tenantId, propertyId, subdomain });
    await saveRecords(all);
    return subdomain;
  });
}
export async function chooseHotelDomain(tenantId: string, propertyId: string, value: string) {
  return mutate(async (all) => {
    const record = all.find((r) => r.tenantId === tenantId);
    if (!record || record.propertyId !== propertyId)
      throw new Error("Hotel domain ownership mismatch.");
    const subdomain = validateHotelSubdomain(value, occupied(all, tenantId));
    record.subdomain = subdomain;
    if (record.publishedSubdomain) record.publishedSubdomain = subdomain;
    await saveRecords(all);
    return record;
  });
}
export async function publishHotelDomain(tenantId: string, propertyId: string) {
  return mutate(async (all) => {
    const record = all.find((r) => r.tenantId === tenantId);
    if (!record || record.propertyId !== propertyId)
      throw new Error("Hotel domain ownership mismatch.");
    const published = await getWebsitePersistence()?.loadPublished(tenantId);
    if (!published || published.propertyId !== propertyId)
      throw new Error("Save published website content first.");
    record.publishedSubdomain = validateHotelSubdomain(record.subdomain, occupied(all, tenantId));
    await saveRecords(all);
    return record;
  });
}
export function publicHotelUrl(subdomain: string) {
  return `https://${subdomain}.${process.env.PATEL_HMS_ROOT_DOMAIN || "patelhms.com"}`;
}

/** Remove public routing only. Keep the chosen address, drafts and published content for republishing. */
export async function unpublishHotelDomain(tenantId: string, propertyId: string) {
  return mutate(async (all) => {
    const record = all.find((r) => r.tenantId === tenantId);
    if (!record || record.propertyId !== propertyId)
      throw new Error("Hotel domain ownership mismatch.");
    delete record.publishedSubdomain;
    await saveRecords(all);
    return record;
  });
}
