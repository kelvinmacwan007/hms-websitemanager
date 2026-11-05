"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { BedDouble, ChevronDown, Minus, Plus, Users, X } from "lucide-react";
import type { AvailabilitySearch } from "@/types/hotel";
import { guestParty } from "@/lib/booking/party";
import styles from "./GuestPicker.module.css";
import { useBookingPopover } from "./useBookingPopover";

type GuestSelection = ReturnType<typeof guestParty> & { rooms: number };

export function GuestPicker({
  values,
  maxRooms,
  onChange,
}: {
  values?: Partial<AvailabilitySearch>;
  maxRooms: number;
  onChange?: (selection: GuestSelection) => void;
}) {
  const [party, setParty] = useState(() => ({
    ...guestParty({ guests: values?.guests ?? 2, ...values }),
    rooms: values?.rooms ?? 1,
  }));
  const [open, setOpen] = useState<"guests" | "rooms" | null>(null);
  const {
    dialog,
    trigger,
    alternateTrigger: roomTrigger,
  } = useBookingPopover(Boolean(open), open === "rooms");
  const id = useId();
  const guests = party.adults + party.children;
  const summary = `${party.adults} ${party.adults === 1 ? "adult" : "adults"}, ${party.children} ${party.children === 1 ? "child" : "children"}, ${party.pets} ${party.pets === 1 ? "pet" : "pets"}`;

  const rows = [
    {
      key: "rooms",
      label: "Rooms",
      hint: "At least one adult in each room",
      min: 1,
      max: Math.min(maxRooms, 20 - party.children),
    },
    {
      key: "adults",
      label: "Adults",
      hint: "At least one adult in each room",
      min: party.rooms,
      max: 20 - party.children,
    },
    {
      key: "children",
      label: "Children",
      hint: "Child rates follow the hotel’s policy",
      min: 0,
      max: 20 - party.adults,
    },
    {
      key: "pets",
      label: "Pets",
      hint: "Request pets; hotel confirmation required",
      min: 0,
      max: 10,
    },
  ] as const;

  function change(key: (typeof rows)[number]["key"], amount: number) {
    const current = party;
    const row = rows.find((row) => row.key === key)!;
    const next = { ...current, [key]: Math.max(row.min, Math.min(row.max, current[key] + amount)) };
    next.adults = Math.max(next.adults, next.rooms);
    setParty(next);
    onChange?.(next);
  }

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <span className={styles.label}>
          <Users size={16} aria-hidden="true" /> Guests
        </span>
        <button
          ref={trigger}
          type="button"
          className={styles.trigger}
          aria-label={`Guests: ${summary}`}
          aria-haspopup="dialog"
          aria-expanded={open === "guests"}
          aria-controls={id}
          onClick={() => {
            setOpen("guests");
          }}
        >
          <span className={styles.summary}>
            <span title={summary}>{summary}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </span>
        </button>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>
          <BedDouble size={16} aria-hidden="true" /> Rooms
        </span>
        <button
          ref={roomTrigger}
          type="button"
          className={styles.trigger}
          aria-label={`Rooms: ${party.rooms} ${party.rooms === 1 ? "room" : "rooms"}`}
          aria-haspopup="dialog"
          aria-expanded={open === "rooms"}
          aria-controls={id}
          onClick={() => {
            setOpen("rooms");
          }}
        >
          <span className={styles.summary}>
            <span>
              {party.rooms} {party.rooms === 1 ? "room" : "rooms"}
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </span>
        </button>
      </div>
      <input type="hidden" name="guests" value={guests} />
      {Object.entries(party).map(([key, count]) => (
        <input key={key} type="hidden" name={key} value={count} />
      ))}
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            id={id}
            aria-label={open === "rooms" ? "Rooms" : "Guests"}
            className={styles.dialog}
            onClose={() => {
              setOpen(null);
              (open === "rooms" ? roomTrigger : trigger).current?.focus();
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
              )
                dialog.current?.close();
            }}
          >
            <div className={styles.heading}>
              <h2>{open === "rooms" ? "Rooms" : "Guests"}</h2>
              <button
                type="button"
                className={styles.close}
                aria-label={open === "rooms" ? "Close room selector" : "Close guest selector"}
                onClick={() => dialog.current?.close()}
              >
                <X size={20} />
              </button>
            </div>
            {rows
              .filter((row) => (open === "rooms" ? row.key === "rooms" : row.key !== "rooms"))
              .map(({ key, label, hint, min, max }) => (
                <div key={key} className={styles.row}>
                  <div className={styles.copy}>
                    <strong>{label}</strong>
                    <span className={styles.hint} id={`${id}-${key}-hint`}>
                      {hint}
                    </span>
                  </div>
                  <div className={styles.counter}>
                    <button
                      type="button"
                      aria-label={`Decrease ${label.toLowerCase()}`}
                      aria-describedby={`${id}-${key}-hint`}
                      disabled={party[key] <= min}
                      onClick={() => change(key, -1)}
                    >
                      <Minus size={18} />
                    </button>
                    <output aria-label={label} aria-live="polite">
                      {party[key]}
                    </output>
                    <button
                      type="button"
                      aria-label={`Increase ${label.toLowerCase()}`}
                      aria-describedby={`${id}-${key}-hint`}
                      disabled={party[key] >= max}
                      onClick={() => change(key, 1)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))}
            <p className={styles.note}>
              {open === "rooms"
                ? "At least one adult per room."
                : "Pet requests require hotel confirmation."}
            </p>
            <button
              type="button"
              className={styles.done}
              data-shimmer
              onClick={() => {
                dialog.current?.close();
              }}
            >
              Done
            </button>
          </dialog>,
          document.body,
        )}
    </div>
  );
}
