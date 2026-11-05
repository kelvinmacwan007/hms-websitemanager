"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { HotelMotionConfig, MotionPreset } from "@/types/hotel";

gsap.registerPlugin(ScrollTrigger);

const MotionContext = createContext<MotionPreset>("calm");
export const useMotionPreset = () => useContext(MotionContext);
const SmoothScrollContext = createContext<(top: number, immediate?: boolean) => void>(() => {});
export const useSmoothScroll = () => useContext(SmoothScrollContext);

type Props = { children: React.ReactNode; motionConfig?: HotelMotionConfig };

export function MotionWrapper({ children, motionConfig }: Props) {
  const pathname = usePathname();
  const preset = motionConfig?.preset ?? "calm";
  const smoothScroll = motionConfig?.smoothScroll ?? true;
  const lenisRef = useRef<Lenis | null>(null);
  const scrollTo = useCallback(
    (top: number, immediate = false) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(top, { immediate });
      } else {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({
          top,
          behavior: immediate || reduceMotion || preset === "off" ? "instant" : "smooth",
        });
      }
    },
    [preset],
  );

  useEffect(() => {
    if (preset === "off") return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      document.documentElement.classList.add("motion-enabled");
      const refresh = () => ScrollTrigger.refresh();
      const frame = requestAnimationFrame(refresh);
      window.addEventListener("load", refresh);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("load", refresh);
        document.documentElement.classList.remove("motion-enabled");
      };
    });

    if (smoothScroll)
      media.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const lenis = new Lenis({
          autoRaf: false,
          lerp: 0.1,
          smoothWheel: true,
          syncTouch: false,
          anchors: true,
          stopInertiaOnNavigate: true,
          prevent: (node) => node.matches("dialog, [data-lenis-prevent], input, textarea, select"),
        });
        lenisRef.current = lenis;
        const tick = (time: number) => lenis.raf(time * 1000);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);
        // Existing lightboxes lock body scrolling. Keep Lenis in sync with that lock.
        const syncLock = () => {
          const locked =
            document.body.style.overflow === "hidden" ||
            Boolean(document.querySelector("dialog[open]"));
          if (locked && !lenis.isStopped) lenis.stop();
          else if (!locked && lenis.isStopped) lenis.start();
        };
        const observer = new MutationObserver(syncLock);
        observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
        const dialogs = new MutationObserver(syncLock);
        dialogs.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["open"],
        });
        syncLock();
        return () => {
          observer.disconnect();
          dialogs.disconnect();
          gsap.ticker.remove(tick);
          lenis.off("scroll", ScrollTrigger.update);
          lenisRef.current = null;
          lenis.destroy();
        };
      });
    return () => media.revert();
  }, [preset, smoothScroll]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <MotionContext.Provider value={preset}>
      <SmoothScrollContext.Provider value={scrollTo}>{children}</SmoothScrollContext.Provider>
    </MotionContext.Provider>
  );
}
