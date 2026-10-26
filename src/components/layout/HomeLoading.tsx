"use client";

import { useEffect, useState } from "react";
import styles from "./HomeLoading.module.css";

/** Homepage-only entrance; never wait for offscreen/lazy hotel photos. */
export function HomeLoading() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const heroImage = document
      .querySelector("[data-motion-hero]")
      ?.closest("section")
      ?.querySelector<HTMLImageElement>("img");
    const images = heroImage ? [heroImage] : [];
    const imageReady = images.map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), {
              once: true,
              signal: controller.signal,
            });
            image.addEventListener("error", () => resolve(), {
              once: true,
              signal: controller.signal,
            });
          }),
    );
    // A slow or failed image must never keep guests from using the website.
    const timeout = window.setTimeout(finish, 2500);
    void Promise.all([...imageReady, document.fonts.ready]).then(finish, finish);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className={styles.overlay}
      data-home-loading
      data-ready={ready}
      role="status"
      aria-label="Loading website"
      aria-hidden={ready || undefined}
    >
      <div className={styles.mark} aria-hidden="true">
        <span className={styles.orbit} />
        <span className={styles.innerOrbit} />
        <span className={styles.spark} />
      </div>
      <span className={styles.caption}>Preparing your stay</span>
      <span className={styles.dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
