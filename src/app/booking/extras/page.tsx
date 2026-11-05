import { getBookingContext } from "@/lib/booking/context";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartReview } from "@/components/booking/CartReview";
import { pageEnabled } from "@/lib/website/pages";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { resolveDemoSelection } from "@/lib/booking/demoSelection";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { websiteClassName } from "@/lib/ui/websiteStyles";

export const metadata = { title: "Extras & services", robots: "noindex, nofollow" };
export default async function ExtrasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { tenant, provider, hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  const rooms = search ? await provider.searchAvailability(tenant, search) : [];
  const selection = resolveDemoSelection(params, hotel, rooms);
  return (
    <>
      {selection ? (
        <CartReview
          step={2}
          hotelName={hotel.name}
          search={selection.search}
          lines={selection.lines}
          extras={hotel.extras ?? []}
          addOns={hotel.addOns ?? []}
          initialExtraIds={selection.extras.map((extra) => extra.id)}
          isDemo={isDemoPaymentMode()}
        />
      ) : (
        <main className={websiteClassName("container py-12")}>
          <h1 className={websiteClassName("section-title")}>Your room selection needs updating.</h1>
          <p className={websiteClassName("mt-4 text-muted")}>
            Choose available rooms before adding extras.
          </p>
          <Link className={websiteClassName("brand-button mt-6")} href="/booking">
            Search rooms
          </Link>
        </main>
      )}
    </>
  );
}
