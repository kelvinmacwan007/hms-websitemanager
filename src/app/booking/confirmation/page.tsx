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
    return (
      <>
        <UatPaymentConfirmation hotelName={hotel.name} query={query.toString()} />
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
