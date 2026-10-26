"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { RoomCard } from "@/components/rooms/RoomCard";
import styles from "./RoomCartPicker.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cartQuery, type CartLine } from "@/lib/booking/cart";
import { formatMoney } from "@/lib/utils/format";
import type { AvailabilitySearch, HotelRoom } from "@/types/hotel";

export function RoomCartPicker({
  rooms,
  search,
  isDemo,
  initialItems,
}: {
  rooms: HotelRoom[];
  search: AvailabilitySearch;
  isDemo: boolean;
  initialItems: Array<{ roomSlug: string; rateId: string; quantity: number }>;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      initialItems.map((item) => [`${item.roomSlug}:${item.rateId}`, item.quantity]),
    ),
  );
  const lines: CartLine[] = rooms.flatMap((room) =>
    room.ratePlans
      .filter((rate) => rate.available)
      .flatMap((rate) => {
        const quantity = quantities[`${room.slug}:${rate.id}`] ?? 0;
        return quantity ? [{ room, rate, quantity }] : [];
      }),
  );
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const capacity = lines.reduce((sum, line) => sum + line.room.occupancy * line.quantity, 0);
  const mixedCurrencies = new Set(lines.map((line) => line.rate.price.currency)).size > 1;
  const overInventory = lines.some((line) => {
    const roomCount = lines
      .filter((item) => item.room.id === line.room.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    return (line.rate.inventoryCount ?? Number.POSITIVE_INFINITY) < roomCount;
  });
  const canReview =
    count === search.rooms &&
    capacity >= search.guests &&
    !mixedCurrencies &&
    !overInventory &&
    (!search.pets || lines.some((line) => line.room.petsAllowed !== false));
  const params = useSearchParams();
  const reviewQuery = cartQuery(search, lines);
  params
    .getAll("addon")
    .slice(0, 50)
    .forEach((value) => reviewQuery.append("addon", value));
  const preview = params.get("__website_preview");
  if (preview) reviewQuery.set("__website_preview", preview);
  const reviewHref = canReview ? `/booking/cart?${reviewQuery}` : "/booking#room-cart";

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("hotel-cart-update", {
        detail: {
          searchKey: new URLSearchParams(window.location.search).toString(),
          count,
          href: reviewHref,
        },
      }),
    );
  }, [count, reviewHref]);

  function adjust(room: HotelRoom, rateId: string, delta: number) {
    const key = `${room.slug}:${rateId}`;
    setQuantities((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(10, (current[key] ?? 0) + delta)),
    }));
  }

  return (
    <div className={websiteClassName("mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]")}>
      <div className={styles.roomGrid}>
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} search={search} availabilityChecked>
            {room.ratePlans
              .filter((rate) => rate.available)
              .map((rate) => {
                const quantity = quantities[`${room.slug}:${rate.id}`] ?? 0;
                const selectedRooms = lines
                  .filter((line) => line.room.id === room.id)
                  .reduce((total, line) => total + line.quantity, 0);
                const inventory = rate.inventoryCount;
                const inventoryReached = inventory !== undefined && selectedRooms >= inventory;
                return (
                  <div key={rate.id} className={styles.rate}>
                    <div>
                      <p className={websiteClassName("font-semibold")}>{rate.name}</p>
                      <p className={websiteClassName("mt-1 text-sm leading-5 text-muted")}>
                        {[rate.mealPlan, rate.cancellationPolicy].filter(Boolean).join(" · ")}
                      </p>
                      <p className={styles.price}>
                        <strong>{formatMoney(rate.price)}</strong> <span>/ night</span>
                      </p>
                      <p
                        className={styles.availability}
                        data-status={
                          inventory === 0
                            ? "unavailable"
                            : inventory === undefined
                              ? "unknown"
                              : "available"
                        }
                        aria-live="polite"
                      >
                        {inventory === undefined
                          ? "Contact the hotel to confirm the number of rooms available."
                          : inventory === 0
                            ? "No rooms available for these dates."
                            : `${inventory} ${inventory === 1 ? "room available" : "rooms available"} for these dates.${inventoryReached ? " All available rooms of this type are selected." : ""}`}
                      </p>
                    </div>
                    <div
                      className={websiteClassName("flex shrink-0 items-center gap-3")}
                      aria-label={`${rate.name} quantity`}
                    >
                      <button
                        type="button"
                        className={websiteClassName(
                          "icon-button grid h-11 w-11 place-items-center disabled:opacity-40",
                        )}
                        onClick={() => adjust(room, rate.id, -1)}
                        disabled={!quantity}
                        aria-label={`Remove one ${room.name}, ${rate.name}`}
                      >
                        <Minus size={17} />
                      </button>
                      <span
                        className={websiteClassName("w-8 text-center font-semibold tabular-nums")}
                        aria-live="polite"
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className={websiteClassName(
                          "icon-button grid h-11 w-11 place-items-center disabled:opacity-40",
                        )}
                        onClick={() => adjust(room, rate.id, 1)}
                        disabled={count >= search.rooms || inventoryReached || quantity >= 10}
                        aria-label={`Add one ${room.name}, ${rate.name}`}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            <Link
              href={`/rooms/${room.slug}`}
              className={websiteClassName(
                "mt-7 inline-block text-sm font-semibold text-brand underline underline-offset-4",
              )}
            >
              View room details <ArrowRight size={18} className="inline-block ml-1" />
            </Link>
          </RoomCard>
        ))}
      </div>
      <aside
        id="room-cart"
        className={websiteClassName(
          "surface-panel glass-panel h-fit scroll-mt-28 p-6 lg:sticky lg:top-28",
        )}
        aria-label="Room cart"
      >
        <div className={websiteClassName("flex items-center gap-3")}>
          <ShoppingBag size={22} className={websiteClassName("text-brand")} />
          <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
            Your rooms
          </Heading>
        </div>
        <p className={websiteClassName("mt-3 text-sm text-muted")}>
          {count} of {search.rooms} selected
        </p>
        {count < search.rooms ? (
          <p className={websiteClassName("mt-2 text-sm text-muted")}>
            Select {search.rooms - count} more {search.rooms - count === 1 ? "room" : "rooms"} to
            continue.
          </p>
        ) : null}
        {lines.length ? (
          <div className={websiteClassName("mt-5 divide-y divide-line border-y border-line")}>
            {lines.map((line) => (
              <div
                key={`${line.room.id}:${line.rate.id}`}
                className={websiteClassName("flex items-start justify-between gap-3 py-4 text-sm")}
              >
                <div>
                  <p className={websiteClassName("font-semibold")}>
                    {line.quantity} × {line.room.name}
                  </p>
                  <p className={websiteClassName("mt-1 text-muted")}>{line.rate.name}</p>
                </div>
                <button
                  type="button"
                  title="Remove rate"
                  aria-label={`Remove ${line.room.name}, ${line.rate.name}`}
                  onClick={() =>
                    setQuantities((current) => ({
                      ...current,
                      [`${line.room.slug}:${line.rate.id}`]: 0,
                    }))
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={websiteClassName("mt-6 text-sm text-muted")}>
            Select a rate for each room in your stay.
          </p>
        )}
        {count === search.rooms && capacity < search.guests ? (
          <p className={websiteClassName("mt-4 text-sm text-error")}>
            These rooms do not fit all {search.guests} guests.
          </p>
        ) : null}
        {overInventory ? (
          <p className={websiteClassName("mt-4 text-sm text-error")}>
            Fewer rooms are available at this rate. Reduce the quantity or choose another rate.
          </p>
        ) : null}
        {mixedCurrencies ? (
          <p className={websiteClassName("mt-4 text-sm text-error")}>
            Choose rooms priced in the same currency.
          </p>
        ) : null}
        {canReview ? (
          <Link href={reviewHref} className={websiteClassName("brand-button mt-6 w-full")}>
            <span className={websiteClassName("button-text-container")}>
              <span className={websiteClassName("button-text")}>Review cart</span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            className={websiteClassName("brand-button mt-6 w-full cursor-not-allowed opacity-50")}
            disabled
          >
            <span className={websiteClassName("button-text-container")}>
              <span className={websiteClassName("button-text")}>Review cart</span>
            </span>
          </button>
        )}
        <p className={websiteClassName("mt-3 text-xs leading-5 text-muted")}>
          {isDemo
            ? "Sample rates only. No rooms are held."
            : "Availability and prices must be confirmed before booking."}
        </p>
      </aside>
    </div>
  );
}
