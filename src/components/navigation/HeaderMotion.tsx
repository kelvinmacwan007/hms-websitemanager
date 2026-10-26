"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useMotionPreset } from "@/components/layout/MotionWrapper";

interface HeaderMotionProps {
  children: React.ReactNode;
  className?: string;
  template?: string;
}

export function HeaderMotion({ children, className, template }: HeaderMotionProps) {
  const headerRef = useRef<HTMLElement>(null);
  const preset = useMotionPreset();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => {
      // Hysteresis prevents a shrinking sticky header from toggling at its boundary.
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
      const groups = ["header-identity", "header-navigation", "header-actions"];
      const before = new Map(
        groups.map((group) => [
          group,
          targets
            .filter((target) => target.classList.contains(group))
            .map((target) => target.getBoundingClientRect())
            .filter((rect) => rect.width && rect.height),
        ]),
      );
      const height = header.getBoundingClientRect().height;
      // Capture the currently painted positions before interrupting a transition.
      // Resetting first makes a quick scroll reversal jump to the previous endpoint.
      gsap.killTweensOf([header, ...targets]);
      gsap.set(targets, { clearProps: "transform,transformOrigin,opacity" });
      gsap.set(header, { clearProps: "height" });
      header.dataset.compact = compact;
      if (preset === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const nextHeight = header.getBoundingClientRect().height;
      targets.forEach((target) => {
        const after = target.getBoundingClientRect();
        if (!after.width || !after.height) return;
        const group = groups.find((name) => target.classList.contains(name));
        const previous = group ? before.get(group) : undefined;
        const origin = previous?.reduce((nearest, rect) =>
          Math.abs(rect.left - after.left) < Math.abs(nearest.left - after.left) ? rect : nearest,
        );
        if (!origin) return;
        gsap.fromTo(
          target,
          {
            x: origin.left - after.left,
            y: origin.top - after.top,
            // Only the logo changes size. Scaling navigation or action groups
            // distorts their text, icons, and pill buttons during the transition.
            scaleX: group === "header-identity" ? origin.width / after.width : 1,
            scaleY: group === "header-identity" ? origin.height / after.height : 1,
            transformOrigin: "top left",
          },
          {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 0.55,
            ease: "power3.inOut",
            clearProps: "transform,transformOrigin,opacity",
          },
        );
      });
      gsap.fromTo(
        header,
        { height },
        { height: nextHeight, duration: 0.55, ease: "power3.inOut", clearProps: "height" },
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
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
    <header ref={headerRef} className={className} data-template={template}>
      {children}
    </header>
  );
}
