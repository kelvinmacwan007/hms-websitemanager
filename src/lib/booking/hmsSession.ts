import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename, rmdir } from "node:fs/promises";
import { join, resolve } from "node:path";

export const HMS_COOKIE = "hms-booking";
export type HmsBookingSession = {
  tenantId: string;
  propertyId: string;
  expiresAt: number;
  fingerprint: string;
  state: "creating" | "reserved" | "paying" | "paid" | "declined" | "attention";
  reservationId?: string;
};

export function validBookingToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function paths(tenantId: string, token: string) {
  if (!validBookingToken(token)) throw new Error("Invalid booking access.");
  // Runtime records are mounted separately and must not be bundled into the server.
  const root = resolve(
    /* turbopackIgnore: true */ process.env.PATEL_HMS_BOOKING_STORE ?? ".data/hms-bookings",
  );
  const key = createHash("sha256").update(`${tenantId}:${token}`).digest("hex");
  return { root, filename: join(root, `${key}.json`), lock: join(root, `${key}.lock`) };
}

export async function readHmsSession(
  tenantId: string,
  token: string,
): Promise<HmsBookingSession | null> {
  try {
    const value = JSON.parse(
      await readFile(/* turbopackIgnore: true */ paths(tenantId, token).filename, "utf8"),
    ) as HmsBookingSession;
    if (value.tenantId !== tenantId || value.expiresAt <= Date.now())
      throw new Error("Booking access expired. Contact the hotel about previous attempts.");
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeHmsSession(tenantId: string, token: string, value: HmsBookingSession) {
  const { root, filename } = paths(tenantId, token);
  await mkdir(root, { recursive: true });
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
  await rename(temporary, filename);
}

/** Persist the write intent before sending to HMS. Never replay ambiguous writes.
 * The directory must be durable and shared by every application instance. */
export async function withHmsSessionLock<T>(
  tenantId: string,
  token: string,
  operation: () => Promise<T>,
): Promise<T> {
  const { root, lock } = paths(tenantId, token);
  await mkdir(root, { recursive: true });
  try {
    await mkdir(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new Error("Booking operation already in progress.");
    throw error;
  }
  try {
    return await operation();
  } finally {
    await rmdir(lock);
  }
}
