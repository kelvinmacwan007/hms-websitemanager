import assert from "node:assert/strict";
import test from "node:test";
import { createHotelMetadata } from "../src/lib/seo/metadata.ts";
import { demoHotel } from "../src/providers/mock/demoHotel.ts";

test("central SEO controls preserve per-page overrides, site defaults and social metadata", () => {
  const hotel = structuredClone(demoHotel);
  hotel.configured = true;
  hotel.seo = {
    title: "Official hotel website",
    description: "Default hotel description",
    canonicalUrl: "https://hotel.example.com/",
    robots: "noindex, follow",
  };
  hotel.website = {
    pages: {
      rooms: {
        enabled: true,
        seoTitle: "Custom rooms title",
        seoDescription: "Custom rooms description",
      },
    },
    homeSections: [],
    promotions: [],
  };
  const room = createHotelMetadata(hotel, "/rooms");
  assert.equal(room.title, "Custom rooms title");
  assert.equal(room.description, "Custom rooms description");
  assert.equal(room.openGraph.title, room.title);
  assert.equal(room.twitter.description, room.description);
  assert.equal(room.alternates.canonical, "https://hotel.example.com/rooms");
  assert.equal(room.robots, "noindex, follow");
  assert.equal(createHotelMetadata(hotel).title, "Official hotel website");
  assert.equal(createHotelMetadata(hotel, "/dining").title, `Dining | ${hotel.name}`);
  assert.equal(createHotelMetadata(hotel, "/dining").description, "Default hotel description");
});

test("cleared SEO defaults fall back to hotel values and do not create blank titles or robots", () => {
  const hotel = structuredClone(demoHotel);
  hotel.configured = true;
  hotel.seo = { title: "", description: "", canonicalUrl: "", robots: "" };
  const metadata = createHotelMetadata(hotel);
  assert.equal(metadata.title, `${hotel.name} | Official Hotel Website`);
  assert.equal(metadata.description, hotel.tagline || hotel.description);
  assert.equal(metadata.robots, "index, follow");
  assert.equal(metadata.alternates, undefined);
  hotel.configured = false;
  assert.equal(createHotelMetadata(hotel).robots, "noindex, nofollow");
});
