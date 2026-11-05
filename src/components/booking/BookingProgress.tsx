"use client";

import Link from "next/link";
import { BOOKING_STEPS, bookingStepHref, type BookingStep } from "@/lib/booking/steps";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import styles from "./BookingProgress.module.css";
import { useCallback, useContext, useEffect, useId, useRef } from "react";
import { BookingProgressContext } from "./BookingProgressContext";

export type BookingProgressProps = {
  step: BookingStep;
  hotelName: string;
  query?: string;
  allowBack?: boolean;
  demo?: boolean;
  onStepNavigate?: (step: BookingStep) => boolean;
};

/** Pages publish their state; the layout keeps the visible stepper mounted. */
export function BookingProgress(props: BookingProgressProps) {
  const context = useContext(BookingProgressContext);
  const owner = useId();
  const callback = useRef(props.onStepNavigate);
  useEffect(() => {
    callback.current = props.onStepNavigate;
  }, [props.onStepNavigate]);
  const navigate = useCallback((step: BookingStep) => callback.current?.(step) ?? false, []);
  const { step, hotelName, query, allowBack, demo } = props;
  useEffect(() => {
    if (!context) return;
    return context.register(owner, {
      step,
      hotelName,
      query,
      allowBack,
      demo,
      onStepNavigate: navigate,
    });
  }, [context, owner, step, hotelName, query, allowBack, demo, navigate]);
  return context ? null : <BookingProgressDisplay {...props} />;
}

export function BookingProgressDisplay({
  step,
  query = "",
  allowBack = true,
  onStepNavigate,
}: BookingProgressProps) {
  return (
    <section
      className={`${websiteClassName("container")} ${styles.progress}`}
      aria-label="Booking progress"
    >
      <nav aria-label="Booking steps">
        <ol>
          {BOOKING_STEPS.map((label, index) => {
            const number = (index + 1) as BookingStep;
            const complete = number < step;
            const content = (
              <>
                <span className={styles.number}>{number}</span>
                <span className={styles.label}>{label}</span>
                <span className={styles.shortLabel} aria-hidden="true">
                  {number === 3 ? "Guest" : number === 5 ? "Confirm" : label}
                </span>
              </>
            );
            return (
              <li
                key={label}
                data-state={number === step ? "current" : complete ? "complete" : "upcoming"}
                aria-current={number === step ? "step" : undefined}
              >
                {complete && allowBack && query ? (
                  <Link
                    className={styles.item}
                    href={bookingStepHref(number, query)}
                    aria-label={`Back to ${label.toLowerCase()}`}
                    onClick={(event) => {
                      if (onStepNavigate?.(number)) event.preventDefault();
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <span className={styles.item} aria-disabled={number > step ? true : undefined}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </section>
  );
}
