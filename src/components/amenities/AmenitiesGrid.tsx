import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { AmenityIcon } from "@/components/amenities/AmenityIcon";
import type { HotelAmenity } from "@/types/hotel";

export function AmenitiesGrid({ amenities }: { amenities: HotelAmenity[] }) {
  if (!amenities.length) return null;

  return (
    <section id="experience" className={websiteClassName("container py-20")}>
      <div className={websiteClassName("max-w-2xl")}>
        <p className={websiteClassName("eyebrow")}>Hotel amenities</p>
        <Heading as="h2" className={websiteClassName("section-title mt-4")}>
          More ways to enjoy your stay.
        </Heading>
      </div>
      <div
        className={websiteClassName(
          "mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {amenities.map((amenity) => (
          <article key={amenity.id} className={websiteClassName("bg-surface p-7")}>
            <div className={websiteClassName("text-brand")}>
              <AmenityIcon
                iconUrl={amenity.iconUrl}
                iconKey={amenity.iconKey}
                label={amenity.label}
              />
            </div>
            <Heading as="h3" className={websiteClassName("mt-5 text-lg font-bold")}>
              {amenity.label}
            </Heading>
            {amenity.description ? (
              <p className={websiteClassName("mt-2 text-sm leading-6 text-muted")}>
                {amenity.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
