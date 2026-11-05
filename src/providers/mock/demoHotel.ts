import type { Hotel } from "@/types/hotel";

const image = (id: string, query: string, alt: string) => ({
  id,
  url: `/demo/photos/${query.split("?")[0]}.jpg`,
  alt,
});

export const demoHotel: Hotel = {
  id: "demo-hotel",
  tenantId: "demo-hotel",
  template: "default",
  name: "Brazilian Hotel",
  tagline: "Room to relax, space to reconnect. Find your own pace at Brazilian Hotel.",
  description:
    "Spend the morning by the pool, linger over lunch, or head out to explore Miami Beach. With comfortable rooms, on-site dining, and space to unwind, your day is yours.",
  longDescription:
    "Make Brazilian Hotel your base for a stay in Miami Beach. Choose a room or suite, enjoy on-site dining, and take time out by the pool or at the spa. Whether you are travelling for work, a weekend away, or time with family, explore the rooms and services to plan a stay at your own pace.",
  configured: true,
  branding: {
    logoUrl: "/branding/brazilian-hotel.png",
    logoLightUrl: "/branding/brazilian-hotel.png",
    primaryColor: "#2c2b57",
    secondaryColor: "#499e2f",
    accentColor: "#ffbf2b",
    motion: {
      preset: "expressive",
      smoothScroll: true,
    },
  },
  heroImage: image(
    "hero",
    "photo-1542314831-068cd1dbfeeb?",
    "Hotel exterior and pool at blue hour",
  ),
  location: {
    address: "1200 Ocean Drive",
    city: "Miami Beach",
    region: "Florida",
    country: "United States",
    postalCode: "33139",
    latitude: 25.782,
    longitude: -80.131,
    mapUrl: "https://maps.google.com/?q=1200+Ocean+Drive+Miami+Beach",
  },
  contact: {
    phone: "+1 305 555 0148",
    email: "reservations@demo.patelhms.com",
  },
  amenities: [
    {
      id: "wifi",
      label: "High-Speed Wi-Fi",
      iconKey: "wifi",
      description: "Stay connected throughout the hotel and in every room.",
    },
    {
      id: "pool",
      label: "Pool Deck",
      iconKey: "pool",
      description: "Take a quiet swim or settle in for an afternoon by the water.",
    },
    {
      id: "restaurant",
      label: "All-Day Dining",
      iconKey: "restaurant",
      description: "Breakfast, local favorites, and late suppers under one roof.",
    },
    {
      id: "spa",
      label: "Wellness Spa",
      iconKey: "spa",
      description: "Unwind with treatments designed around rest and recovery.",
    },
    {
      id: "parking",
      label: "Valet Parking",
      iconKey: "parking",
      description: "Arrive easily and leave the details to our team.",
    },
    {
      id: "transfer",
      label: "Airport Transfer",
      iconKey: "transfer",
      description: "Private transfers can be arranged in advance.",
    },
    {
      id: "fitness",
      label: "Fitness Studio",
      iconKey: "gym",
      description: "Keep your routine with cardio and strength equipment.",
    },
    {
      id: "luggage",
      label: "Luggage Storage",
      iconKey: "luggage",
      description: "Leave your bags with the team before check-in or after check-out.",
    },
  ],
  gallery: [
    image("g1", "photo-1566073771259-6a8506099945?", "Hotel exterior with pool and palms"),
    image("g2", "photo-1551882547-ff40c63fe5fa?", "Elegant suite bedroom"),
    image("g3", "photo-1578683010236-d716f9a3f461?", "Contemporary guest room"),
    image("g4", "photo-1551218808-94e220e084d2?", "Fine dining table setting"),
    image("g5", "photo-1540555700478-4be289fbecef?", "Spa treatment room"),
    image("g6", "photo-1590490360182-c33d57733427?", "Bright hotel lounge"),
    image("g7", "photo-1566665797739-1674de7a421a?", "Quiet guest room with warm lighting"),
    image("g8", "photo-1618773928121-c32242e63f39?", "Suite bedroom and seating area"),
    image(
      "g9",
      "photo-1514933651103-005eec06c04b?",
      "Restaurant interior ready for evening service",
    ),
  ],
  rooms: [
    {
      id: "room-deluxe",
      slug: "deluxe-city-room",
      name: "Deluxe City Room",
      shortDescription:
        "A comfortable room with city views, practical storage, and a spacious writing desk.",
      description:
        "The Deluxe City Room balances crisp contemporary lines with warm textures, creating an elegant base for business or leisure stays.",
      images: [
        image("r1", "photo-1590490360182-c33d57733427?", "Deluxe hotel room with daylight"),
        image("r1b", "photo-1578683010236-d716f9a3f461?", "Deluxe guest room seating area"),
      ],
      amenities: [
        { id: "wifi", label: "Wi-Fi", iconKey: "wifi" },
        { id: "desk", label: "Work Desk", iconKey: "business" },
        { id: "shower", label: "Rain Shower", iconKey: "spa" },
      ],
      occupancy: 2,
      bedType: "King Bed",
      size: "32 m2",
      startingPrice: { amount: 249, currency: "USD" },
      availabilityStatus: "available",
      policies: ["Check-in from 2:00 PM", "Check-out until 11:00 AM", "Non-smoking room"],
      ratePlans: [
        {
          id: "bar",
          name: "Best Available Rate",
          description: "Flexible stay with room-only pricing.",
          price: { amount: 249, currency: "USD" },
          cancellationPolicy: "Free cancellation up to 24 hours before arrival.",
          mealPlan: "Room only",
          available: true,
          inventoryCount: 8,
        },
        {
          id: "deluxe-breakfast",
          name: "Breakfast Included",
          description: "Breakfast for two each morning.",
          price: { amount: 289, currency: "USD" },
          cancellationPolicy: "Free cancellation up to 24 hours before arrival.",
          mealPlan: "Breakfast",
          available: true,
          inventoryCount: 8,
        },
      ],
    },
    {
      id: "room-premier",
      slug: "premier-sea-view",
      name: "Premier Sea View",
      shortDescription:
        "A larger room framing coastal light with a lounge corner and upgraded bath amenities.",
      description:
        "Wake to a cinematic sea view in a room designed for slow mornings, restful evenings, and attentive in-room dining.",
      images: [
        image("r2", "photo-1566665797739-1674de7a421a?", "Premium sea view room"),
        image("r2b", "photo-1551882547-ff40c63fe5fa?", "Premier room seating and bedroom"),
      ],
      amenities: [
        { id: "wifi", label: "Wi-Fi", iconKey: "wifi" },
        { id: "view", label: "Sea View", iconKey: "gallery" },
        { id: "minibar", label: "Mini Bar", iconKey: "dining" },
      ],
      occupancy: 3,
      bedType: "King Bed",
      size: "42 m2",
      startingPrice: { amount: 349, currency: "USD" },
      availabilityStatus: "limited",
      policies: ["Breakfast packages available", "Extra bed on request"],
      ratePlans: [
        {
          id: "breakfast",
          name: "Breakfast Inclusive",
          description: "Daily breakfast and flexible cancellation.",
          price: { amount: 399, currency: "USD" },
          cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
          mealPlan: "Breakfast",
          available: true,
          inventoryCount: 3,
        },
        {
          id: "premier-flex",
          name: "Flexible Room Rate",
          description: "Room only with flexible cancellation.",
          price: { amount: 349, currency: "USD" },
          cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
          mealPlan: "Room only",
          available: true,
          inventoryCount: 3,
        },
      ],
    },
    {
      id: "room-suite",
      slug: "signature-suite",
      name: "Signature Suite",
      shortDescription:
        "A spacious suite with separate living and dining areas, with room to settle in.",
      description:
        "The Signature Suite is the hotel's most expansive stay, pairing residential privacy with the rhythm of full-service hospitality.",
      images: [
        image("r3", "photo-1618773928121-c32242e63f39?", "Luxury suite bedroom"),
        image("r3b", "photo-1590490360182-c33d57733427?", "Separate suite lounge"),
      ],
      amenities: [
        { id: "wifi", label: "Wi-Fi", iconKey: "wifi" },
        { id: "lounge", label: "Private Lounge", iconKey: "business" },
        { id: "dining", label: "Dining Area", iconKey: "restaurant" },
      ],
      occupancy: 4,
      bedType: "King Bed",
      size: "68 m2",
      startingPrice: { amount: 599, currency: "USD" },
      availabilityStatus: "available",
      policies: ["Suite benefits included", "Airport transfer available"],
      ratePlans: [
        {
          id: "suite-flex",
          name: "Suite Flexible",
          description:
            "Includes breakfast, lounge access, and late checkout subject to availability.",
          price: { amount: 599, currency: "USD" },
          cancellationPolicy: "Free cancellation up to 72 hours before arrival.",
          mealPlan: "Breakfast",
          available: true,
          inventoryCount: 2,
        },
      ],
    },
    {
      id: "room-family",
      slug: "family-residence",
      name: "Family Residence",
      shortDescription:
        "Extra room to settle in together, with flexible sleeping space and a relaxed lounge.",
      description:
        "Designed for longer stays and shared mornings, the Family Residence offers space for everyone to feel at home.",
      images: [
        image("r4", "photo-1578683010236-d716f9a3f461?", "Spacious family room"),
        image("r4b", "photo-1566665797739-1674de7a421a?", "Family room seating area"),
      ],
      amenities: [
        { id: "wifi", label: "Wi-Fi", iconKey: "wifi" },
        { id: "lounge", label: "Lounge Area", iconKey: "business" },
        { id: "dining", label: "Dining Table", iconKey: "restaurant" },
      ],
      occupancy: 4,
      bedType: "King and Twin Beds",
      size: "58 m2",
      startingPrice: { amount: 449, currency: "USD" },
      availabilityStatus: "available",
      policies: ["Children welcome", "Connecting rooms on request"],
      ratePlans: [
        {
          id: "family-flex",
          name: "Family Flexible",
          description: "Breakfast for the family and flexible cancellation.",
          price: { amount: 449, currency: "USD" },
          mealPlan: "Breakfast",
          cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
          available: true,
          inventoryCount: 4,
        },
      ],
    },
  ],
  offers: [
    {
      id: "weekend",
      title: "Weekend Escape",
      badge: "Weekend Stay",
      description: "Stay two nights with breakfast, spa credits, and a relaxed late checkout.",
      image: image("o1", "photo-1500530855697-b586d89ba3ee?", "Resort breakfast terrace"),
      ctaLabel: "View Offer",
    },
    {
      id: "business",
      title: "Business Stay",
      badge: "Business Travel",
      description:
        "A streamlined weekday rate with breakfast, transfers, and meeting room credits.",
      image: image("o2", "photo-1497366811353-6870744d04b2?", "Premium meeting lounge"),
      ctaLabel: "Reserve",
    },
    {
      id: "long-stay",
      title: "Stay a Little Longer",
      badge: "Extended Stay",
      description:
        "Settle in for five nights or more with breakfast and a little extra time to explore the city.",
      image: image("o3", "photo-1551882547-ff40c63fe5fa?", "Comfortable suite for a longer stay"),
      ctaLabel: "Explore Rooms",
    },
    {
      id: "spa-retreat",
      title: "Spa Retreat",
      badge: "Wellness",
      description:
        "Pair a restful room with a treatment at the wellness spa and an easy morning breakfast.",
      image: image("o4", "photo-1540555700478-4be289fbecef?", "Peaceful spa treatment room"),
      ctaLabel: "Explore Offer",
    },
  ],
  menus: [
    {
      id: "dinner",
      name: "Dinner",
      sections: [
        {
          id: "market-salads-&-starters",
          title: "Market Salads & Starters",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Baby Gem Caesar",
              price: "$24",
              description: "Parmigiano reggiano - lemon black pepper emulsion - herb crouton",
            },
            {
              id: "dish-1",
              name: "Blue Iceberg",
              price: "$22",
              description: "Smoked bacon - point reyes blue - cherry tomato",
            },
            {
              id: "dish-2",
              name: "Maple & Bourbon Bacon",
              price: "$30",
              description: "Apple cabbage slaw - pickled mustard seeds",
            },
            {
              id: "dish-3",
              name: "Scallion Salad",
              price: "$20",
              description: "Mixed greens, gochujang vinaigrette",
            },
            {
              id: "dish-4",
              name: "Burrata",
              price: "$28",
              description: "Marinated beetroot - pickled red onions - basil oil",
            },
          ],
        },
        {
          id: "shellfish-platters",
          title: "Shellfish Platters",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Shellfish Platter",
              price: "$54",
              description:
                "Oysters - ceviche - clams - mussels - lobster. Two person minimum / price per person",
            },
          ],
        },
        {
          id: "surf-&-turf",
          title: "Surf & Turf",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Filet & Lobster Tail",
              price: "$89",
              description: "",
            },
            {
              id: "dish-1",
              name: "Filet & Grilled Prawns",
              price: "$79",
              description: "",
            },
          ],
        },
        {
          id: "sides",
          title: "Sides",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Yukon Gold Mashed Potatoes",
              price: "$19",
              description: "Parmesan crust",
            },
            {
              id: "dish-1",
              name: "Tater Tots",
              price: "$19",
              description: "",
            },
            {
              id: "dish-2",
              name: "Parmesan Truffle Fries",
              price: "$19",
              description: "",
            },
            {
              id: "dish-3",
              name: "Sweet Corn Pudding",
              price: "$19",
              description: "",
            },
            {
              id: "dish-4",
              name: "Crispy Brussels Sprouts",
              price: "$19",
              description: "To share",
            },
          ],
        },
        {
          id: "the-meats",
          title: "The Meats",
          column: "center",
          boxed: true,
          items: [
            {
              id: "dish-0",
              name: "Filet",
              price: "$58",
              description: "6oz.",
            },
            {
              id: "dish-1",
              name: "Wagyu Flat Iron",
              price: "$52",
              description: "8oz.",
            },
            {
              id: "dish-2",
              name: "Spinalis",
              price: "$78",
              description: "8oz.",
            },
            {
              id: "dish-3",
              name: "Filet",
              price: "$72",
              description: "10oz.",
            },
            {
              id: "dish-4",
              name: "Ribeye",
              price: "$81",
              description: "10oz.",
            },
            {
              id: "dish-5",
              name: "NY Strip",
              price: "$69",
              description: "14oz.",
            },
            {
              id: "dish-6",
              name: "Bone-In Filet",
              price: "$88",
              description: "14oz.",
            },
            {
              id: "dish-7",
              name: "Dry-Aged Delmonico",
              price: "$112",
              description: "14oz.",
            },
            {
              id: "dish-8",
              name: "Cowgirl Bone-In Ribeye",
              price: "$98",
              description: "16oz.",
            },
            {
              id: "dish-9",
              name: "Dry-Aged Porterhouse",
              price: "$112",
              description: "28oz.",
            },
            {
              id: "dish-10",
              name: "Dry-Aged Tomahawk",
              price: "$160",
              description: "34oz.",
            },
          ],
        },
        {
          id: "sauces",
          title: "Sauces",
          column: "center",
          boxed: true,
          items: [
            {
              id: "dish-0",
              name: "Au Poivre",
              price: "$2",
              description: "",
            },
            {
              id: "dish-1",
              name: "Red Wine",
              price: "$2",
              description: "",
            },
            {
              id: "dish-2",
              name: "Bearnaise",
              price: "$4",
              description: "",
            },
            {
              id: "dish-3",
              name: "Horseradish",
              price: "$3",
              description: "",
            },
            {
              id: "dish-4",
              name: "Chimichurri",
              price: "$2",
              description: "",
            },
          ],
        },
        {
          id: "entrees",
          title: "Entrees",
          column: "right",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Maple Rubbed Salmon",
              price: "$52",
              description: "Pickled cherry tomatoes - broccolini - olive dressing",
            },
            {
              id: "dish-1",
              name: "Free Range Chicken",
              price: "$22",
              description: "Peas & beans - confit garlic - toasted mustard seed jus",
            },
            {
              id: "dish-2",
              name: "Braised Beef Short Rib",
              price: "$56",
              description: "Creamed potatoes - roasted pepper relish - crispy shallots",
            },
            {
              id: "dish-3",
              name: "Maine Lobster Linguini",
              price: "$66",
              description: "Tomato - lemon - garlic - creamy lobster sauce",
            },
            {
              id: "dish-4",
              name: "Mushroom & Truffle Tagliatelle",
              price: "$55",
              description: "Pecorino - braised mushrooms - baby spinach",
            },
            {
              id: "dish-5",
              name: "Roasted Lamb Rack",
              price: "$66",
              description: "Glazed carrots - baby kale - rosemary jus",
            },
          ],
        },
        {
          id: "mac-&-cheese",
          title: "Mac & Cheese",
          column: "right",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Traditional",
              price: "$19",
              description: "",
            },
            {
              id: "dish-1",
              name: "Bacon",
              price: "$22",
              description: "",
            },
            {
              id: "dish-2",
              name: "Lobster",
              price: "$32",
              description: "",
            },
          ],
        },
        {
          id: "desserts",
          title: "Desserts",
          column: "right",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Bag O' Donuts",
              price: "$15",
              description: "Cinnamon sugar - dulce de leche - raspberry - chocolate",
            },
            {
              id: "dish-1",
              name: "Chocolate Cake",
              price: "$15",
              description: "Chocolate ganache sauce",
            },
            {
              id: "dish-2",
              name: "Cheesecake",
              price: "$19",
              description: "Raspberry coulis - berries",
            },
            {
              id: "dish-3",
              name: "Apple Pie",
              price: "$19",
              description: "Cinnamon crumble - maple creme fraiche",
            },
          ],
        },
      ],
    },
    {
      id: "lunch",
      name: "Lunch",
      sections: [
        {
          id: "fresh-&-seasonal",
          title: "Fresh & Seasonal",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Garden Salad",
              price: "$18",
              description: "Seasonal leaves - citrus vinaigrette",
            },
            {
              id: "dish-1",
              name: "Burrata",
              price: "$24",
              description: "Heirloom tomatoes - basil",
            },
          ],
        },
        {
          id: "lunch-favorites",
          title: "Lunch Favorites",
          column: "center",
          boxed: true,
          items: [
            {
              id: "dish-0",
              name: "Steak Frites",
              price: "$38",
              description: "Grilled flat iron - parmesan fries",
            },
            {
              id: "dish-1",
              name: "Market Fish",
              price: "$32",
              description: "Seasonal vegetables - lemon butter",
            },
            {
              id: "dish-2",
              name: "Roast Chicken Sandwich",
              price: "$24",
              description: "Sourdough - herb mayonnaise",
            },
          ],
        },
        {
          id: "something-sweet",
          title: "Something Sweet",
          column: "right",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Chocolate Cake",
              price: "$15",
              description: "Chocolate ganache",
            },
            {
              id: "dish-1",
              name: "Seasonal Sorbet",
              price: "$12",
              description: "Ask for today's flavors",
            },
          ],
        },
      ],
    },
    {
      id: "brunch",
      name: "Brunch",
      sections: [
        {
          id: "slow-mornings",
          title: "Slow Mornings",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Buttermilk Pancakes",
              price: "$22",
              description: "Berries - maple syrup",
            },
            {
              id: "dish-1",
              name: "Avocado Toast",
              price: "$20",
              description: "Sourdough - radish - herbs",
            },
          ],
        },
        {
          id: "brunch-classics",
          title: "Brunch Classics",
          column: "center",
          boxed: true,
          items: [
            {
              id: "dish-0",
              name: "Eggs Benedict",
              price: "$26",
              description: "Poached eggs - hollandaise",
            },
            {
              id: "dish-1",
              name: "Steak & Eggs",
              price: "$38",
              description: "Grilled steak - eggs your way",
            },
          ],
        },
        {
          id: "at-the-table",
          title: "At the Table",
          column: "right",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Fresh Orange Juice",
              price: "$8",
              description: "",
            },
            {
              id: "dish-1",
              name: "House Coffee",
              price: "$5",
              description: "",
            },
            {
              id: "dish-2",
              name: "Seasonal Fruit",
              price: "$12",
              description: "",
            },
          ],
        },
      ],
    },
    {
      id: "wine",
      name: "Wine List",
      sections: [
        {
          id: "sparkling",
          title: "Sparkling",
          column: "left",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "House Prosecco",
              price: "$14",
              description: "By the glass",
            },
          ],
        },
        {
          id: "white-&-rose",
          title: "White & Rose",
          column: "center",
          boxed: true,
          items: [
            {
              id: "dish-0",
              name: "Sauvignon Blanc",
              price: "$14",
              description: "By the glass",
            },
            {
              id: "dish-1",
              name: "Chardonnay",
              price: "$16",
              description: "By the glass",
            },
            {
              id: "dish-2",
              name: "Provence Rose",
              price: "$15",
              description: "By the glass",
            },
          ],
        },
        {
          id: "red",
          title: "Red",
          column: "right",
          boxed: false,
          items: [
            {
              id: "dish-0",
              name: "Pinot Noir",
              price: "$16",
              description: "By the glass",
            },
            {
              id: "dish-1",
              name: "Cabernet Sauvignon",
              price: "$18",
              description: "By the glass",
            },
          ],
        },
      ],
    },
  ],
  dining: [
    {
      id: "terrace",
      name: "The Terrace Room",
      description:
        "Seasonal dishes inspired by coastal American and international cooking, served from breakfast through late supper.",
      image: image("d1", "photo-1551218808-94e220e084d2?", "Hotel restaurant table"),
      hours: "7:00 AM - 11:00 PM",
    },
    {
      id: "lounge",
      name: "The Drawing Room",
      description:
        "Coffee, light plates, and evening refreshments in a calm lounge made for unhurried conversation.",
      image: image("d2", "photo-1514933651103-005eec06c04b?", "Warmly lit hotel lounge"),
      hours: "11:00 AM - 11:00 PM",
    },
  ],
  testimonials: [
    {
      id: "t1",
      quote: "A calm, polished stay with thoughtful service at every touchpoint.",
      guestName: "Aarav M.",
      location: "New York",
    },
    {
      id: "t2",
      quote:
        "The room was generous, breakfast was excellent, and the team made every arrival feel easy.",
      guestName: "Nisha R.",
      location: "Atlanta",
    },
    {
      id: "t3",
      quote: "A thoughtful place to return to after a full day in the city.",
      guestName: "Daniel K.",
      location: "Chicago",
    },
  ],
  policies: [
    { title: "Check-in", description: "Rooms are available from 2:00 PM on arrival day." },
    { title: "Check-out", description: "Standard check-out is 11:00 AM." },
    {
      title: "Children",
      description: "Children are welcome. Extra bed availability depends on room type.",
    },
    { title: "Pets", description: "Pets are not accommodated at the hotel." },
    { title: "Smoking", description: "Guest rooms and indoor shared spaces are non-smoking." },
    {
      title: "Cancellation",
      description: "Cancellation terms vary by rate plan and are shown with each room rate.",
    },
  ],
  faqs: [
    {
      id: "arrival",
      question: "What time can I arrive?",
      answer: "Check-in begins at 2:00 PM. Contact the hotel if you expect to arrive earlier.",
    },
    {
      id: "departure",
      question: "When is check-out?",
      answer: "Standard check-out is 11:00 AM. Late check-out depends on availability.",
    },
    {
      id: "transfer",
      question: "Can I arrange an airport transfer?",
      answer: "Yes. Please contact the hotel before arrival to request a transfer.",
    },
    {
      id: "parking",
      question: "Is parking available?",
      answer: "Valet parking is available for staying guests.",
    },
    {
      id: "fitness",
      question: "Is there a fitness studio?",
      answer: "Yes. The fitness studio has cardio and strength equipment.",
    },
    {
      id: "luggage",
      question: "Can the hotel hold my luggage?",
      answer: "The team can store luggage before check-in or after check-out.",
    },
    {
      id: "breakfast",
      question: "Is breakfast included?",
      answer:
        "Breakfast depends on the rate plan selected. Check the inclusions shown with each room rate.",
    },
    {
      id: "family",
      question: "Are families welcome?",
      answer:
        "Yes. The Family Residence accommodates up to four guests, and extra beds depend on room type.",
    },
    {
      id: "booking",
      question: "Can I book this demo online?",
      answer:
        "This demonstration displays sample rates only. No reservation or payment is processed.",
    },
  ],
  extras: [
    {
      id: "transfer",
      name: "Airport transfer",
      description: "One-way private arrival transfer.",
      price: { amount: 65, currency: "USD" },
      charge: "per-stay",
    },
    {
      id: "spa",
      name: "Spa treatment",
      description: "One 60-minute treatment during your stay.",
      price: { amount: 145, currency: "USD" },
      charge: "per-stay",
    },
    {
      id: "breakfast",
      name: "Breakfast supplement",
      description: "Add breakfast if your chosen rate is room only.",
      price: { amount: 38, currency: "USD" },
      charge: "per-night",
    },
  ],
  seo: {
    title: "Brazilian Hotel | Rooms, Dining & Stays",
    description: "Explore Brazilian Hotel, browse rooms and amenities, and plan your stay.",
  },
};
