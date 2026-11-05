import type { Hotel, HotelRoom } from "../../types/hotel";
import {
  createWebsiteDocument,
  parseWebsiteDocument,
  presentationPayload,
  type WebsitePresentationPayload,
} from "../../../Portal/content";

/** Rehydrate presentation over current PMS records. No operational fields are read from storage. */
export function presentationDocument(hotel: Hotel, payload: WebsitePresentationPayload) {
  if (
    payload.schemaVersion !== 1 ||
    payload.tenantId !== hotel.tenantId ||
    payload.propertyId !== hotel.id
  )
    throw new Error("Presentation property mismatch.");
  const base = createWebsiteDocument(hotel);
  const example = presentationPayload(base);
  function keys(value: unknown, allowed: string[]) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.includes(key))
    )
      throw new Error("Invalid presentation fields.");
  }
  keys(payload, Object.keys(example));
  keys(payload.content, Object.keys(example.content));
  if (!Array.isArray(payload.rooms) || !Array.isArray(payload.rateVisibility))
    throw new Error("Invalid room presentation.");
  const roomKeys = [
    "pmsRoomTypeId",
    "slug",
    "displayName",
    "shortDescription",
    "description",
    "images",
    "amenities",
    "size",
    "visible",
  ];
  const seen = new Set<string>();
  for (const edit of payload.rooms) {
    keys(edit, roomKeys);
    if (typeof edit.pmsRoomTypeId !== "string" || seen.has(edit.pmsRoomTypeId))
      throw new Error("Invalid duplicate room identifier.");
    seen.add(edit.pmsRoomTypeId);
  }
  for (const rate of payload.rateVisibility)
    keys(rate, ["pmsRoomTypeId", "pmsRatePlanId", "visible"]);
  const { website, enquiryEmail, socialLinks, ...content } = payload.content;
  const roomMap = new Map(hotel.rooms.map((room) => [room.id, room]));
  const order = [
    ...payload.rooms.map((edit) => edit.pmsRoomTypeId),
    ...hotel.rooms.map((room) => room.id),
  ];
  const rooms = [...new Set(order)].flatMap((id) => {
    const room = roomMap.get(id);
    if (!room) return [];
    const edit = payload.rooms.find((item) => item.pmsRoomTypeId === id);
    return [
      {
        ...room,
        ...(edit
          ? {
              name: edit.displayName,
              slug: edit.slug,
              shortDescription: edit.shortDescription,
              description: edit.description,
              images: edit.images,
              amenities: edit.amenities,
              size: edit.size,
              visible: edit.visible,
            }
          : {}),
        ratePlans: room.ratePlans.map((rate) => ({
          ...rate,
          visible:
            payload.rateVisibility.find(
              (item) => item.pmsRoomTypeId === id && item.pmsRatePlanId === rate.id,
            )?.visible ?? rate.visible,
        })),
      },
    ];
  });
  return parseWebsiteDocument({
    ...base,
    pages: payload.pages,
    homeSections: payload.homeSections,
    setupStep: payload.setupStep,
    promotions: payload.promotions,
    hotel: {
      ...base.hotel,
      ...content,
      heroImage: hotel.heroImage,
      branding: { ...hotel.branding, ...content.branding },
      contact: { ...hotel.contact, website, enquiryEmail, socialLinks },
      rooms,
      bookingSettings: payload.bookingSettings,
      paymentSettings: payload.paymentSettings,
    },
  });
}

export function normalizeHotel(hotel: Hotel, payload: WebsitePresentationPayload | null): Hotel {
  if (!payload) return hotel;
  const document = presentationDocument(hotel, payload);
  return {
    ...document.hotel,
    addOns: hotel.addOns,
    addOnsUnavailable: hotel.addOnsUnavailable,
    website: {
      pages: document.pages,
      homeSections: document.homeSections,
      promotions: document.promotions ?? [],
    },
  };
}

export function mergeRoomPresentation(rooms: HotelRoom[], context: HotelRoom[]) {
  return context.flatMap((edit) => {
    const room = rooms.find((item) => item.id === edit.id);
    return room
      ? [
          {
            ...room,
            name: edit.name,
            slug: edit.slug,
            shortDescription: edit.shortDescription,
            description: edit.description,
            images: edit.images,
            amenities: edit.amenities,
            size: edit.size,
            visible: edit.visible,
            ratePlans: room.ratePlans.map((rate) => ({
              ...rate,
              visible: edit.ratePlans.some((item) => item.id === rate.id)
                ? edit.ratePlans.find((item) => item.id === rate.id)?.visible
                : edit.availabilityStatus === "unknown" && !edit.ratePlans.length
                  ? rate.visible
                  : false,
            })),
          },
        ]
      : [];
  });
}

export function validatePresentation(hotel: Hotel, input: unknown): WebsitePresentationPayload {
  // Round-trip through the existing strict WebsiteDocument validator and allowlist serializer.
  const payload = input as WebsitePresentationPayload;
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(payload.rooms) ||
    !Array.isArray(payload.rateVisibility)
  )
    throw new Error("Invalid presentation payload.");
  return presentationPayload(presentationDocument(hotel, payload));
}
