import type { Hotel } from "../../types/hotel";
import type { PageKey } from "../../../Portal/content";

export function pageEnabled(hotel: Hotel, page: PageKey) {
  if (page === "home") return true;
  return hotel.website?.pages[page]?.enabled !== false;
}
export function publicNavigation(hotel: Hotel) {
  return [
    { page: "rooms", label: "Rooms", available: hotel.rooms.length > 0 },
    { page: "experiences", label: "Experiences", available: hotel.amenities.length > 0 },
    {
      page: "dining",
      label: "Menu",
      available: Boolean(hotel.menus?.length || hotel.dining?.length),
    },
    { page: "offers", label: "Offers", available: Boolean(hotel.offers?.length) },
    { page: "gallery", label: "Gallery", available: hotel.gallery.length > 0 },
    { page: "about", label: "About", available: true },
    { page: "contact", label: "Contact", available: true },
  ]
    .filter((item) => item.available && pageEnabled(hotel, item.page as PageKey))
    .map((item) => ({
      href: item.page === "dining" ? "/menu" : `/${item.page}`,
      label: item.label,
    }));
}
