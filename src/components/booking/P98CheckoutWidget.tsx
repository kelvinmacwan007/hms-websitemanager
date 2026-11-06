"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  checkoutWidgetOptions,
  P98PAY_UAT_SCRIPT,
  type CheckoutGuest,
  type P98PayConfig,
  type P98PayOptions,
} from "@/lib/payment/p98pay";
import styles from "./P98CheckoutWidget.module.css";
import { hasReportedUatReceipt, isReportedUatSuccess } from "@/lib/payment/uatReceipt";

declare global {
  interface Window {
    startCheckoutWidget?: (widgetId: string, options?: P98PayOptions) => void;
  }
}

export function P98CheckoutWidget({
  config,
  amount,
  currency,
  guest,
  onTestPaymentReported,
}: {
  config: P98PayConfig;
  amount: number;
  currency: string;
  guest: CheckoutGuest;
  onTestPaymentReported?: () => void;
}) {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "unverified" | "redirecting"
  >("loading");
  const [scriptReady, setScriptReady] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const completed = useRef(false);
  const reportedCallback = useRef(onTestPaymentReported);
  useEffect(() => {
    reportedCallback.current = onTestPaymentReported;
  }, [onTestPaymentReported]);
  const valid = currency === config.currency && Number.isFinite(amount) && amount > 0;
  useEffect(() => {
    if (scriptReady || !valid) return;
    const timeout = setTimeout(() => setStatus("error"), 25000);
    return () => clearTimeout(timeout);
  }, [scriptReady, valid]);
  useEffect(() => {
    if (!scriptReady || !valid || !mountRef.current || completed.current) return;
    const mount = mountRef.current;
    let active = true;
    let ready = false;
    let reported = false;
    function reportSuccess() {
      if (!active || reported || completed.current) return;
      reported = true;
      completed.current = true;
      clearTimeout(timeout);
      observer.disconnect();
      // Hide the provider receipt before it paints while the confirmation route loads.
      // Keep the SDK mounted until navigation completes; removing it here can restart it.
      mount.hidden = true;
      mount.inert = true;
      setStatus(reportedCallback.current ? "redirecting" : "unverified");
      reportedCallback.current?.();
    }
    const observer = new MutationObserver(checkReady);
    function checkReady() {
      if (!active || reported) return;
      const root = mount.querySelector("#checkoutWidgetShadowRoot")?.shadowRoot;
      if (root) observer.observe(root, { childList: true, subtree: true, characterData: true });
      if (root && hasReportedUatReceipt(root)) {
        reportSuccess();
        return;
      }
      if (
        active &&
        !ready &&
        !reported &&
        (root?.querySelector("input, iframe") || mount.querySelector("input, iframe"))
      ) {
        setStatus("ready");
        ready = true;
        clearTimeout(timeout);
      }
    }
    const timeout = setTimeout(() => {
      if (active) {
        observer.disconnect();
        setStatus("error");
      }
    }, 25000);
    observer.observe(mount, { childList: true, subtree: true });
    try {
      if (!window.startCheckoutWidget) throw new Error("Widget unavailable");
      const existing = document.getElementById("checkoutWidgetShadowRoot");
      if (existing && !mount.contains(existing)) throw new Error("Another checkout is active");
      if (!existing)
        window.startCheckoutWidget(
          config.widgetId,
          checkoutWidgetOptions(
            amount,
            { firstName: guest.firstName, lastName: guest.lastName, email: guest.email },
            (data) => {
              if (isReportedUatSuccess(data)) reportSuccess();
              else if (active && !completed.current) setStatus("unverified");
            },
          ),
        );
      queueMicrotask(() => {
        if (active) checkReady();
      });
    } catch {
      clearTimeout(timeout);
      observer.disconnect();
      // Async state update avoids a synchronous render loop if the SDK is unavailable.
      queueMicrotask(() => {
        if (active) setStatus("error");
      });
    }
    return () => {
      active = false;
      clearTimeout(timeout);
      observer.disconnect();
      mount.replaceChildren();
    };
  }, [scriptReady, valid, amount, config.widgetId, guest.firstName, guest.lastName, guest.email]);
  if (!valid)
    return (
      <p className={styles.error} role="alert">
        This payment method supports positive USD amounts only. Contact the hotel for other payment
        options.
      </p>
    );
  return (
    <div className={styles.widget}>
      {status === "loading" && (
        <p className={styles.status} role="status">
          Loading secure checkout...
        </p>
      )}
      {status === "error" && (
        <p className={styles.error} role="alert">
          The payment widget could not load. Reload the page to retry.
        </p>
      )}
      {status === "unverified" && (
        <p className={styles.status} role="status">
          Payment response received. Hotel confirmation requires independent verification. No
          reservation has been marked as paid.
        </p>
      )}
      {status === "redirecting" && (
        <p className={styles.status} role="status">
          Payment response received. Opening confirmation…
        </p>
      )}
      <div
        id="checkoutWidget"
        ref={mountRef}
        className={styles.mount}
        aria-busy={status === "loading"}
      />
      <Script
        id="p98pay-uat-checkout"
        src={P98PAY_UAT_SCRIPT}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setStatus("error")}
      />
    </div>
  );
}
