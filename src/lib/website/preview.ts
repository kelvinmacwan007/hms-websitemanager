import "server-only";
import { randomUUID } from "node:crypto";
import type { Hotel } from "../../types/hotel";
import type { WebsitePresentationPayload } from "../../../Portal/content";

type PreviewRecord = {
  tenantId: string;
  hotel: Hotel;
  document: WebsitePresentationPayload;
  expires: number;
};
const memory = globalThis as typeof globalThis & {
  websitePreviewDrafts?: Map<string, PreviewRecord>;
};
const drafts = (memory.websitePreviewDrafts ??= new Map());
export function loadPreview(token: string | null, tenantId: string) {
  if ((process.env.NODE_ENV === "production" && !process.env.WEBSITE_MANAGER_HOST) || !token)
    return null;
  const record = drafts.get(token);
  if (!record || record.tenantId !== tenantId || record.expires < Date.now()) return null;
  return record;
}
export function savePreview(
  tenantId: string,
  hotel: Hotel,
  document: WebsitePresentationPayload,
  token?: string,
) {
  const now = Date.now();
  for (const [key, record] of drafts) if (record.expires < now) drafts.delete(key);
  const id = token && loadPreview(token, tenantId) ? token : randomUUID();
  if (drafts.size >= 30 && !drafts.has(id)) drafts.delete(drafts.keys().next().value!);
  drafts.set(id, { tenantId, hotel, document, expires: now + 30 * 60 * 1000 });
  return id;
}
