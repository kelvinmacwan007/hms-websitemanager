"use client";
import Image from "next/image";
import { ArrowRight, BellRing, Mail, MapPin, Phone } from "lucide-react";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import type { Hotel } from "@/types/hotel";
import { Heading } from "./Heading";
import { ContactForm } from "./ContactForm";
import styles from "./ContactLocation.module.css";

export function ContactLocation({ hotel }: { hotel: Hotel }) {
  const address = [
    hotel.location.address,
    hotel.location.city,
    hotel.location.region,
    hotel.location.postalCode,
    hotel.location.country,
  ]
    .filter(Boolean)
    .join(", ");
  const mapQuery =
    hotel.location.latitude != null && hotel.location.longitude != null
      ? `${hotel.location.latitude},${hotel.location.longitude}`
      : `${hotel.name}, ${address}`;
  const directions =
    hotel.location.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const exterior = hotel.heroImage || hotel.gallery[0];
  const interior =
    hotel.gallery.find((image) => /lobby|reception|lounge/i.test(image.alt)) ||
    hotel.gallery[1] ||
    exterior;
  const email = hotel.contact.enquiryEmail || hotel.contact.email;
  const arrival = hotel.policies?.find((policy) => /check[ -]?in/i.test(policy.title));
  return (
    <main id="main-content" className={`${websiteClassName("container")} ${styles.page}`}>
      <div className={styles.topline}>
        <div>
          <Heading as="h1">
            Find your <em>{hotel.name}</em>
          </Heading>
          <p>Find us, plan your arrival, and get in touch with our team.</p>
        </div>
      </div>
      <section className={styles.locator} aria-label="Hotel location">
        <div className={styles.map}>
          <iframe
            title={`Map of ${hotel.name}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a className={styles.mapCaption} href={directions} target="_blank" rel="noreferrer">
            <strong>{hotel.name}</strong>
            <span>
              Get directions <ArrowRight size={16} />
            </span>
          </a>
        </div>
      </section>
      <div className={styles.bottom}>
        <section
          id="arrival-details"
          className={styles.arrival}
          aria-label="Arrival and reservations"
        >
          {interior && (
            <Image
              src={interior.url}
              alt={interior.alt}
              width={1000}
              height={540}
              className={styles.interior}
            />
          )}
          <div className={styles.arrivalCopy}>
            <Heading as="h2">
              Your {hotel.location.city || "next"} stay <em>starts here.</em>
            </Heading>
            <div className={styles.address}>
              <MapPin size={23} />
              <p>{address}</p>
            </div>
            <div className={styles.detail}>
              <h3>Reservations</h3>
              {!email && !hotel.contact.phone && (
                <p>Use the enquiry form to ask about your stay.</p>
              )}
              {email && (
                <a href={`mailto:${email}`}>
                  <Mail size={21} />
                  Contact reservations <ArrowRight size={17} />
                </a>
              )}
              {hotel.contact.phone && (
                <a href={`tel:${hotel.contact.phone}`}>
                  <Phone size={20} />
                  {hotel.contact.phone}
                </a>
              )}
            </div>
            <div className={styles.detail}>
              <h3>Arrival assistance</h3>
              <div className={styles.address}>
                <BellRing size={23} />
                <p>
                  {arrival?.description || "Ask our team about parking, transfers, and check-in."}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.form} aria-label="Contact the hotel">
          <Heading as="h2">
            How can we <em>help?</em>
          </Heading>
          <p>Contact our team with your questions or special requests.</p>
          <ContactForm />
        </section>
      </div>
    </main>
  );
}
