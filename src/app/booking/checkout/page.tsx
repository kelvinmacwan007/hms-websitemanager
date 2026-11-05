import { getBookingContext } from "@/lib/booking/context";
import { pageEnabled } from "@/lib/website/pages";
import { AddOnRequests } from "@/components/extras/AddOnRequests";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoCheckout } from "@/components/booking/DemoCheckout";
import { HmsCheckout } from "@/components/booking/HmsCheckout";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { resolveDemoSelection } from "@/lib/booking/demoSelection";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { getCheckoutWidgetConfig } from "@/lib/payment/p98payConfig";

type Params = Record<string, string | string[] | undefined>;

export const metadata = { title: "Guest checkout", robots: "noindex, nofollow" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { tenant, provider, hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  const rooms = search ? await provider.searchAvailability(tenant, search) : [];
  const selection = resolveDemoSelection(params, hotel, rooms);

  if (!selection) {
    return (
      <>
        <main className={websiteClassName("container py-20")}>
          <Heading as="h1" className={websiteClassName("section-title")}>
            This sample stay is no longer available.
          </Heading>
          <Link href="/booking" className={websiteClassName("brand-button mt-8")}>
            <span className={websiteClassName("button-text-container")}>
              <span className={websiteClassName("button-text")}>Search again</span>
            </span>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      {!isDemoPaymentMode() && (
        <BookingProgress
          step={3}
          hotelName={hotel.name}
          query={selection.query.toString()}
          demo={isDemoPaymentMode()}
        />
      )}
      <AddOnRequests items={hotel.addOns ?? []} selected={params.addon} />
      {!isDemoPaymentMode() ? (
        <HmsCheckout
          hotelName={hotel.name}
          lines={selection.lines}
          search={selection.search}
          query={selection.query.toString()}
          estimate={selection.estimate}
          currency={selection.currency}
          extras={selection.extras}
        />
      ) : (
        <DemoCheckout
          widgetConfig={getCheckoutWidgetConfig()}
          settings={hotel.bookingSettings}
          hotelName={hotel.name}
          lines={selection.lines}
          search={selection.search}
          nights={selection.nights}
          extras={selection.extras}
          estimate={selection.estimate}
          policies={hotel.policies ?? []}
          backHref={`/booking/extras?${selection.query}`}
          paymentHref={`/booking/payment?${selection.query}`}
        />
      )}
    </>
  );
}
