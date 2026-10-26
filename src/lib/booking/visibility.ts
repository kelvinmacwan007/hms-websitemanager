import type { HotelRoom } from "../../types/hotel";

/** Undefined preserves existing integrations. Explicit false always hides an item. */
export function visibleRooms(rooms: HotelRoom[]): HotelRoom[] {
  return rooms.flatMap((room) => {
    if (room.visible === false) return [];
    const ratePlans = room.ratePlans.filter((rate) => rate.visible !== false);
    if (!ratePlans.length && room.availabilityStatus !== "unknown") return [];
    return [
      {
        ...room,
        amenities: room.amenities.filter((amenity) => amenity.enabled !== false),
        ratePlans,
        startingPrice: ratePlans.length
          ? ratePlans.reduce(
              (min, rate) => (rate.price.amount < min.amount ? rate.price : min),
              ratePlans[0].price,
            )
          : room.startingPrice,
      },
    ];
  });
}
