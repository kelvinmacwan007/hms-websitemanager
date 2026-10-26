"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Minus, Plus, Users, X } from "lucide-react";
import type { AvailabilitySearch } from "@/types/hotel";
import { guestParty, partySummary } from "@/lib/booking/party";
import styles from "./GuestPicker.module.css";

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
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const guests = party.adults + party.children;
  const summary = `${partySummary({ guests, ...party })}, ${party.rooms} ${party.rooms === 1 ? "room" : "rooms"}`;

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

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
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.label}>
          <Users size={17} /> Guests &amp; rooms
        </span>
        <span className={styles.summary}>
          <span title={summary}>{summary}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </button>
      <input type="hidden" name="guests" value={guests} />
      {Object.entries(party).map(([key, count]) => (
        <input key={key} type="hidden" name={key} value={count} />
      ))}
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            id={id}
            aria-label="Guests and rooms"
            className={styles.dialog}
            onClose={() => {
              setOpen(false);
              trigger.current?.focus();
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
              <h2>Guests &amp; rooms</h2>
              <button
                type="button"
                className={styles.close}
                aria-label="Close guest selector"
                onClick={() => dialog.current?.close()}
              >
                <X size={20} />
              </button>
            </div>
            {rows.map(({ key, label, hint, min, max }) => (
              <div key={key} className={styles.row}>
                <div className={styles.copy}>
                  <strong>{label}</strong>
                  <span>{hint}</span>
                </div>
                <div className={styles.counter}>
                  <button
                    type="button"
                    aria-label={`Decrease ${label.toLowerCase()}`}
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
                    disabled={party[key] >= max}
                    onClick={() => change(key, 1)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
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
