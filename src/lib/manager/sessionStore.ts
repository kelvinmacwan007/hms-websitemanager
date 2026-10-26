import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join } from "node:path";

type StoredSession = { digest: string; expires: number; policy: string };
const validId = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{64}$/.test(id);
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
let lastSweep = 0;

/** Server-side allowlist: copied cookies stop working after logout. No HMS tokens/passwords stored. */
export async function registerSession(
  root: string,
  token: string,
  expires: number,
  policy: string,
  id: string,
) {
  if (!validId(id)) throw new Error("Invalid session identifier.");
  const directory = join(root, "manager-sessions");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const name of await readdir(directory)) {
      if (!/^[a-f0-9]{64}\.json$/.test(name)) continue;
      try {
        const record = JSON.parse(await readFile(join(directory, name), "utf8"));
        if (!Number.isFinite(record.expires) || record.expires <= now)
          await unlink(join(directory, name));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  }
  await writeFile(
    join(directory, `${id}.json`),
    JSON.stringify({ digest: digest(token), expires, policy }),
    {
      flag: "wx",
      mode: 0o600,
    },
  );
}
export const newSessionId = () => randomBytes(32).toString("hex");

export async function activeSession(
  root: string,
  id: unknown,
  token: string,
  policy: string,
  now = Date.now(),
) {
  if (!validId(id)) return false;
  try {
    const stored: StoredSession = JSON.parse(
      await readFile(join(root, "manager-sessions", `${id}.json`), "utf8"),
    );
    if (!Number.isFinite(stored.expires) || stored.expires <= now || stored.policy !== policy) {
      await revokeSession(root, id);
      return false;
    }
    const actual = Buffer.from(digest(token), "hex");
    const expected = Buffer.from(stored.digest, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
export async function revokeSession(root: string, id: unknown) {
  if (!validId(id)) return;
  try {
    await unlink(join(root, "manager-sessions", `${id}.json`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
