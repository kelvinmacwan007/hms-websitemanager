import { createHash } from "node:crypto";
import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

let lastCleanup = -1;
/** Atomic slots shared by Node workers on one persistent filesystem; fail closed on storage errors. */
export async function allowLogin(root: string, key: string, limit: number, now = Date.now()) {
  const bucket = Math.floor(now / 60_000);
  const directory = join(root, "manager-login-limits");
  const hash = createHash("sha256").update(key).digest("hex");
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if (lastCleanup !== bucket) {
      lastCleanup = bucket;
      for (const name of await readdir(directory)) {
        if (/^\d+-[a-f0-9]{64}$/.test(name) && Number(name.split("-")[0]) < bucket - 2)
          await rm(join(directory, name), { recursive: true, force: true });
      }
    }
    const entry = join(directory, `${bucket}-${hash}`);
    await mkdir(entry, { recursive: true, mode: 0o700 });
    for (let slot = 0; slot < limit; slot++) {
      try {
        await mkdir(join(entry, String(slot)), { mode: 0o700 });
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    return false;
  } catch {
    return false;
  }
}
