"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { Checkbox } from "@/components/common/Checkbox";

import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DEFAULT_BOOKING_SETTINGS } from "@/lib/booking/settings";
import type { BookingSettings } from "@/types/hotel";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import type { CartLine } from "@/lib/booking/cart";
import type { AvailabilitySearch, HotelExtra, HotelPolicy } from "@/types/hotel";
import { useSmoothScroll } from "@/components/layout/MotionWrapper";
import { partySummary } from "@/lib/booking/party";

type GuestDetails = {
  prefix: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address: string;
  city: string;
  postalCode: string;
  requests: string;
};

type Props = {
  settings?: BookingSettings;
  hotelName: string;
  lines: CartLine[];
  search: AvailabilitySearch;
  nights: number;
  extras: HotelExtra[];
  estimate: number;
  policies: HotelPolicy[];
  backHref: string;
  paymentHref: string;
};

const inputClass = "checkout-input min-h-12 w-full px-4 py-3 text-sm text-ink outline-none";

export function DemoCheckout({
  hotelName,
  lines,
  search,
  nights,
  extras,
  estimate,
  policies,
  backHref,
  paymentHref,
  settings = DEFAULT_BOOKING_SETTINGS,
}: Props) {
  const [guest, setGuest] = useState<GuestDetails | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const scrollTo = useSmoothScroll();
  const money = (amount: number) => formatMoney({ amount, currency: lines[0].rate.price.currency });

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setGuest({
      prefix: String(form.get("prefix") ?? ""),
      firstName: String(form.get("firstName") ?? ""),
      middleInitial: String(form.get("middleInitial") ?? "")
        .trim()
        .toUpperCase(),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      country: String(form.get("country") ?? ""),
      region: String(form.get("region") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      requests: String(form.get("requests") ?? ""),
    });
    setReviewed(true);
    scrollTo(0);
  }

  return (
    <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
      <Link
        href={backHref}
        className={websiteClassName(
          "inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline",
        )}
      >
        <ArrowLeft size={18} /> Back to stay
      </Link>
      <div
        className={websiteClassName(
          "mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7",
        )}
      >
        <div>
          <p className={websiteClassName("eyebrow")}>Demo checkout</p>
          <Heading as="h1" className={websiteClassName("mt-3 font-display text-4xl md:text-5xl")}>
            Guest details
          </Heading>
        </div>
        <p className={websiteClassName("max-w-md text-sm leading-6 text-muted")}>
          Review a sample checkout for {hotelName}. Details stay in this browser tab; no booking or
          payment is created.
        </p>
      </div>

      <div
        className={websiteClassName(
          "mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]",
        )}
      >
        <div className={websiteClassName("min-w-0")}>
          {reviewed && guest ? (
            <section
              className={websiteClassName("surface-panel glass-panel p-6 md:p-8")}
              aria-live="polite"
            >
              <div className={websiteClassName("flex items-center gap-3 text-brand")}>
                <Check size={23} />
                <p className={websiteClassName("eyebrow")}>Details reviewed</p>
              </div>
              <Heading as="h2" className={websiteClassName("mt-4 font-display text-3xl")}>
                Your sample details are ready.
              </Heading>
              <dl
                className={websiteClassName(
                  "mt-6 grid gap-5 border-y border-line py-6 text-sm sm:grid-cols-2",
                )}
              >
                <div>
                  <dt className={websiteClassName("text-muted")}>Lead guest</dt>
                  <dd className={websiteClassName("mt-1 font-semibold")}>
                    {guest.prefix === "Prefer not to say" ? "" : `${guest.prefix} `}
                    {guest.firstName} {guest.middleInitial ? `${guest.middleInitial}. ` : ""}
                    {guest.lastName}
                  </dd>
                </div>
                <div>
                  <dt className={websiteClassName("text-muted")}>Phone</dt>
                  <dd className={websiteClassName("mt-1 font-semibold")}>{guest.phone}</dd>
                </div>
                <div>
                  <dt className={websiteClassName("text-muted")}>Email</dt>
                  <dd className={websiteClassName("mt-1 break-all font-semibold")}>
                    {guest.email}
                  </dd>
                </div>
                <div>
                  <dt className={websiteClassName("text-muted")}>Address</dt>
                  <dd className={websiteClassName("mt-1 font-semibold")}>
                    {guest.address}, {guest.city}
                    {guest.region ? `, ${guest.region}` : ""} {guest.postalCode}, {guest.country}
                  </dd>
                </div>
              </dl>
              {guest.requests ? (
                <p className={websiteClassName("mt-4 text-sm text-muted")}>
                  Request: {guest.requests}
                </p>
              ) : null}
              <p
                className={websiteClassName(
                  "mt-6 border-l-4 border-brand bg-brand-soft p-4 text-sm leading-6",
                )}
              >
                This is only a demo review. No reservation, payment, or message was sent to the
                hotel.
              </p>
              <div className={websiteClassName("mt-7 flex flex-wrap gap-3")}>
                <button
                  type="button"
                  className={websiteClassName("ghost-button")}
                  onClick={() => setReviewed(false)}
                >
                  Edit details
                </button>
                <Link href={paymentHref} className={websiteClassName("brand-button")}>
                  <span className={websiteClassName("button-text-container")}>
                    <span className={websiteClassName("button-text")}>
                      Continue to demo payment
                    </span>
                  </span>
                </Link>
              </div>
            </section>
          ) : (
            <form onSubmit={review} className={websiteClassName("space-y-10")}>
              <section className={websiteClassName("border-t border-line pt-7")}>
                <div className={websiteClassName("flex items-baseline justify-between gap-4")}>
                  <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
                    Lead guest information
                  </Heading>
                  <span className={websiteClassName("text-xs text-muted")}>* Required</span>
                </div>
                <div className={websiteClassName("mt-6 grid gap-4 sm:grid-cols-12")}>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-3",
                    )}
                  >
                    Prefix *
                    <select
                      className={websiteClassName(inputClass)}
                      name="prefix"
                      autoComplete="honorific-prefix"
                      defaultValue={guest?.prefix ?? ""}
                      required
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="Mr">Mr</option>
                      <option value="Ms">Ms</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Mx">Mx</option>
                      <option value="Dr">Dr</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-6",
                    )}
                  >
                    First name *
                    <input
                      className={websiteClassName(inputClass)}
                      name="firstName"
                      autoComplete="given-name"
                      defaultValue={guest?.firstName}
                      required
                      maxLength={80}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-3",
                    )}
                  >
                    Middle initial
                    <input
                      className={websiteClassName(inputClass)}
                      name="middleInitial"
                      autoComplete="additional-name"
                      defaultValue={guest?.middleInitial}
                      maxLength={1}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-6",
                    )}
                  >
                    Last name *
                    <input
                      className={websiteClassName(inputClass)}
                      name="lastName"
                      autoComplete="family-name"
                      defaultValue={guest?.lastName}
                      required
                      maxLength={80}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-6",
                    )}
                  >
                    Phone {settings.requirePhone ? "*" : "(optional)"}
                    <input
                      className={websiteClassName(inputClass)}
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      defaultValue={guest?.phone}
                      required={settings.requirePhone}
                      maxLength={32}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-12",
                    )}
                  >
                    Email address *
                    <input
                      className={websiteClassName(inputClass)}
                      name="email"
                      type="email"
                      autoComplete="email"
                      defaultValue={guest?.email}
                      required
                      maxLength={160}
                    />
                    <span className={websiteClassName("text-xs font-normal text-muted")}>
                      Your confirmation email would be sent here in a live booking.
                    </span>
                  </label>
                </div>
              </section>

              <section className={websiteClassName("border-t border-line pt-7")}>
                <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
                  Address
                </Heading>
                <div className={websiteClassName("mt-6 grid gap-4 sm:grid-cols-12")}>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-6",
                    )}
                  >
                    Country or region {settings.requireAddress ? "*" : "(optional)"}
                    <input
                      className={websiteClassName(inputClass)}
                      name="country"
                      autoComplete="country-name"
                      defaultValue={guest?.country}
                      required={settings.requireAddress}
                      maxLength={80}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-6",
                    )}
                  >
                    State or province
                    <input
                      className={websiteClassName(inputClass)}
                      name="region"
                      autoComplete="address-level1"
                      defaultValue={guest?.region}
                      maxLength={80}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-12",
                    )}
                  >
                    Address 1 {settings.requireAddress ? "*" : "(optional)"}
                    <input
                      className={websiteClassName(inputClass)}
                      name="address"
                      autoComplete="address-line1"
                      defaultValue={guest?.address}
                      required={settings.requireAddress}
                      maxLength={160}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-7",
                    )}
                  >
                    City {settings.requireAddress ? "*" : "(optional)"}
                    <input
                      className={websiteClassName(inputClass)}
                      name="city"
                      autoComplete="address-level2"
                      defaultValue={guest?.city}
                      required={settings.requireAddress}
                      maxLength={80}
                    />
                  </label>
                  <label
                    className={websiteClassName(
                      "grid min-w-0 gap-2 text-sm font-semibold sm:col-span-5",
                    )}
                  >
                    Zip or postal code {settings.requireAddress ? "*" : "(optional)"}
                    <input
                      className={websiteClassName(inputClass)}
                      name="postalCode"
                      autoComplete="postal-code"
                      defaultValue={guest?.postalCode}
                      required={settings.requireAddress}
                      maxLength={24}
                    />
                  </label>
                </div>
              </section>

              <section className={websiteClassName("border-t border-line pt-7")}>
                <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
                  Reservation details
                </Heading>
                <details className={websiteClassName("mt-5 border border-line bg-surface p-5")}>
                  <summary className={websiteClassName("cursor-pointer font-semibold")}>
                    Special requests
                  </summary>
                  <label className={websiteClassName("mt-5 grid gap-2 text-sm font-semibold")}>
                    Your request
                    <textarea
                      name="requests"
                      rows={4}
                      maxLength={500}
                      defaultValue={guest?.requests}
                      className={websiteClassName(`${inputClass} resize-y`)}
                      placeholder="Arrival time, accessibility needs, or other notes"
                    />
                  </label>
                  <p className={websiteClassName("mt-2 text-xs text-muted")}>
                    Requests depend on hotel availability.
                  </p>
                </details>
              </section>

              <section className={websiteClassName("border-t border-line pt-7")}>
                <Heading
                  as="h2"
                  className={websiteClassName("flex items-center gap-2 font-sans text-2xl")}
                >
                  <LockKeyhole size={21} className={websiteClassName("text-brand")} /> Payment
                </Heading>
                <p
                  className={websiteClassName(
                    "mt-4 border border-line bg-surface p-5 text-sm leading-6 text-muted",
                  )}
                >
                  The next screen simulates payment without collecting card details. A real checkout
                  requires the hotel&apos;s verified booking and payment integrations.
                </p>
              </section>

              {policies.length || lines.some((line) => line.rate.cancellationPolicy) ? (
                <section className={websiteClassName("border-t border-line pt-7")}>
                  <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
                    Policies
                  </Heading>
                  <dl
                    className={websiteClassName("mt-5 divide-y divide-line border-y border-line")}
                  >
                    {policies.map((policy) => (
                      <div
                        key={policy.title}
                        className={websiteClassName("grid gap-1 py-4 sm:grid-cols-[160px_1fr]")}
                      >
                        <dt className={websiteClassName("font-semibold")}>{policy.title}</dt>
                        <dd className={websiteClassName("text-sm leading-6 text-muted")}>
                          {policy.description}
                        </dd>
                      </div>
                    ))}
                    {lines
                      .filter((line) => line.rate.cancellationPolicy)
                      .map((line) => (
                        <div
                          key={`${line.room.id}:${line.rate.id}`}
                          className={websiteClassName("grid gap-1 py-4 sm:grid-cols-[160px_1fr]")}
                        >
                          <dt className={websiteClassName("font-semibold")}>{line.room.name}</dt>
                          <dd className={websiteClassName("text-sm leading-6 text-muted")}>
                            {line.rate.cancellationPolicy}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </section>
              ) : null}

              <section className={websiteClassName("border-t border-line pt-7")}>
                <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
                  Acknowledgement
                </Heading>
                <div className={websiteClassName("mt-5 grid gap-4 text-sm")}>
                  <label className={websiteClassName("flex cursor-pointer items-start gap-3")}>
                    <Checkbox required className={websiteClassName("mt-0.5")} />
                    <span>I have reviewed the stay details and policies shown above.</span>
                  </label>
                  <label className={websiteClassName("flex cursor-pointer items-start gap-3")}>
                    <Checkbox required className={websiteClassName("mt-0.5")} />
                    <span>
                      I understand this is a sample checkout and does not make a reservation.
                    </span>
                  </label>
                </div>
              </section>

              <div
                className={websiteClassName(
                  "flex flex-wrap items-center justify-between gap-5 border-t border-line pt-7",
                )}
              >
                <p className={websiteClassName("text-sm text-muted")}>
                  No reservation will be made.
                </p>
                <button type="submit" className={websiteClassName("brand-button")}>
                  <span className={websiteClassName("button-text-container")}>
                    <span className={websiteClassName("button-text")}>Review sample details</span>
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        <aside
          className={websiteClassName("surface-panel glass-panel h-fit p-6 lg:sticky lg:top-28")}
          aria-label="Price details"
        >
          <Heading as="h2" className={websiteClassName("font-display text-2xl")}>
            Price details
          </Heading>
          <div className={websiteClassName("mt-5 border-t border-line pt-5")}>
            <p className={websiteClassName("font-semibold")}>{hotelName}</p>
            <p className={websiteClassName("mt-3 text-sm text-muted")}>
              {formatStayDate(search.checkIn)} to {formatStayDate(search.checkOut)}
            </p>
            <p className={websiteClassName("mt-1 text-sm text-muted")}>
              {nights} {nights === 1 ? "night" : "nights"} · {partySummary(search)} · {search.rooms}{" "}
              {search.rooms === 1 ? "room" : "rooms"}
            </p>
          </div>
          <div className={websiteClassName("mt-5 border-t border-line pt-5")}>
            {lines.map((line) => (
              <div
                key={`${line.room.id}:${line.rate.id}`}
                className={websiteClassName("mt-4 flex justify-between gap-4 text-sm")}
              >
                <span>
                  {line.quantity} × {line.room.name}
                  <span className={websiteClassName("block text-muted")}>{line.rate.name}</span>
                </span>
                <strong>{money(line.rate.price.amount * line.quantity * nights)}</strong>
              </div>
            ))}
            {extras.map((extra) => (
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
          </div>
          <div
            className={websiteClassName(
              "mt-6 flex justify-between gap-4 border-t border-line pt-5 text-lg font-bold",
            )}
          >
            <span>Estimated subtotal</span>
            <span>{money(estimate)}</span>
          </div>
          <p className={websiteClassName("mt-3 text-xs leading-5 text-muted")}>
            Sample prices before taxes or local charges. No amount will be charged.
          </p>
          <Link href={backHref} className={websiteClassName("ghost-button mt-6 w-full")}>
            Edit room or extras
          </Link>
        </aside>
      </div>
    </main>
  );
}
