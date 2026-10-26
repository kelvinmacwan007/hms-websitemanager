"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ScrollableHmsList.module.css";

export function ScrollableHmsList({
  children,
  visibleCount,
  label,
}: {
  children: ReactNode;
  visibleCount: number;
  label: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const element = viewport.current;
    const list = element?.firstElementChild;
    if (!element || !list) return;
    const measure = () => {
      const rows = [...list.children].slice(0, visibleCount);
      if (!rows.length) return;
      // Measure actual wrapped content so the last visible row is never clipped.
      setHeight(
        Math.ceil(
          rows[rows.length - 1].getBoundingClientRect().bottom - list.getBoundingClientRect().top,
        ),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    [...list.children].forEach((row) => observer.observe(row));
    measure();
    return () => observer.disconnect();
  }, [children, visibleCount]);
  return (
    <div
      ref={viewport}
      className={styles.viewport}
      style={{ maxHeight: height }}
      role="region"
      aria-label={label}
      tabIndex={0}
      data-lenis-prevent
    >
      {children}
    </div>
  );
}
