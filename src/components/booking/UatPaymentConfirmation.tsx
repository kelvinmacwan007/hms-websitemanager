"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookingProgress } from "./BookingProgress";
import { Heading } from "../common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { readUatReceipt, type UatReceipt } from "@/lib/payment/uatReceipt";
import { formatMoney } from "@/lib/utils/format";

export function UatPaymentConfirmation({ hotelName, query }: { hotelName: string; query: string }) {
  const [receipt, setReceipt] = useState<UatReceipt | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setReceipt(readUatReceipt(hotelName, query));
    });
    return () => {
      active = false;
    };
  }, [hotelName, query]);
  return (
    <>
      <BookingProgress step={receipt ? 5 : 4} hotelName={hotelName} allowBack={false} demo />
      <main className={websiteClassName("container py-12 md:py-16")}>
        <section className={websiteClassName("surface-panel mx-auto max-w-2xl p-6 md:p-10")}>
          <p className={websiteClassName("eyebrow")}>UAT checkout</p>
          <Heading as="h1" className={websiteClassName("section-title mt-4")}>
            {receipt === undefined
              ? "Loading test result…"
              : receipt
                ? "Test payment completed"
                : "No test payment result to display"}
          </Heading>
          {receipt && (
            <p className={websiteClassName("mt-6 text-2xl font-semibold")}>
              {formatMoney(receipt)}
            </p>
          )}
          <p className={websiteClassName("mt-6 leading-8 text-muted")}>
            {receipt
              ? "P98Pay displayed a successful or authorized UAT result. This browser-reported result has not been independently verified. No hotel reservation was created or marked as paid."
              : "A confirmation URL alone does not establish a successful payment. Complete UAT checkout in the same browser tab to see its test result here."}
          </p>
          <Link href="/booking" className={websiteClassName("brand-button mt-8")}>
            Search rooms
          </Link>
        </section>
      </main>
    </>
  );
}
