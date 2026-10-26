import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { notFound } from "next/navigation";
import { AmenityIcon } from "@/components/amenities/AmenityIcon";
import { SiteShell } from "@/components/layout/SiteShell";
import { RoomImageSlider } from "@/components/rooms/RoomImageSlider";
import { RoomAvailabilityCalendar } from "@/components/rooms/RoomAvailabilityCalendar";
import { RoomReservationPanel } from "@/components/rooms/RoomReservationPanel";
import { SimilarRooms } from "@/components/rooms/SimilarRooms";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { roomDisplayRates } from "@/lib/booking/displayRates";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  const hotel = await provider.getHotel(tenant);
  const room = await provider.getRoomBySlug(tenant, slug);
  return createHotelMetadata(hotel, `/rooms/${slug}`, room?.name ?? "Room unavailable");
}

export default async function RoomDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  const hotel = await provider.getHotel(tenant);
  if (!pageEnabled(hotel, "rooms")) notFound();
  const room = await provider.getRoomBySlug(tenant, slug);
  if (!room) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const displayed = await roomDisplayRates(provider, tenant, hotel);

  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16")}>
        <div
          className={websiteClassName(
            "grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-14",
          )}
        >
          <div className={websiteClassName("min-w-0")}>
            <RoomImageSlider images={room.images} roomName={room.name} />
            <section className={websiteClassName("border-b border-line py-10")}>
              <p className={websiteClassName("eyebrow")}>Room Details</p>
              <Heading as="h1" className={websiteClassName("section-title mt-4")}>
                {room.name}
              </Heading>
              <div
                className={websiteClassName(
                  "mt-6 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold",
                )}
              >
                <span>Up to {room.occupancy} guests</span>
                {room.size ? <span>Room size: {room.size}</span> : null}
                {room.bedType ? <span>{room.bedType}</span> : null}
              </div>
              <p className={websiteClassName("mt-6 text-lg leading-8 text-muted")}>
                {room.description}
              </p>
            </section>

            <RoomAvailabilityCalendar
              roomSlug={room.slug}
              occupancy={room.occupancy}
              today={today}
            />

            <section
              id="room-amenities"
              className={websiteClassName("border-b border-line py-10 scroll-mt-28")}
            >
              <Heading as="h2" className={websiteClassName("font-display text-4xl")}>
                Amenities
              </Heading>
              <div className={websiteClassName("mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2")}>
                {room.amenities.map((amenity) => (
                  <div className={websiteClassName("flex items-center gap-4")} key={amenity.id}>
                    <span className={websiteClassName("text-brand")}>
                      <AmenityIcon iconUrl={amenity.iconUrl} iconKey={amenity.iconKey} />
                    </span>
                    <span>
                      <strong className={websiteClassName("block")}>{amenity.label}</strong>
                      {amenity.description ? (
                        <span className={websiteClassName("mt-1 block text-sm text-muted")}>
                          {amenity.description}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            {room.policies?.length ? (
              <section className={websiteClassName("py-10")}>
                <Heading as="h2" className={websiteClassName("font-display text-4xl")}>
                  Room Policies
                </Heading>
                <ul className={websiteClassName("mt-6 grid gap-3 text-muted")}>
                  {room.policies.map((policy) => (
                    <li className={websiteClassName("border-l-2 border-brand pl-4")} key={policy}>
                      {policy}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          <RoomReservationPanel
            room={displayed.rooms.find((candidate) => candidate.id === room.id) ?? room}
            extras={hotel.extras ?? []}
            addOns={hotel.addOns ?? []}
            today={today}
          />
        </div>
        <SimilarRooms
          current={displayed.rooms.find((candidate) => candidate.id === room.id) ?? room}
          rooms={displayed.rooms}
          rateDates={displayed.rateDates}
        />
      </main>
    </SiteShell>
  );
}
