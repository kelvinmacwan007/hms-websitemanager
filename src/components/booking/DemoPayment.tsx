"use client";

import { BookingProgress } from "./BookingProgress";
import { BookingStaySummary } from "./BookingStaySummary";
import { Heading } from "@/components/common/Heading";
import { CheckoutPaymentWidget } from "./CheckoutPaymentWidget";
import type { P98PayConfig } from "@/lib/payment/p98pay";

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
import { formatMoney } from "@/lib/utils/format";
import type { CartLine } from "@/lib/booking/cart";
import type { PaymentStatus, PaymentSummary } from "@/lib/payment/types";
import type { AvailabilitySearch, HotelExtra } from "@/types/hotel";

type Props = {
  widgetConfig?: P98PayConfig | null;
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
  widgetConfig,
  hotelName,
  lines,
  search,
  extras,
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
            ? "Your selected stay changed. Please search again."
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
    <>
      <BookingProgress
        step={result?.status === "approved" ? 5 : 4}
        hotelName={hotelName}
        query={selectionQuery}
        demo
      />
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
          <p className={websiteClassName("eyebrow")}>Your reservation</p>
          <Heading as="h1" className={websiteClassName("mt-3 font-display text-4xl md:text-5xl")}>
            Payment
          </Heading>
          <p className={websiteClassName("mt-4 max-w-2xl text-sm leading-6 text-muted")}>
            {widgetConfig
              ? "Review the amount for your selected rooms, nights, and extras before continuing."
              : "Review the payment options and amount for your selected stay."}
          </p>
        </div>

        <div
          className={websiteClassName(
            "mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]",
          )}
        >
          <div className={websiteClassName("min-w-0")}>
            {widgetConfig ? (
              <CheckoutPaymentWidget
                config={widgetConfig}
                hotelName={hotelName}
                query={selectionQuery}
                amount={estimate}
                currency={currency}
              />
            ) : result ? (
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
                  Payment response / {result.status}
                </p>
                <Heading as="h2" className={websiteClassName("mt-2 font-display text-3xl")}>
                  {result.status === "approved"
                    ? "Payment response received"
                    : result.status === "pending"
                      ? "Payment pending"
                      : "Payment declined"}
                </Heading>
                <p className={websiteClassName("mt-4 leading-7 text-muted")}>
                  {result.status === "approved"
                    ? "A payment response was received. Your reservation remains unconfirmed until the hotel provides a booking reference."
                    : result.status === "pending"
                      ? "Payment verification is pending. Your reservation remains unconfirmed."
                      : "Payment was declined. Your selected stay is unchanged; please try again."}
                </p>
                <dl
                  className={websiteClassName(
                    "mt-6 grid gap-4 border-y border-line py-5 text-sm sm:grid-cols-2",
                  )}
                >
                  <div>
                    <dt className={websiteClassName("text-muted")}>Amount</dt>
                    <dd className={websiteClassName("mt-1 font-semibold")}>
                      {money(result.amount)}
                    </dd>
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
                  A reservation is confirmed only when the hotel provides a booking reference.
                </p>
                <button
                  type="button"
                  className={websiteClassName("ghost-button mt-7 gap-2")}
                  onClick={() => setResult(null)}
                >
                  <RotateCcw size={16} /> Try again
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
                    <p className={websiteClassName("font-semibold")}>Card payment</p>
                    <p className={websiteClassName("mt-2 text-sm leading-6 text-muted")}>
                      Payment details are entered only through the hotel&apos;s secure payment
                      provider.
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
                      <p className={websiteClassName("font-semibold")}>Stay estimate checked</p>
                      <p className={websiteClassName("mt-2 text-sm leading-6 text-muted")}>
                        Your selection and amount are checked again before confirmation.
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
                  The amount shown is an estimate before taxes or local charges, not a payable
                  total. Final charges require hotel confirmation.
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
                        {busy ? "Checking stay..." : "Continue"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={websiteClassName("ghost-button")}
                    disabled={busy}
                    onClick={() => preview("declined")}
                  >
                    Payment declined
                  </button>
                  <button
                    type="button"
                    className={websiteClassName("ghost-button")}
                    disabled={busy}
                    onClick={() => preview("pending")}
                  >
                    Payment pending
                  </button>
                </div>
              </section>
            )}
          </div>
          <BookingStaySummary
            hotelName={hotelName}
            search={search}
            lines={lines}
            total={estimate}
            currency={currency}
            extras={extras}
          />
        </div>
      </main>
    </>
  );
}
