import Link from "next/link";
import { Users, BedDouble, Maximize, ArrowRight, Star } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";
import { stayQuery } from "@/lib/booking/party";
import type { AvailabilitySearch, HotelRoom } from "@/types/hotel";
import { RoomCardGallery } from "./RoomCardGallery";
import { RoomAmenitiesSlider } from "./RoomAmenitiesSlider";
import { AmenityIcon } from "../amenities/AmenityIcon";
import styles from "./RoomCard.module.css";
import type { ReactNode } from "react";

export function RoomCard({
  room,
  rateDates,
  search,
  layout = "vertical",
  children,
}: {
  room: HotelRoom;
  rateDates?: { checkIn: string; checkOut: string };
  search?: AvailabilitySearch;
  availabilityChecked?: boolean;
  layout?: "vertical" | "responsive";
  children?: ReactNode;
}) {
  const bookingHref = search
    ? `/booking?${new URLSearchParams({ ...Object.fromEntries(stayQuery(search)), room: room.slug })}`
    : rateDates
      ? `/booking?${new URLSearchParams({ ...rateDates, guests: "1", rooms: "1", room: room.slug })}`
      : `/booking?${new URLSearchParams({ room: room.slug })}`;
  const amenities = room.amenities.filter((item) => item.enabled !== false);
  const detailsHref = `/rooms/${room.slug}${search ? `?${stayQuery(search)}` : ""}`;
  return (
    <div className={styles.shell}>
      <article data-motion-card data-layout={layout} className={styles.card}>
        <RoomCardGallery images={room.images} roomName={room.name} />
        <div className={styles.content}>
          <p className={styles.eyebrow}>Room</p>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              <Link href={detailsHref}>{room.name}</Link>
            </h3>
            {typeof room.reviewRating === "number" &&
              room.reviewRating > 0 &&
              room.reviewRating <= 5 && (
                <span
                  className={styles.rating}
                  aria-label={`Guest rating ${room.reviewRating} out of 5`}
                >
                  <Star size={17} fill="currentColor" />
                  <strong>{room.reviewRating.toFixed(1)}</strong>
                </span>
              )}
          </div>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <i>
                <Users size={24} />
              </i>
              <div>
                <strong>{room.occupancy} Guests</strong>
                <span>Max occupancy</span>
              </div>
            </div>
            {room.bedType && (
              <div className={styles.fact}>
                <i>
                  <BedDouble size={24} />
                </i>
                <div>
                  <strong>{room.bedType.replace(/\s*\*\s*/g, " ")}</strong>
                  <span>Comfortable bed</span>
                </div>
              </div>
            )}
            {room.size && (
              <div className={styles.fact}>
                <i>
                  <Maximize size={23} />
                </i>
                <div>
                  <strong>{room.size}</strong>
                  <span>Room size</span>
                </div>
              </div>
            )}
          </div>
          {amenities.length > 0 && (
            <div className={styles.amenities}>
              <div className={styles.amenitiesHeading}>
                <h4>Top amenities</h4>
                <Link href={`/rooms/${room.slug}#room-amenities`}>
                  View all amenities <ArrowRight size={16} />
                </Link>
              </div>
              <RoomAmenitiesSlider>
                {amenities.map((item) => (
                  <li key={item.id}>
                    <AmenityIcon iconUrl={item.iconUrl} iconKey={item.iconKey} label={item.label} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </RoomAmenitiesSlider>
            </div>
          )}
        </div>
        <div className={styles.footer} data-custom={Boolean(children)}>
          {children ?? (
            <>
              <div className={styles.priceRow}>
                <div className={styles.price}>
                  {room.startingPrice ? (
                    <>
                      <span className={styles.from}>From</span>
                      <div>
                        <strong>{formatMoney(room.startingPrice)}</strong>
                        <span>/ night</span>
                      </div>
                      <p className={styles.taxNote}>Taxes and fees may apply</p>
                    </>
                  ) : (
                    <span className={styles.priceNotice}>Select dates for rates</span>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                <Link href={detailsHref} className={styles.details}>
                  View details
                </Link>
                <Link href={bookingHref} className={styles.book} data-shimmer>
                  Check dates <ArrowRight size={20} />
                </Link>
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
