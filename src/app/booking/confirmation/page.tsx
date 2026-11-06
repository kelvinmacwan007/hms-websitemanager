import { getBookingContext } from "@/lib/booking/context";
import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { HmsPayment } from "@/components/booking/HmsPayment";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { getCheckoutWidgetConfig } from "@/lib/payment/p98payConfig";
import { parseCartItems } from "@/lib/booking/cart";
import { selectedAddOnRequests } from "@/lib/booking/addOnRequests";
import { UatPaymentConfirmation } from "@/components/booking/UatPaymentConfirmation";

export const metadata = { title: "Reservation status", robots: "noindex, nofollow" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  if (!isDemoPaymentMode())
    return (
      <>
        <HmsPayment confirmation hotelName={hotel.name} />
      </>
    );
  const params = await searchParams;
  if (getCheckoutWidgetConfig() && params.uat === "1") {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value !== undefined) query.set(key, value);
    }
    const requestedRooms =
      parseCartItems(params) ??
      (typeof params.room === "string" ? [{ roomSlug: params.room, rateId: "", quantity: 1 }] : []);
    const roomDetails = requestedRooms.flatMap((item) => {
      const room = hotel.rooms.find((room) => room.slug === item.roomSlug);
      return room
        ? [
            {
              name: room.name,
              quantity: item.quantity,
              bedType: room.bedType,
              image: room.images[0],
            },
          ]
        : [];
    });
    const stay = {
      address: [
        hotel.location.address,
        hotel.location.city,
        hotel.location.region,
        hotel.location.country,
      ]
        .filter(Boolean)
        .join(", "),
      image: roomDetails[0]?.image ?? hotel.heroImage,
      rooms: roomDetails.map(({ name, quantity, bedType }) => ({ name, quantity, bedType })),
      addOns: selectedAddOnRequests(hotel.addOns ?? [], params.addon).map(({ item, quantity }) => ({
        name: item.name,
        quantity,
      })),
    };
    return (
      <>
        <UatPaymentConfirmation hotelName={hotel.name} query={query.toString()} stay={stay} />
      </>
    );
  }
  return (
    <>
      <BookingProgress step={4} hotelName={hotel.name} allowBack={false} demo />
      <main
        className={websiteClassName(
          "container grid min-h-[60vh] place-items-center py-12 md:py-16 lg:py-20 text-center",
        )}
      >
        <section className={websiteClassName("max-w-2xl")}>
          <p className={websiteClassName("eyebrow")}>Reservation status</p>
          <Heading as="h1" className={websiteClassName("section-title mt-4")}>
            No confirmed reservation to display.
          </Heading>
          <p className={websiteClassName("mt-6 leading-8 text-muted")}>
            A reservation is confirmed only after {hotel.name} provides a booking reference. If you
            have already contacted the hotel, check your confirmation message or ask the
            reservations team.
          </p>
          <div className={websiteClassName("mt-8 flex flex-wrap justify-center gap-3")}>
            <Link href="/booking" className={websiteClassName("brand-button")}>
              <span className={websiteClassName("button-text-container")}>
                <span className={websiteClassName("button-text")}>Search rooms</span>
              </span>
            </Link>
            <Link href="/contact" className={websiteClassName("ghost-button")}>
              Contact hotel
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
