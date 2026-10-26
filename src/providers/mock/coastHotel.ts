import type { Hotel } from "@/types/hotel";
import { demoHotel } from "./demoHotel";

export const coastHotel: Hotel = {
  ...demoHotel,
  id: "coast-demo",
  tenantId: "coast-demo",
  name: "Aurelia Hotel",
  tagline: "A small seaside stay with room to slow down.",
  description: "A relaxed coastal hotel with bright rooms and easy access to the shore.",
  longDescription:
    "Enjoy a relaxed base for days by the sea in Santa Monica. Aurelia Hotel offers comfortable rooms, Wi-Fi, and parking, with space to unwind between outings. Explore the room details and contact the team to plan your arrival.",
  branding: {
    logoLayout: "wide",
    logoUrl: "/branding/aurelia-hotel-burgundy.png",
    logoLightUrl: "/branding/aurelia-hotel-burgundy.png",
    primaryColor: "#541e24",
    secondaryColor: "#7c3540",
    accentColor: "#9d4653",
    motion: { preset: "calm", smoothScroll: true },
  },
  location: {
    address: "1 Beachfront Avenue",
    city: "Santa Monica",
    region: "California",
    country: "United States",
    postalCode: "90401",
  },
  contact: { phone: "+1 310 555 0182", email: "hello@aurelia.example" },
  heroImage: {
    id: "coast-hero",
    url: "/demo/photos/photo-1499793983690-e29da59ef1c2.jpg",
    alt: "Quiet beach beside the coast",
  },
  gallery: [],
  amenities: [
    { id: "wifi", label: "Wi-Fi", iconKey: "wifi" },
    { id: "parking", label: "Parking", iconKey: "parking" },
  ],
  rooms: [
    {
      ...demoHotel.rooms[0],
      id: "coast-room",
      slug: "coast-room",
      name: "Coast Room",
      shortDescription: "A bright, comfortable base for days by the sea.",
      description: "A simple, comfortable room for an easy coastal stay.",
      images: [demoHotel.rooms[1].images[0]],
      amenities: [{ id: "wifi", label: "Wi-Fi", iconKey: "wifi" }],
      policies: ["Check-in from 3:00 PM", "Check-out until 11:00 AM", "Non-smoking room"],
      startingPrice: { amount: 219, currency: "USD" },
      ratePlans: [{ ...demoHotel.rooms[0].ratePlans[0], price: { amount: 219, currency: "USD" } }],
    },
  ],
  offers: [],
  dining: [],
  testimonials: [],
  policies: [{ title: "Check-in", description: "Check-in begins at 3:00 PM." }],
  faqs: [
    { id: "arrival", question: "When can I check in?", answer: "Check-in begins at 3:00 PM." },
    {
      id: "parking",
      question: "Is parking available?",
      answer: "Parking is available for guests.",
    },
  ],
  extras: [
    {
      id: "bike",
      name: "Bicycle rental",
      description: "A bicycle for your stay.",
      price: { amount: 35, currency: "USD" },
      charge: "per-stay",
    },
  ],
  seo: { title: "Aurelia Hotel", description: "A relaxed coastal stay in Santa Monica." },
};
