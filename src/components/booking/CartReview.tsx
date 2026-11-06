"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { Checkbox } from "@/components/common/Checkbox";
import { QuantityStepper } from "@/components/common/QuantityStepper";

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
  Info,
} from "lucide-react";
import { BookingProgress } from "./BookingProgress";
import { RoomCard } from "@/components/rooms/RoomCard";
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
  step = 1,
}: {
  hotelName: string;
  search: AvailabilitySearch;
  lines: CartLine[];
  extras: HotelExtra[];
  addOns?: HotelAddOn[];
  initialExtraIds: string[];
  isDemo: boolean;
  step?: 1 | 2;
}) {
  const [lines, setLines] = useState(initialLines);
  const params = useSearchParams();
  const currency = initialLines[0].rate.price.currency;
  const eligibleAddOns = addOns.filter(
    (item) =>
      item.price.currency === currency &&
      (!item.startDate || item.startDate <= search.checkIn) &&
      (!item.endDate || item.endDate >= search.checkIn),
  );
  const [requests, setRequests] = useState(() =>
    selectedAddOnRequests(eligibleAddOns, params.getAll("addon")),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialExtraIds));
  const nights =
    (Date.parse(`${search.checkOut}T00:00:00Z`) - Date.parse(`${search.checkIn}T00:00:00Z`)) /
    86400000;
  const money = (amount: number) => formatMoney({ amount, currency });
  const eligibleExtras = extras.filter(
    (extra) =>
      isDemo &&
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
  const editQuery = cartQuery(search, lines);
  for (const destination of [query, editQuery]) {
    selectedExtras.forEach((extra) => destination.append("extra", extra.id));
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
  function changeService(item: HotelAddOn, quantity: number) {
    const count = Math.max(0, Math.min(99, quantity));
    setRequests((current) => [
      ...current.filter((request) => request.item.id !== item.id),
      ...(count ? [{ item, quantity: count }] : []),
    ]);
  }
  const checkoutLabel = step === 1 ? "Continue to extras" : "Continue to guest details";
  const nextHref = `/booking/${step === 1 ? "extras" : "checkout"}?${query}`;
  return (
    <>
      <BookingProgress step={step} hotelName={hotelName} query={query.toString()} demo={isDemo} />
      <main className={`${websiteClassName("container")} ${styles.page}`}>
        <Link
          href={step === 1 ? `/booking?${editQuery}` : `/booking/cart?${query}`}
          className={styles.back}
        >
          <ArrowLeft size={17} /> {step === 1 ? "Change rooms" : "Back to rooms"}
        </Link>
        <div className={styles.layout}>
          <div className={styles.main}>
            <header className={styles.heading}>
              <p className={websiteClassName("eyebrow")}>Your reservation</p>
              <Heading as="h1">{step === 1 ? "Your room cart" : "Add extras to your stay"}</Heading>
              <p>
                {step === 1
                  ? "Review your stay before continuing."
                  : "Choose optional services for a more comfortable stay."}
              </p>
            </header>
            {step === 1 && (
              <>
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
                <section className={styles.selectedRooms} aria-label="Selected rooms">
                  <h2>
                    <BedDouble size={24} />{" "}
                    {lines.length === 1 ? "Selected room" : "Selected rooms"}
                  </h2>
                  {lines.length ? (
                    lines.map((line) => (
                      <RoomCard
                        key={`${line.room.id}:${line.rate.id}`}
                        room={line.room}
                        search={search}
                        layout="responsive"
                      >
                        <div className={styles.cartRoomPrice}>
                          <span className={styles.rateName}>{line.rate.name}</span>
                          <div>
                            <strong>{money(line.rate.price.amount)}</strong>
                            <span>/ night</span>
                          </div>
                          <p>
                            {line.quantity} {line.quantity === 1 ? "room" : "rooms"} &middot;{" "}
                            {nights} {nights === 1 ? "night" : "nights"}
                          </p>
                          {line.rate.mealPlan && <p>{line.rate.mealPlan}</p>}
                        </div>
                        <div className={styles.cartRoomActions}>
                          <Link href={`/booking?${editQuery}`} data-site-button>
                            <Pencil size={16} aria-hidden="true" /> Change room
                          </Link>
                          <Link href={`/rooms/${line.room.slug}?${editQuery}`} data-site-button>
                            View details <ArrowRight size={18} aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            aria-label={`Remove ${line.room.name}`}
                            onClick={() =>
                              setLines((current) =>
                                current.filter(
                                  (item) =>
                                    item.room.id !== line.room.id || item.rate.id !== line.rate.id,
                                ),
                              )
                            }
                          >
                            <Trash2 size={16} aria-hidden="true" /> Remove
                          </button>
                        </div>
                      </RoomCard>
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
              </>
            )}
            {step === 2 && (eligibleAddOns.length > 0 || eligibleExtras.length === 0) && (
              <section className={styles.card} aria-label="Extras and services">
                <h2>Extras &amp; services</h2>
                {eligibleAddOns.length > 0 ? (
                  <div className={styles.serviceList}>
                    {eligibleAddOns.map((item) => {
                      const quantity =
                        requests.find((request) => request.item.id === item.id)?.quantity || 0;
                      return (
                        <div className={styles.service} key={item.id} data-selected={quantity > 0}>
                          <Checkbox
                            aria-label={`Add ${item.name}`}
                            checked={quantity > 0}
                            onChange={(event) => changeService(item, event.target.checked ? 1 : 0)}
                          />
                          <div className={styles.serviceCopy}>
                            <strong>{item.name}</strong>
                            {item.description && <p>{item.description}</p>}
                            <small>Hotel confirmation required</small>
                          </div>
                          <div className={styles.servicePrice}>
                            <strong>{formatMoney(item.price)}</strong>
                            <small>Listed price</small>
                          </div>
                          <QuantityStepper
                            className={styles.serviceControls}
                            value={quantity}
                            label={`${item.name} quantity`}
                            decreaseLabel={`Decrease ${item.name}`}
                            increaseLabel={`Increase ${item.name}`}
                            onChange={(value) => changeService(item, value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.note}>
                    No optional services are available for these dates. You can continue without
                    extras.
                  </p>
                )}
                {eligibleAddOns.length > 0 && (
                  <p className={styles.note}>
                    Services are requests. Availability and final charges are confirmed by the
                    hotel.
                  </p>
                )}
              </section>
            )}
            {step === 2 && eligibleExtras.length > 0 && (
              <section className={styles.card}>
                <h2>Optional extras</h2>
                <div className={styles.extraList}>
                  {eligibleExtras.map((extra) => (
                    <label
                      key={extra.id}
                      className={styles.service}
                      data-selected={selectedIds.has(extra.id)}
                    >
                      <Checkbox
                        checked={selectedIds.has(extra.id)}
                        onChange={(event) => toggleExtra(extra.id, event.target.checked)}
                      />
                      <span className={styles.serviceCopy}>
                        <strong>{extra.name}</strong>
                        <small>{extra.description}</small>
                      </span>
                      <span className={styles.servicePrice}>
                        <strong>{formatMoney(extra.price)}</strong>
                        <small>{extra.charge === "per-night" ? "per night" : "per stay"}</small>
                      </span>
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
            <p className={styles.note}>
              Final rates and add-on charges require hotel confirmation.
            </p>
            {canContinue ? (
              <Link
                href={nextHref}
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
              <Info size={17} /> Availability and final prices are rechecked before confirmation.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
