"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingProgress } from "./BookingProgress";
import { Check } from "lucide-react";
import flow from "./BookingFlow.module.css";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { formatMoney, formatStayDate } from "@/lib/utils/format";
import { HMS_READ_ONLY } from "@/lib/api/hmsPolicy";

type Status = {
  reservationId: string;
  state: string;
  currency: string;
  total: number;
  balance: number;
  checkIn: string;
  checkOut: string;
};
async function fetchStatus(): Promise<Status> {
  const response = await fetch("/api/booking/hms?action=status", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
export function HmsPayment({
  confirmation = false,
  hotelName,
}: {
  confirmation?: boolean;
  hotelName: string;
}) {
  const query = useSearchParams().toString();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setStatus(await fetchStatus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reservation status could not be loaded.");
    }
  }, []);
  useEffect(() => {
    let active = true;
    fetchStatus()
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Reservation status could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const card = Object.fromEntries(data.entries());
    // Card data is sent directly to the server proxy and is never persisted locally.
    form.reset();
    try {
      const response = await fetch("/api/booking/hms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "pay", amount: status?.balance, card }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!result.success)
        setError(
          result.state === "declined"
            ? "Payment was declined. Check your card details."
            : "Payment needs checking by the hotel. Do not pay again.",
        );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment needs checking by the hotel.");
    } finally {
      await load();
      setBusy(false);
    }
  }
  const inputClass = websiteClassName(
    "checkout-input mt-2 min-h-12 w-full px-4 py-3 text-sm text-ink outline-none",
  );
  return (
    <>
      <BookingProgress
        step={confirmation && status?.state === "paid" && status.balance === 0 ? 5 : 4}
        hotelName={hotelName}
        query={query}
        allowBack={false}
      />
      <main className={websiteClassName("container max-w-3xl py-12")}>
        {confirmation && status?.state === "paid" && status.balance === 0 && (
          <section className={flow.confirmation} role="status">
            <Check aria-hidden="true" />
            <h2>Your booking is confirmed</h2>
            <p>Thank you for choosing {hotelName}. Your payment has been verified by the hotel.</p>
            <p>
              Booking reference: <strong>{status.reservationId}</strong>
            </p>
          </section>
        )}
        <h1 className={websiteClassName("section-title")}>
          {confirmation ? "Reservation status" : "Reservation and payment"}
        </h1>
        {!status && !error && (
          <p className={websiteClassName("mt-6")} role="status">
            Loading reservation…
          </p>
        )}
        {status && (
          <section className={websiteClassName("surface-panel mt-8 p-6")}>
            <p>
              Reservation reference: <strong>{status.reservationId}</strong>
            </p>
            <p className={websiteClassName("mt-3")}>
              {formatStayDate(status.checkIn.slice(0, 10))} to{" "}
              {formatStayDate(status.checkOut.slice(0, 10))}
            </p>
            <p className={websiteClassName("mt-3")}>
              Total: {formatMoney({ amount: status.total, currency: status.currency })}
            </p>
            <p className={websiteClassName("mt-3 font-semibold")}>
              Outstanding balance:{" "}
              {formatMoney({ amount: status.balance, currency: status.currency })}
            </p>
            <p className={websiteClassName("mt-4")} role="status">
              {status.state === "paid" && status.balance === 0
                ? "Payment verified by the hotel."
                : ["attention", "paying", "creating"].includes(status.state)
                  ? "The hotel must check this booking or payment. Contact the hotel before submitting another payment."
                  : "Reservation created. Review the payable balance before paying."}
            </p>
          </section>
        )}
        {HMS_READ_ONLY && (
          <p className={websiteClassName("surface-panel mt-6 p-6")}>
            Read-only testing. Payments are disabled.
          </p>
        )}
        {!HMS_READ_ONLY &&
          status &&
          !confirmation &&
          status.balance > 0 &&
          ["reserved", "declined"].includes(status.state) && (
            <form
              onSubmit={pay}
              autoComplete="off"
              className={websiteClassName("mt-8 grid gap-5 sm:grid-cols-2")}
            >
              <label>
                Cardholder name
                <input className={inputClass} name="cardHolderName" maxLength={150} required />
              </label>
              <label>
                Card type
                <select className={inputClass} name="cardType">
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">American Express</option>
                  <option value="DISCOVER">Discover</option>
                </select>
              </label>
              <label>
                Card number
                <input
                  className={inputClass}
                  name="cardNumber"
                  inputMode="numeric"
                  pattern="[0-9 ]{12,23}"
                  maxLength={23}
                  required
                />
              </label>
              <label>
                Expiry (MM/YY)
                <input
                  className={inputClass}
                  name="expiryDate"
                  placeholder="MM/YY"
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                  maxLength={5}
                  required
                />
              </label>
              <label>
                Security code
                <input
                  className={inputClass}
                  name="securityCode"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{3,4}"
                  maxLength={4}
                  required
                />
              </label>
              <label className={websiteClassName("flex items-start gap-3 self-center")}>
                <input type="checkbox" required />I authorize payment of{" "}
                {formatMoney({ amount: status.balance, currency: status.currency })}.
              </label>
              <button
                type="submit"
                disabled={busy}
                className={websiteClassName("brand-button justify-self-start")}
              >
                {busy
                  ? "Processing payment…"
                  : `Pay ${formatMoney({ amount: status.balance, currency: status.currency })}`}
              </button>
            </form>
          )}
        {error && (
          <p role="alert" className={websiteClassName("mt-6 text-error")}>
            {error}
          </p>
        )}
        <div className={websiteClassName("mt-8 flex flex-wrap gap-3")}>
          <button
            type="button"
            disabled={busy}
            className={websiteClassName("ghost-button")}
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Refresh status
          </button>
          {status && (
            <Link
              href={`${confirmation ? "/booking/payment" : "/booking/confirmation"}${query ? `?${query}` : ""}`}
              className={websiteClassName("ghost-button")}
            >
              {confirmation ? "Payment details" : "View reservation status"}
            </Link>
          )}
          <Link href="/contact" className={websiteClassName("ghost-button")}>
            Contact hotel
          </Link>
        </div>
      </main>
    </>
  );
}
