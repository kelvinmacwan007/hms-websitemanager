"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { offsetDate } from "@/lib/booking/settings";
import styles from "./BookingDatePicker.module.css";
import { useBookingPopover } from "./useBookingPopover";
import { canSelectStayDate, type StayDateLimits } from "@/lib/booking/dateRange";

type StayRange = StayDateLimits & {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
};

const months = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, index, 1)),
  ),
);
const dateOf = (value: string) => new Date(`${value}T12:00:00Z`);
const monthOf = (value: string) => value.slice(0, 7) + "-01";
const shiftMonth = (value: string, offset: number) => {
  const date = dateOf(value);
  date.setUTCMonth(date.getUTCMonth() + offset, 1);
  return date.toISOString().slice(0, 10);
};
const displayDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOf(value));

export function BookingDatePicker({
  value,
  onChange,
  min,
  max,
  today,
  name,
  label,
  className = "",
  rangeStart,
  rangeEnd,
  stayRange,
  initialSelection = "start",
}: {
  value: string;
  onChange: (value: string) => void;
  min: string;
  max?: string;
  today: string;
  name?: string;
  label: string;
  className?: string;
  rangeStart?: string;
  rangeEnd?: string;
  stayRange?: StayRange;
  initialSelection?: "start" | "end";
}) {
  const id = useId();
  const [month, setMonth] = useState(monthOf(value || min));
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(initialSelection);
  const [draftStart, setDraftStart] = useState(stayRange?.checkIn || "");
  const [draftEnd, setDraftEnd] = useState(stayRange?.checkOut || "");
  const [hovered, setHovered] = useState("");
  const { dialog, trigger } = useBookingPopover(open);
  const lower = stayRange?.minArrival || min;
  const upper = stayRange
    ? selecting === "start"
      ? stayRange.maxArrival
      : offsetDate(draftStart || stayRange.checkIn, stayRange.maxStay)
    : max || offsetDate(min, 730);
  const minimumMonth = monthOf(lower);
  const maximumMonth = monthOf(upper);
  const clamp = (date: string) => (date < lower ? lower : date > upper ? upper : date);
  const selectedStart = stayRange ? draftStart : rangeStart;
  const selectedEnd = stayRange
    ? selecting === "end" && hovered > draftStart
      ? hovered
      : draftEnd
    : rangeEnd;
  const years = Array.from(
    { length: Math.max(1, Number(upper.slice(0, 4)) - Number(lower.slice(0, 4)) + 1) },
    (_, i) => Number(lower.slice(0, 4)) + i,
  );

  function close() {
    dialog.current?.close();
  }
  function show() {
    if (stayRange) {
      setDraftStart(stayRange.checkIn);
      setDraftEnd(stayRange.checkOut);
      setSelecting(initialSelection);
      setHovered("");
    }
    setMonth(monthOf(clamp(value || today)));
    setOpen(true);
  }

  function selectDate(day: string) {
    if (!stayRange) {
      onChange(day);
      close();
      return;
    }
    setHovered("");
    if (selecting === "start" || !draftStart || day <= draftStart) {
      setDraftStart(day);
      setDraftEnd("");
      setSelecting("end");
    } else {
      setDraftEnd(day);
      stayRange.onChange(draftStart, day);
      close();
    }
  }

  function calendar(start: string, second: boolean) {
    const date = dateOf(start);
    const monthIndex = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const blanks = date.getUTCDay();
    const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    return (
      <section
        className={`${styles.month} ${second ? styles.secondMonth : ""}`}
        aria-label={`${months[monthIndex]} ${year}`}
      >
        <div className={styles.monthHeading}>
          {second ? (
            <span>
              {months[monthIndex]} {year}
            </span>
          ) : (
            <>
              <select
                data-compact-control
                aria-label="Calendar month"
                value={monthIndex}
                onChange={(e) =>
                  setMonth(`${year}-${String(Number(e.target.value) + 1).padStart(2, "0")}-01`)
                }
              >
                {months.map((text, i) => {
                  const key = `${year}-${String(i + 1).padStart(2, "0")}-01`;
                  return (
                    <option
                      key={text}
                      value={i}
                      disabled={key < minimumMonth || key > maximumMonth}
                    >
                      {text}
                    </option>
                  );
                })}
              </select>
              <select
                data-compact-control
                aria-label="Calendar year"
                value={year}
                onChange={(e) => {
                  const next = `${e.target.value}-${String(monthIndex + 1).padStart(2, "0")}-01`;
                  setMonth(
                    next < minimumMonth ? minimumMonth : next > maximumMonth ? maximumMonth : next,
                  );
                }}
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className={styles.days}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <span key={day} className={styles.weekday} aria-hidden="true">
              {day}
            </span>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <span key={`blank-${i}`} className={styles.outsideDay} aria-hidden="true">
              {new Date(Date.UTC(year, monthIndex, i - blanks + 1)).getUTCDate()}
            </span>
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = `${start.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                key={day}
                type="button"
                data-date={day}
                disabled={
                  stayRange
                    ? !canSelectStayDate(day, draftStart, selecting, stayRange)
                    : day < min || day > upper
                }
                aria-label={displayDate(day)}
                aria-pressed={stayRange ? day === selectedStart || day === draftEnd : day === value}
                aria-current={day === today ? "date" : undefined}
                data-range={Boolean(
                  selectedStart && selectedEnd && day > selectedStart && day < selectedEnd,
                )}
                data-endpoint={day === selectedStart || day === selectedEnd}
                onMouseEnter={() => {
                  if (
                    stayRange &&
                    selecting === "end" &&
                    canSelectStayDate(day, draftStart, selecting, stayRange)
                  )
                    setHovered(day);
                }}
                onClick={() => selectDate(day)}
              >
                {i + 1}
              </button>
            );
          })}
          {Array.from({ length: (7 - ((blanks + days) % 7)) % 7 }, (_, i) => (
            <span key={`next-${i}`} className={styles.outsideDay} aria-hidden="true">
              {i + 1}
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={trigger}
        type="button"
        className={`${styles.trigger} ${className}`}
        aria-label={`${label}: ${value ? displayDate(value) : "Choose date"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={show}
      >
        <span>{value ? displayDate(value) : "Choose date"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            id={id}
            className={styles.dialog}
            aria-labelledby={`${id}-title`}
            onClose={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                if (
                  e.clientX < rect.left ||
                  e.clientX > rect.right ||
                  e.clientY < rect.top ||
                  e.clientY > rect.bottom
                )
                  close();
              }
            }}
          >
            <div className={styles.title}>
              <div>
                <span>Plan your stay</span>
                <h2 id={`${id}-title`}>
                  {stayRange ? "Choose your stay dates" : `Choose your ${label.toLowerCase()} date`}
                </h2>
              </div>
              <button type="button" aria-label="Close calendar" onClick={close}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.toolbar}>
              <button
                type="button"
                aria-label="Previous month"
                disabled={month <= minimumMonth}
                onClick={() => setMonth(shiftMonth(month, -1))}
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button type="button" onClick={() => setMonth(monthOf(clamp(today)))}>
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                disabled={month >= maximumMonth}
                onClick={() => setMonth(shiftMonth(month, 1))}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
            <div className={styles.calendars} onMouseLeave={() => setHovered("")}>
              {calendar(month, false)}
              {calendar(shiftMonth(month, 1), true)}
            </div>
            <div className={styles.footer}>
              <span role="status" aria-live="polite">
                {stayRange
                  ? selecting === "end" && !draftEnd
                    ? "Now select your check-out date"
                    : selecting === "start"
                      ? "Select your check-in date"
                      : `${Math.round((Date.parse(draftEnd) - Date.parse(draftStart)) / 86400000)} nights selected`
                  : value
                    ? displayDate(value)
                    : "Select an available date"}
              </span>
              <button type="button" disabled={Boolean(stayRange && !draftEnd)} onClick={close}>
                Done
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
