"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertTriangle, Info, X } from "lucide-react";
import type { ToastMessage } from "./toast";
import styles from "./ToastViewport.module.css";

type Entry = ToastMessage & { id: number };
function Toast({ item, dismiss }: { item: Entry; dismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || item.type === "error" || item.action) return;
    const timer = window.setTimeout(dismiss, item.type === "warning" ? 10000 : 6000);
    return () => window.clearTimeout(timer);
  }, [paused, item, dismiss]);
  const Icon =
    item.type === "success"
      ? Check
      : item.type === "warning"
        ? AlertTriangle
        : item.type === "info"
          ? Info
          : X;
  return (
    <div
      className={`${styles.toast} ${styles[item.type]}`}
      role={item.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <span className={styles.icon}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className={styles.content}>
        <p>{item.message}</p>
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action!.onClick();
              dismiss();
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss notification"
        onClick={dismiss}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const [items, setItems] = useState<Entry[]>([]);
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    let sequence = 0;
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<ToastMessage>).detail;
      setItems((current) =>
        [
          ...current.filter((item) => item.message !== detail.message || item.type !== detail.type),
          { ...detail, id: ++sequence },
        ].slice(-4),
      );
    };
    // Native dialogs use the top layer. Keep notifications inside the active dialog.
    const locate = () =>
      setHost(document.querySelector("dialog[open]") || document.querySelector(".wm-root"));
    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    window.addEventListener("hms-toast", receive);
    return () => {
      observer.disconnect();
      window.removeEventListener("hms-toast", receive);
    };
  }, []);
  if (!host || !items.length) return null;
  return createPortal(
    <div className={styles.viewport} aria-label="Notifications">
      {items.map((item) => (
        <Toast
          key={item.id}
          item={item}
          dismiss={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
        />
      ))}
    </div>,
    host,
  );
}
