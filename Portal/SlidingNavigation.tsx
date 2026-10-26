"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./SlidingNavigation.module.css";

export function SlidingNavigation({
  children,
  activeKey,
}: {
  children: ReactNode;
  activeKey: string;
}) {
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = nav?.querySelector<HTMLElement>("[data-active-background]");
    if (!nav || !indicator) return;

    const update = () => {
      const active = nav.querySelector<HTMLElement>('button[aria-current="page"]');
      if (!active || !active.offsetWidth || !nav.getClientRects().length) return;
      const bounds = nav.getBoundingClientRect();
      const target = active.getBoundingClientRect();
      indicator.style.transform = `translate(${target.left - bounds.left + nav.scrollLeft}px, ${target.top - bounds.top + nav.scrollTop}px)`;
      indicator.style.width = `${target.width}px`;
      indicator.style.height = `${target.height}px`;
      // Place the initial highlight without animating in from the corner.
      if (!nav.dataset.indicatorReady) {
        indicator.getBoundingClientRect();
        nav.dataset.indicatorReady = "true";
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    nav.querySelectorAll("button, .wm-nav-group").forEach((item) => observer.observe(item));
    document.fonts.ready.then(update);
    return () => observer.disconnect();
  }, [activeKey]);

  return (
    <nav ref={navRef} className={styles.navigation} aria-label="Website editor sections">
      <span className={styles.indicator} data-active-background aria-hidden="true" />
      {children}
    </nav>
  );
}
