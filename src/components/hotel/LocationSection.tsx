import { Heading } from "@/components/common/Heading";
import styles from "./LocationSection.module.css";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { MapPin } from "lucide-react";
import type { Hotel } from "@/types/hotel";

export function LocationSection({
  hotel,
  copyOverride,
}: {
  hotel: Hotel;
  copyOverride?: { title: string; eyebrow: string };
}) {
  const locality = [hotel.location.city, hotel.location.region, hotel.location.country]
    .filter(Boolean)
    .filter((part) => !hotel.location.address.toLowerCase().includes(part!.toLowerCase()))
    .join(", ");
  return (
    <section className={styles.section} aria-label="Hotel location">
      <div className={styles.layout}>
        <div>
          <p className={styles.eyebrow}>{copyOverride?.eyebrow || "Location"}</p>
          <Heading as="h2" className={styles.title}>
            {copyOverride?.title || "Find us."}
          </Heading>
          <div className={styles.divider} />
          <p className={styles.description}>
            View our location or get in touch for help planning your arrival.
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.addressRow}>
            <MapPin size={20} className={styles.mapIcon} aria-hidden="true" />
            <div>
              <p className={styles.address}>{hotel.location.address}</p>
              {locality && <p className={styles.locality}>{locality}</p>}
            </div>
          </div>
          <div className={styles.actions}>
            <Link hotel={hotel} className={styles.contact} href="/contact">
              Contact the hotel
            </Link>
            {hotel.location.mapUrl && (
              <a className={styles.directions} href={hotel.location.mapUrl}>
                Get directions
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
