"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, CalendarDays, Moon, Users, MapPin } from "lucide-react";
import { Heading } from "../common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { readUatReceipt, type UatReceipt } from "@/lib/payment/uatReceipt";
import { readCheckoutGuest } from "@/lib/payment/checkoutGuest";
import type { CheckoutGuest } from "@/lib/payment/p98pay";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import styles from "./UatPaymentConfirmation.module.css";

function stayDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}
type StayDetails = {
  address: string;
  image?: { url: string; alt: string };
  rooms: { name: string; quantity: number; bedType?: string }[];
  addOns: { name: string; quantity: number }[];
};
export function UatPaymentConfirmation({
  hotelName,
  query,
  stay,
}: {
  hotelName: string;
  query: string;
  stay?: StayDetails;
}) {
  const [receipt, setReceipt] = useState<UatReceipt | null | undefined>(undefined);
  const [guest, setGuest] = useState<CheckoutGuest | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setReceipt(readUatReceipt(hotelName, query));
        const params = new URLSearchParams(query);
        params.delete("uat");
        setGuest(readCheckoutGuest(hotelName, params.toString()));
      }
    });
    return () => {
      active = false;
    };
  }, [hotelName, query]);
  const params = new URLSearchParams(query);
  const checkIn = stayDate(params.get("checkIn"));
  const checkOut = stayDate(params.get("checkOut"));
  const guestName = [guest?.firstName, guest?.lastName].filter(Boolean).join(" ");
  const count = (key: string) => {
    const value = Number(params.get(key));
    return Number.isSafeInteger(value) && value > 0 && value <= 20 ? value : null;
  };
  const nights =
    checkIn && checkOut ? Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000) : 0;
  return (
    <main
      className={`${websiteClassName("container")} ${styles.page}`}
      data-payment-summary={receipt ? "true" : undefined}
    >
      <div className={styles.hero}>
        {receipt && (
          <div className={styles.mark} aria-hidden="true">
            <Check size={34} />
          </div>
        )}
        <Heading as="h1" className={styles.title}>
          {receipt === undefined
            ? "Loading your summary..."
            : receipt
              ? "Thank you for choosing us."
              : "No payment summary to display"}
        </Heading>
        <p className={styles.intro}>
          {receipt
            ? `${guestName ? `Thank you, ${guestName}. ` : ""}Your checkout details are ready. Keep this summary for your records.`
            : receipt === undefined
              ? "Preparing your checkout details."
              : "Complete checkout in the same browser tab to view your summary."}
        </p>
        {receipt && <span className={styles.badge}>Booking confirmation pending</span>}
      </div>
      {receipt ? (
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <section className={styles.card} aria-label="Your stay">
              <div className={styles.hotel}>
                {stay?.image && (
                  <Image
                    unoptimized
                    src={stay.image.url}
                    alt={stay.image.alt}
                    width={220}
                    height={140}
                    className={styles.hotelImage}
                  />
                )}
                <div>
                  <h2>{hotelName}</h2>
                  {stay?.address && (
                    <p className={styles.address}>
                      <MapPin size={15} aria-hidden="true" />
                      {stay.address}
                    </p>
                  )}
                </div>
              </div>
              <dl className={styles.stayFacts}>
                {checkIn && (
                  <div>
                    <dt>
                      <CalendarDays size={17} aria-hidden="true" />
                      Check-in
                    </dt>
                    <dd>{formatStayDate(checkIn)}</dd>
                  </div>
                )}
                {checkOut && (
                  <div>
                    <dt>
                      <CalendarDays size={17} aria-hidden="true" />
                      Check-out
                    </dt>
                    <dd>{formatStayDate(checkOut)}</dd>
                  </div>
                )}
                {nights > 0 && (
                  <div>
                    <dt>
                      <Moon size={17} aria-hidden="true" />
                      Stay
                    </dt>
                    <dd>
                      {nights} {nights === 1 ? "night" : "nights"}
                    </dd>
                  </div>
                )}
                {count("guests") && (
                  <div>
                    <dt>
                      <Users size={17} aria-hidden="true" />
                      Guests
                    </dt>
                    <dd>{count("guests")}</dd>
                  </div>
                )}
              </dl>
            </section>
            <section className={styles.card} aria-label="Your booking details">
              <h2>Your booking details</h2>
              {stay?.rooms.length ? (
                <ul className={styles.items}>
                  {stay.rooms.map((room, index) => (
                    <li key={`${room.name}-${index}`}>
                      <div>
                        <strong>{room.name}</strong>
                        {room.bedType && <small>{room.bedType}</small>}
                      </div>
                      <span>
                        {room.quantity} {room.quantity === 1 ? "room" : "rooms"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{count("rooms") ?? 1} room(s) requested</p>
              )}
              {!!stay?.addOns.length && (
                <>
                  <h3 className={styles.subheading}>Add-ons &amp; services</h3>
                  <ul className={styles.items}>
                    {stay.addOns.map((item, index) => (
                      <li key={`${item.name}-${index}`}>
                        <span>{item.name}</span>
                        <span>&times;{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className={styles.total}>
                <strong>Checkout amount</strong>
                <span>
                  {formatMoney(receipt)} <small>{receipt.currency}</small>
                </span>
              </div>
            </section>
          </div>
          <aside className={styles.sideColumn} aria-label="Payment and next steps">
            <section className={styles.card} aria-label="Payment summary">
              <div className={styles.paymentHeading}>
                <h2>Payment summary</h2>
                <p>Your checkout response has been received.</p>
              </div>
              <dl className={styles.details}>
                <div>
                  <dt>Payment date</dt>
                  <dd>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(receipt.savedAt))}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={styles.badge}>Verification pending</span>
                  </dd>
                </div>
                {guestName && (
                  <div>
                    <dt>Guest</dt>
                    <dd>{guestName}</dd>
                  </div>
                )}
                {guest?.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>{guest.email}</dd>
                  </div>
                )}
              </dl>
            </section>
            <section className={styles.card}>
              <h2>What&apos;s next?</h2>
              <ul className={styles.nextSteps}>
                <li>
                  Contact the hotel to confirm your reservation and receive a booking reference.
                </li>
                <li>Keep your checkout summary for any questions about your stay.</li>
                <li>For special requests, contact the hotel directly.</li>
              </ul>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={websiteClassName("ghost-button")}
                  onClick={() => window.print()}
                >
                  Print / save summary
                </button>
                <Link href="/contact" className={websiteClassName("brand-button")}>
                  Contact hotel
                </Link>
              </div>
            </section>
          </aside>
          <p className={styles.notice}>
            This summary is not a tax invoice or proof of payment. Your reservation is confirmed
            only after the hotel provides a booking reference.
          </p>
        </div>
      ) : (
        <div className={styles.empty}>
          <Link href="/booking" className={websiteClassName("brand-button")}>
            Search rooms
          </Link>
        </div>
      )}
    </main>
  );
}
