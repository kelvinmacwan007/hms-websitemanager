"use client";

import { useState, type FormEvent } from "react";
import type { WebsiteDocument } from "./content";
import { visibleRooms } from "../src/lib/booking/visibility";
import { parseAvailabilitySearch } from "../src/lib/booking/search";
import {
  DEFAULT_BOOKING_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  offsetDate,
  propertyDate,
} from "../src/lib/booking/settings";
import { resolveCart } from "../src/lib/booking/cart";
import type { AvailabilitySearch } from "../src/types/hotel";

/** Local preview only: never creates a hold, sends guest data, or charges a card. */
export function SetupBookingPreview({
  content,
  onComplete,
}: {
  content: WebsiteDocument;
  onComplete: () => void;
}) {
  const { hotel } = content;
  const settings = hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS;
  const payment = hotel.paymentSettings ?? DEFAULT_PAYMENT_SETTINGS;
  const [stage, setStage] = useState<"home" | "search" | "guest" | "payment" | "confirmation">(
    "home",
  );
  const [search, setSearch] = useState<AvailabilitySearch | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const rooms = visibleRooms(hotel.rooms).filter((room) => room.availabilityStatus !== "sold-out");
  const today = propertyDate(hotel.timeZone);
  const arrival = offsetDate(today, settings.minAdvanceDays);
  const requested = rooms.flatMap((room) =>
    room.ratePlans.flatMap((rate) => {
      const quantity = selection[JSON.stringify([room.slug, rate.id])] ?? 0;
      return quantity ? [JSON.stringify([room.slug, rate.id, quantity])] : [];
    }),
  );
  const lines = search ? resolveCart(search, rooms, { item: requested }) : null;
  const nights = search ? (Date.parse(search.checkOut) - Date.parse(search.checkIn)) / 86400000 : 0;
  const subtotal =
    lines?.reduce((sum, line) => sum + line.rate.price.amount * line.quantity * nights, 0) ?? 0;
  const currency = lines?.[0]?.rate.price.currency ?? hotel.currency ?? "USD";
  const money = (amount: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);

  function findRooms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = Object.fromEntries(
      ["checkIn", "checkOut", "guests", "rooms"].map((key) => [key, String(form.get(key) ?? "")]),
    );
    const result = parseAvailabilitySearch(params, settings, hotel.timeZone);
    if (!result.search) {
      setError(result.error ?? "Choose a valid stay.");
      return;
    }
    setSearch(result.search);
    setSelection({});
    setError("");
    setStage("search");
  }

  return (
    <section className="wm-booking-test" aria-label="Booking flow test">
      <header>
        <p className="wm-kicker">DRAFT BOOKING PREVIEW</p>
        <h2>{hotel.name}</h2>
        <p>
          Use made-up guest details. Prices are samples from Patel HMS; no live availability, room
          hold, payment, or reservation is created.
        </p>
      </header>
      <ol className="wm-test-progress" aria-label="Booking steps">
        {(["home", "search", "guest", "payment", "confirmation"] as const).map((step) => (
          <li key={step} aria-current={stage === step ? "step" : undefined}>
            {step === "search"
              ? "Room & rate"
              : step === "guest"
                ? "Guest details"
                : step[0].toUpperCase() + step.slice(1)}
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="wm-notice is-error">
          {error}
        </p>
      )}
      {stage === "home" && (
        <form onSubmit={findRooms}>
          <h3>Find your stay</h3>
          <div className="wm-two-columns">
            <label>
              Check-in
              <input
                name="checkIn"
                type="date"
                defaultValue={arrival}
                min={arrival}
                max={offsetDate(today, settings.advanceWindow)}
                required
              />
            </label>
            <label>
              Check-out
              <input
                name="checkOut"
                type="date"
                defaultValue={offsetDate(arrival, settings.minStay)}
                required
              />
            </label>
            <label>
              Guests
              <input name="guests" type="number" defaultValue={2} min={1} max={20} required />
            </label>
            <label>
              Rooms
              <input
                name="rooms"
                type="number"
                defaultValue={1}
                min={1}
                max={settings.maxRooms}
                required
              />
            </label>
          </div>
          <button type="submit" className="wm-button wm-button-primary">
            Search sample rooms
          </button>
        </form>
      )}
      {stage === "search" && (
        <>
          <h3>Select {search?.rooms} room(s) and rate(s)</h3>
          <p>Room capacities, availability, and rate visibility are checked before continuing.</p>
          {rooms.map((room) => (
            <section key={room.id} className="wm-readonly-row">
              <h4>{room.name}</h4>
              <p>Up to {room.occupancy} guests per room</p>
              {room.ratePlans
                .filter((rate) => rate.available)
                .map((rate) => (
                  <label key={rate.id} className="wm-test-rate">
                    <span>
                      {rate.name}
                      <small>
                        {rate.price.currency} {rate.price.amount} / night ·{" "}
                        {rate.cancellationPolicy}
                      </small>
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={Math.min(search?.rooms ?? 1, rate.inventoryCount ?? 10)}
                      aria-label={`${room.name}, ${rate.name} quantity`}
                      value={selection[JSON.stringify([room.slug, rate.id])] ?? 0}
                      onChange={(event) =>
                        setSelection({
                          ...selection,
                          [JSON.stringify([room.slug, rate.id])]: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                ))}
            </section>
          ))}
          {!rooms.length && (
            <p>
              No visible rooms have matching rates. Enable a room and at least one rate in the
              editor.
            </p>
          )}
          <div className="wm-inline-actions">
            <button type="button" className="wm-button" onClick={() => setStage("home")}>
              Change dates
            </button>
            <button
              type="button"
              className="wm-button wm-button-primary"
              disabled={!lines}
              onClick={() => {
                setError("");
                setStage("guest");
              }}
            >
              Guest details
            </button>
          </div>
          {!lines && (
            <p>Select the requested room count, with enough capacity and available inventory.</p>
          )}
        </>
      )}
      {stage === "guest" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setStage("payment");
          }}
        >
          <h3>Sample guest details</h3>
          <div className="wm-two-columns">
            <label>
              First name
              <input name="firstName" defaultValue="Test" required maxLength={100} />
            </label>
            <label>
              Last name
              <input name="lastName" defaultValue="Guest" required maxLength={100} />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                defaultValue="test@example.com"
                required
                maxLength={254}
              />
            </label>
            <label>
              Phone {settings.requirePhone ? "(required)" : "(optional)"}
              <input name="phone" type="tel" required={settings.requirePhone} maxLength={30} />
            </label>
            {settings.requireAddress && (
              <label>
                Address
                <input name="address" required maxLength={250} />
              </label>
            )}
          </div>
          {hotel.policies?.map((policy, index) => (
            <details key={index}>
              <summary>{policy.title}</summary>
              <p>{policy.description}</p>
            </details>
          ))}
          <label className="wm-test-consent">
            <input type="checkbox" required />I have reviewed the stay policies.
          </label>
          <div className="wm-inline-actions">
            <button type="button" className="wm-button" onClick={() => setStage("search")}>
              Change rooms
            </button>
            <button type="submit" className="wm-button wm-button-primary">
              Review payment policy
            </button>
          </div>
        </form>
      )}
      {stage === "payment" && (
        <>
          <h3>
            {payment.mode === "pay-at-property"
              ? "Pay at property"
              : payment.mode === "deposit"
                ? "Deposit payment"
                : "Full payment"}
          </h3>
          <p>
            Sample room subtotal: <strong>{money(subtotal)}</strong>, before taxes and extras.
          </p>
          <p>
            {payment.mode === "pay-at-property"
              ? "Guests pay at the property. This test does not create a real booking."
              : `Sample amount due now: ${money(subtotal * (payment.mode === "deposit" ? payment.depositPercent / 100 : 1))}. The final amount is confirmed when guests make a real booking.`}
          </p>
          <div className="wm-inline-actions">
            <button
              type="button"
              className="wm-button wm-button-primary"
              onClick={() => {
                setError("");
                setStage("confirmation");
                onComplete();
              }}
            >
              {payment.mode === "pay-at-property"
                ? "Preview reservation success"
                : "Preview payment & reservation success"}
            </button>
            {payment.mode !== "pay-at-property" && (
              <>
                <button
                  type="button"
                  className="wm-button"
                  onClick={() =>
                    setError(
                      "Sample payment declined. No reservation is confirmed. Try again or change your stay.",
                    )
                  }
                >
                  Preview decline
                </button>
                <button
                  type="button"
                  className="wm-button"
                  onClick={() =>
                    setError(
                      "Sample payment is still being checked. A real booking is confirmed only when payment and the reservation are verified.",
                    )
                  }
                >
                  Preview pending
                </button>
                <button
                  type="button"
                  className="wm-button"
                  onClick={() =>
                    setError(
                      "Sample payment succeeded, but the booking could not be confirmed. Contact your administrator for help.",
                    )
                  }
                >
                  Preview booking failure
                </button>
              </>
            )}
          </div>
        </>
      )}
      {stage === "confirmation" && (
        <div role="status">
          <h3>Sample confirmation</h3>
          <p>
            Your draft booking test is complete. A real confirmation will show the verified hotel
            reservation reference and hotel contact details.
          </p>
          <p>
            <strong>No reservation was created and no money was charged.</strong>
          </p>
          <button
            type="button"
            className="wm-button"
            onClick={() => {
              setStage("home");
              setSearch(null);
              setSelection({});
            }}
          >
            Start another test
          </button>
        </div>
      )}
    </section>
  );
}
