"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./RoomCard.module.css";

export function RoomAmenitiesSlider({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [directions, setDirections] = useState({ previous: false, next: false });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      setDirections({
        previous: list.scrollLeft > 2,
        next: list.scrollLeft + list.clientWidth < list.scrollWidth - 2,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(list);
    for (const child of list.children) observer.observe(child);
    list.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, [children]);

  function slide(direction: number) {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div className={styles.amenitySlider}>
      <ul ref={listRef} className={styles.amenityList} tabIndex={0} aria-label="Room amenities">
        {children}
      </ul>
      {(directions.previous || directions.next) && (
        <div className={styles.amenityControls}>
          {directions.previous && (
            <button type="button" onClick={() => slide(-1)} aria-label="Previous amenities">
              <ChevronLeft size={20} />
            </button>
          )}
          {directions.next && (
            <button type="button" onClick={() => slide(1)} aria-label="Next amenities">
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
