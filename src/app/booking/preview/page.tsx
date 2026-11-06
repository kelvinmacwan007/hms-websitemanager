import { getBookingContext } from "@/lib/booking/context";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoStayPreview } from "@/components/booking/DemoStayPreview";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { parseAvailabilitySearch } from "@/lib/booking/search";

type Params = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Params> };

export const metadata = { title: "Stay overview", robots: "noindex, nofollow" };

export default async function BookingPreviewPage({ searchParams }: Props) {
  if (!isDemoPaymentMode()) notFound();

  const params = await searchParams;
  const { tenant, provider, hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  const roomSlug = typeof params.room === "string" ? params.room : "";
  const rateId = typeof params.rate === "string" ? params.rate : "";
  const room = search
    ? (await provider.searchAvailability(tenant, search)).find((item) => item.slug === roomSlug)
    : undefined;
  const rate = room?.ratePlans.find((item) => item.id === rateId);

  if (!search || !room || !rate) {
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

  const nights = Math.round(
    (Date.parse(`${search.checkOut}T00:00:00Z`) - Date.parse(`${search.checkIn}T00:00:00Z`)) /
      86400000,
  );
  const selectedIds = new Set(
    Array.isArray(params.extra)
      ? params.extra
      : typeof params.extra === "string"
        ? [params.extra]
        : [],
  );
  const extras = (hotel.extras ?? []).filter(
    (extra) => !(extra.id === "breakfast" && /breakfast/i.test(rate.mealPlan ?? "")),
  );
  const pricedExtras = extras.filter((extra) => extra.price.currency === rate.price.currency);

  return (
    <>
      <DemoStayPreview
        room={room}
        rate={rate}
        search={search}
        nights={nights}
        extras={pricedExtras}
        initialExtraIds={[...selectedIds]}
      />
    </>
  );
}
