import { websiteClassName } from "@/lib/ui/websiteStyles";
import { pageEnabled } from "@/lib/website/pages";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/layout/Footer";
import { isMockMode } from "@/lib/api/mode";
import type { Hotel } from "@/types/hotel";
import { BookingSettingsProvider } from "@/components/booking/BookingSettingsContext";
import { propertyDate } from "@/lib/booking/settings";
import { PageEntryMotion } from "./PageEntryMotion";
import { WebsiteCursor } from "./WebsiteCursor";
import styles from "./SiteShell.module.css";

export function SiteShell({
  hotel,
  children,
  showMobileBookingCta = true,
}: {
  hotel: Hotel;
  children: React.ReactNode;
  showMobileBookingCta?: boolean;
}) {
  return (
    <BookingSettingsProvider
      settings={hotel.bookingSettings}
      timeZone={hotel.timeZone}
      today={propertyDate(hotel.timeZone)}
    >
      <div className={`${styles.site} hotel-site`}>
        {isMockMode() ? (
          <div
            className={websiteClassName(
              "bg-brand-dark px-4 py-2 text-center text-xs font-semibold text-white",
            )}
          >
            Demo website: sample content and rates. Reservations are not enabled.
          </div>
        ) : null}
        <a href="#main-content" className={websiteClassName("skip-link")}>
          Skip to content
        </a>
        <Header hotel={hotel} />
        <div id="main-content">
          <PageEntryMotion>{children}</PageEntryMotion>
        </div>
        <Footer hotel={hotel} />
        <WebsiteCursor />
        {showMobileBookingCta && pageEnabled(hotel, "booking") ? (
          <>
            <div
              className={websiteClassName("h-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden")}
              aria-hidden="true"
            />
            <a
              href="/booking"
              className={websiteClassName(
                "brand-button fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 w-auto lg:!hidden",
              )}
            >
              Find a room
            </a>
          </>
        ) : null}
      </div>
    </BookingSettingsProvider>
  );
}
