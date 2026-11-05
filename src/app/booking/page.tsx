import { getBookingContext } from "@/lib/booking/context";
import { notFound, redirect } from "next/navigation";
import { cartQuery, selectRequestedRoom } from "@/lib/booking/cart";
import { selectedAddOnRequests } from "@/lib/booking/addOnRequests";
import { pageEnabled } from "@/lib/website/pages";
import { BookingPageContent } from "@/components/booking/BookingPageContent";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { DEFAULT_BOOKING_SETTINGS, offsetDate, propertyDate } from "@/lib/booking/settings";
import type { Hotel } from "@/types/hotel";
import { AddOnRequests } from "@/components/extras/AddOnRequests";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function getDefaultSearch(hotel: Hotel) {
  const settings = hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS;
  const checkIn = offsetDate(propertyDate(hotel.timeZone), settings.minAdvanceDays);
  return { checkIn, checkOut: offsetDate(checkIn, settings.minStay), guests: 2, rooms: 1 };
}

export async function generateMetadata() {
  const { hotel } = await getBookingContext();
  return createHotelMetadata(hotel, "/booking");
}

export default async function BookingPage({ searchParams }: Props) {
  const { tenant, provider, hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  const params = await searchParams;
  const parsed = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  const search =
    parsed.search ??
    (!parsed.error && Object.keys(params).length === 0 ? getDefaultSearch(hotel) : undefined);
  let error = parsed.error;
  let rooms = [] as Hotel["rooms"];
  try {
    if (search) rooms = await provider.searchAvailability(tenant, search);
  } catch {
    error = "Availability could not be checked. Please try again or contact the hotel.";
  }
  if (search) rooms = rooms.filter((room) => room.availabilityStatus !== "sold-out");
  if (search && !error && typeof params.room === "string") {
    const selection = selectRequestedRoom(search, rooms, params.room);
    if (selection) {
      const query = cartQuery(search, selection);
      selectedAddOnRequests(hotel.addOns ?? [], params.addon).forEach(({ item, quantity }) =>
        query.append("addon", JSON.stringify([item.id, quantity])),
      );
      const extras = Array.isArray(params.extra)
        ? params.extra
        : typeof params.extra === "string"
          ? [params.extra]
          : [];
      extras
        .filter((id) => hotel.extras?.some((extra) => extra.id === id))
        .forEach((id) => query.append("extra", id));
      if (typeof params.__website_preview === "string")
        query.set("__website_preview", params.__website_preview);
      redirect(`/booking/cart?${query}`);
    }
    error =
      "Your selected room is unavailable for these dates or guest counts. Please adjust your stay or choose another room.";
  }
  const isDemo = isDemoPaymentMode();

  return (
    <>
      <AddOnRequests items={hotel.addOns ?? []} selected={params.addon} />
      <BookingPageContent
        pageContent={hotel.website?.pages.booking}
        initialSearch={search}
        initialRooms={rooms}
        initialError={error}
        isDemo={isDemo}
        searchParams={params}
      />
    </>
  );
}
