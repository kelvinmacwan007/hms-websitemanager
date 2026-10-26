"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";
import { Heading } from "./Heading";

import styles from "./ContactForm.styles";
import { useState } from "react";
import { Send, CheckCircle, Loader, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm({ hotelName }: { hotelName?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  const [message, setMessage] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setStatus("loading");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enquiry could not be sent.");
      setMessage(result.message);
      setStatus("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enquiry could not be sent.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className={websiteClassName(
          `flex flex-col items-center justify-center gap-5 rounded-xl py-16 text-center ${styles.confirmation}`,
        )}
      >
        <CheckCircle size={48} className={websiteClassName(styles.accentText)} strokeWidth={1.5} />
        <div>
          <Heading
            as="h2"
            className={websiteClassName(`font-display text-2xl ${styles.confirmationTitle}`)}
          >
            {message}
          </Heading>
          <p className={websiteClassName("mt-2 text-muted text-sm")}>
            Call or email the hotel using the contact details on this page to send your enquiry.
          </p>
        </div>
        <button
          type="button"
          className={websiteClassName(`ghost-button mt-4 ${styles.returnButton}`)}
          onClick={() => setStatus("idle")}
        >
          Return to form
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {status === "error" && (
        <p role="alert" className="mb-4 text-error">
          {message}
        </p>
      )}
      <p className={websiteClassName("mb-5 text-sm text-muted")}>
        Use this form for reservation enquiries and special requests.
      </p>
      <div className={websiteClassName("grid gap-5")}>
        {hotelName && (
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="font-semibold">Hotel location</span>
            <select
              aria-label="Hotel location"
              className="checkout-input w-full px-4 py-3"
              disabled={status === "loading"}
            >
              <option>{hotelName}</option>
            </select>
          </label>
        )}

        <div className={websiteClassName("grid gap-5 sm:grid-cols-2")}>
          <label className={websiteClassName("flex flex-col gap-2")}>
            <span
              className={websiteClassName(
                `text-xs font-semibold uppercase tracking-wider ${styles.fieldLabel}`,
              )}
            >
              First name <span className={websiteClassName(styles.accentText)}>*</span>
            </span>
            <input
              required
              type="text"
              name="firstName"
              id="firstName"
              placeholder="Jane"
              className={websiteClassName("checkout-input w-full px-4 py-3 text-sm outline-none")}
              disabled={status === "loading"}
            />
          </label>
          <label className={websiteClassName("flex flex-col gap-2")}>
            <span
              className={websiteClassName(
                `text-xs font-semibold uppercase tracking-wider ${styles.fieldLabel}`,
              )}
            >
              Last name <span className={websiteClassName(styles.accentText)}>*</span>
            </span>
            <input
              required
              type="text"
              name="lastName"
              id="lastName"
              placeholder="Smith"
              className={websiteClassName("checkout-input w-full px-4 py-3 text-sm outline-none")}
              disabled={status === "loading"}
            />
          </label>
        </div>

        <label className={websiteClassName("flex flex-col gap-2")}>
          <span
            className={websiteClassName(
              `text-xs font-semibold uppercase tracking-wider ${styles.fieldLabel}`,
            )}
          >
            Email address <span className={websiteClassName(styles.accentText)}>*</span>
          </span>
          <input
            required
            type="email"
            name="email"
            id="email"
            placeholder="jane@example.com"
            className={websiteClassName("checkout-input w-full px-4 py-3 text-sm outline-none")}
            disabled={status === "loading"}
          />
        </label>

        <label className={websiteClassName("flex flex-col gap-2")}>
          <span
            className={websiteClassName(
              `text-xs font-semibold uppercase tracking-wider ${styles.fieldLabel}`,
            )}
          >
            Phone number
          </span>
          <input
            type="tel"
            name="phone"
            id="phone"
            placeholder="+1 (555) 000-0000"
            className={websiteClassName("checkout-input w-full px-4 py-3 text-sm outline-none")}
            disabled={status === "loading"}
          />
        </label>

        <label className={websiteClassName("flex flex-col gap-2")}>
          <span
            className={websiteClassName(
              `text-xs font-semibold uppercase tracking-wider ${styles.fieldLabel}`,
            )}
          >
            Enquiry type
          </span>
          <select
            name="enquiry"
            id="enquiry"
            className={websiteClassName(
              `checkout-input w-full px-4 py-3 text-sm outline-none ${styles.selectControl}`,
            )}
            disabled={status === "loading"}
          >
            <option value="">Select a topic…</option>
            <option value="reservation">Reservation enquiry</option>
            <option value="dining">Dining and amenities</option>
            <option value="groups">Group bookings</option>
            <option value="special">Accessibility and special requests</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className={websiteClassName("flex flex-col gap-2")}>
          <span
            className={websiteClassName(
              `text-xs font-semibold uppercase tracking-wider ${styles.fieldLabel}`,
            )}
          >
            Message <span className={websiteClassName(styles.accentText)}>*</span>
          </span>
          <textarea
            required
            name="message"
            id="message"
            rows={5}
            placeholder="Tell us how we can help…"
            className={websiteClassName(
              "checkout-input w-full resize-none px-4 py-3 text-sm outline-none",
            )}
            disabled={status === "loading"}
          />
        </label>

        {status === "error" && (
          <div
            className={websiteClassName(
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${styles.errorNotice}`,
            )}
          >
            <AlertCircle size={16} />
            Something went wrong. Please try again or email us directly.
          </div>
        )}

        <button
          type="submit"
          className={websiteClassName("brand-button w-full justify-center")}
          disabled={status === "loading"}
          aria-disabled={status === "loading"}
        >
          <span className={websiteClassName("button-text-container")}>
            <span className={websiteClassName("button-text")}>
              {status === "loading" ? (
                <>
                  <Loader size={15} className={websiteClassName("animate-spin")} /> Checking…
                </>
              ) : (
                <>
                  Check enquiry details <Send size={15} />
                </>
              )}
            </span>
          </span>
        </button>
      </div>
    </form>
  );
}
