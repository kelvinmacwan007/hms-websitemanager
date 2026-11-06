"use client";

import Link from "next/link";
import { GuestInput } from "./GuestInput";
import { validateGuestForm } from "@/lib/booking/guestForm";
import { BookingStaySummary } from "./BookingStaySummary";
import flow from "./BookingFlow.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import type { CartLine } from "@/lib/booking/cart";
import type { AvailabilitySearch, HotelExtra } from "@/types/hotel";
import type { HmsOption, HmsForecastDay } from "@/services/patelHms/integrationTypes";
import { HMS_READ_ONLY } from "@/lib/api/hmsPolicy";
import { allocateParty, partySummary } from "@/lib/booking/party";

async function lookup(action: string, params: Record<string, string> = {}) {
  const response = await fetch(`/api/booking/hms?${new URLSearchParams({ action, ...params })}`, {
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Hotel data could not be loaded.");
  return result.data;
}

function GuestFields({
  index,
  name,
  occupancy,
  initialAdults,
  initialChildren,
  initialPets,
  maxPets,
}: {
  index: number;
  name: string;
  occupancy: number;
  initialAdults: number;
  initialChildren: number;
  initialPets: number;
  maxPets: number;
}) {
  const [countries, setCountries] = useState<HmsOption[]>([]);
  const [states, setStates] = useState<HmsOption[]>([]);
  const [cities, setCities] = useState<HmsOption[]>([]);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loadingZip, setLoadingZip] = useState(false);
  useEffect(() => {
    let active = true;
    lookup("countries")
      .then((data) => {
        if (active) setCountries(data);
      })
      .catch(() => {
        if (active) setError("Countries could not be loaded. Refresh to try again.");
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (country)
      lookup("states", { id: country })
        .then((data) => {
          if (active) setStates(data);
        })
        .catch(() => {
          if (active) setError("States could not be loaded.");
        });
    return () => {
      active = false;
    };
  }, [country]);
  useEffect(() => {
    let active = true;
    if (state)
      lookup("cities", { id: state })
        .then((data) => {
          if (active) setCities(data);
        })
        .catch(() => {
          if (active) setError("Cities could not be loaded.");
        });
    return () => {
      active = false;
    };
  }, [state]);
  const field = (key: string) => `room-${index}-${key}`;
  async function findZip() {
    setError("");
    setLoadingZip(true);
    try {
      const location = await lookup("zipcode", { zipcode: zip });
      if (!location.countryId || !location.stateId || !location.cityId) throw new Error();
      setCountry(String(location.countryId));
      setState(String(location.stateId));
      setCity(String(location.cityId));
      setStates([]);
      setCities([]);
    } catch {
      setError("Location could not be found. Select it below.");
    } finally {
      setLoadingZip(false);
    }
  }
  const inputClass = websiteClassName(
    "checkout-input mt-2 min-h-12 w-full px-4 py-3 text-sm text-ink outline-none",
  );
  return (
    <fieldset className={websiteClassName("surface-panel p-6")}>
      <legend className={websiteClassName("font-display text-2xl")}>
        Room {index + 1}: {name}
      </legend>
      <p className={websiteClassName("mb-5 text-sm text-muted")}>
        Enter the lead adult guest for this room.
      </p>
      <div className={websiteClassName("grid gap-5 sm:grid-cols-2")}>
        <label>
          Adults in this room
          <GuestInput
            className={inputClass}
            name={field("totalAdult")}
            type="number"
            min={1}
            max={occupancy}
            defaultValue={initialAdults}
            required
          />
        </label>
        <label>
          Children in this room
          <GuestInput
            className={inputClass}
            name={field("totalChild")}
            type="number"
            min={0}
            max={occupancy - 1}
            defaultValue={initialChildren}
            required
          />
        </label>
        {maxPets > 0 && (
          <label>
            Pets requested for this room
            <GuestInput
              className={inputClass}
              name={field("pets")}
              type="number"
              min={0}
              max={maxPets}
              defaultValue={initialPets}
              required
            />
            <span className="block mt-2 text-sm text-muted">
              The hotel must confirm your pet request and any fees.
            </span>
          </label>
        )}
        <label>
          Gender
          <select className={inputClass} name={field("gender")} defaultValue="0">
            <option value="0">Prefer not to say</option>
            <option value="1">Male</option>
            <option value="2">Female</option>
            <option value="3">Non-binary</option>
          </select>
        </label>
        {(
          [
            ["firstName", "First name", "text", "given-name"],
            ["lastName", "Last name", "text", "family-name"],
            ["email", "Email", "email", "email"],
            ["mobile", "Phone", "tel", "tel"],
          ] as const
        ).map(([key, label, type, autoComplete]) => (
          <label key={key}>
            {label}
            <GuestInput
              className={inputClass}
              name={field(key)}
              type={type}
              placeholder={key === "mobile" ? "+1 202 555 0147" : undefined}
              autoComplete={autoComplete}
              maxLength={150}
              required
            />
          </label>
        ))}
        <label>
          ZIP / postal code
          <GuestInput
            className={inputClass}
            name={field("zipCode")}
            value={zip}
            onChange={(event) => setZip(event.target.value)}
            maxLength={16}
            required
          />
        </label>
        <button
          className={websiteClassName("ghost-button self-end")}
          type="button"
          onClick={findZip}
          disabled={loadingZip || zip.length < 2}
        >
          {loadingZip ? "Finding location…" : "Find location by ZIP"}
        </button>
        {(
          [
            [
              "countryId",
              "Country",
              country,
              countries,
              (value: string) => {
                setCountry(value);
                setState("");
                setCity("");
                setStates([]);
                setCities([]);
              },
            ],
            [
              "stateId",
              "State",
              state,
              states,
              (value: string) => {
                setState(value);
                setCity("");
                setCities([]);
              },
            ],
            ["cityId", "City", city, cities, setCity],
          ] as const
        ).map(([key, label, value, options, change]) => (
          <label key={key}>
            {label}
            <select
              className={inputClass}
              aria-label={label}
              name={field(key)}
              value={value}
              onChange={(event) => change(event.target.value)}
              required
              disabled={(key === "stateId" && !country) || (key === "cityId" && !state)}
            >
              <option value="">Select {label.toLowerCase()}</option>
              {options.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className={websiteClassName("mt-4 text-error")}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function HmsCheckout({
  lines,
  search,
  query,
  estimate,
  currency,
  hotelName,
  extras = [],
}: {
  lines: CartLine[];
  search: AvailabilitySearch;
  query: string;
  estimate: number;
  currency: string;
  hotelName: string;
  extras?: HotelExtra[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [forecast, setForecast] = useState<Record<string, HmsForecastDay[]>>({});
  const rooms = lines.flatMap((line) => Array.from({ length: line.quantity }, () => line.room));
  const allocation = allocateParty(rooms, search);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateGuestForm(event.currentTarget)) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const storageKey = `hms-attempt:${query}`;
      let accessToken = sessionStorage.getItem(storageKey);
      if (!accessToken) {
        accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
        sessionStorage.setItem(storageKey, accessToken);
      }
      setAttempted(true);
      const response = await fetch("/api/booking/hms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reserve",
          query,
          accessToken,
          rooms: rooms.map((_, index) => {
            const value = (key: string) => String(form.get(`room-${index}-${key}`) ?? "");
            return {
              totalAdult: Number(value("totalAdult")),
              totalChild: Number(value("totalChild")),
              pets: Number(value("pets")),
              guest: {
                firstName: value("firstName"),
                lastName: value("lastName"),
                email: value("email"),
                mobile: value("mobile"),
                zipCode: value("zipCode"),
                gender: Number(value("gender")),
                countryId: Number(value("countryId")),
                stateId: Number(value("stateId")),
                cityId: Number(value("cityId")),
              },
            };
          }),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (
          [400, 409].includes(response.status) &&
          !result.reservationId &&
          response.status === 400
        )
          setAttempted(false);
        throw new Error(result.error ?? "Booking needs checking by the hotel.");
      }
      router.push(`/booking/payment?${query}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Booking could not be completed. Contact the hotel before submitting again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function recover() {
    setBusy(true);
    try {
      const accessToken = sessionStorage.getItem(`hms-attempt:${query}`);
      const response = await fetch("/api/booking/hms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "resume", accessToken }),
      });
      const result = await response.json();
      if (!response.ok || !result.reservationId)
        throw new Error(
          result.error ??
            "The hotel must check this booking attempt. Do not create another reservation.",
        );
      router.push(`/booking/payment?${query}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Contact the hotel to check this attempt.");
    } finally {
      setBusy(false);
    }
  }
  async function loadForecast(roomId: string) {
    try {
      setForecast((current) => ({ ...current, [roomId]: [] }));
      const data = await lookup("forecast", { roomId, fromDate: search.checkIn });
      setForecast((current) => ({ ...current, [roomId]: data }));
    } catch {
      setError("The rate forecast could not be loaded.");
    }
  }
  return (
    <main className={websiteClassName("container py-12")}>
      <div className={flow.split}>
        <div className={flow.content}>
          <Link
            className={websiteClassName("text-brand font-semibold")}
            href={`/booking/extras?${query}`}
          >
            Back to extras
          </Link>
          <h1 className={websiteClassName("section-title")}>Guest details</h1>
          <p className={websiteClassName("mt-4 text-muted")}>
            {hotelName} · {formatStayDate(search.checkIn)} to {formatStayDate(search.checkOut)} ·{" "}
            {partySummary(search)}
          </p>
          <p className={websiteClassName("mt-4")}>
            Estimated room subtotal: {formatMoney({ amount: estimate, currency })}. The hotel
            provides the final taxes and payable balance after reservation creation.
          </p>
          <div className={websiteClassName("mt-5 flex flex-wrap gap-3")}>
            {lines.map((line) => (
              <button
                type="button"
                className={websiteClassName("ghost-button")}
                key={line.room.id}
                onClick={() => loadForecast(line.room.id)}
              >
                View daily rates: {line.room.name}
              </button>
            ))}
          </div>
          {Object.entries(forecast).map(([id, days]) => (
            <div className={websiteClassName("mt-4 overflow-x-auto")} key={id}>
              <table className={websiteClassName("w-full text-left text-sm")}>
                <caption>
                  {lines.find((line) => line.room.id === id)?.room.name} — rate forecast
                </caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Nightly rate</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.rateDate}>
                      <td>{formatStayDate(day.rateDate.slice(0, 10))}</td>
                      <td>{formatMoney({ amount: day.rate, currency })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {HMS_READ_ONLY ? (
            <p role="status" className={websiteClassName("surface-panel mt-8 p-6")}>
              Read-only testing. You can view room availability and daily rates. Reservations and
              payments are disabled.
            </p>
          ) : (
            <form onSubmit={submit} className={websiteClassName("mt-8 grid gap-8")}>
              {rooms.map((room, index) => (
                <GuestFields
                  key={`${room.id}-${index}`}
                  index={index}
                  name={room.name}
                  occupancy={room.occupancy}
                  initialAdults={allocation[index].adults}
                  initialChildren={allocation[index].children}
                  initialPets={allocation[index].pets}
                  maxPets={search.pets ?? 0}
                />
              ))}
              <label className={websiteClassName("flex items-start gap-3")}>
                <GuestInput type="checkbox" required className={websiteClassName("mt-1")} />I
                authorize the hotel to create this reservation and understand payment may be
                required. I have reviewed the hotel’s policies.
              </label>
              {error && (
                <p role="alert" className={websiteClassName("text-error")}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || attempted}
                className={websiteClassName("brand-button justify-self-start")}
              >
                {busy
                  ? "Creating reservation…"
                  : attempted
                    ? "Booking submitted — check status"
                    : "Create reservation"}
              </button>
              {attempted && !busy && (
                <button
                  type="button"
                  onClick={recover}
                  className={websiteClassName("ghost-button justify-self-start")}
                >
                  Check reservation status
                </button>
              )}
            </form>
          )}
        </div>
        <BookingStaySummary
          hotelName={hotelName}
          search={search}
          lines={lines}
          total={estimate}
          currency={currency}
          extras={extras}
        />
      </div>
    </main>
  );
}
