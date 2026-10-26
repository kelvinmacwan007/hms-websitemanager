import { Heading } from "@/components/common/Heading";
import gridStyles from "./RoomGrid.module.css";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { RoomCard } from "@/components/rooms/RoomCard";
import type { HotelRoom } from "@/types/hotel";

function similarityScore(current: HotelRoom, candidate: HotelRoom) {
  const occupancyDifference = Math.abs(current.occupancy - candidate.occupancy) * 1000;
  const currentPrice = current.startingPrice?.amount;
  const candidatePrice = candidate.startingPrice?.amount;
  const priceDifference =
    currentPrice !== undefined && candidatePrice !== undefined
      ? Math.abs(currentPrice - candidatePrice)
      : 500;
  const sameBed =
    current.bedType && candidate.bedType && current.bedType === candidate.bedType ? -250 : 0;
  return occupancyDifference + priceDifference + sameBed;
}

export function SimilarRooms({
  current,
  rooms,
  rateDates,
}: {
  current: HotelRoom;
  rooms: HotelRoom[];
  rateDates?: { checkIn: string; checkOut: string };
}) {
  const similar = rooms
    .filter((room) => room.id !== current.id && room.availabilityStatus !== "sold-out")
    .sort((a, b) => similarityScore(current, a) - similarityScore(current, b))
    .slice(0, 3);

  if (!similar.length) return null;
  return (
    <section
      className={websiteClassName("border-t border-line py-14 md:py-20")}
      aria-labelledby="similar-rooms-heading"
    >
      <div
        className={websiteClassName("flex flex-col justify-between gap-5 md:flex-row md:items-end")}
      >
        <div>
          <p className={websiteClassName("eyebrow")}>More ways to stay</p>
          <Heading
            as="h2"
            id="similar-rooms-heading"
            className={websiteClassName("section-title mt-3")}
          >
            Similar rooms
          </Heading>
          <p className={websiteClassName("mt-4 max-w-2xl text-muted")}>
            Explore other rooms with comparable space, occupancy, and nightly rates.
          </p>
        </div>
        <Link href="/rooms" className={websiteClassName("ghost-button")}>
          View all rooms
        </Link>
      </div>
      <div className={`mt-9 ${gridStyles.grid}`}>
        {similar.map((room) => (
          <ScrollReveal key={room.id}>
            <RoomCard room={room} rateDates={rateDates} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
