import "server-only";
import { join, resolve } from "node:path";
export function websiteDataRoot() {
  if (process.env.WEBSITE_DATA_DIR) return resolve(process.env.WEBSITE_DATA_DIR);
  if (process.env.NODE_ENV === "production") return null;
  return join(process.cwd(), ".data");
}
