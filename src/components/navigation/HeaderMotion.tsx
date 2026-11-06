"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useMotionPreset } from "@/components/layout/MotionWrapper";

interface HeaderMotionProps {
  children: React.ReactNode;
  className?: string;
  shellClassName?: string;
  template?: string;
}

export function HeaderMotion({ children, className, shellClassName, template }: HeaderMotionProps) {
  const headerRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const preset = useMotionPreset();

  useEffect(() => {
    const site = shellRef.current?.closest<HTMLElement>(".hotel-site");
    const banner = site?.querySelector<HTMLElement>("[data-demo-banner]");
    if (!site || !banner) return;
    const measure = () =>
      site.style.setProperty("--demo-banner-height", `${banner.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      site.style.removeProperty("--demo-banner-height");
    };
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    // Reserve a stable document footprint, including after font or viewport changes.
    const layout = header.querySelector<HTMLElement>("[data-header-layout]");
    const reserveSpace = () => {
      if (!layout || !shellRef.current) return;
      const compact = header.dataset.compact;
      header.dataset.compact = "false";
      const height = layout.getBoundingClientRect().height;
      if (compact === undefined) delete header.dataset.compact;
      else header.dataset.compact = compact;
      shellRef.current.style.setProperty("--header-expanded-height", `${height}px`);
      shellRef.current
        .closest<HTMLElement>(".website-root")
        ?.style.setProperty("--website-header-height", `${height}px`);
    };
    reserveSpace();
    const observer = new ResizeObserver(reserveSpace);
    if (layout) observer.observe(layout);
    window.addEventListener("resize", reserveSpace);
    const update = () => {
      // Separate entry and exit thresholds prevent flicker near the boundary.
      const compact = String(window.scrollY > (header.dataset.compact === "true" ? 100 : 180));
      if (header.dataset.compact === compact) return;
      const initialized = header.dataset.compact !== undefined;
      // Initial scroll setup must not cancel the header's entrance tween.
      if (!initialized) {
        header.dataset.compact = compact;
        return;
      }
      const targets = Array.from(
        header.querySelectorAll<HTMLElement>(
          ".header-identity, .header-navigation, .header-actions",
        ),
      );
      gsap.killTweensOf([header, ...targets]);
      gsap.set(targets, { clearProps: "transform,transformOrigin,opacity" });
      gsap.set(header, { clearProps: "height,transform" });
      header.dataset.compact = compact;
      if (preset === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (compact === "true") {
        // Bring in the entire sticky bar together, with its final layout intact.
        gsap.fromTo(
          header,
          { yPercent: -100 },
          { yPercent: 0, duration: 0.6, ease: "power3.out", clearProps: "transform" },
        );
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", reserveSpace);
      observer.disconnect();
      gsap.killTweensOf([
        header,
        ...header.querySelectorAll(".header-identity, .header-navigation, .header-actions"),
      ]);
    };
  }, [preset, template]);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header || preset === "off") return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const entry = gsap.fromTo(
          header.querySelectorAll("[data-header-entry]"),
          { opacity: 0, y: -12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: "power3.out",
            clearProps: "opacity,transform",
          },
        );
        const showFocusedContent = () => entry.progress(1);
        header.addEventListener("focusin", showFocusedContent);
        return () => header.removeEventListener("focusin", showFocusedContent);
      });
      return () => media.revert();
    },
    { scope: headerRef, dependencies: [preset, template], revertOnUpdate: true },
  );

  return (
    <div ref={shellRef} className={shellClassName}>
      <header ref={headerRef} className={className} data-template={template}>
        {children}
      </header>
    </div>
  );
}
