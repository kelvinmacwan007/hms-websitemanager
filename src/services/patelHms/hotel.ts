import type { Hotel, Tenant } from "@/types/hotel";
import { getPropertyContext } from "./propertyContext";
import { fetchRooms } from "./rooms";
import { mergeRoomPresentation } from "@/lib/website/presentation";
import { fetchAddOns } from "./addOns";

export async function fetchHotelContext(tenant: Tenant): Promise<Hotel> {
  const [hotel, operational, addOns] = await Promise.all([
    getPropertyContext(tenant),
    fetchRooms(tenant),
    fetchAddOns(tenant).then(
      (items) => ({ items, unavailable: false }),
      () => ({ items: [], unavailable: true }),
    ),
  ]);
  const edited = new Map(
    mergeRoomPresentation(operational, hotel.rooms).map((room) => [room.id, room]),
  );
  const rooms = operational.map((room) => ({
    ...(edited.get(room.id) ?? room),
    images: room.images,
  }));
  const gallery = [
    ...new Map(rooms.flatMap((room) => room.images).map((image) => [image.url, image])).values(),
  ];
  return {
    ...hotel,
    rooms,
    gallery,
    heroImage: hotel.heroImage,
    heroSlides: hotel.heroSlides ?? [],
    addOns: addOns.items,
    addOnsUnavailable: addOns.unavailable,
  };
}
