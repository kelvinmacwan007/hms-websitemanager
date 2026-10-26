"use client";

import { useEffect, useRef } from "react";
import styles from "./WebsiteCursor.module.css";

/** Decorative follower: the native cursor stays available for precise interaction. */
export function WebsiteCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    let x = 0,
      y = 0,
      targetX = 0,
      targetY = 0;
    let visible = false;
    const hide = () => {
      visible = false;
      element.dataset.visible = "false";
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const draw = () => {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 ? requestAnimationFrame(draw) : 0;
    };
    const move = (event: PointerEvent) => {
      if (!query.matches || event.pointerType !== "mouse") return hide();
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        x = targetX;
        y = targetY;
      }
      visible = true;
      element.dataset.visible = "true";
      const target = event.target instanceof Element ? event.target : null;
      element.dataset.interactive = String(
        Boolean(target?.closest("a, button, summary, [role='button']")),
      );
      element.dataset.text = String(
        Boolean(target?.closest("input, textarea, select, [contenteditable='true']")),
      );
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    query.addEventListener("change", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      query.removeEventListener("change", hide);
    };
  }, []);
  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true">
      <span />
    </div>
  );
}
