"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useMotionPreset } from "@/components/layout/MotionWrapper";

export function HeroMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const preset = useMotionPreset();
  useEffect(() => {
    const hero = ref.current;
    if (!hero || preset === "off") return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const tween = gsap.fromTo(
          hero.children,
          { opacity: 0, y: preset === "expressive" ? 32 : 18 },
          {
            opacity: 1,
            y: 0,
            duration: preset === "expressive" ? 0.85 : 0.6,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "opacity,transform",
          },
        );
        const revealOnFocus = () => {
          tween.progress(1);
        };
        hero.addEventListener("focusin", revealOnFocus);
        return () => hero.removeEventListener("focusin", revealOnFocus);
      },
      ref,
    );
    return () => media.revert();
  }, [preset]);
  return (
    <div ref={ref} data-motion-hero className={websiteClassName("max-w-3xl")}>
      {children}
    </div>
  );
}
