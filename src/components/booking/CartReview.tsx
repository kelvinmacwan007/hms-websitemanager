"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { Checkbox } from "@/components/common/Checkbox";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  CalendarDays,
  Moon,
  Users,
  BedDouble,
  Pencil,
  Trash2,
  X,
  Info,
  Gift,
  PawPrint,
  Clock,
} from "lucide-react";
import Image from "next/image";
import styles from "./CartReview.module.css";
import { selectedAddOnRequests } from "@/lib/booking/addOnRequests";
import { useEffect, useState } from "react";
import { cartQuery, cartSubtotal, type CartLine } from "@/lib/booking/cart";
import { stayQuery, partySummary } from "@/lib/booking/party";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import type { AvailabilitySearch, HotelExtra, HotelAddOn } from "@/types/hotel";
import { useSearchParams } from "next/navigation";

export function CartReview({
  hotelName,
  search,
  lines: initialLines,
  extras,
  addOns = [],
  initialExtraIds,
  isDemo,
}: {
  hotelName: string;
  search: AvailabilitySearch;
  lines: CartLine[];
  extras: HotelExtra[];
  addOns?: HotelAddOn[];
  initialExtraIds: string[];
  isDemo: boolean;
}) {
  const [lines, setLines] = useState(initialLines);
  const params = useSearchParams();
  const [requests, setRequests] = useState(() =>
    selectedAddOnRequests(addOns, params.getAll("addon")),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialExtraIds));
  const nights =
    (Date.parse(`${search.checkOut}T00:00:00Z`) - Date.parse(`${search.checkIn}T00:00:00Z`)) /
    86400000;
  const currency = initialLines[0].rate.price.currency;
  const money = (amount: number) => formatMoney({ amount, currency });
  const eligibleExtras = extras.filter(
    (extra) =>
      extra.price.currency === currency &&
      !(
        extra.id === "breakfast" &&
        lines.every((line) => /breakfast/i.test(line.rate.mealPlan ?? ""))
      ),
  );
  const selectedExtras = eligibleExtras.filter((extra) => selectedIds.has(extra.id));
  const addOnSubtotal = requests
    .filter(({ item }) => item.price.currency === currency)
    .reduce((sum, { item, quantity }) => sum + item.price.amount * quantity, 0);
  const roomSubtotal = cartSubtotal(lines, nights);
  const subtotal =
    roomSubtotal +
    addOnSubtotal +
    selectedExtras.reduce(
      (sum, extra) => sum + extra.price.amount * (extra.charge === "per-night" ? nights : 1),
      0,
    );
  const query = cartQuery(search, lines);
  selectedExtras.forEach((extra) => query.append("extra", extra.id));
  const editQuery = cartQuery(search, lines);
  for (const destination of [query, editQuery]) {
    requests.forEach(({ item, quantity }) =>
      destination.append("addon", JSON.stringify([item.id, quantity])),
    );
    const preview = params.get("__website_preview");
    if (preview) destination.set("__website_preview", preview);
  }

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cartHref = `/booking/cart?${query}`;
  const searchKey = params.toString();
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("hotel-cart-update", {
        detail: { searchKey, count: cartCount, href: cartHref },
      }),
    );
  }, [searchKey, cartCount, cartHref]);

  function toggleExtra(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const canContinue =
    lines.length > 0 &&
    lines.reduce((sum, line) => sum + line.quantity, 0) === search.rooms &&
    lines.reduce((sum, line) => sum + line.quantity * line.room.occupancy, 0) >= search.guests &&
    (!search.pets || lines.some((line) => line.room.petsAllowed !== false));
  const checkoutLabel = isDemo ? "Continue to demo checkout" : "Continue to checkout";
  return (
    <main className={`${websiteClassName("container")} ${styles.page}`}>
      <Link href={`/booking?${editQuery}`} className={styles.back}>
        <ArrowLeft size={17} /> Change rooms
      </Link>
      <div className={styles.layout}>
        <div className={styles.main}>
          <header className={styles.heading}>
            <p className={websiteClassName("eyebrow")}>
              {isDemo ? "Demo booking" : "Your reservation"}
            </p>
            <Heading as="h1">Your room cart</Heading>
            <p>Review your stay before continuing.</p>
          </header>
          <div className={styles.stayBar}>
            <div>
              <CalendarDays size={23} />
              <span>
                <strong>{formatStayDate(search.checkIn)}</strong>
                <small>Check-in</small>
              </span>
            </div>
            <div>
              <CalendarDays size={23} />
              <span>
                <strong>{formatStayDate(search.checkOut)}</strong>
                <small>Check-out</small>
              </span>
            </div>
            <div>
              <Moon size={23} />
              <span>
                {nights} {nights === 1 ? "night" : "nights"}
              </span>
            </div>
            <div>
              <Users size={23} />
              <span>{partySummary(search)}</span>
            </div>
          </div>
          <section className={styles.card} aria-label="Selected rooms">
            <h2>
              <BedDouble size={24} /> {lines.length === 1 ? "Selected room" : "Selected rooms"}
            </h2>
            {lines.length ? (
              lines.map((line) => (
                <article key={`${line.room.id}:${line.rate.id}`} className={styles.room}>
                  <div className={styles.photo}>
                    {line.room.images[0] ? (
                      <Image
                        src={line.room.images[0].url}
                        alt={line.room.name}
                        fill
                        sizes="(max-width:650px) 90vw, 280px"
                      />
                    ) : (
                      <BedDouble size={40} />
                    )}
                  </div>
                  <div className={styles.roomInfo}>
                    <h3>{line.room.name}</h3>
                    <p>
                      {line.rate.name} · {line.quantity} {line.quantity === 1 ? "room" : "rooms"} ·
                      up to {line.room.occupancy * line.quantity} guests
                    </p>
                    {line.rate.mealPlan && <p>{line.rate.mealPlan}</p>}
                    <div className={styles.roomActions}>
                      <Link href={`/booking?${editQuery}`}>
                        <Pencil size={16} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setLines((current) =>
                            current.filter(
                              (item) =>
                                item.room.id !== line.room.id || item.rate.id !== line.rate.id,
                            ),
                          )
                        }
                        aria-label={`Remove ${line.room.name}`}
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className={styles.roomPrice}>
                    <strong>{money(line.rate.price.amount)}</strong>
                    <small>per night</small>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.empty}>
                <ShoppingBag size={30} />
                <h3>Your cart is empty.</h3>
                <Link href={`/rooms?${stayQuery(search)}`}>
                  Explore rooms <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </section>
          {requests.length > 0 && (
            <section className={styles.card} aria-label="Requested add-ons">
              <h2>
                <ShoppingBag size={24} /> Requested add-ons
              </h2>
              <div className={styles.requests}>
                {requests.map(({ item, quantity }) => {
                  const Icon = /pet/i.test(item.name)
                    ? PawPrint
                    : /bed/i.test(item.name)
                      ? BedDouble
                      : /check/i.test(item.name)
                        ? Clock
                        : Gift;
                  return (
                    <div key={item.id}>
                      <Icon size={24} />
                      <strong>{item.name}</strong>
                      <span>{quantity}</span>
                      <span className={styles.confirmation}>
                        <Info size={15} /> Hotel confirmation required
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRequests((current) =>
                            current.filter((request) => request.item.id !== item.id),
                          )
                        }
                        aria-label={`Remove ${item.name}`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className={styles.note}>
                <Info size={16} /> Listed add-on prices are included in the estimate. Availability
                and final charges are confirmed by the hotel.
              </p>
            </section>
          )}
          {eligibleExtras.length > 0 && (
            <section className={styles.card}>
              <h2>
                <Gift size={24} /> Optional extras
              </h2>
              <div className={styles.extraList}>
                {eligibleExtras.map((extra) => (
                  <label key={extra.id}>
                    <Checkbox
                      checked={selectedIds.has(extra.id)}
                      onChange={(event) => toggleExtra(extra.id, event.target.checked)}
                    />
                    <span>
                      <strong>{extra.name}</strong>
                      <small>{extra.description}</small>
                    </span>
                    <strong>
                      {formatMoney(extra.price)}
                      <small>{extra.charge === "per-night" ? "per night" : "per stay"}</small>
                    </strong>
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className={`${styles.card} ${styles.summary}`} aria-label="Cart total">
          <Heading as="h2">Your stay summary</Heading>
          <p className={styles.hotel}>{hotelName}</p>
          <p className={styles.dates}>
            {formatStayDate(search.checkIn)} to {formatStayDate(search.checkOut)} · {nights}{" "}
            {nights === 1 ? "night" : "nights"} · {search.guests}{" "}
            {search.guests === 1 ? "guest" : "guests"}
          </p>
          <dl className={styles.breakdown}>
            <div>
              <dt>Room subtotal</dt>
              <dd>{money(roomSubtotal)}</dd>
            </div>
            {selectedExtras.map((extra) => (
              <div key={extra.id}>
                <dt>{extra.name}</dt>
                <dd>{money(extra.price.amount * (extra.charge === "per-night" ? nights : 1))}</dd>
              </div>
            ))}
            {addOnSubtotal > 0 && (
              <div>
                <dt>Listed add-ons</dt>
                <dd>{money(addOnSubtotal)}</dd>
              </div>
            )}
            <div>
              <dt>
                Taxes &amp; local charges <Info size={15} />
              </dt>
              <dd>Not included</dd>
            </div>
          </dl>
          <div className={styles.total}>
            <h3>
              Estimated <em>total</em>
            </h3>
            <div>
              <output aria-label="Estimated total amount" aria-live="polite">
                {money(subtotal)}
              </output>
              <small>{currency}</small>
            </div>
          </div>
          <p className={styles.note}>Final rates and add-on charges require hotel confirmation.</p>
          {canContinue ? (
            <Link
              href={`/booking/checkout?${query}`}
              className={`${websiteClassName("brand-button")} ${styles.continue}`}
            >
              {checkoutLabel} <ArrowRight size={19} />
            </Link>
          ) : (
            <>
              <button
                type="button"
                className={`${websiteClassName("brand-button")} ${styles.continue}`}
                disabled
              >
                {checkoutLabel}
              </button>
              <p role="status" className={styles.note}>
                Choose enough rooms for your stay to continue.
              </p>
            </>
          )}
          <p className={styles.notice}>
            <Info size={17} />{" "}
            {isDemo
              ? "Demo only. No rooms are held and no payment is collected."
              : "Availability and final prices are rechecked before confirmation."}
          </p>
        </aside>
      </div>
    </main>
  );
}
