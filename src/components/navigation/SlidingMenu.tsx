"use client";

import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { usePathname } from "next/navigation";
import styles from "./SlidingMenu.module.css";

const previousLinks = new Map<string, string>();

export function SlidingMenu({ children, className, ...props }: ComponentProps<"nav">) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const nav = ref.current;
    const indicator = nav?.querySelector<HTMLElement>("[data-menu-background]");
    if (!nav || !indicator) return;
    const key = nav.getAttribute("aria-label") || "navigation";
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
    const active = links.find((link) => link.getAttribute("aria-current") === "page");
    const place = (link?: HTMLAnchorElement) => {
      if (!link || !link.offsetWidth) {
        indicator.style.opacity = "0";
        return;
      }
      const box = nav.getBoundingClientRect();
      const target = link.getBoundingClientRect();
      indicator.style.transform = `translate(${target.left - box.left + nav.scrollLeft - nav.clientLeft}px, ${target.top - box.top + nav.scrollTop - nav.clientTop}px)`;
      indicator.style.width = `${target.width}px`;
      indicator.style.height = `${target.height}px`;
      indicator.style.opacity = "1";
    };
    if (!nav.dataset.menuReady) {
      place(links.find((link) => link.getAttribute("href") === previousLinks.get(key)) || active);
      indicator.getBoundingClientRect();
      nav.dataset.menuReady = "true";
    }
    const frame = requestAnimationFrame(() => place(active));
    if (active) previousLinks.set(key, active.getAttribute("href") || "");
    const observer = new ResizeObserver(() => place(active));
    observer.observe(nav);
    links.forEach((link) => observer.observe(link));
    const clicked = (event: MouseEvent) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (link && nav.contains(link)) place(link);
    };
    nav.addEventListener("click", clicked);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      nav.removeEventListener("click", clicked);
    };
  }, [pathname]);

  return (
    <nav {...props} ref={ref} className={`${className || ""} ${styles.menu}`}>
      <span data-menu-background className={styles.background} aria-hidden="true" />
      {children}
    </nav>
  );
}
