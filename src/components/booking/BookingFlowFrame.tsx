"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BookingProgressDisplay, type BookingProgressProps } from "./BookingProgress";
import { BookingProgressContext } from "./BookingProgressContext";
import type { BookingStep } from "@/lib/booking/steps";
import { useSmoothScroll } from "@/components/layout/MotionWrapper";

export function BookingFlowFrame({
  hotelName,
  children,
}: {
  hotelName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const scrollTo = useSmoothScroll();
  useEffect(() => {
    scrollTo(0, true);
  }, [pathname, scrollTo]);
  const query = useSearchParams().toString();
  const routeKey = `${pathname}?${query}`;
  const [override, setOverride] = useState<{
    owner: string;
    routeKey: string;
    props: BookingProgressProps;
  } | null>(null);
  const register = useCallback(
    (owner: string, props: BookingProgressProps) => {
      setOverride({ owner, routeKey, props });
      return () => setOverride((current) => (current?.owner === owner ? null : current));
    },
    [routeKey],
  );
  const context = useMemo(() => ({ register }), [register]);
  const step: BookingStep = pathname.endsWith("/extras")
    ? 2
    : pathname.endsWith("/checkout")
      ? 3
      : pathname.endsWith("/payment") || pathname.endsWith("/confirmation")
        ? 4
        : 1;
  const progress =
    override?.routeKey === routeKey
      ? override.props
      : {
          step,
          hotelName,
          query,
          allowBack: !pathname.endsWith("/confirmation"),
        };
  return (
    <BookingProgressContext.Provider value={context}>
      <div
        onClickCapture={(event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const link =
            event.target instanceof Element
              ? event.target.closest<HTMLAnchorElement>("a[href]")
              : null;
          if (!link || link.target === "_blank") return;
          const target = new URL(link.href);
          if (target.origin === window.location.origin && target.pathname.startsWith("/booking"))
            scrollTo(0, true);
        }}
      >
        {pathname !== "/booking" &&
          pathname !== "/booking/" &&
          !pathname.endsWith("/widget-preview") &&
          !pathname.endsWith("/confirmation") && <BookingProgressDisplay {...progress} />}
        <div data-booking-step-content>{children}</div>
      </div>
    </BookingProgressContext.Provider>
  );
}
