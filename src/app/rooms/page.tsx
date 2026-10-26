import { notFound } from "next/navigation";
import { RoomsExplorer } from "@/components/rooms/RoomsExplorer";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { DEFAULT_BOOKING_SETTINGS, offsetDate, propertyDate } from "@/lib/booking/settings";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import styles from "./page.module.css";
import Image from "next/image";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { roomDisplayRates } from "@/lib/booking/displayRates";

export async function generateMetadata() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  return createHotelMetadata(hotel, "/rooms");
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  const hotel = await provider.getHotel(tenant);
  if (!pageEnabled(hotel, "rooms")) notFound();
  const catalogue = await provider.getRooms(tenant);
  const params = await searchParams;
  const settings = hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS;
  const checkIn = offsetDate(propertyDate(hotel.timeZone), settings.minAdvanceDays);
  const defaultSearch = {
    checkIn,
    checkOut: offsetDate(checkIn, settings.minStay),
    guests: 2,
    rooms: 1,
  };
  const requested = params.checkIn !== undefined || params.checkOut !== undefined;
  const parsed = requested ? parseAvailabilitySearch(params, settings, hotel.timeZone) : {};
  const search = parsed.search ?? defaultSearch;
  let rooms = catalogue;
  let availabilityChecked = false;
  let error = parsed.error;
  if (requested && parsed.search) {
    try {
      const available = await provider.searchAvailability(tenant, search);
      const byId = new Map(
        available
          .filter(
            (room) =>
              room.occupancy * search.rooms >= search.guests &&
              room.ratePlans.some(
                (rate) => rate.available && (rate.inventoryCount ?? Infinity) >= search.rooms,
              ),
          )
          .map((room) => [room.id, room]),
      );
      rooms = catalogue.flatMap((room) => {
        const live = byId.get(room.id);
        return live ? [{ ...room, ...live, images: room.images, amenities: room.amenities }] : [];
      });
      availabilityChecked = true;
    } catch {
      error =
        "Availability could not be checked. Please retry or contact the hotel. Room details are still available below.";
    }
  } else if (!requested) {
    const displayed = await roomDisplayRates(provider, tenant, hotel, catalogue);
    rooms = displayed.rooms;
    if (displayed.rateError) error = "Live rates could not be loaded. Choose your dates to retry.";
  }

  return (
    <SiteShell hotel={hotel}>
      <main>
        <div className={styles.hero}>
          {(hotel.heroImage?.url || catalogue[0]?.images[0]?.url) && (
            <Image
              src={hotel.heroImage?.url || catalogue[0].images[0].url}
              alt=""
              fill
              className={styles.photo}
              sizes="100vw"
              priority
            />
          )}
          <div className={styles.shade} aria-hidden="true" />
          <div className={`${websiteClassName("container")} ${styles.content}`}>
            <p className={styles.kicker}>
              {hotel.website?.pages.rooms.eyebrow || "Rooms & suites"}
            </p>
            <Heading as="h1" surface="photo">
              {hotel.website?.pages.rooms.title || "Your space to unwind."}
            </Heading>
            <p className={styles.description}>
              {hotel.website?.pages.rooms.description ||
                "Compare rooms and amenities, then choose your dates to see available rates."}
            </p>
          </div>
        </div>
        <div className={`${websiteClassName("container")} ${styles.body}`}>
          <RoomsExplorer
            key={JSON.stringify(params)}
            rooms={rooms}
            catalogue={catalogue}
            search={search}
            availabilityChecked={availabilityChecked}
            error={error}
          />
        </div>
      </main>
    </SiteShell>
  );
}
