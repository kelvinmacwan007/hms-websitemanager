"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionPreset } from "@/components/layout/MotionWrapper";

gsap.registerPlugin(ScrollTrigger);

export function ScrollReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const preset = useMotionPreset();
  useEffect(() => {
    const section = ref.current;
    if (!section || preset === "off") return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: section, start: "top 92%", once: true },
        });
        timeline.fromTo(
          section,
          { opacity: 0, y: preset === "expressive" ? 32 : 18 },
          {
            opacity: 1,
            y: 0,
            duration: preset === "expressive" ? 0.85 : 0.6,
            ease: "power2.out",
            clearProps: "opacity,transform",
          },
        );
        const cards = section.querySelectorAll<HTMLElement>("[data-motion-card]");
        if (cards.length)
          timeline.fromTo(
            cards,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.12,
              ease: "power2.out",
              clearProps: "opacity,transform",
            },
            0.15,
          );
        const revealOnFocus = () => {
          timeline.progress(1);
        };
        section.addEventListener("focusin", revealOnFocus);
        return () => section.removeEventListener("focusin", revealOnFocus);
      },
      ref,
    );
    return () => media.revert();
  }, [preset]);
  return (
    <div ref={ref} className={websiteClassName(`scroll-reveal ${className}`)}>
      {children}
    </div>
  );
}
