import { getBookingContext } from "@/lib/booking/context";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoPayment } from "@/components/booking/DemoPayment";
import { HmsPayment } from "@/components/booking/HmsPayment";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { cartSubtotal } from "@/lib/booking/cart";
import { resolveDemoSelection } from "@/lib/booking/demoSelection";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { getCheckoutWidgetConfig } from "@/lib/payment/p98payConfig";

type Params = Record<string, string | string[] | undefined>;

export const metadata = { title: "Reservation payment", robots: "noindex, nofollow" };

export default async function PaymentPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { tenant, provider, hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  if (!isDemoPaymentMode())
    return (
      <>
        <HmsPayment hotelName={hotel.name} />
      </>
    );
  const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  const rooms = search ? await provider.searchAvailability(tenant, search) : [];
  const selection = resolveDemoSelection(params, hotel, rooms);

  if (!selection) {
    return (
      <>
        <main className={websiteClassName("container py-20")}>
          <Heading as="h1" className={websiteClassName("section-title")}>
            This stay is no longer available.
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
      <DemoPayment
        widgetConfig={getCheckoutWidgetConfig()}
        hotelName={hotel.name}
        lines={selection.lines}
        search={selection.search}
        nights={selection.nights}
        extras={selection.extras}
        roomSubtotal={cartSubtotal(selection.lines, selection.nights)}
        estimate={selection.estimate}
        currency={selection.currency}
        backHref={`/booking/checkout?${selection.query}`}
        selectionQuery={selection.query.toString()}
      />
    </>
  );
}
