// Fallback headings; property-specific content comes from the hotel provider.
export const defaultTemplateCopy = {
  home: {
    storyEyebrow: "About the hotel",
    storyTitle: "Get to know the hotel.",
    roomsEyebrow: "Rooms",
    roomsTitle: "Find your room.",
    amenitiesEyebrow: "Featured amenities",
    amenitiesTitle: "Make yourself at home.",
    offersEyebrow: "Offers",
    offersTitle: "Offers for your stay.",
    testimonialsEyebrow: "Guest reviews",
    testimonialsTitle: "Hear from our guests.",
    galleryEyebrow: "Hotel gallery",
    galleryTitle: "A closer look at your stay.",
  },
  about: {
    eyebrow: "About the hotel",
    title: "Welcome to our hotel.",
    servicesEyebrow: "Services and spaces",
    servicesTitle: "During your stay.",
    testimonialsEyebrow: "Guest reviews",
    testimonialsTitle: "Words from our guests",
  },
  booking: {
    pageEyebrow: "Plan your stay",
    pageTitle: "Choose your dates and room.",
    finalEyebrow: "Reservations",
    finalTitle: "Ready to plan your stay?",
  },
} as const;
