"use client";

import { useEffect, useRef } from "react";

/** Keep desktop pickers beside their field; phones use a viewport-safe dialog. */
export function useBookingPopover(open: boolean, alternate = false) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const alternateTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const position = () => {
      if (window.innerWidth <= 640) {
        element.style.removeProperty("top");
        element.style.removeProperty("left");
        element.style.removeProperty("margin");
        return;
      }
      const target = (alternate ? alternateTrigger : trigger).current?.getBoundingClientRect();
      if (!target) return;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const left = Math.max(16, Math.min(target.left, innerWidth - width - 16));
      const below = target.bottom + 10;
      const top =
        below + height <= innerHeight - 16
          ? below
          : target.top - height - 10 >= 16
            ? target.top - height - 10
            : Math.max(16, Math.min(below, innerHeight - height - 16));
      element.style.margin = "0";
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    };
    element.showModal();
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, alternate]);
  return { dialog, trigger, alternateTrigger };
}
