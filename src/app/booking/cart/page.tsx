import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { CartReview } from "@/components/booking/CartReview";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { resolveCart } from "@/lib/booking/cart";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

type Params = Record<string, string | string[] | undefined>;
export const metadata = { title: "Room Cart", robots: "noindex, nofollow" };

export default async function CartPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  const hotel = await provider.getHotel(tenant);
  if (!pageEnabled(hotel, "booking")) notFound();
  const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  const rooms = search ? await provider.searchAvailability(tenant, search) : [];
  const lines = search ? resolveCart(search, rooms, params) : null;

  if (!search || !lines) {
    return (
      <SiteShell hotel={hotel}>
        <main className={websiteClassName("container py-20")}>
          <Heading as="h1" className={websiteClassName("section-title")}>
            Your room selection needs updating.
          </Heading>
          <p className={websiteClassName("mt-5 text-muted")}>
            A rate, room quantity, or date is no longer valid.
          </p>
          <Link href="/booking" className={websiteClassName("brand-button mt-8")}>
            <span className={websiteClassName("button-text-container")}>
              <span className={websiteClassName("button-text")}>Search rooms</span>
            </span>
          </Link>
        </main>
      </SiteShell>
    );
  }

  const initialExtraIds = Array.isArray(params.extra)
    ? params.extra
    : typeof params.extra === "string"
      ? [params.extra]
      : [];
  return (
    <SiteShell hotel={hotel} showMobileBookingCta={false}>
      <CartReview
        hotelName={hotel.name}
        search={search}
        lines={lines}
        extras={hotel.extras ?? []}
        addOns={hotel.addOns ?? []}
        initialExtraIds={initialExtraIds}
        isDemo={isDemoPaymentMode()}
      />
    </SiteShell>
  );
}
