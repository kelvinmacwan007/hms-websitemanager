import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { websiteDataRoot } from "./storage";
import { randomUUID } from "node:crypto";
import type { WebsitePresentationPayload } from "../../../Portal/content";

export interface WebsitePersistence {
  loadDraft(tenantId: string): Promise<WebsitePresentationPayload | null>;
  saveDraft(tenantId: string, document: WebsitePresentationPayload): Promise<void>;
  loadPublished(tenantId: string): Promise<WebsitePresentationPayload | null>;
  publishDocument(tenantId: string, document: WebsitePresentationPayload): Promise<void>;
}

/** Development only: atomic presentation files, separate draft/published records. */
export class DevelopmentWebsitePersistence implements WebsitePersistence {
  constructor(private root: string) {}
  private filename(tenantId: string, state: string) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId)) throw new Error("Invalid tenant identifier.");
    return join(this.root, `${tenantId}.${state}.json`);
  }
  private async load(tenantId: string, state: string) {
    try {
      const record = JSON.parse(await readFile(this.filename(tenantId, state), "utf8"));
      if (!record || record.schemaVersion !== 1 || record.tenantId !== tenantId)
        throw new Error("Invalid stored presentation.");
      return record as WebsitePresentationPayload;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  private async save(tenantId: string, state: string, document: WebsitePresentationPayload) {
    if (document.tenantId !== tenantId) throw new Error("Tenant mismatch.");
    const filename = this.filename(tenantId, state);
    await mkdir(this.root, { recursive: true });
    const temporary = `${filename}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(document), { encoding: "utf8", mode: 0o600 });
    await rename(temporary, filename);
  }
  loadDraft = (tenantId: string) => this.load(tenantId, "draft");
  loadPublished = (tenantId: string) => this.load(tenantId, "published");
  saveDraft = (tenantId: string, document: WebsitePresentationPayload) =>
    this.save(tenantId, "draft", document);
  publishDocument = (tenantId: string, document: WebsitePresentationPayload) =>
    this.save(tenantId, "published", document);
}

export function getWebsitePersistence(): WebsitePersistence | null {
  const root = websiteDataRoot();
  return root ? new DevelopmentWebsitePersistence(join(root, "website")) : null;
}
