import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import styles from "./RoomShowcase.styles";
import Link from "next/link";
import { RoomCard } from "@/components/rooms/RoomCard";
import gridStyles from "./RoomGrid.module.css";
import type { HotelRoom } from "@/types/hotel";
import { defaultTemplateCopy as copy } from "@/templates/default/copy";

export function RoomShowcase({
  rooms,
  copyOverride,
  rateDates,
}: {
  rooms: HotelRoom[];
  copyOverride?: { title: string; eyebrow: string };
  rateDates?: { checkIn: string; checkOut: string };
}) {
  if (!rooms.length) return null;
  return (
    <section className={websiteClassName(`home-section ${styles.section}`)}>
      <div className={websiteClassName("container")}>
        <div
          className={websiteClassName(
            "flex flex-col justify-between gap-6 md:flex-row md:items-end",
          )}
        >
          <div className={websiteClassName("max-w-2xl")}>
            <p className={websiteClassName("eyebrow")}>
              {copyOverride?.eyebrow || copy.home.roomsEyebrow}
            </p>
            <Heading as="h2" className={websiteClassName(`section-title mt-5 ${styles.title}`)}>
              {copyOverride?.title || copy.home.roomsTitle}
            </Heading>
            <div className={websiteClassName(styles.accentDivider)} />
          </div>
          <Link href="/rooms" className={websiteClassName("ghost-button")}>
            All rooms
          </Link>
        </div>
        <div className={`mt-8 ${gridStyles.grid}`}>
          {rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.id} room={room} rateDates={rateDates} layout="vertical" />
          ))}
        </div>
      </div>
    </section>
  );
}
