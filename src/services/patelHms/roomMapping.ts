import { hmsAmenityIconUrl } from "./amenities.ts";
import type { HotelRoom } from "@/types/hotel";
import type { HmsRoomType, HmsCatalogRoom } from "./integrationTypes";

export function mapHmsCatalogRooms(input: HmsCatalogRoom[], baseUrl: string): HotelRoom[] {
  return input
    .filter((room) => room.roomTypeStatus === 1)
    .map((room) => {
      if (!room.id || !Number.isInteger(room.maxOccupancy) || room.maxOccupancy < 1)
        throw new Error("Invalid HMS room catalogue.");
      const name = room.displayName || room.typeName;
      return {
        id: room.id,
        slug: `room-${room.id.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
        name,
        description: room.description ?? "",
        shortDescription: room.description ?? "",
        images: (room.roomTypeImages ?? [])
          .filter((image) => image.imageNamePath)
          .map((image) => ({
            id: image.id,
            url: hmsImageUrl(image.imageNamePath, baseUrl),
            alt: name,
          })),
        amenities: (room.roomTypeAmenities ?? []).map((amenity) => ({
          id: amenity.amenityMasterId,
          label: amenity.amenityName,
          iconUrl: hmsAmenityIconUrl(amenity, baseUrl),
        })),
        occupancy: room.maxOccupancy,
        bedType: room.totalBedType,
        size: room.dimension ?? undefined,
        availabilityStatus: "unknown",
        ratePlans: [],
      };
    });
}

export function hmsImageUrl(path: string, baseUrl?: string): string {
  const url = new URL(path.replace(/\\/g, "/"), baseUrl);
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid HMS room image URL.");
  return url.href;
}

export function mapHmsRooms(input: HmsRoomType[], currency: string, baseUrl?: string): HotelRoom[] {
  if (!Array.isArray(input) || !/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid room data.");
  return input.map((room) => {
    if (
      !room.id ||
      !Number.isInteger(room.availableRooms) ||
      room.availableRooms < 0 ||
      !Number.isInteger(room.maxOccupancy) ||
      room.maxOccupancy < 1
    )
      throw new Error("Invalid room inventory or occupancy.");
    // The selected package's average covers the requested stay (including weekend rates).
    const amount = room.averageRate ?? room.roomRateByRateType ?? room.baseRate;
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid room rate.");
    const name = room.displayName || room.typeName;
    return {
      id: room.id,
      slug: `room-${room.id.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
      name,
      shortDescription: "",
      description: "",
      images: (room.roomTypeImagesPath ?? []).map((url, index) => ({
        id: `${room.id}-${index}`,
        url: hmsImageUrl(url, baseUrl),
        alt: name,
      })),
      amenities: [],
      occupancy: room.maxOccupancy,
      bedType: room.totalBedType,
      startingPrice: { amount, currency },
      availabilityStatus:
        room.availableRooms === 0 ? "sold-out" : room.availableRooms < 3 ? "limited" : "available",
      ratePlans: [
        {
          id: "hms-standard",
          name: "Standard rate",
          price: { amount, currency },
          available: room.availableRooms > 0,
          inventoryCount: room.availableRooms,
        },
      ],
    };
  });
}
