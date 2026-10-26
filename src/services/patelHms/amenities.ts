import type { HmsCatalogRoom } from "./integrationTypes";

export function hmsAmenityIconUrl(
  amenity: { amenityIconPath?: string | null; amenityIcon?: string | null },
  baseUrl?: string,
): string | undefined {
  const path = amenity.amenityIconPath?.trim() || amenity.amenityIcon?.trim();
  if (!path) return undefined;
  try {
    const url = new URL(path.replace(/\\/g, "/"), baseUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      /\/placeholders\//i.test(url.pathname)
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function catalogAmenities(rooms: HmsCatalogRoom[], baseUrl?: string) {
  const amenities = new Map<
    string,
    { id: string; label: string; rooms: string[]; iconUrl?: string }
  >();
  for (const room of rooms) {
    if (room.roomTypeStatus !== 1) continue;
    for (const amenity of room.roomTypeAmenities ?? []) {
      const label = amenity.amenityName?.trim();
      if (!label) continue;
      const id = amenity.amenityMasterId || label.toLowerCase();
      const item: { id: string; label: string; rooms: string[]; iconUrl?: string } = amenities.get(
        id,
      ) ?? { id, label, rooms: [] };
      const iconUrl = hmsAmenityIconUrl(amenity, baseUrl);
      if (iconUrl && !item.iconUrl) item.iconUrl = iconUrl;
      const name = room.displayName || room.typeName;
      if (!item.rooms.includes(name)) item.rooms.push(name);
      amenities.set(id, item);
    }
  }
  return [...amenities.values()].sort((a, b) => a.label.localeCompare(b.label));
}
