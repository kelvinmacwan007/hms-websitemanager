"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { Check, ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const iso = (date: Date) => date.toISOString().slice(0, 10);
const shiftMonth = (date: Date, amount: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));

function Month({
  month,
  today,
  available,
  loading,
}: {
  month: Date;
  today: string;
  available: Set<string>;
  loading: boolean;
}) {
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = month.getUTCDay();
  return (
    <div className={websiteClassName("min-w-0")}>
      <Heading as="h3" className={websiteClassName("text-center text-sm font-bold uppercase")}>
        {month.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" })}
      </Heading>
      <div
        className={websiteClassName(
          "mt-5 grid grid-cols-7 text-center text-xs font-semibold text-muted",
        )}
      >
        {weekdays.map((day) => (
          <span key={day} className={websiteClassName("py-2")}>
            {day}
          </span>
        ))}
      </div>
      <div className={websiteClassName("grid grid-cols-7")}>
        {Array.from({ length: offset }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const value = iso(
            new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1)),
          );
          const past = value < today;
          const enabled = !loading && !past && available.has(value);
          const unavailable = !loading && !past && !enabled;
          return (
            <div
              key={value}
              title={
                past
                  ? "Past date"
                  : loading
                    ? "Checking availability"
                    : enabled
                      ? "Available"
                      : "Unavailable"
              }
              aria-label={`${value}: ${past ? "past" : loading ? "checking" : enabled ? "available" : "unavailable"}`}
              className={websiteClassName(
                `relative grid aspect-square place-items-center border text-sm ${loading && !past ? "animate-pulse border-line bg-brand-soft text-transparent" : enabled ? "calendar-day-available" : unavailable ? "calendar-day-unavailable" : "border-line bg-background text-muted/35"}`,
              )}
            >
              <span>{index + 1}</span>
              {enabled ? (
                <Check
                  size={10}
                  className={websiteClassName("absolute right-1 top-1")}
                  aria-hidden="true"
                />
              ) : unavailable ? (
                <X
                  size={10}
                  className={websiteClassName("absolute right-1 top-1")}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoomAvailabilityCalendar({
  roomSlug,
  today,
}: {
  roomSlug: string;
  occupancy: number;
  today: string;
}) {
  const firstAllowedMonth = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const [month, setMonth] = useState(firstAllowedMonth);
  const [available, setAvailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const secondMonth = shiftMonth(month, 1);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/rooms/availability-calendar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: roomSlug, month: iso(month).slice(0, 7) }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as { available?: string[]; error?: string };
        if (!response.ok || !data.available) throw new Error(data.error || "Calendar unavailable.");
        return data.available;
      })
      .then((dates) => setAvailable(new Set(dates)))
      .catch((cause) => {
        if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, roomSlug]);

  function moveMonth(amount: number) {
    setLoading(true);
    setError("");
    setAvailable(new Set());
    setMonth((current) => shiftMonth(current, amount));
  }

  return (
    <section
      className={websiteClassName("border-b border-line py-10")}
      aria-labelledby="availability-heading"
    >
      <div className={websiteClassName("flex flex-wrap items-end justify-between gap-4")}>
        <div>
          <p className={websiteClassName("eyebrow")}>Date overview</p>
          <Heading
            as="h2"
            id="availability-heading"
            className={websiteClassName("mt-2 font-display text-4xl")}
          >
            Availability
          </Heading>
        </div>
        <div
          className={websiteClassName("flex flex-wrap items-center gap-4 text-xs font-semibold")}
        >
          <span className={websiteClassName("flex items-center gap-2")}>
            <i className={websiteClassName("h-4 w-4 border border-success bg-success")} /> Available
          </span>
          <span className={websiteClassName("flex items-center gap-2")}>
            <i className={websiteClassName("h-4 w-4 border border-error bg-error")} /> Not available
          </span>
          <span className={websiteClassName("flex items-center gap-2")}>
            <i className={websiteClassName("h-4 w-4 border border-line bg-background")} /> Past
          </span>
        </div>
      </div>
      <div className={websiteClassName("surface-panel glass-panel mt-7 p-4 sm:p-6")}>
        <div className={websiteClassName("flex items-center justify-between")}>
          <button
            type="button"
            className={websiteClassName(
              "icon-button grid h-10 w-10 place-items-center rounded-md border border-line disabled:opacity-35",
            )}
            onClick={() => moveMonth(-1)}
            disabled={month <= firstAllowedMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          {loading ? (
            <span className={websiteClassName("flex items-center gap-2 text-sm text-muted")}>
              <LoaderCircle size={16} className={websiteClassName("animate-spin")} /> Updating
              availability
            </span>
          ) : (
            <span className={websiteClassName("text-sm text-muted")}>
              Availability updates automatically
            </span>
          )}
          <button
            type="button"
            className={websiteClassName(
              "icon-button grid h-10 w-10 place-items-center rounded-md border border-line",
            )}
            onClick={() => moveMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className={websiteClassName("mt-5 grid gap-8 md:grid-cols-2")}>
          <Month month={month} today={today} available={available} loading={loading} />
          <div className={websiteClassName("hidden md:block")}>
            <Month month={secondMonth} today={today} available={available} loading={loading} />
          </div>
        </div>
        {error ? (
          <p className={websiteClassName("mt-5 text-sm font-semibold text-error")} role="alert">
            {error}
          </p>
        ) : null}
        <p
          className={websiteClassName(
            "mt-5 border-t border-line pt-4 text-xs leading-5 text-muted",
          )}
        >
          Green dates currently have at least one room and rate available. Availability may change
          before booking is confirmed.
        </p>
      </div>
    </section>
  );
}
