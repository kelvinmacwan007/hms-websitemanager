"use client";

import { BookingDatePicker } from "../booking/BookingDatePicker";
import { GuestPicker } from "../booking/GuestPicker";
import { useBookingSettings } from "../booking/BookingSettingsContext";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { offsetDate } from "@/lib/booking/settings";
import { guestParty } from "@/lib/booking/party";

import styles from "./RoomReservationPanel.module.css";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { Checkbox } from "@/components/common/Checkbox";

import Link from "next/link";
import { CalendarDays, ArrowRight, LockKeyhole, Info } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@/lib/utils/format";
import type { HotelAddOn, HotelExtra, HotelRoom } from "@/types/hotel";
import { useSearchParams } from "next/navigation";

export function RoomReservationPanel({
  room,
  extras,
  today,
  addOns = [],
  addOnsUnavailable = false,
}: {
  room: HotelRoom;
  extras: HotelExtra[];
  today: string;
  addOns?: HotelAddOn[];
  addOnsUnavailable?: boolean;
}) {
  const params = useSearchParams();
  const { settings, timeZone } = useBookingSettings();
  const { search: initialSearch } = parseAvailabilitySearch(
    Object.fromEntries(params),
    settings,
    timeZone,
  );
  const rates = room.ratePlans.filter((rate) => rate.available);
  const minArrival = offsetDate(today, settings.minAdvanceDays);
  const [checkIn, setCheckIn] = useState(initialSearch?.checkIn ?? minArrival);
  const [checkOut, setCheckOut] = useState(
    initialSearch?.checkOut ?? offsetDate(minArrival, settings.minStay),
  );
  const stayRange = {
    checkIn,
    checkOut,
    minArrival,
    maxArrival: offsetDate(today, settings.advanceWindow),
    minStay: settings.minStay,
    maxStay: settings.maxStay,
    onChange: (start: string, end: string) => {
      setCheckIn(start);
      setCheckOut(end);
    },
  };
  const [rooms, setRooms] = useState(initialSearch?.rooms ?? 1);
  const [guests, setGuests] = useState(initialSearch?.guests ?? Math.min(2, room.occupancy));
  const [party, setParty] = useState(() =>
    guestParty(initialSearch ?? { guests: Math.min(2, room.occupancy) }),
  );
  const [rateId, setRateId] = useState(rates[0]?.id ?? "");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const previewToken = useSearchParams().get("__website_preview");
  const rate = rates.find((item) => item.id === rateId);
  const price = rate?.price ?? room.startingPrice;
  const eligibleAddOns = addOns.filter(
    (item) =>
      (!item.startDate || item.startDate <= checkIn) &&
      (!item.endDate || item.endDate >= checkIn) &&
      (!price || item.price.currency === price.currency),
  );
  const selectedAddOns = eligibleAddOns.filter((item) => addOnQuantities[item.id]);
  const addOnTotal = selectedAddOns.reduce(
    (sum, item) => sum + item.price.amount * addOnQuantities[item.id],
    0,
  );
  const nights = Math.max(
    1,
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000,
  );
  const maxRooms = Math.max(1, Math.min(settings.maxRooms, rate?.inventoryCount ?? 10));
  const total =
    (price?.amount ?? 0) * rooms * nights +
    addOnTotal +
    extras
      .filter(
        (extra) =>
          selectedExtras.includes(extra.id) && (!price || extra.price.currency === price.currency),
      )
      .reduce(
        (sum, extra) => sum + extra.price.amount * (extra.charge === "per-night" ? nights : 1),
        0,
      );

  const href = (() => {
    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
      rooms: String(rooms),
      ...Object.fromEntries(Object.entries(party).map(([key, count]) => [key, String(count)])),
    });
    if (rate) query.append("item", JSON.stringify([room.slug, rate.id, rooms]));
    else query.set("room", room.slug);
    eligibleAddOns.forEach((item) => {
      if (addOnQuantities[item.id])
        query.append("addon", JSON.stringify([item.id, addOnQuantities[item.id]]));
    });
    if (previewToken) query.set("__website_preview", previewToken);
    selectedExtras.forEach((extra) => query.append("extra", extra));
    return `${rate ? "/booking/cart" : "/booking"}?${query}`;
  })();

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (checkOut < offsetDate(value, settings.minStay))
      setCheckOut(offsetDate(value, settings.minStay));
  }

  const money = (amount: number) =>
    price ? formatMoney({ amount, currency: price.currency }) : "Check rates";
  const pricedExtras = extras.filter((extra) => price && extra.price.currency === price.currency);
  const capacityError =
    guests > room.occupancy * rooms
      ? `This selection accommodates up to ${room.occupancy * rooms} guests. Add more rooms or reduce your guests.`
      : "";

  return (
    <aside className={styles.panel} aria-label="Room reservation">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Your stay</p>
        <h2 className={styles.price}>
          <span>{price ? formatMoney(price) : "Check rates"}</span>
          {price && <small>/ night</small>}
        </h2>
      </header>
      <div className={styles.dates}>
        <div className={styles.dateRow}>
          <CalendarDays size={21} aria-hidden="true" />
          <div>
            <span className={styles.dateLabel}>Check-in</span>
            <BookingDatePicker
              stayRange={stayRange}
              label="Check-in"
              today={today}
              min={minArrival}
              value={checkIn}
              onChange={changeCheckIn}
              className={styles.dateButton}
              rangeStart={checkIn}
              rangeEnd={checkOut}
            />
          </div>
        </div>
        <div className={styles.dateRow}>
          <CalendarDays size={21} aria-hidden="true" />
          <div>
            <span className={styles.dateLabel}>Check-out</span>
            <BookingDatePicker
              stayRange={stayRange}
              initialSelection="end"
              label="Check-out"
              today={today}
              min={offsetDate(checkIn, settings.minStay)}
              value={checkOut}
              onChange={setCheckOut}
              className={styles.dateButton}
              rangeStart={checkIn}
              rangeEnd={checkOut}
            />
          </div>
        </div>
      </div>
      <div className={styles.guestFields}>
        <GuestPicker
          values={{ guests, rooms, ...party }}
          maxRooms={maxRooms}
          onChange={(next) => {
            setRooms(next.rooms);
            setGuests(next.adults + next.children);
            setParty(next);
          }}
        />
      </div>
      {rates.length > 1 && (
        <label className={styles.rateSelect}>
          Room rate
          <select value={rateId} onChange={(event) => setRateId(event.target.value)}>
            {rates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatMoney(item.price)}
              </option>
            ))}
          </select>
        </label>
      )}
      {addOnsUnavailable && (
        <p role="status" className={websiteClassName("mb-4 text-sm text-muted")}>
          Add-ons could not be loaded. Please refresh or contact the hotel for available services.
        </p>
      )}
      {(eligibleAddOns.length > 0 || pricedExtras.length > 0) && (
        <fieldset className={styles.addOns}>
          <legend>
            Add-ons <em>(optional)</em>
          </legend>
          <p className={styles.addOnIntro}>Enhance your stay with optional services.</p>
          <div className={styles.addOnList} data-lenis-prevent>
            {eligibleAddOns.map((item) => {
              const quantity = addOnQuantities[item.id] ?? 0;
              return (
                <div key={item.id} className={styles.addOnRow} data-selected={quantity > 0}>
                  <label className={styles.addOnLabel}>
                    <Checkbox
                      checked={quantity > 0}
                      onChange={(event) =>
                        setAddOnQuantities((current) => ({
                          ...current,
                          [item.id]: event.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.description || "Arrange with the hotel"}</small>
                    </span>
                  </label>
                  <div className={styles.addOnPrice}>
                    <strong>{formatMoney(item.price)}</strong>
                    {quantity > 0 && (
                      <div
                        className={styles.quantityControl}
                        role="group"
                        aria-label={`${item.name} quantity controls`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          disabled={quantity <= 1}
                          onClick={() =>
                            setAddOnQuantities((current) => ({
                              ...current,
                              [item.id]: Math.max(1, quantity - 1),
                            }))
                          }
                        >
                          ?
                        </button>
                        <input
                          data-compact-control
                          type="number"
                          min={1}
                          max={99}
                          value={quantity}
                          aria-label={`${item.name} quantity`}
                          onChange={(event) =>
                            setAddOnQuantities((current) => ({
                              ...current,
                              [item.id]: Math.max(1, Math.min(99, Number(event.target.value) || 1)),
                            }))
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={quantity >= 99}
                          onClick={() =>
                            setAddOnQuantities((current) => ({
                              ...current,
                              [item.id]: Math.min(99, quantity + 1),
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {pricedExtras.map((extra) => (
              <label
                key={extra.id}
                className={styles.addOnRow}
                data-selected={selectedExtras.includes(extra.id)}
              >
                <span className={styles.addOnLabel}>
                  <Checkbox
                    checked={selectedExtras.includes(extra.id)}
                    onChange={() =>
                      setSelectedExtras((current) =>
                        current.includes(extra.id)
                          ? current.filter((id) => id !== extra.id)
                          : [...current, extra.id],
                      )
                    }
                  />
                  <span>
                    <strong>{extra.name}</strong>
                    <small>{extra.charge === "per-night" ? "Per night" : "Per stay"}</small>
                  </span>
                </span>
                <span className={styles.addOnPrice}>
                  <strong>{formatMoney(extra.price)}</strong>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <section className={styles.summary} aria-label="Price summary">
        <h3>Price summary</h3>
        <dl>
          <div>
            <dt>
              {rooms === 1 ? "Room" : `${rooms} rooms`} × {nights}{" "}
              {nights === 1 ? "night" : "nights"}
            </dt>
            <dd>{money((price?.amount ?? 0) * rooms * nights)}</dd>
          </div>
          {pricedExtras
            .filter((extra) => selectedExtras.includes(extra.id))
            .map((extra) => (
              <div key={extra.id}>
                <dt>{extra.name}</dt>
                <dd>{money(extra.price.amount * (extra.charge === "per-night" ? nights : 1))}</dd>
              </div>
            ))}
          {selectedAddOns.map((item) => (
            <div key={item.id}>
              <dt>
                {item.name} × {addOnQuantities[item.id]}
              </dt>
              <dd>{money(item.price.amount * addOnQuantities[item.id])}</dd>
            </div>
          ))}
          <div>
            <dt>
              Taxes &amp; fees <Info size={13} aria-hidden="true" />
            </dt>
            <dd>At checkout</dd>
          </div>
        </dl>
        <div className={styles.total} aria-live="polite">
          <strong>Estimated total</strong>
          <span>{money(total)}</span>
        </div>
        {(eligibleAddOns.length > 0 || price) && (
          <p className={styles.disclaimer}>
            Taxes are excluded. Final charges are confirmed by the hotel.
          </p>
        )}
      </section>
      {capacityError && (
        <p id="room-capacity-error" role="alert" className={styles.capacityError}>
          {capacityError}
        </p>
      )}
      <Link
        href={href}
        aria-disabled={Boolean(capacityError)}
        aria-describedby={capacityError ? "room-capacity-error" : undefined}
        onClick={(event) => {
          if (capacityError) event.preventDefault();
        }}
        className={`${websiteClassName("brand-button")} ${styles.reserve}`}
      >
        <span>Reserve this room</span>
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
      <p className={styles.footer}>
        <LockKeyhole size={14} aria-hidden="true" /> Availability rechecked before confirmation
      </p>
    </aside>
  );
}
