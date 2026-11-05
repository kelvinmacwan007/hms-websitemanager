"use client";

import { usePathname } from "next/navigation";
import { websiteClassName } from "@/lib/ui/websiteStyles";

export default function BookingLoading() {
  const pathname = usePathname();
  const title = pathname.endsWith("/checkout")
    ? "Guest details"
    : pathname.endsWith("/extras")
      ? "Add extras to your stay"
      : pathname.endsWith("/cart")
        ? "Your room cart"
        : pathname.endsWith("/payment")
          ? "Payment"
          : pathname.endsWith("/confirmation")
            ? "Confirmation"
            : "Choose your stay";
  return (
    <main
      className={websiteClassName("container py-8 md:py-10")}
      aria-busy="true"
      data-booking-loading
    >
      <h1 className={websiteClassName("mb-8 font-display text-3xl md:text-4xl")}>{title}</h1>
      <div className={websiteClassName("grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]")}>
        <div className={websiteClassName("surface-panel p-6 md:p-8")}>
          <p role="status" className={websiteClassName("mb-6 text-sm text-muted")}>
            Loading this step’s details…
          </p>
          <div aria-hidden="true">
            <div className={websiteClassName("mb-8 h-7 w-48 rounded bg-brand-soft")} />
            <div className={websiteClassName("grid gap-5 sm:grid-cols-2")}>
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className={websiteClassName("h-14 rounded bg-brand-soft")} />
              ))}
            </div>
            <div className={websiteClassName("mt-8 h-12 w-48 rounded bg-brand-soft")} />
          </div>
        </div>
        <div className={websiteClassName("surface-panel min-h-64 p-6")}>
          <h2 className={websiteClassName("mb-6 font-display text-xl")}>Your stay summary</h2>
          <div aria-hidden="true" className={websiteClassName("grid gap-5")}>
            <div className={websiteClassName("h-5 w-3/4 rounded bg-brand-soft")} />
            <div className={websiteClassName("h-5 w-1/2 rounded bg-brand-soft")} />
            <div className={websiteClassName("h-8 w-2/3 rounded bg-brand-soft")} />
          </div>
        </div>
      </div>
    </main>
  );
}
