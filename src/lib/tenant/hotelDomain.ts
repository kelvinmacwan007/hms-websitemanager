const reserved = new Set([
  "website",
  "websites",
  "www",
  "api",
  "admin",
  "mail",
  "ftp",
  "manager",
  "portal",
  "app",
  "support",
]);
export function validateHotelSubdomain(value: string, occupied: Set<string> = new Set()) {
  const label = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    throw new Error(
      "Use 1–63 lowercase letters, numbers or hyphens. Enter only the subdomain name.",
    );
  if (reserved.has(label) || occupied.has(label))
    throw new Error("This website address is unavailable. Choose another name.");
  return label;
}
export function hotelSubdomain(
  name: string,
  propertyId: string,
  occupied: Set<string> = new Set(),
) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const base = (normalized || "hotel").slice(0, 63).replace(/-$/g, "");
  if (!reserved.has(base) && !occupied.has(base)) return base;
  const suffix = propertyId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  if (!suffix) throw new Error("A property ID is required for a unique hotel domain.");
  const candidate = base.slice(0, 50).replace(/-$/g, "") + "-" + suffix;
  if (occupied.has(candidate) || reserved.has(candidate))
    throw new Error("Hotel subdomain collision; ask your administrator to assign an alias.");
  return candidate;
}
