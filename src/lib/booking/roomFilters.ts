import type { HotelRoom } from "../../types/hotel";

export function filterRooms(
  rooms: HotelRoom[],
  filters: {
    amenities: string[];
    types: string[];
    stars: number;
    beds?: string[];
    guests?: number[];
    priceRange?: [number, number] | null;
  },
) {
  return rooms.filter(
    (room) =>
      (!filters.types.length || filters.types.includes(room.id)) &&
      filters.amenities.every((id) =>
        room.amenities.some((item) => item.id === id && item.enabled !== false),
      ) &&
      (!filters.stars ||
        (Number.isFinite(room.reviewRating) && (room.reviewRating ?? 0) >= filters.stars)) &&
      (!filters.beds?.length || filters.beds.includes(room.bedType || "")) &&
      (!filters.guests?.length ||
        filters.guests.some((value) =>
          value === 3 ? room.occupancy >= 3 : room.occupancy === value,
        )) &&
      (!filters.priceRange ||
        (room.startingPrice &&
          room.startingPrice.amount >= filters.priceRange[0] &&
          room.startingPrice.amount <= filters.priceRange[1])),
  );
}
