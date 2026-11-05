"use client";

import { useEffect, useState } from "react";
import { readCheckoutGuest } from "@/lib/payment/checkoutGuest";
import type { CheckoutGuest, P98PayConfig } from "@/lib/payment/p98pay";
import { P98CheckoutWidget } from "./P98CheckoutWidget";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { useRouter } from "next/navigation";
import { saveUatReceipt } from "@/lib/payment/uatReceipt";

export function CheckoutPaymentWidget({
  config,
  hotelName,
  query,
  amount,
  currency,
}: {
  config: P98PayConfig;
  hotelName: string;
  query: string;
  amount: number;
  currency: string;
}) {
  const [guest, setGuest] = useState<CheckoutGuest | null>(null);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setGuest(readCheckoutGuest(hotelName, query));
    });
    return () => {
      active = false;
    };
  }, [hotelName, query]);
  const hasGuest = Boolean(guest?.firstName.trim() && guest.lastName.trim() && guest.email.trim());
  return (
    <section className={websiteClassName("surface-panel p-6 md:p-8")}>
      <h2 className={websiteClassName("text-2xl font-semibold")}>Secure payment</h2>
      <p className={websiteClassName("mt-3 mb-6 text-sm leading-6 text-muted")}>
        This is a UAT test transaction; it does not create a hotel reservation.
      </p>
      {guest ? (
        <>
          {!hasGuest && (
            <p role="status" className={websiteClassName("mb-5 text-sm leading-6 text-muted")}>
              Enter your name and email in the secure checkout below to test payment for your
              selected stay.
            </p>
          )}
          <P98CheckoutWidget
            config={config}
            amount={amount}
            currency={currency}
            guest={guest}
            onTestPaymentReported={() => {
              saveUatReceipt(hotelName, query, amount);
              const params = new URLSearchParams(query);
              params.set("uat", "1");
              router.replace(`/booking/confirmation?${params}`);
            }}
          />
        </>
      ) : (
        <p role="status">Preparing checkout...</p>
      )}
    </section>
  );
}
