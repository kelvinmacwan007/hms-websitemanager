"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { offsetDate } from "@/lib/booking/settings";
import styles from "./BookingDatePicker.module.css";

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
    weekday: "short",
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
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [month, setMonth] = useState(monthOf(value || min));
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  const upper = max || offsetDate(min, 730);
  const minimumMonth = monthOf(min);
  const maximumMonth = monthOf(upper);
  const clamp = (date: string) => (date < min ? min : date > upper ? upper : date);
  const years = Array.from(
    { length: Math.max(1, Number(upper.slice(0, 4)) - Number(min.slice(0, 4)) + 1) },
    (_, i) => Number(min.slice(0, 4)) + i,
  );

  function close() {
    dialog.current?.close();
  }
  function show() {
    setMonth(monthOf(clamp(value || today)));
    setOpen(true);
  }

  function calendar(start: string, second: boolean) {
    const date = dateOf(start);
    const monthIndex = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const blanks = (date.getUTCDay() + 6) % 7;
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
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span key={day} className={styles.weekday} aria-hidden="true">
              {day}
            </span>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = `${start.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                key={day}
                type="button"
                data-date={day}
                disabled={day < min || day > upper}
                aria-label={displayDate(day)}
                aria-pressed={day === value}
                aria-current={day === today ? "date" : undefined}
                data-range={Boolean(rangeStart && rangeEnd && day > rangeStart && day < rangeEnd)}
                data-endpoint={day === rangeStart || day === rangeEnd}
                onClick={() => {
                  onChange(day);
                  close();
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        className={`${styles.trigger} ${className}`}
        aria-label={`${label}: ${value ? displayDate(value) : "Choose date"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        <span>{value ? displayDate(value) : "Choose date"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={styles.dialog}
            aria-labelledby={id}
            onClose={() => setOpen(false)}
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
                <h2 id={id}>Choose your {label.toLowerCase()} date</h2>
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
            <div className={styles.calendars}>
              {calendar(month, false)}
              {calendar(shiftMonth(month, 1), true)}
            </div>
            <div className={styles.footer}>
              <span>{value ? displayDate(value) : "Select an available date"}</span>
              <button type="button" onClick={close}>
                Done
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
