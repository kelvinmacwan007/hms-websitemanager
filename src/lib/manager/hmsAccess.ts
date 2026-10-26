import { createHash } from "node:crypto";
export type ManagerProperty = { tenantId: string; propertyId: string; name: string };

/** Resolve authenticated work profiles, optionally discovering unconfigured properties. */
export function hmsManagerProperties(
  data: unknown,
  configs: Record<string, { propertyId: string; customerCode: string }>,
  customerCode: string,
  discover = false,
): ManagerProperty[] {
  const user = (data as { user?: { currentWorkProfile?: unknown; workProfiles?: unknown[] } })
    ?.user;
  const profiles = [
    user?.currentWorkProfile,
    ...(Array.isArray(user?.workProfiles) ? user.workProfiles : []),
  ];
  const found = new Map<string, ManagerProperty>();
  for (const raw of profiles) {
    const profile = raw as { propertyId?: string; propertyName?: string } | null;
    if (typeof profile?.propertyId !== "string" || !profile.propertyId.trim()) continue;
    const candidates = Object.entries(configs).filter(
      ([, connection]) =>
        connection?.propertyId === profile.propertyId && connection.customerCode === customerCode,
    );
    // Ambiguous server configuration must never pick a different hotel's workspace.
    if (candidates.length > 1 || (!discover && candidates.length !== 1)) continue;
    const tenantId =
      candidates[0]?.[0] ??
      `hms-${createHash("sha256")
        .update(JSON.stringify([customerCode, profile.propertyId]))
        .digest("hex")
        .slice(0, 32)}`;
    if (found.has(tenantId)) continue;
    found.set(tenantId, {
      tenantId,
      propertyId: profile.propertyId,
      name: profile.propertyName || "Hotel property",
    });
  }
  return [...found.values()];
}
