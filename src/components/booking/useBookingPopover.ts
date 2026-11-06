"use client";

import { useLayoutEffect, useRef } from "react";

/** Keep desktop pickers beside their field; phones use a viewport-safe dialog. */
export function useBookingPopover(open: boolean, alternate = false) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const alternateTrigger = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    // Preserve sticky layout: changing overflow on html/body moves the room sidebar.
    // Modal content keeps native scrolling; wheel/touch outside it cannot move the page.
    const preventBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const point = "touches" in event ? event.touches[0] : event;
      const bounds = element.getBoundingClientRect();
      const outside =
        point &&
        (point.clientX < bounds.left ||
          point.clientX > bounds.right ||
          point.clientY < bounds.top ||
          point.clientY > bounds.bottom);
      // Native dialog backdrops retarget events to the dialog itself.
      if (outside || !element.contains(event.target as Node)) event.preventDefault();
    };
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false, capture: true });
    document.addEventListener("touchmove", preventBackgroundScroll, {
      passive: false,
      capture: true,
    });
    const viewport = window.visualViewport;
    const position = () => {
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      element.style.maxHeight = `${Math.max(0, viewportHeight - 32)}px`;
      if (viewportWidth <= 640) {
        element.style.margin = "0";
        element.style.top = `${viewportTop + Math.max(16, (viewportHeight - element.offsetHeight) / 2)}px`;
        element.style.left = `${viewportLeft + Math.max(16, (viewportWidth - element.offsetWidth) / 2)}px`;
        return;
      }
      const target = (alternate ? alternateTrigger : trigger).current?.getBoundingClientRect();
      if (!target) return;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const left = Math.max(
        viewportLeft + 16,
        Math.min(target.left, viewportLeft + viewportWidth - width - 16),
      );
      const below = target.bottom + 10;
      const top =
        below + height <= viewportTop + viewportHeight - 16
          ? below
          : target.top - height - 10 >= viewportTop + 16
            ? target.top - height - 10
            : Math.max(
                viewportTop + 16,
                Math.min(below, viewportTop + viewportHeight - height - 16),
              );
      element.style.margin = "0";
      element.style.left = `${left}px`;
      element.style.top = `${Math.max(
        viewportTop + 16,
        Math.min(top, viewportTop + viewportHeight - height - 16),
      )}px`;
    };
    element.showModal();
    position();
    element.scrollTop = 0;
    element
      .querySelector<HTMLButtonElement>('button[aria-label^="Close"]')
      ?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener("resize", position);
    viewport?.addEventListener("resize", position);
    viewport?.addEventListener("scroll", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("wheel", preventBackgroundScroll, true);
      document.removeEventListener("touchmove", preventBackgroundScroll, true);
      viewport?.removeEventListener("resize", position);
      viewport?.removeEventListener("scroll", position);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, alternate]);
  return { dialog, trigger, alternateTrigger };
}
