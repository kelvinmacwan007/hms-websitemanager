import { demoHotel } from "@/providers/mock/demoHotel";
import { coastHotel } from "@/providers/mock/coastHotel";
import type { HotelRoom, Tenant } from "@/types/hotel";

function cloneHotel(tenant: Tenant) {
  if (tenant.id === "coast-demo" || tenant.id === "hotel2")
    return { ...coastHotel, tenantId: tenant.id };
  if (tenant.id === "demo-hotel" || tenant.id === "hotel1")
    return { ...demoHotel, tenantId: tenant.id };
  return {
    ...demoHotel,
    id: tenant.id,
    tenantId: tenant.id,
    name: "Hotel website unavailable",
    description: "This hotel website is not configured in the mock provider.",
    configured: false,
    branding: {},
    heroImage: undefined,
    location: { address: "", city: "", country: "" },
    contact: {},
    rooms: [],
    amenities: [],
    gallery: [],
    offers: [],
    dining: [],
    menus: [],
    testimonials: [],
    policies: [],
    faqs: [],
    extras: [],
  };
}

export const mockProvider = {
  async getHotel(tenant: Tenant) {
    return cloneHotel(tenant);
  },
  async getRooms(tenant: Tenant) {
    return cloneHotel(tenant).rooms;
  },
  async getRoomBySlug(tenant: Tenant, slug: string) {
    return cloneHotel(tenant).rooms.find((room) => room.slug === slug) ?? null;
  },
  async searchAvailability(tenant: Tenant): Promise<HotelRoom[]> {
    return cloneHotel(tenant).rooms.flatMap((room) => {
      if (room.availabilityStatus === "sold-out") return [];
      const ratePlans = room.ratePlans.filter(
        (rate) => rate.available && (rate.inventoryCount ?? 0) >= 1,
      );
      return ratePlans.length ? [{ ...room, ratePlans }] : [];
    });
  },
};
