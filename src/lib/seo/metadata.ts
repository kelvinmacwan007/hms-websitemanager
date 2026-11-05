import type { Metadata } from "next";
import type { Hotel } from "@/types/hotel";

const pageTitles: Record<string, string> = {
  "/rooms": "Rooms & Suites",
  "/gallery": "Photo Gallery",
  "/contact": "Contact",
  "/offers": "Special Offers",
  "/about": "About",
  "/faq": "Frequently Asked Questions",
  "/reviews": "Guest Reviews",
  "/experiences": "Experiences",
  "/policies": "Hotel Policies",
  "/dining": "Menu",
  "/menu": "Menu",
  "/booking": "Find a Stay",
};

export function createHotelMetadata(hotel: Hotel, path = "", pageTitle?: string): Metadata {
  const page =
    hotel.website?.pages[
      (path === "/menu" ? "dining" : path.split("/")[1] || "home") as keyof NonNullable<
        Hotel["website"]
      >["pages"]
    ];
  const label = pageTitle ?? pageTitles[path];
  const title =
    page?.seoTitle ||
    (label
      ? `${label} | ${hotel.name}`
      : hotel.seo?.title || `${hotel.name} | Official Hotel Website`);
  const description =
    page?.seoDescription || hotel.seo?.description || hotel.tagline || hotel.description;
  const canonical = hotel.seo?.canonicalUrl
    ? `${hotel.seo.canonicalUrl.replace(/\/+$/, "")}${path}`
    : undefined;

  return {
    title,
    description,
    robots: hotel.configured ? hotel.seo?.robots || "index, follow" : "noindex, nofollow",
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      images: hotel.heroImage
        ? [{ url: hotel.heroImage.url, alt: hotel.heroImage.alt }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function hotelJsonLd(hotel: Hotel) {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.description,
    image: hotel.gallery.map((image) => image.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.location.address,
      addressLocality: hotel.location.city,
      addressRegion: hotel.location.region,
      postalCode: hotel.location.postalCode,
      addressCountry: hotel.location.country,
    },
    telephone: hotel.contact.phone,
    email: hotel.contact.email,
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
