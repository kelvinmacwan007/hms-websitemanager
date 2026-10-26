import { SocialIcon } from "../common/SocialIcon";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Hotel } from "@/types/hotel";

export function Footer({ hotel }: { hotel: Hotel }) {
  const socials = hotel.contact.socialLinks ?? [];
  return (
    <footer className={websiteClassName("hotel-footer !mt-0")}>
      <div className={websiteClassName("container")}>
        <div className={websiteClassName("footer-introduction")}>
          <div className={websiteClassName("footer-brand")}>
            <Link
              hotel={hotel}
              href="/"
              aria-label={`${hotel.name} home`}
              className={websiteClassName("footer-brand-link")}
            >
              <span className={websiteClassName("footer-hotel-name")}>{hotel.name}</span>
            </Link>
            <p>
              {hotel.tagline ||
                (hotel.location.city
                  ? `Make yourself at home in ${hotel.location.city}.`
                  : "Make yourself at home.")}
            </p>
          </div>
          <div className={websiteClassName("footer-invitation")}>
            <span className={websiteClassName("footer-kicker")}>Your next stay</span>
            <Heading surface="brand" as="h2">
              A change of scenery.
              <br />
              <em>A place to belong.</em>
            </Heading>
            <Link hotel={hotel} href="/booking" className={websiteClassName("footer-book")}>
              Find your room <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={websiteClassName("footer-information")}>
          <section>
            <Heading as="h3">Reservations</Heading>
            <address>
              {hotel.contact.phone ? (
                <a href={`tel:${hotel.contact.phone}`}>{hotel.contact.phone}</a>
              ) : null}
              {hotel.contact.email ? (
                <a href={`mailto:${hotel.contact.email}`}>{hotel.contact.email}</a>
              ) : null}
            </address>
            <Link hotel={hotel} href="/contact" className={websiteClassName("footer-text-link")}>
              Talk to our team <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </section>
          <section>
            <Heading as="h3">Find us</Heading>
            <address>
              {hotel.location.address ? <span>{hotel.location.address}</span> : null}
              <span>
                {hotel.location.city}
                {hotel.location.region ? `, ${hotel.location.region}` : ""}{" "}
                {hotel.location.postalCode}
              </span>
              <span>{hotel.location.country}</span>
            </address>
            {hotel.location.mapUrl ? (
              <a
                href={hotel.location.mapUrl}
                className={websiteClassName("footer-text-link")}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={15} aria-hidden="true" /> Get directions{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            ) : null}
          </section>
          <nav aria-label="Footer navigation">
            <Heading as="h3">Discover</Heading>
            <Link hotel={hotel} href="/about">
              Our hotel
            </Link>
            {hotel.rooms.length ? (
              <Link hotel={hotel} href="/rooms">
                Rooms & suites
              </Link>
            ) : null}
            {hotel.gallery.length ? (
              <Link hotel={hotel} href="/gallery">
                Gallery
              </Link>
            ) : null}
            {hotel.testimonials?.length ? (
              <Link hotel={hotel} href="/reviews">
                Guest reviews
              </Link>
            ) : null}
          </nav>
          <section>
            <Heading as="h3">{socials.length ? "Stay in touch" : "Good to know"}</Heading>
            {socials.length ? (
              <div className={websiteClassName("footer-socials")}>
                {socials.map((social) => {
                  return (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      title={social.label}
                    >
                      <SocialIcon label={social.label} size={20} strokeWidth={1.5} />
                    </a>
                  );
                })}
              </div>
            ) : null}
            <div className={websiteClassName("footer-help-links")}>
              {hotel.faqs?.length ? (
                <Link hotel={hotel} href="/faq">
                  Frequently asked questions
                </Link>
              ) : null}
              <Link hotel={hotel} href="/policies">
                Hotel policies
              </Link>
            </div>
          </section>
        </div>
        <div className={websiteClassName("footer-bottom")}>
          <span>
            &copy; {new Date().getFullYear()} {hotel.name}. All rights reserved.
          </span>
          <span className={websiteClassName("footer-destination")}>
            {hotel.location.city}{" "}
            {hotel.location.city && hotel.location.country ? (
              <span aria-hidden="true">/</span>
            ) : null}{" "}
            {hotel.location.country}
          </span>
          <span>
            Powered by <strong>Patel HMS</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
