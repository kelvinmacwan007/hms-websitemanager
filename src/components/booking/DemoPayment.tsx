"use client";

import { Heading } from "@/components/common/Heading";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import { partySummary } from "@/lib/booking/party";
import type { CartLine } from "@/lib/booking/cart";
import type { PaymentStatus, PaymentSummary } from "@/lib/payment/types";
import type { AvailabilitySearch, HotelExtra } from "@/types/hotel";

type Props = {
  hotelName: string;
  lines: CartLine[];
  search: AvailabilitySearch;
  nights: number;
  extras: HotelExtra[];
  roomSubtotal: number;
  estimate: number;
  currency: string;
  backHref: string;
  selectionQuery: string;
};

export function DemoPayment({
  hotelName,
  lines,
  search,
  nights,
  extras,
  roomSubtotal,
  estimate,
  currency,
  backHref,
  selectionQuery,
}: Props) {
  const [result, setResult] = useState<PaymentSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const money = (amount: number) => formatMoney({ amount, currency });

  async function preview(outcome: PaymentStatus) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/booking/demo-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: selectionQuery, outcome }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 409
            ? "This sample stay changed. Please search again."
            : "The payment preview could not be completed.",
        );
      const payment = (await response.json()) as PaymentSummary;
      setResult(payment);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The payment preview could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
      <Link
        href={backHref}
        className={websiteClassName(
          "inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline",
        )}
      >
        <ArrowLeft size={18} /> Back to guest details
      </Link>
      <div className={websiteClassName("mt-5 border-b border-line pb-7")}>
        <p className={websiteClassName("eyebrow")}>Demo checkout / Final step</p>
        <Heading as="h1" className={websiteClassName("mt-3 font-display text-4xl md:text-5xl")}>
          Payment preview
        </Heading>
        <p className={websiteClassName("mt-4 max-w-2xl text-sm leading-6 text-muted")}>
          See how approval, decline, and pending states work. No card information is requested, no
          money is charged, and no reservation is created.
        </p>
      </div>

      <div
        className={websiteClassName(
          "mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]",
        )}
      >
        <div className={websiteClassName("min-w-0")}>
          {result ? (
            <section
              className={websiteClassName("surface-panel glass-panel p-6 md:p-8")}
              aria-live="polite"
            >
              <div
                className={websiteClassName(
                  result.status === "declined" ? "text-red-700" : "text-brand",
                )}
              >
                {result.status === "approved" ? (
                  <CheckCircle2 size={36} />
                ) : result.status === "pending" ? (
                  <Clock3 size={36} />
                ) : (
                  <XCircle size={36} />
                )}
              </div>
              <p className={websiteClassName("eyebrow mt-5")}>
                Sample transaction / {result.status}
              </p>
              <Heading as="h2" className={websiteClassName("mt-2 font-display text-3xl")}>
                {result.status === "approved"
                  ? "Approval preview complete"
                  : result.status === "pending"
                    ? "Pending payment preview"
                    : "Sample payment declined"}
              </Heading>
              <p className={websiteClassName("mt-4 leading-7 text-muted")}>
                {result.status === "approved"
                  ? "This preview shows an approved sample payment. No money was charged and no reservation was created."
                  : result.status === "pending"
                    ? "This preview shows a pending payment. A reservation would remain unconfirmed until payment is verified."
                    : "This sample attempt was declined. Your selected stay is unchanged; you can retry the preview."}
              </p>
              <dl
                className={websiteClassName(
                  "mt-6 grid gap-4 border-y border-line py-5 text-sm sm:grid-cols-2",
                )}
              >
                <div>
                  <dt className={websiteClassName("text-muted")}>Sample amount</dt>
                  <dd className={websiteClassName("mt-1 font-semibold")}>{money(result.amount)}</dd>
                </div>
                <div>
                  <dt className={websiteClassName("text-muted")}>Reservation</dt>
                  <dd className={websiteClassName("mt-1 font-semibold")}>Not created</dd>
                </div>
              </dl>
              <p
                className={websiteClassName(
                  "mt-6 border-l-4 border-brand bg-brand-soft p-4 text-sm leading-6",
                )}
              >
                This is a demonstration only. No payment was processed, no rooms were reserved, and
                there is no confirmation number.
              </p>
              <button
                type="button"
                className={websiteClassName("ghost-button mt-7 gap-2")}
                onClick={() => setResult(null)}
              >
                <RotateCcw size={16} /> Try another outcome
              </button>
            </section>
          ) : (
            <section className={websiteClassName("border-t border-line pt-7")}>
              <Heading
                as="h2"
                className={websiteClassName("flex items-center gap-3 font-display text-2xl")}
              >
                <CreditCard size={24} className={websiteClassName("text-brand")} /> Payment method
              </Heading>
              <div
                className={websiteClassName(
                  "surface-panel glass-panel mt-6 flex items-start gap-4 p-6",
                )}
              >
                <CreditCard size={25} className={websiteClassName("mt-1 shrink-0 text-brand")} />
                <div>
                  <p className={websiteClassName("font-semibold")}>Card payment preview</p>
                  <p className={websiteClassName("mt-2 text-sm leading-6 text-muted")}>
                    A live checkout will open the hotel&apos;s approved hosted payment page. This
                    demo never collects card number, expiry, or security code.
                  </p>
                </div>
              </div>
              <div
                className={websiteClassName(
                  "mt-8 grid gap-5 border-t border-line pt-7 sm:grid-cols-2",
                )}
              >
                <div className={websiteClassName("flex gap-3")}>
                  <ShieldCheck size={22} className={websiteClassName("shrink-0 text-brand")} />
                  <div>
                    <p className={websiteClassName("font-semibold")}>Sample estimate checked</p>
                    <p className={websiteClassName("mt-2 text-sm leading-6 text-muted")}>
                      The sample selection and amount are checked again when you preview an outcome.
                    </p>
                  </div>
                </div>
                <div className={websiteClassName("flex gap-3")}>
                  <LockKeyhole size={22} className={websiteClassName("shrink-0 text-brand")} />
                  <div>
                    <p className={websiteClassName("font-semibold")}>
                      Confirmation after verification
                    </p>
                    <p className={websiteClassName("mt-2 text-sm leading-6 text-muted")}>
                      A reservation is confirmed only when payment is verified and the hotel
                      provides a booking reference.
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={websiteClassName(
                  "mt-8 border-l-4 border-brand bg-brand-soft p-5 text-sm leading-6",
                )}
              >
                The amount shown is an estimate before taxes or local charges, not a payable total.
                Choose a sample result to test the flow.
              </div>
              {error ? (
                <p
                  role="alert"
                  className={websiteClassName("mt-5 text-sm font-semibold text-red-700")}
                >
                  {error}
                </p>
              ) : null}
              <div className={websiteClassName("mt-7 flex flex-wrap gap-3")}>
                <button
                  type="button"
                  className={websiteClassName("brand-button")}
                  disabled={busy}
                  onClick={() => preview("approved")}
                >
                  <span className={websiteClassName("button-text-container")}>
                    <span className={websiteClassName("button-text")}>
                      {busy ? "Checking stay..." : "Preview approval"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={websiteClassName("ghost-button")}
                  disabled={busy}
                  onClick={() => preview("declined")}
                >
                  Preview decline
                </button>
                <button
                  type="button"
                  className={websiteClassName("ghost-button")}
                  disabled={busy}
                  onClick={() => preview("pending")}
                >
                  Preview pending
                </button>
              </div>
            </section>
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
                className={websiteClassName("mb-4 flex justify-between gap-4 text-sm")}
              >
                <span>
                  {line.quantity} × {line.room.name}
                  <span className={websiteClassName("block text-muted")}>{line.rate.name}</span>
                </span>
                <strong>{money(line.rate.price.amount * line.quantity * nights)}</strong>
              </div>
            ))}
            <div
              className={websiteClassName(
                "flex justify-between gap-4 border-t border-line pt-4 text-sm",
              )}
            >
              <span>Room subtotal</span>
              <strong>{money(roomSubtotal)}</strong>
            </div>
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
            The hotel must confirm taxes, fees, and the final amount. This preview does not charge
            you.
          </p>
        </aside>
      </div>
    </main>
  );
}
