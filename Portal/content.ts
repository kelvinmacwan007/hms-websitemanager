import type { Hotel } from "@/types/hotel";
import {
  DEFAULT_BOOKING_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  bookingSettingsIssues,
} from "../src/lib/booking/settings";

export const PAGE_KEYS = [
  "home",
  "about",
  "rooms",
  "gallery",
  "offers",
  "dining",
  "experiences",
  "reviews",
  "faq",
  "policies",
  "contact",
  "booking",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];
export type PageContent = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};
export const SECTION_KEYS = [
  "story",
  "rooms",
  "amenities",
  "offers",
  "testimonials",
  "dining",
  "location",
  "gallery",
  "booking",
] as const;
export type HomeSection = {
  id: (typeof SECTION_KEYS)[number];
  enabled: boolean;
  eyebrow: string;
  title: string;
};
export type WebsitePromotion = {
  id: string;
  code: string;
  enabled: boolean;
  type: "percentage" | "fixed" | "stay-free";
  value: number;
  from: string;
  until: string;
  roomTypeIds: string[];
  buyNights: number;
  freeNights: number;
};
export type WebsiteDocument = {
  schemaVersion: 1;
  hotel: Hotel;
  pages: Record<PageKey, PageContent>;
  homeSections: HomeSection[];
  setupStep?: number;
  promotions?: WebsitePromotion[];
};
export const PAGE_LABELS: Record<PageKey, string> = {
  home: "Homepage",
  about: "About us",
  rooms: "Rooms",
  gallery: "Gallery",
  offers: "Offers",
  dining: "Menu",
  experiences: "Experiences",
  reviews: "Guest reviews",
  faq: "FAQs",
  policies: "Policies",
  contact: "Contact",
  booking: "Booking",
};

const headings: Record<PageKey, string> = {
  home: "A stay to remember.",
  about: "Welcome to our hotel.",
  rooms: "Your space to unwind.",
  gallery: "A closer look at your stay.",
  offers: "More reasons to stay.",
  dining: "Menus",
  experiences: "Make the most of your stay.",
  reviews: "Words from our guests.",
  faq: "A little help before you arrive.",
  policies: "The details of your stay.",
  contact: "Speak with the hotel directly.",
  booking: "Find the room that fits your stay.",
};

export function defaultHotelDescription(name: string): string {
  return `Welcome to ${name.trim() || "our hotel"}. Explore our rooms, plan your stay, and contact our team for assistance.`;
}

export function createWebsiteDocument(hotel?: Hotel): WebsiteDocument {
  const initial: Hotel = hotel ?? {
    id: "my-hotel",
    tenantId: "my-hotel",
    template: "default",
    configured: true,
    name: "Your hotel",
    tagline: "A stay to remember.",
    description: "",
    longDescription: "",
    branding: {
      primaryColor: "#173b3f",
      secondaryColor: "#d6c4a4",
      accentColor: "#b38b59",
      fontHeading: "Georgia",
      fontBody: "Arial",
    },
    location: { address: "", city: "", country: "" },
    contact: {},
    rooms: [],
    gallery: [],
    amenities: [],
    offers: [],
    dining: [],
    testimonials: [],
    policies: [],
    faqs: [],
    extras: [],
  };
  const contentHotel = structuredClone(initial);
  contentHotel.description =
    contentHotel.description.trim() || defaultHotelDescription(contentHotel.name);
  // Live HMS add-ons and resolved page configuration are runtime data, not editor fields.
  delete contentHotel.addOns;
  delete contentHotel.addOnsUnavailable;
  delete contentHotel.website;
  return {
    schemaVersion: 1,
    hotel: contentHotel,
    setupStep: 0,
    promotions: [],
    pages: Object.fromEntries(
      PAGE_KEYS.map((key) => [
        key,
        {
          enabled: true,
          eyebrow: PAGE_LABELS[key],
          title: key === "home" ? initial.tagline || headings.home : headings[key],
          description: "",
          seoTitle: "",
          seoDescription: "",
        },
      ]),
    ) as Record<PageKey, PageContent>,
    homeSections: [
      {
        id: "story",
        enabled: true,
        eyebrow: "About the hotel",
        title: "Get to know the hotel.",
      },
      {
        id: "rooms",
        enabled: true,
        eyebrow: "Rooms",
        title: "Find your room.",
      },
      {
        id: "amenities",
        enabled: true,
        eyebrow: "Featured amenities",
        title: "Make yourself at home.",
      },
      {
        id: "offers",
        enabled: true,
        eyebrow: "Offers",
        title: "Explore our latest offers.",
      },
      {
        id: "testimonials",
        enabled: true,
        eyebrow: "Guest reviews",
        title: "Hear from our guests.",
      },
      {
        id: "dining",
        enabled: true,
        eyebrow: "Menu",
        title: "Explore our menus.",
      },
      { id: "location", enabled: true, eyebrow: "Location", title: "Find us." },
      {
        id: "gallery",
        enabled: true,
        eyebrow: "Hotel gallery",
        title: "A closer look at your stay.",
      },
      {
        id: "booking",
        enabled: true,
        eyebrow: "Reservations",
        title: "Ready to plan your stay?",
      },
    ].sort(
      (a, b) =>
        [
          "rooms",
          "story",
          "amenities",
          "offers",
          "dining",
          "testimonials",
          "gallery",
          "booking",
          "location",
        ].indexOf(a.id) -
        [
          "rooms",
          "story",
          "amenities",
          "offers",
          "dining",
          "testimonials",
          "gallery",
          "booking",
          "location",
        ].indexOf(b.id),
    ) as HomeSection[],
  };
}

export type ContentPath = Array<string | number>;
export function valueAt(document: unknown, path: ContentPath): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      value && typeof value === "object"
        ? (value as Record<string | number, unknown>)[key]
        : undefined,
    document,
  );
}
export function updateAt<T>(document: T, path: ContentPath, value: unknown): T {
  if (!path.length) return value as T;
  const [key, ...rest] = path;
  if (["__proto__", "constructor", "prototype"].includes(String(key)))
    throw new Error("Invalid content path.");
  const source = document as Record<string | number, unknown> | undefined;
  const result = Array.isArray(document) ? [...document] : { ...source };
  (result as Record<string | number, unknown>)[key] = updateAt(source?.[key], rest, value);
  return result as T;
}

export function safeImageUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) return value;
  if (/^\/(?!\/)[^\\\s]*$/.test(value)) return value;
  try {
    return new URL(value).protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

// Structural validation protects the editor from malformed imports and stored drafts.
type Rule =
  | "string"
  | "number"
  | "boolean"
  | { fields: Record<string, Rule>; optional?: boolean }
  | { items: Rule; optional?: boolean }
  | { type: "string" | "number" | "boolean"; optional: true };
const optionalString: Rule = { type: "string", optional: true };
const optionalNumber: Rule = { type: "number", optional: true };
const optionalBoolean: Rule = { type: "boolean", optional: true };
const object = (fields: Record<string, Rule>, optional = false): Rule => ({
  fields,
  optional,
});
const array = (items: Rule, optional = false): Rule => ({ items, optional });
const image = object({
  id: "string",
  url: "string",
  alt: "string",
  category: optionalString,
  width: optionalNumber,
  height: optionalNumber,
});
const money = object({ amount: "number", currency: "string" });
const amenity = object({
  enabled: optionalBoolean,
  id: "string",
  label: "string",
  iconKey: optionalString,
  iconUrl: optionalString,
  description: optionalString,
});
const schema = object({
  schemaVersion: "number",
  setupStep: optionalNumber,
  promotions: array(
    object({
      id: "string",
      code: "string",
      enabled: "boolean",
      type: "string",
      value: "number",
      from: "string",
      until: "string",
      roomTypeIds: array("string"),
      buyNights: "number",
      freeNights: "number",
    }),
    true,
  ),
  hotel: object({
    timeZone: optionalString,
    currency: optionalString,
    bookingSettings: object(
      {
        minStay: "number",
        maxStay: "number",
        advanceWindow: "number",
        minAdvanceDays: "number",
        maxRooms: "number",
        requirePhone: "boolean",
        requireAddress: "boolean",
      },
      true,
    ),
    paymentSettings: object({ mode: "string", depositPercent: "number" }, true),
    id: "string",
    tenantId: "string",
    template: "string",
    configured: "boolean",
    name: "string",
    tagline: optionalString,
    description: "string",
    longDescription: optionalString,
    branding: object({
      header: object(
        {
          template: optionalString,
          announcementText: optionalString,
          announcementLabel: optionalString,
          announcementPage: optionalString,
        },
        true,
      ),
      logoUrl: optionalString,
      logoLightUrl: optionalString,
      logoDarkUrl: optionalString,
      logoLayout: optionalString,
      faviconUrl: optionalString,
      primaryColor: optionalString,
      secondaryColor: optionalString,
      accentColor: optionalString,
      fontHeading: optionalString,
      fontBody: optionalString,
      websiteStyle: optionalString,
      buttonStyle: optionalString,
      imageStyle: optionalString,
      cornerRadius: optionalNumber,
      motion: object(
        {
          preset: optionalString,
          smoothScroll: { type: "boolean", optional: true },
        },
        true,
      ),
    }),
    location: object({
      address: "string",
      city: "string",
      country: "string",
      region: optionalString,
      postalCode: optionalString,
      latitude: optionalNumber,
      longitude: optionalNumber,
      mapUrl: optionalString,
    }),
    contact: object({
      phone: optionalString,
      email: optionalString,
      enquiryEmail: optionalString,
      website: optionalString,
      socialLinks: array(object({ label: "string", href: "string" }), true),
    }),
    heroImage: {
      ...(image as { fields: Record<string, Rule> }),
      optional: true,
    },
    heroSlides: array(image, true),
    gallery: array(image),
    amenities: array(amenity),
    rooms: array(
      object({
        visible: optionalBoolean,
        id: "string",
        slug: "string",
        name: "string",
        shortDescription: "string",
        description: "string",
        images: array(image),
        amenities: array(amenity),
        occupancy: "number",
        reviewRating: optionalNumber,
        bedType: optionalString,
        size: optionalString,
        startingPrice: object({ amount: "number", currency: "string" }, true),
        availabilityStatus: "string",
        ratePlans: array(
          object({
            visible: optionalBoolean,
            id: "string",
            name: "string",
            description: optionalString,
            price: money,
            mealPlan: optionalString,
            cancellationPolicy: optionalString,
            available: "boolean",
            inventoryCount: optionalNumber,
          }),
        ),
        policies: array("string", true),
      }),
    ),
    offers: array(
      object({
        id: "string",
        title: "string",
        description: "string",
        image: {
          ...(image as { fields: Record<string, Rule> }),
          optional: true,
        },
        badge: optionalString,
        validUntil: optionalString,
        ctaLabel: optionalString,
      }),
      true,
    ),
    menus: array(
      object({
        id: "string",
        name: "string",
        pdfUrl: optionalString,
        sections: array(
          object({
            id: "string",
            title: "string",
            column: "string",
            boxed: "boolean",
            items: array(
              object({
                id: "string",
                name: "string",
                description: "string",
                price: "string",
                image: { ...(image as { fields: Record<string, Rule> }), optional: true },
                itemType: optionalString,
                vintage: optionalString,
                status: optionalString,
                available: optionalBoolean,
              }),
            ),
          }),
        ),
      }),
      true,
    ),
    dining: array(
      object({
        id: "string",
        name: "string",
        description: "string",
        image: {
          ...(image as { fields: Record<string, Rule> }),
          optional: true,
        },
        hours: optionalString,
      }),
      true,
    ),
    testimonials: array(
      object({
        id: "string",
        quote: "string",
        guestName: "string",
        location: optionalString,
      }),
      true,
    ),
    policies: array(object({ title: "string", description: "string" }), true),
    faqs: array(object({ id: "string", question: "string", answer: "string" }), true),
    extras: array(
      object({
        id: "string",
        name: "string",
        description: "string",
        price: money,
        charge: "string",
      }),
      true,
    ),
    seo: object(
      {
        title: optionalString,
        description: optionalString,
        canonicalUrl: optionalString,
        robots: optionalString,
      },
      true,
    ),
  }),
  pages: object(
    Object.fromEntries(
      PAGE_KEYS.map((key) => [
        key,
        object({
          enabled: "boolean",
          eyebrow: "string",
          title: "string",
          description: "string",
          seoTitle: "string",
          seoDescription: "string",
        }),
      ]),
    ),
  ),
  homeSections: array(
    object({
      id: "string",
      enabled: "boolean",
      eyebrow: "string",
      title: "string",
    }),
  ),
});

function checkShape(value: unknown, rule: Rule, path: string): void {
  if (typeof rule !== "string" && rule.optional && value === undefined) return;
  if (typeof rule === "string" || "type" in rule) {
    const type = typeof rule === "string" ? rule : rule.type;
    if (typeof value !== type || (type === "number" && !Number.isFinite(value)))
      throw new Error(`${path} must be ${type}.`);
    return;
  }
  if ("items" in rule) {
    if (!Array.isArray(value) || value.length > 250)
      throw new Error(`${path} must be a list with at most 250 items.`);
    value.forEach((item, index) => checkShape(item, rule.items, `${path}[${index + 1}]`));
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must be an object.`);
  const data = value as Record<string, unknown>;
  for (const key of Object.keys(data))
    if (!(key in rule.fields) || ["__proto__", "prototype", "constructor"].includes(key))
      throw new Error(`Unknown field: ${path}.${key}.`);
  for (const [key, field] of Object.entries(rule.fields))
    checkShape(data[key], field, `${path}.${key}`);
}

export function parseWebsiteDocument(value: unknown): WebsiteDocument {
  checkShape(value, schema, "Website");
  const document = value as WebsiteDocument;
  if ((document.hotel.heroSlides?.length || 0) > 7)
    throw new Error("A banner can contain at most 7 images.");
  if (
    document.setupStep !== undefined &&
    (!Number.isInteger(document.setupStep) || document.setupStep < 0 || document.setupStep > 6)
  )
    throw new Error("Invalid setup step.");
  if (
    document.hotel.bookingSettings &&
    bookingSettingsIssues(document.hotel.bookingSettings).length
  )
    throw new Error(bookingSettingsIssues(document.hotel.bookingSettings).join(" "));
  if (
    document.hotel.paymentSettings &&
    (!["full", "deposit", "pay-at-property"].includes(document.hotel.paymentSettings.mode) ||
      !Number.isFinite(document.hotel.paymentSettings.depositPercent) ||
      document.hotel.paymentSettings.depositPercent < 1 ||
      document.hotel.paymentSettings.depositPercent > 100)
  )
    throw new Error("Invalid payment settings.");
  if (document.schemaVersion !== 1)
    throw new Error("This file uses an unsupported website format.");
  if (
    document.homeSections.length !== SECTION_KEYS.length ||
    new Set(document.homeSections.map((section) => section.id)).size !== SECTION_KEYS.length ||
    document.homeSections.some((section) => !SECTION_KEYS.includes(section.id))
  )
    throw new Error("Homepage sections must include each supported section exactly once.");
  if (
    document.hotel.rooms.some(
      (room) => !["available", "limited", "sold-out", "unknown"].includes(room.availabilityStatus),
    )
  )
    throw new Error("Invalid room availability status.");
  if (document.hotel.extras?.some((extra) => !["per-stay", "per-night"].includes(extra.charge)))
    throw new Error("Invalid extra charge type.");
  if (
    document.hotel.branding.logoLayout &&
    !["compact", "wide"].includes(document.hotel.branding.logoLayout)
  )
    throw new Error("Invalid logo layout.");
  if (
    document.hotel.branding.motion?.preset &&
    !["off", "calm", "expressive"].includes(document.hotel.branding.motion.preset)
  )
    throw new Error("Invalid motion preset.");
  const brand = document.hotel.branding;
  if (
    brand.header?.template &&
    !["minimal", "centered", "contact", "announcement", "transparent"].includes(
      brand.header.template,
    )
  )
    throw new Error("Invalid header template.");
  if (
    brand.header?.announcementPage &&
    !["/offers", "/rooms", "/booking", "/contact"].includes(brand.header.announcementPage)
  )
    throw new Error("Invalid announcement page.");
  if (
    (brand.header?.announcementText?.length ?? 0) > 180 ||
    (brand.header?.announcementLabel?.length ?? 0) > 40
  )
    throw new Error(
      "Keep the announcement under 180 characters and its link label under 40 characters.",
    );
  for (const [key, values] of [
    ["websiteStyle", ["luxury", "modern", "minimal", "classic", "resort", "boutique"]],
    ["buttonStyle", ["square", "soft", "rounded", "pill"]],
    ["imageStyle", ["natural", "soft", "rounded", "editorial"]],
  ] as const) {
    if (brand[key] && !(values as readonly string[]).includes(brand[key]!))
      throw new Error(`Invalid ${key}.`);
  }
  if (brand.cornerRadius !== undefined && (brand.cornerRadius < 0 || brand.cornerRadius > 24))
    throw new Error("Invalid corner radius.");
  return structuredClone({
    ...document,
    hotel: {
      ...document.hotel,
      description:
        document.hotel.description.trim() || defaultHotelDescription(document.hotel.name),
      rooms: document.hotel.rooms.map((room) => ({
        ...room,
        visible: room.visible ?? true,
        ratePlans: room.ratePlans.map((rate) => ({
          ...rate,
          visible: rate.visible ?? true,
        })),
      })),
      bookingSettings: document.hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS,
      paymentSettings: document.hotel.paymentSettings ?? DEFAULT_PAYMENT_SETTINGS,
    },
  });
}

export function contentIssues(document: WebsiteDocument): string[] {
  const issues: string[] = [];
  const codes = new Set<string>();
  for (const promo of document.promotions ?? []) {
    const code = promo.code.trim().toUpperCase();
    if (!code || !/^[A-Z0-9_-]{1,40}$/.test(code) || codes.has(code))
      issues.push(
        "Promotion codes must be unique and contain only letters, numbers, hyphens, or underscores.",
      );
    codes.add(code);
    const validDate = (date: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date;
    if (!validDate(promo.from) || !validDate(promo.until) || promo.from > promo.until)
      issues.push(`${code || "Promotion"}: choose a valid date range.`);
    if (
      !["percentage", "fixed", "stay-free"].includes(promo.type) ||
      (promo.type === "percentage" && (promo.value <= 0 || promo.value > 100)) ||
      (promo.type === "fixed" && promo.value <= 0)
    )
      issues.push(`${code || "Promotion"}: enter a valid discount.`);
    if (
      promo.type === "stay-free" &&
      (!Number.isInteger(promo.buyNights) ||
        promo.buyNights < 1 ||
        !Number.isInteger(promo.freeNights) ||
        promo.freeNights < 1 ||
        promo.buyNights + promo.freeNights > 30)
    )
      issues.push(
        `${code || "Promotion"}: paid and free nights must be positive whole numbers totalling no more than 30.`,
      );
    if (
      new Set(promo.roomTypeIds).size !== promo.roomTypeIds.length ||
      promo.roomTypeIds.some((id) => !document.hotel.rooms.some((room) => room.id === id))
    )
      issues.push(`${code || "Promotion"}: select valid PMS room types.`);
  }
  issues.push(...bookingSettingsIssues(document.hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS));
  if (!document.hotel.name.trim()) issues.push("Add a hotel name in General.");
  if (!document.hotel.description.trim()) issues.push("Add a hotel description in General.");
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      const ids = value.flatMap((item) =>
        item && typeof item === "object" && "id" in item ? [item.id] : [],
      );
      if (new Set(ids).size !== ids.length) issues.push(`${path}: item IDs must be unique.`);
      value.forEach((item, index) => visit(item, `${path} / ${index + 1}`));
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        const label = `${path} / ${key}`;
        if (typeof child === "string" && child) {
          if (
            ["url", "logoUrl", "logoLightUrl", "logoDarkUrl", "faviconUrl"].includes(key) &&
            !safeImageUrl(child)
          )
            issues.push(`${label}: use an HTTPS image URL, a /local/path, or an uploaded image.`);
          if (["href", "website", "mapUrl", "canonicalUrl"].includes(key)) {
            try {
              if (new URL(child).protocol !== "https:") throw new Error();
            } catch {
              issues.push(`${label}: enter a full HTTPS URL.`);
            }
          }
          if (key.endsWith("Color") && !/^#[\da-f]{6}$/i.test(child))
            issues.push(`${label}: use a six-digit hex color.`);
          if (["email", "enquiryEmail"].includes(key) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(child))
            issues.push(`${label}: enter a valid email address.`);
          if (key === "currency" && !/^[A-Z]{3}$/.test(child))
            issues.push(`${label}: use a three-letter currency code.`);
          if (key === "slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(child))
            issues.push(`${label}: use lowercase words separated by hyphens.`);
        }
        if (
          typeof child === "number" &&
          ((["amount", "inventoryCount"].includes(key) && child < 0) ||
            (key === "occupancy" && (!Number.isInteger(child) || child < 1)))
        )
          issues.push(`${label}: enter a valid positive value.`);
        visit(child, label);
      }
    }
  };
  visit(document.hotel, "Hotel");
  const slugs = document.hotel.rooms.map((room) => room.slug);
  if (new Set(slugs).size !== slugs.length) issues.push("Room URL slugs must be unique.");
  document.hotel.rooms.forEach((room, index) => {
    if (!room.name.trim() || !room.slug.trim())
      issues.push(`Room ${index + 1}: add a name and URL slug.`);
  });
  return issues;
}

export function draftStorageKey(tenantId: string): string {
  return `patel-hms:website-manager:v1:${encodeURIComponent(tenantId)}`;
}

/** Restore presentation without replacing the authoritative PMS snapshot. */
export function preservePmsData(draft: WebsiteDocument, current: WebsiteDocument): WebsiteDocument {
  if (draft.hotel.id !== current.hotel.id || draft.hotel.tenantId !== current.hotel.tenantId)
    throw new Error("This draft belongs to another hotel.");
  const ordered = [
    ...draft.hotel.rooms.flatMap(
      (edit) => current.hotel.rooms.find((room) => room.id === edit.id) ?? [],
    ),
    ...current.hotel.rooms.filter((room) => !draft.hotel.rooms.some((edit) => edit.id === room.id)),
  ];
  const rooms = ordered.map((room) => {
    const edit = draft.hotel.rooms.find((item) => item.id === room.id);
    if (!edit) return room;
    return {
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
        visible: edit.ratePlans.find((item) => item.id === rate.id)?.visible ?? rate.visible,
      })),
    };
  });
  return {
    ...draft,
    hotel: {
      ...draft.hotel,
      id: current.hotel.id,
      tenantId: current.hotel.tenantId,
      template: current.hotel.template,
      configured: current.hotel.configured,
      timeZone: current.hotel.timeZone,
      currency: current.hotel.currency,
      location: current.hotel.location,
      extras: current.hotel.extras,
      heroImage: current.hotel.heroImage,
      contact: {
        ...draft.hotel.contact,
        phone: current.hotel.contact.phone,
        email: current.hotel.contact.email,
      },
      rooms,
    },
  };
}

/** Backend stores presentation/settings only, keyed by PMS IDs. */
export function presentationPayload(document: WebsiteDocument) {
  const { hotel } = document;
  return {
    schemaVersion: 1 as const,
    propertyId: hotel.id,
    tenantId: hotel.tenantId,
    setupStep: document.setupStep ?? 0,
    pages: document.pages,
    homeSections: document.homeSections,
    content: {
      name: hotel.name,
      tagline: hotel.tagline,
      description: hotel.description,
      longDescription: hotel.longDescription,
      branding: hotel.branding,
      heroImage: hotel.heroImage,
      heroSlides: hotel.heroSlides,
      gallery: hotel.gallery,
      amenities: hotel.amenities,
      offers: hotel.offers,
      dining: hotel.dining,
      menus: hotel.menus,
      testimonials: hotel.testimonials,
      policies: hotel.policies,
      faqs: hotel.faqs,
      seo: hotel.seo,
      website: hotel.contact.website,
      enquiryEmail: hotel.contact.enquiryEmail?.trim() || undefined,
      socialLinks: hotel.contact.socialLinks,
    },
    rooms: hotel.rooms.map((room) => ({
      pmsRoomTypeId: room.id,
      slug: room.slug,
      displayName: room.name,
      shortDescription: room.shortDescription,
      description: room.description,
      images: room.images,
      amenities: room.amenities,
      size: room.size,
      visible: room.visible !== false,
    })),
    rateVisibility: hotel.rooms.flatMap((room) =>
      room.ratePlans.map((rate) => ({
        pmsRoomTypeId: room.id,
        pmsRatePlanId: rate.id,
        visible: rate.visible !== false,
      })),
    ),
    bookingSettings: hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS,
    promotions: (document.promotions ?? []).map((promo) => ({
      ...promo,
      code: promo.code.trim().toUpperCase(),
    })),
    paymentSettings: hotel.paymentSettings ?? DEFAULT_PAYMENT_SETTINGS,
  };
}
export type WebsitePresentationPayload = ReturnType<typeof presentationPayload>;

export function parseDraft(
  raw: string,
  tenantId: string,
): { content: WebsiteDocument; savedAt: string } {
  const draft = JSON.parse(raw) as { content?: unknown; savedAt?: unknown };
  if (!draft || typeof draft.savedAt !== "string" || !Number.isFinite(Date.parse(draft.savedAt)))
    throw new Error("The saved draft is not valid.");
  const content = parseWebsiteDocument(draft.content);
  if (content.hotel.tenantId !== tenantId) throw new Error("This draft belongs to another hotel.");
  return { content, savedAt: draft.savedAt };
}
