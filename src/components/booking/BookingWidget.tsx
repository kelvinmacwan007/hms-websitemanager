"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import styles from "./BookingWidget.module.css";
import { BookingDatePicker } from "./BookingDatePicker";
import { GuestPicker } from "./GuestPicker";
import type { AvailabilitySearch } from "@/types/hotel";

import { CalendarDays, Search } from "lucide-react";
import { useBookingSettings } from "./BookingSettingsContext";
import { offsetDate, propertyDate } from "@/lib/booking/settings";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

export function BookingWidget({
  compact = false,
  values,
  onSearch,
  action = "/booking",
  hiddenFields = [],
}: {
  compact?: boolean;
  values?: AvailabilitySearch;
  onSearch?: (search: AvailabilitySearch) => void;
  action?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  const { settings, today: contextToday, timeZone } = useBookingSettings();
  const today = contextToday || propertyDate(timeZone);
  const minArrival = offsetDate(today, settings.minAdvanceDays);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const previewToken = searchParams.get("__website_preview");
  const [checkIn, setCheckIn] = useState(values?.checkIn ?? minArrival);
  const [checkOut, setCheckOut] = useState(
    values?.checkOut ?? offsetDate(checkIn, settings.minStay),
  );

  function changeCheckIn(next: string) {
    setCheckIn(next);
    if (next && checkOut < offsetDate(next, settings.minStay))
      setCheckOut(offsetDate(next, settings.minStay));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchData = {
      checkIn: formData.get("checkIn") as string,
      checkOut: formData.get("checkOut") as string,
      guests: parseInt(formData.get("guests") as string, 10),
      rooms: parseInt(formData.get("rooms") as string, 10),
      adults: Number(formData.get("adults")),
      children: Number(formData.get("children")),
      pets: Number(formData.get("pets")),
    };
    const result = parseAvailabilitySearch(
      Object.fromEntries(Object.entries(searchData).map(([key, value]) => [key, String(value)])),
      settings,
      timeZone,
    );
    if (!result.search) {
      setError(result.error ?? "Choose a valid stay.");
      return;
    }
    setError("");
    onSearch?.(searchData);
    event.currentTarget.submit();
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className={websiteClassName(
        `booking-widget glass-panel bg-surface p-4 shadow-lift [&_input]:!outline-none [&_input]:!ring-0 [&_label:focus-within]:!translate-y-0 [&_label:focus-within]:!border-[var(--color-accent-text)] [&_label:focus-within]:!shadow-[0_0_0_2px_var(--color-accent-glow)] ${compact ? "" : "lg:-mt-12 lg:relative lg:z-20"}`,
      )}
    >
      {previewToken && <input type="hidden" name="__website_preview" value={previewToken} />}
      {hiddenFields.map((field, index) => (
        <input key={`${field.name}-${index}`} type="hidden" name={field.name} value={field.value} />
      ))}
      {searchParams
        .getAll("addon")
        .slice(0, 50)
        .map((value, index) => (
          <input key={index} type="hidden" name="addon" value={value} />
        ))}
      <div className={`booking-widget-grid ${styles.grid}`}>
        <div className={styles.field}>
          <span className={styles.label}>
            <CalendarDays size={15} /> Check-in
          </span>
          <BookingDatePicker
            label="Check-in"
            name="checkIn"
            today={today}
            min={minArrival}
            max={offsetDate(today, settings.advanceWindow)}
            value={checkIn}
            onChange={changeCheckIn}
            rangeStart={checkIn}
            rangeEnd={checkOut}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>
            <CalendarDays size={15} /> Check-out
          </span>
          <BookingDatePicker
            label="Check-out"
            name="checkOut"
            today={today}
            min={offsetDate(checkIn || minArrival, settings.minStay)}
            max={offsetDate(checkIn || minArrival, settings.maxStay)}
            value={checkOut}
            onChange={setCheckOut}
            rangeStart={checkIn}
            rangeEnd={checkOut}
          />
        </div>
        <GuestPicker values={values} maxRooms={settings.maxRooms} />
        <button className={`${websiteClassName("brand-button")} ${styles.submit}`} type="submit">
          <span className={websiteClassName("button-text-container")}>
            <span className={websiteClassName("button-text")}>
              <Search size={17} /> Check availability
            </span>
          </span>
        </button>
      </div>
      {error && (
        <p role="alert" className={websiteClassName("mt-3 text-sm text-error")}>
          {error}
        </p>
      )}
    </form>
  );
}
