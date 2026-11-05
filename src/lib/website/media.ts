import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { websiteDataRoot } from "./storage";
import { randomUUID } from "node:crypto";
export interface MediaStorage {
  uploadMedia(tenantId: string, file: File): Promise<string>;
}
export async function validateMedia(file: File) {
  const types: Record<string, string[]> = {
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
  };
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!types[file.type]?.includes(extension) || file.size < 1 || file.size > 5 * 1024 * 1024)
    throw new Error("Use a PNG, JPEG, WebP or GIF up to 5 MB with a matching extension.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const matches =
    file.type === "image/png"
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : file.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : file.type === "image/webp"
          ? bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
          : /^GIF8[79]a$/.test(bytes.toString("ascii", 0, 6));
  if (!matches) throw new Error("Image signature does not match its type.");
  return { bytes, extension };
}
export const developmentMediaStorage: MediaStorage = {
  async uploadMedia(tenantId, file) {
    if (!websiteDataRoot() || !/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId))
      throw new Error("Development media unavailable.");
    const { bytes, extension } = await validateMedia(file);
    const directory = join(websiteDataRoot()!, "media", tenantId);
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(join(directory, filename), bytes, { mode: 0o600 });
    return `/api/website/media/${tenantId}/${filename}`;
  },
};
