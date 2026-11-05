"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useMotionPreset } from "./MotionWrapper";

gsap.registerPlugin(useGSAP);

export function PageEntryMotion({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const preset = useMotionPreset();

  useGSAP(
    () => {
      const root = ref.current;
      // A persistent layout must not mutate a streamed page before its hydration commits.
      if (!root || !enabled || preset === "off") return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.querySelector<HTMLElement>("h1");
        // The photographic homepage already has its own staggered hero entry.
        if (!heading || heading.closest("[data-motion-hero]")) return;
        const intro = heading.parentElement;
        const targets = intro
          ? Array.from(intro.children).filter(
              (node) => node === heading || node.matches("p, [data-page-entry]"),
            )
          : [heading];
        const entry = gsap.fromTo(
          targets,
          { autoAlpha: 0, y: preset === "expressive" ? 30 : 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: preset === "expressive" ? 0.85 : 0.65,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          },
        );
        const showFocusedContent = () => entry.progress(1);
        root.addEventListener("focusin", showFocusedContent);
        return () => root.removeEventListener("focusin", showFocusedContent);
      });
      return () => media.revert();
    },
    { scope: ref, dependencies: [pathname, preset, enabled], revertOnUpdate: true },
  );

  return (
    <div ref={ref} data-page-entry-root>
      {children}
    </div>
  );
}
