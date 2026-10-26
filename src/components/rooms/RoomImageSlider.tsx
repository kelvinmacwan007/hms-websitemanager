"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/types/hotel";

export function RoomImageSlider({
  images,
  roomName,
}: {
  images: GalleryImage[];
  roomName: string;
}) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const touchStart = useRef<number | null>(null);
  const multiple = images.length > 1;

  function show(index: number) {
    setActive((index + images.length) % images.length);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && multiple)
        setActive((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight" && multiple)
        setActive((current) => (current + 1) % images.length);
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, multiple]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  if (!images.length)
    return (
      <div
        className={websiteClassName("image-frame aspect-[16/10] bg-brand-soft")}
        aria-label={`No images available for ${roomName}`}
      />
    );
  const image = images[active];

  const stage = (fullscreen = false) => (
    <div
      className={websiteClassName(
        fullscreen
          ? "relative h-full w-full"
          : "image-frame group relative aspect-[16/10] bg-brand-soft",
      )}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null || !multiple) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(distance) > 45) show(active + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={fullscreen ? "100vw" : "(max-width: 1024px) 100vw, 58vw"}
        className={websiteClassName(
          fullscreen
            ? "lightbox-media object-contain"
            : "image-cover transition duration-500 group-hover:scale-[1.015]",
        )}
        priority={active === 0}
      />
      {!fullscreen ? (
        <>
          <button
            type="button"
            className={websiteClassName("absolute inset-0 cursor-zoom-in")}
            onClick={() => setExpanded(true)}
            aria-label={`Open ${image.alt} in lightbox`}
          />
          <button
            type="button"
            className={websiteClassName(
              "icon-button absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition hover:bg-black/75",
            )}
            onClick={() => setExpanded(true)}
            aria-label="View image full screen"
          >
            <Expand size={19} />
          </button>
        </>
      ) : null}
      {multiple ? (
        <>
          <button
            type="button"
            className={websiteClassName(
              "icon-button absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition hover:bg-black/75",
            )}
            onClick={() => show(active - 1)}
            aria-label="Previous room image"
          >
            <ChevronLeft size={25} />
          </button>
          <button
            type="button"
            className={websiteClassName(
              "icon-button absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition hover:bg-black/75",
            )}
            onClick={() => show(active + 1)}
            aria-label="Next room image"
          >
            <ChevronRight size={25} />
          </button>
        </>
      ) : null}
      <span
        className={websiteClassName(
          "absolute bottom-4 right-4 z-10 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur",
        )}
      >
        {active + 1} / {images.length}
      </span>
    </div>
  );

  return (
    <div aria-label={`${roomName} image gallery`}>
      {stage()}
      {multiple ? (
        <div
          className={websiteClassName("mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5")}
          role="tablist"
          aria-label="Choose room image"
        >
          {images.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show image ${index + 1}: ${item.alt}`}
              onClick={() => show(index)}
              className={websiteClassName(
                "image-button " +
                  `image-frame relative aspect-[4/3] border-2 bg-brand-soft transition ${index === active ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`,
              )}
            >
              <Image
                src={item.url}
                alt=""
                fill
                sizes="120px"
                className={websiteClassName("object-cover")}
              />
            </button>
          ))}
        </div>
      ) : null}
      {expanded ? (
        <div
          className={websiteClassName(
            "lightbox-backdrop fixed inset-0 z-[90] bg-black/95 p-4 md:p-8",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={`${roomName} full-screen image`}
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            className={websiteClassName(
              "icon-button absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-md bg-white text-ink",
            )}
            onClick={() => setExpanded(false)}
            aria-label="Close full-screen image"
          >
            <X size={22} />
          </button>
          <div
            className={websiteClassName("h-full w-full")}
            onClick={(event) => event.stopPropagation()}
          >
            {stage(true)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
