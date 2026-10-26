"use client";
import { publicNavigation } from "@/lib/website/pages";
import Image from "next/image";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { SocialIcon } from "@/components/common/SocialIcon";
import { Menu, ShoppingBag, X, Search, MapPin, Phone, Mail, Gift, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Hotel } from "@/types/hotel";
import { HeaderMotion } from "./HeaderMotion";
import { SlidingMenu } from "./SlidingMenu";
import styles from "./Header.module.css";

type LiveCart = { searchKey: string; count: number; href: string };

export function Header({ hotel }: { hotel: Hotel }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [liveCart, setLiveCart] = useState<LiveCart | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const template = hotel.branding.header?.template || "minimal";
  const overlay = template === "transparent" && pathname === "/" && hotel.configured;
  const logo = hotel.branding.logoDarkUrl || hotel.branding.logoUrl;
  const lightLogo = hotel.branding.logoLightUrl;
  const items = publicNavigation(hotel);
  const split = Math.ceil(items.length / 2);
  const cartItems = searchParams.getAll("item");
  const cartCount = cartItems.reduce((total, item) => {
    try {
      const parsed: unknown = JSON.parse(item);
      return Array.isArray(parsed) &&
        typeof parsed[2] === "number" &&
        Number.isInteger(parsed[2]) &&
        parsed[2] > 0
        ? total + parsed[2]
        : total;
    } catch {
      return total;
    }
  }, 0);
  const currentCart =
    (pathname === "/booking" || pathname === "/booking/cart") &&
    liveCart?.searchKey === searchParams.toString()
      ? liveCart
      : null;
  const count = currentCart?.count ?? cartCount;
  const cartHref =
    currentCart?.href ??
    (cartItems.length ? `/booking/cart?${searchParams.toString()}` : "/booking");
  const settings = hotel.branding.header;
  const announcement =
    settings?.announcementText?.trim() ||
    hotel.offers?.[0]?.title ||
    "Your next memorable stay starts here.";
  const announcementPage =
    settings?.announcementPage || (hotel.offers?.length ? "/offers" : "/booking");

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const cart = (event: Event) => setLiveCart((event as CustomEvent<LiveCart>).detail);
    document.addEventListener("keydown", escape);
    window.addEventListener("hotel-cart-update", cart);
    return () => {
      document.removeEventListener("keydown", escape);
      window.removeEventListener("hotel-cart-update", cart);
    };
  }, []);

  const links = (entries: typeof items, label: string, className = "") => (
    <SlidingMenu
      className={`${styles.navigation} header-navigation ${className}`}
      aria-label={label}
      data-header-entry
    >
      {entries.map((item) => (
        <Link
          hotel={hotel}
          key={item.href}
          href={item.href}
          aria-current={
            pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined
          }
        >
          {item.label}
        </Link>
      ))}
    </SlidingMenu>
  );
  const identity = (
    <Link
      hotel={hotel}
      href="/"
      className={`${styles.identity} header-identity`}
      aria-label={`${hotel.name} home`}
      data-header-entry
    >
      {logo ? (
        <>
          <Image
            src={logo}
            alt={`${hotel.name} logo`}
            width={hotel.branding.logoLayout === "wide" ? 270 : 112}
            height={hotel.branding.logoLayout === "wide" ? 90 : 82}
            className={`${styles.logo} ${styles.darkLogo}`}
            priority
          />
          {overlay && lightLogo && (
            <Image
              src={lightLogo}
              alt=""
              aria-hidden="true"
              width={hotel.branding.logoLayout === "wide" ? 270 : 112}
              height={hotel.branding.logoLayout === "wide" ? 90 : 82}
              className={`${styles.logo} ${styles.lightLogo}`}
              priority
            />
          )}
        </>
      ) : (
        <span className={styles.hotelName}>{hotel.name}</span>
      )}
    </Link>
  );
  const actions = () => (
    <div className={`${styles.actions} header-actions`} data-header-entry>
      {template !== "minimal" && (
        <Link
          hotel={hotel}
          href="/rooms#rooms-availability"
          className={styles.search}
          aria-label="Search rooms"
        >
          <Search size={22} />
        </Link>
      )}
      <Link
        hotel={hotel}
        href={cartHref}
        className={styles.cart}
        aria-label={`Cart, ${count ? `${count} rooms selected` : "no rooms selected"}`}
        aria-current={pathname === "/booking/cart" ? "page" : undefined}
      >
        <ShoppingBag size={18} />
        <span>Cart{count ? ` (${count})` : ""}</span>
      </Link>
      <Link hotel={hotel} href="/booking" className={styles.book} data-shimmer>
        {template === "centered" || template === "transparent" ? "Book now" : "Book your stay"}
        {template === "minimal" && <ArrowRight size={18} />}
      </Link>
      <button
        type="button"
        className={styles.menuToggle}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );

  return (
    <HeaderMotion
      template={template}
      className={`${styles.header} ${overlay ? styles.overlay : ""} ${overlay && !lightLogo ? styles.noLightLogo : ""}`}
    >
      <div className={styles.templateLayout}>
        {template === "contact" && (
          <div className={styles.contactBar}>
            <div className={styles.contactInner}>
              {hotel.location.address && (
                <Link hotel={hotel} href="/contact">
                  <MapPin size={15} />
                  <span>{hotel.location.address}</span>
                </Link>
              )}
              {hotel.contact.phone && (
                <a href={`tel:${hotel.contact.phone}`}>
                  <Phone size={15} />
                  <span>{hotel.contact.phone}</span>
                </a>
              )}
              {hotel.contact.email && (
                <a href={`mailto:${hotel.contact.email}`}>
                  <Mail size={15} />
                  <span>{hotel.contact.email}</span>
                </a>
              )}
              <div className={styles.socials}>
                {hotel.contact.socialLinks?.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <SocialIcon label={social.label} size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
        {template === "announcement" && !dismissed && (
          <div className={styles.announcement}>
            <Gift size={17} aria-hidden="true" />
            <span>{announcement}</span>
            <Link hotel={hotel} href={announcementPage}>
              {settings?.announcementLabel?.trim() ||
                (announcementPage === "/offers" ? "View offers" : "Find your stay")}
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => setDismissed(true)}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {template === "minimal" ? (
          <>
            <div className={styles.masthead}>
              <Link hotel={hotel} href="/contact" className={styles.visit} data-header-entry>
                Visit us{hotel.location.city && <span>{hotel.location.city}</span>}
              </Link>
              {identity}
              {actions()}
            </div>
            {links(items, "Main navigation", styles.minimalNav)}
          </>
        ) : template === "centered" ? (
          <div className={`${styles.row} ${styles.centeredRow}`}>
            {links(items.slice(0, split), "Main navigation", styles.leftNav)}
            {identity}
            <div className={styles.rightGroup}>
              {links(items.slice(split), "More navigation")}
              {actions()}
            </div>
          </div>
        ) : (
          <div className={styles.row}>
            {identity}
            {links(items, "Main navigation")}
            {actions()}
          </div>
        )}
      </div>
      <div className={`${styles.row} ${styles.stickyRow}`} data-sticky-header>
        {identity}
        {links(items, "Main navigation")}
        {actions()}
      </div>
      {open && (
        <SlidingMenu
          id="mobile-navigation"
          className={styles.mobileNav}
          aria-label="Mobile navigation"
        >
          {items.map((item) => (
            <Link
              hotel={hotel}
              key={item.href}
              href={item.href}
              aria-current={
                pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link hotel={hotel} href={cartHref} onClick={() => setOpen(false)}>
            Cart{count ? ` (${count})` : ""}
          </Link>
        </SlidingMenu>
      )}
    </HeaderMotion>
  );
}
