"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryImage } from "@/types/hotel";

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : images[activeIndex];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = Boolean(active);

  function show(index: number) {
    setActiveIndex((index + images.length) % images.length);
  }

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft")
        setActiveIndex((current) =>
          current === null ? null : (current - 1 + images.length) % images.length,
        );
      if (event.key === "ArrowRight")
        setActiveIndex((current) => (current === null ? null : (current + 1) % images.length));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      dialog.close();
      opener?.focus();
    };
  }, [isOpen, images.length]);

  if (!images.length) return null;

  const lightbox =
    active && activeIndex !== null ? (
      <dialog
        ref={dialogRef}
        onCancel={() => setActiveIndex(null)}
        className={websiteClassName(
          "lightbox-backdrop fixed inset-0 m-0 max-h-none max-w-none border-0 text-white z-[200] grid h-dvh w-screen place-items-center bg-black/90 p-4 md:p-8",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Gallery image ${activeIndex + 1} of ${images.length}`}
        onClick={() => setActiveIndex(null)}
      >
        <button
          className={websiteClassName(
            "icon-button absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-md bg-white text-ink shadow-lift",
          )}
          aria-label="Close gallery image"
          type="button"
          onClick={() => setActiveIndex(null)}
        >
          <X size={22} />
        </button>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className={websiteClassName(
                "icon-button absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-md bg-white/90 text-ink md:left-6",
              )}
              onClick={(event) => {
                event.stopPropagation();
                show(activeIndex - 1);
              }}
              aria-label="Previous gallery image"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              className={websiteClassName(
                "icon-button absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-md bg-white/90 text-ink md:right-6",
              )}
              onClick={(event) => {
                event.stopPropagation();
                show(activeIndex + 1);
              }}
              aria-label="Next gallery image"
            >
              <ChevronRight size={26} />
            </button>
          </>
        ) : null}
        <figure
          className={websiteClassName(
            "lightbox-media flex max-h-[88dvh] max-w-[calc(100vw-2rem)] flex-col items-center",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={active.url}
            alt={active.alt}
            width={1800}
            height={1200}
            sizes="100vw"
            className={websiteClassName("max-h-[82dvh] max-w-full rounded-md object-contain")}
            priority
          />
          <figcaption
            aria-live="polite"
            className={websiteClassName(
              "mt-3 rounded-md bg-black/65 px-4 py-2 text-center text-sm text-white",
            )}
          >
            <span>{active.alt}</span>
            <span className={websiteClassName("ml-3 text-white/65")}>
              {activeIndex + 1} / {images.length}
            </span>
          </figcaption>
        </figure>
      </dialog>
    ) : null;

  return (
    <>
      <div className={websiteClassName("grid auto-rows-[220px] gap-4 md:grid-cols-4")}>
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={websiteClassName(
              "image-button " +
                `image-frame relative cursor-zoom-in bg-brand-soft ${index % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""}`,
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`Open ${image.alt} in lightbox`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className={websiteClassName("image-cover image-motion")}
            />
          </button>
        ))}
      </div>
      {typeof document !== "undefined" && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
