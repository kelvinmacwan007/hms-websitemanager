"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { useMotionPreset } from "@/components/layout/MotionWrapper";
import type { GalleryImage } from "@/types/hotel";

const INTERVAL = 6500;
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const reducedSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};

export function HeroSlider({
  images,
  children,
}: {
  images: GalleryImage[];
  children: React.ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const zoom = useRef<gsap.core.Tween | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const [failed, setFailed] = useState<string[]>([]);
  const reduced = useSyncExternalStore(subscribeMotion, reducedSnapshot, () => true);
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );
  const preset = useMotionPreset();
  const slides = images.filter((image) => !failed.includes(image.url));
  const active = slides.length ? index % slides.length : 0;
  const activeUrl = slides[active]?.url;
  const motion = !reduced && preset !== "off";
  const playing = motion && !paused && slides.length > 1;
  const running = playing && !hovered && !hidden && inView;

  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % slides.length),
      INTERVAL,
    );
    return () => window.clearTimeout(timer);
  }, [running, active, slides.length]);

  useEffect(() => {
    const layer = root.current?.querySelector<HTMLElement>(".hero-slide.is-active");
    const photo = layer?.querySelector("img");
    if (!photo) return;
    if (!motion) {
      gsap.set(photo, { clearProps: "transform" });
      return;
    }
    const tween = gsap.fromTo(
      photo,
      { scale: 1.075 },
      { scale: 1, duration: INTERVAL / 1000 + 1.4, ease: "none", paused: true },
    );
    zoom.current = tween;
    return () => {
      tween.kill();
      zoom.current = null;
    };
  }, [activeUrl, motion]);

  useEffect(() => {
    if (running) zoom.current?.play();
    else zoom.current?.pause();
  }, [running, activeUrl]);

  const choose = (next: number) => {
    setPaused(true);
    setIndex((next + slides.length) % slides.length);
  };
  return (
    <section
      ref={root}
      className={websiteClassName("hero-banner")}
      data-motion={motion ? "enabled" : "off"}
      aria-label="Hotel highlights"
      aria-roledescription={slides.length > 1 ? "carousel" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!(event.target instanceof Element) || !event.target.closest("[data-rotation-toggle]"))
          setPaused(true);
      }}
    >
      <div className={websiteClassName("hero-slides")} aria-hidden="true">
        {slides.map((image, position) => (
          <div
            key={image.url}
            className={websiteClassName(`hero-slide ${position === active ? "is-active" : ""}`)}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="100vw"
              preload={position === 0}
              fetchPriority={position === 0 ? undefined : "low"}
              className={websiteClassName("image-cover")}
              onError={() =>
                setFailed((current) =>
                  current.includes(image.url) ? current : [...current, image.url],
                )
              }
            />
          </div>
        ))}
      </div>
      <div className={websiteClassName("hero-shade")} />
      <div className={websiteClassName("container hero-banner-content")}>{children}</div>
      {slides.length > 1 && (
        <div className={websiteClassName("container hero-slider-footer")}>
          <div className={websiteClassName("hero-slide-info")}>
            <span className={websiteClassName("hero-slide-number")} aria-hidden="true">
              {String(active + 1).padStart(2, "0")}
              <span> / {String(slides.length).padStart(2, "0")}</span>
            </span>
            <p
              className={websiteClassName("hero-slide-caption")}
              aria-live={playing ? "off" : "polite"}
              aria-atomic="true"
            >
              {slides[active].alt}
            </p>
          </div>
          <div
            className={websiteClassName("hero-slider-controls glass-overlay")}
            role="group"
            aria-label="Banner slideshow controls"
          >
            <div className={websiteClassName("hero-slide-selectors")}>
              {slides.map((slide, position) => (
                <button
                  key={slide.url}
                  type="button"
                  className={websiteClassName("indicator-button hero-slide-selector")}
                  aria-label={`Show image ${position + 1}: ${slide.alt}`}
                  aria-pressed={position === active}
                  onClick={() => choose(position)}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              type="button"
              className={websiteClassName("icon-button hero-slider-button")}
              aria-label="Previous banner image"
              onClick={() => choose(active - 1)}
            >
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={websiteClassName("icon-button hero-slider-button")}
              aria-label="Next banner image"
              onClick={() => choose(active + 1)}
            >
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            {motion && (
              <button
                type="button"
                data-rotation-toggle
                className={websiteClassName("icon-button hero-slider-button")}
                aria-label={paused ? "Play banner slideshow" : "Pause banner slideshow"}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? (
                  <Play size={17} aria-hidden="true" />
                ) : (
                  <Pause size={17} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
