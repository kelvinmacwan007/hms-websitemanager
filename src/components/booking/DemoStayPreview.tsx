"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { Checkbox } from "@/components/common/Checkbox";

import Link from "next/link";
import { useState } from "react";
import { stayQuery, partySummary } from "@/lib/booking/party";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import type { AvailabilitySearch, HotelExtra, HotelRoom, RatePlan } from "@/types/hotel";

type Props = {
  room: HotelRoom;
  rate: RatePlan;
  search: AvailabilitySearch;
  nights: number;
  extras: HotelExtra[];
  initialExtraIds: string[];
};

export function DemoStayPreview({ room, rate, search, nights, extras, initialExtraIds }: Props) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialExtraIds));
  const selectedExtras = extras.filter((extra) => selectedIds.has(extra.id));
  const roomSubtotal = rate.price.amount * nights * search.rooms;
  const extrasSubtotal = selectedExtras.reduce(
    (sum, extra) => sum + extra.price.amount * (extra.charge === "per-night" ? nights : 1),
    0,
  );
  const money = (amount: number) => formatMoney({ amount, currency: rate.price.currency });
  const checkoutQuery = new URLSearchParams({
    ...Object.fromEntries(stayQuery(search)),
    room: room.slug,
    rate: rate.id,
  });
  selectedExtras.forEach((extra) => checkoutQuery.append("extra", extra.id));

  function toggleExtra(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
      <p className={websiteClassName("eyebrow")}>Demo booking preview</p>
      <Heading as="h1" className={websiteClassName("section-title mt-4")}>
        Your sample stay.
      </Heading>
      <p className={websiteClassName("mt-5 max-w-2xl leading-7 text-muted")}>
        This is an estimate using static demo data. No room is held, no payment is collected, and no
        reservation is created.
      </p>
      <div className={websiteClassName("mt-10 grid gap-10 lg:grid-cols-[1fr_360px]")}>
        <div>
          <section className={websiteClassName("border-t border-line py-7")}>
            <p className={websiteClassName("eyebrow")}>01 Stay</p>
            <Heading as="h2" className={websiteClassName("mt-3 font-display text-3xl")}>
              {room.name}
            </Heading>
            <p className={websiteClassName("mt-3 text-muted")}>
              {formatStayDate(search.checkIn)} to {formatStayDate(search.checkOut)} · {nights}{" "}
              {nights === 1 ? "night" : "nights"} · {partySummary(search)} · {search.rooms}{" "}
              {search.rooms === 1 ? "room" : "rooms"}
            </p>
            <p className={websiteClassName("mt-3 text-sm text-muted")}>
              {rate.name}
              {rate.mealPlan ? ` · ${rate.mealPlan}` : ""}
            </p>
            {rate.cancellationPolicy ? (
              <p className={websiteClassName("mt-2 text-sm text-muted")}>
                {rate.cancellationPolicy}
              </p>
            ) : null}
          </section>
          {extras.length ? (
            <section className={websiteClassName("border-t border-line py-7")}>
              <p className={websiteClassName("eyebrow")}>02 Extras</p>
              <Heading as="h2" className={websiteClassName("mt-3 font-display text-3xl")}>
                Make it your stay.
              </Heading>
              <div className={websiteClassName("mt-6 grid gap-3")}>
                {extras.map((extra) => (
                  <label
                    key={extra.id}
                    className={websiteClassName(
                      "flex cursor-pointer items-start gap-4 border border-line bg-surface p-5",
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.has(extra.id)}
                      onChange={(event) => toggleExtra(extra.id, event.target.checked)}
                      className={websiteClassName("mt-0.5")}
                    />
                    <span className={websiteClassName("flex-1")}>
                      <strong className={websiteClassName("block")}>{extra.name}</strong>
                      <span className={websiteClassName("mt-1 block text-sm text-muted")}>
                        {extra.description}
                      </span>
                    </span>
                    <span className={websiteClassName("text-sm font-semibold")}>
                      {formatMoney(extra.price)}
                      <span className={websiteClassName("block text-xs font-normal text-muted")}>
                        {extra.charge === "per-night" ? "per night" : "per stay"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ) : null}
          <section className={websiteClassName("border-t border-line py-7")}>
            <p className={websiteClassName("eyebrow")}>{extras.length ? "03" : "02"} Next step</p>
            <Heading as="h2" className={websiteClassName("mt-3 font-display text-3xl")}>
              Review guest details.
            </Heading>
            <p className={websiteClassName("mt-3 max-w-xl leading-7 text-muted")}>
              See the demo checkout with this room and estimate. No reservation or payment is
              processed.
            </p>
            <Link
              href={`/booking/checkout?${checkoutQuery}`}
              className={websiteClassName("brand-button mt-6")}
            >
              <span className={websiteClassName("button-text-container")}>
                <span className={websiteClassName("button-text")}>Continue to demo checkout</span>
              </span>
            </Link>
          </section>
        </div>
        <aside
          className={websiteClassName(
            "h-fit border border-line bg-surface p-6 lg:sticky lg:top-28",
          )}
          aria-live="polite"
        >
          <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
            Sample estimate
          </Heading>
          <div className={websiteClassName("mt-6 flex justify-between gap-4 text-sm")}>
            <span>
              {money(rate.price.amount)} x {nights} nights x {search.rooms} rooms
            </span>
            <strong>{money(roomSubtotal)}</strong>
          </div>
          {selectedExtras.map((extra) => (
            <div
              key={extra.id}
              className={websiteClassName("mt-4 flex justify-between gap-4 text-sm")}
            >
              <span>
                {extra.name}
                {extra.charge === "per-night" ? ` x ${nights}` : ""}
              </span>
              <strong>
                {money(extra.price.amount * (extra.charge === "per-night" ? nights : 1))}
              </strong>
            </div>
          ))}
          <div
            className={websiteClassName(
              "mt-6 flex justify-between gap-4 border-t border-line pt-5 text-lg font-bold",
            )}
          >
            <span>Estimated subtotal</span>
            <span>{money(roomSubtotal + extrasSubtotal)}</span>
          </div>
          <p className={websiteClassName("mt-4 text-xs leading-5 text-muted")}>
            Sample prices before taxes or local charges. Final terms are provided by the hotel.
          </p>
        </aside>
      </div>
    </main>
  );
}
