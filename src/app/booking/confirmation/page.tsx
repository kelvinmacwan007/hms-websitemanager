import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { HmsPayment } from "@/components/booking/HmsPayment";

export const metadata = { title: "Reservation status", robots: "noindex, nofollow" };

export default async function ConfirmationPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "booking")) notFound();
  if (!isDemoPaymentMode())
    return (
      <SiteShell hotel={hotel}>
        <HmsPayment confirmation />
      </SiteShell>
    );
  return (
    <SiteShell hotel={hotel}>
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
    </SiteShell>
  );
}
