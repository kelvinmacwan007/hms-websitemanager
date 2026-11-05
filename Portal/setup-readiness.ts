import { safeImageUrl, type WebsiteDocument } from "./content";

/** Shared by setup status, publish controls, and server-side publish validation. */
export function websiteSetupReadiness(content: WebsiteDocument, hmsRatesReady?: boolean | null) {
  const hotel = content.hotel;
  const checks = [
    { label: "Hotel information", ready: Boolean(hotel.name?.trim() && hotel.description?.trim()) },
    {
      label: "Brand",
      ready: Boolean(safeImageUrl(hotel.branding.logoUrl) && hotel.branding.primaryColor),
    },
    { label: "Rooms", ready: hotel.rooms.length > 0 },
    {
      label: "HMS rates",
      ready:
        hmsRatesReady === undefined
          ? hotel.rooms.some(
              (room) =>
                room.ratePlans.some((rate) => rate.price.amount > 0) ||
                (room.startingPrice?.amount ?? 0) > 0,
            )
          : hmsRatesReady === true,
    },
  ];
  const missing = checks.findIndex((check) => !check.ready);
  const synced = missing === -1;
  const websiteReady =
    synced &&
    Boolean(
      safeImageUrl(hotel.heroSlides?.[0]?.url || hotel.heroImage?.url) &&
      content.pages.home.title?.trim(),
    );
  const error = !synced
    ? `Complete Sync hotel data before publishing. ${checks[missing].label} ${hmsRatesReady === null && missing === 3 ? "could not be verified" : "needs attention"}.`
    : !websiteReady
      ? "Complete Website before publishing. Add a homepage image and heading."
      : "";
  return { checks, missing, synced, websiteReady, canPublish: synced && websiteReady, error };
}
