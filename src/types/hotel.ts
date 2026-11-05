export type Tenant = {
  id: string;
  hostname: string;
};

export type Money = {
  amount: number;
  currency: string;
};

export type MotionPreset = "off" | "calm" | "expressive";

export type HotelMotionConfig = {
  preset?: MotionPreset;
  smoothScroll?: boolean;
};

export type HotelBranding = {
  header?: {
    template?: "minimal" | "centered" | "contact" | "announcement" | "transparent";
    announcementText?: string;
    announcementLabel?: string;
    announcementPage?: "/offers" | "/rooms" | "/booking" | "/contact";
  };
  logoUrl?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  logoLayout?: "compact" | "wide";
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontHeading?: string;
  fontBody?: string;
  websiteStyle?: "luxury" | "modern" | "minimal" | "classic" | "resort" | "boutique";
  buttonStyle?: "square" | "soft" | "rounded" | "pill";
  imageStyle?: "natural" | "soft" | "rounded" | "editorial";
  cornerRadius?: number;
  motion?: HotelMotionConfig;
};

export type HotelContact = {
  phone?: string;
  email?: string;
  enquiryEmail?: string;
  website?: string;
  socialLinks?: { label: string; href: string }[];
};

export type HotelLocation = {
  address: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
};

export type HotelAmenity = {
  enabled?: boolean;
  id: string;
  label: string;
  iconKey?: string;
  iconUrl?: string;
  description?: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  category?: string;
  width?: number;
  height?: number;
};

export type RatePlan = {
  visible?: boolean;
  id: string;
  name: string;
  description?: string;
  price: Money;
  mealPlan?: string;
  cancellationPolicy?: string;
  available: boolean;
  inventoryCount?: number;
};

export type HotelRoom = {
  petsAllowed?: boolean;
  reviewRating?: number;
  visible?: boolean;
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  images: GalleryImage[];
  amenities: HotelAmenity[];
  occupancy: number;
  bedType?: string;
  size?: string;
  startingPrice?: Money;
  availabilityStatus: "available" | "limited" | "sold-out" | "unknown";
  ratePlans: RatePlan[];
  policies?: string[];
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  image?: GalleryImage;
  badge?: string;
  validUntil?: string;
  ctaLabel?: string;
};

export type RestaurantMenu = {
  id: string;
  name: string;
  pdfUrl?: string;
  sections: {
    id: string;
    title: string;
    column: string;
    boxed?: boolean;
    items: {
      id: string;
      name: string;
      description: string;
      price: string;
      image?: GalleryImage;
      itemType?: "veg" | "non-veg";
      vintage?: string;
      status?: string;
      available?: boolean;
    }[];
  }[];
};

export type DiningVenue = {
  id: string;
  name: string;
  description: string;
  image?: GalleryImage;
  hours?: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  guestName: string;
  location?: string;
};

export type HotelPolicy = {
  title: string;
  description: string;
};

export type HotelFaq = {
  id: string;
  question: string;
  answer: string;
};

/** HMS catalogue rates have no verified booking charge basis. Display only. */
export type HotelAddOn = {
  id: string;
  name: string;
  description: string;
  price: Money;
  taxFree: boolean;
  startDate?: string;
  endDate?: string;
};
export type HotelExtra = {
  id: string;
  name: string;
  description: string;
  price: Money;
  charge: "per-stay" | "per-night";
};

export type Hotel = {
  addOns?: HotelAddOn[];
  addOnsUnavailable?: boolean;
  website?: Pick<
    import("../../Portal/content").WebsiteDocument,
    "pages" | "homeSections" | "promotions"
  >;
  /** Operational values supplied by PMS; never edited in Website Studio. */
  timeZone?: string;
  currency?: string;
  bookingSettings?: BookingSettings;
  paymentSettings?: PaymentSettings;
  id: string;
  tenantId: string;
  template: "default" | string;
  name: string;
  tagline?: string;
  description: string;
  longDescription?: string;
  branding: HotelBranding;
  location: HotelLocation;
  contact: HotelContact;
  heroImage?: GalleryImage;
  heroSlides?: GalleryImage[];
  gallery: GalleryImage[];
  amenities: HotelAmenity[];
  rooms: HotelRoom[];
  offers?: Offer[];
  dining?: DiningVenue[];
  menus?: RestaurantMenu[];
  testimonials?: Testimonial[];
  policies?: HotelPolicy[];
  faqs?: HotelFaq[];
  extras?: HotelExtra[];
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    robots?: string;
  };
  configured: boolean;
};

export type AvailabilitySearch = {
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  adults?: number;
  children?: number;
  pets?: number;
};

export type BookingSettings = {
  minStay: number;
  maxStay: number;
  advanceWindow: number;
  minAdvanceDays: number;
  maxRooms: number;
  requirePhone: boolean;
  requireAddress: boolean;
};

export type PaymentSettings = {
  mode: "full" | "deposit" | "pay-at-property";
  depositPercent: number;
};
