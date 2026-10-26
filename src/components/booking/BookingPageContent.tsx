import { formatStayDate } from "@/lib/utils/format";
import { partySummary } from "@/lib/booking/party";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import styles from "./BookingPageContent.styles";
import Link from "next/link";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { RoomCartPicker } from "@/components/booking/RoomCartPicker";
import { parseCartItems } from "@/lib/booking/cart";
import { defaultTemplateCopy as copy } from "@/templates/default/copy";
import type { AvailabilitySearch, HotelRoom } from "@/types/hotel";
import { CalendarDays, Users, SearchX, CircleAlert } from "lucide-react";
import layout from "./BookingPageContent.module.css";

type Props = {
  pageContent?: import("../../../Portal/content").PageContent;
  initialSearch?: AvailabilitySearch;
  initialRooms: HotelRoom[];
  initialError?: string;
  isDemo: boolean;
  searchParams: Record<string, string | string[] | undefined>;
};

export function BookingPageContent({
  pageContent,
  initialSearch: search,
  initialRooms: rooms,
  initialError: error,
  isDemo,
  searchParams: params,
}: Props) {
  return (
    <main className={layout.page}>
      <div className={websiteClassName(`relative overflow-hidden ${styles.banner}`)}>
        <div aria-hidden="true" className={websiteClassName(styles.bannerDecoration)} />
        <div className={websiteClassName("container relative")}>
          <p className={websiteClassName(`eyebrow ${styles.eyebrow}`)}>
            {pageContent?.eyebrow || copy.booking.pageEyebrow}
          </p>
          <Heading
            as="h1"
            surface="brand"
            className={websiteClassName(`mt-5 font-display text-white ${styles.pageTitle}`)}
          >
            {pageContent?.title || copy.booking.pageTitle}
          </Heading>
          {pageContent?.description && (
            <p className="mt-5 text-lg leading-8 text-white">{pageContent.description}</p>
          )}
          <div className={websiteClassName(styles.accentDivider)} />
        </div>
      </div>

      <div className={websiteClassName(`container ${styles.overlappingContent}`)}>
        <BookingWidget key={JSON.stringify(search)} compact values={search} />
      </div>

      {error && !search ? (
        <div className={websiteClassName("container mt-8")}>
          <p
            role="alert"
            className={websiteClassName(
              `border-l-4 border-error bg-surface p-5 text-error ${styles.errorNotice}`,
            )}
          >
            {error}
          </p>
        </div>
      ) : null}

      {search ? (
        <section className={websiteClassName("container mt-10 pb-20")} aria-live="polite">
          <div
            className={websiteClassName(
              `flex flex-wrap items-end justify-between gap-4 pb-6 ${styles.dividedRow}`,
            )}
          >
            <div>
              <p className={websiteClassName("eyebrow")}>
                {isDemo ? "Sample search" : "Search results"}
              </p>
              <Heading
                as="h2"
                className={websiteClassName(`mt-3 font-display ${styles.sectionTitle}`)}
              >
                {formatStayDate(search.checkIn)} to {formatStayDate(search.checkOut)}
              </Heading>
              <div className={websiteClassName("mt-2 flex flex-wrap gap-4 text-sm text-muted")}>
                <span className={websiteClassName("flex items-center gap-1.5")}>
                  <Users size={14} /> {partySummary(search)}
                </span>
                <span className={websiteClassName("flex items-center gap-1.5")}>
                  <CalendarDays size={14} /> {search.rooms} {search.rooms === 1 ? "room" : "rooms"}
                </span>
              </div>
            </div>
            {isDemo && (
              <p className={websiteClassName(`text-xs max-w-xs text-right ${styles.resultNote}`)}>
                Sample availability &amp; rates. No reservation can be made in demo mode.
              </p>
            )}
          </div>

          {rooms.length && !error ? (
            <RoomCartPicker
              key={JSON.stringify([search, params.item])}
              rooms={rooms}
              search={search}
              isDemo={isDemo}
              initialItems={parseCartItems(params) ?? []}
            />
          ) : (
            <div className={layout.emptyState} role={error ? "alert" : "status"}>
              <span className={layout.stateIcon} aria-hidden="true">
                {error ? <CircleAlert size={26} /> : <SearchX size={26} />}
              </span>
              <Heading
                as="h3"
                className={websiteClassName(`font-display text-2xl ${styles.emptyTitle}`)}
              >
                {error?.startsWith("Your selected room")
                  ? "Your selected room is unavailable."
                  : error
                    ? "We couldn’t check availability."
                    : "No rooms available for these dates."}
              </Heading>
              <p className={websiteClassName("mt-3 text-muted")}>
                {error
                  ? error
                  : "Try different dates or fewer guests. Our team can also help you find the right stay."}
              </p>
              <Link href="/contact" className={websiteClassName("brand-button mt-6 inline-flex")}>
                <span className={websiteClassName("button-text-container")}>
                  <span className={websiteClassName("button-text")}>Contact hotel</span>
                </span>
              </Link>
            </div>
          )}

          {rooms.length > 0 && !error && (
            <p className={websiteClassName("mt-8 text-sm text-muted")}>
              To confirm availability and arrange a reservation,{" "}
              <Link
                href="/contact"
                className={websiteClassName(
                  "font-semibold text-brand underline underline-offset-4",
                )}
              >
                contact the hotel
              </Link>{" "}
              directly.
            </p>
          )}
        </section>
      ) : !error ? (
        <p className={websiteClassName("container mt-8 text-muted")}>
          Choose your dates and guest count to explore room options.
        </p>
      ) : null}
    </main>
  );
}
