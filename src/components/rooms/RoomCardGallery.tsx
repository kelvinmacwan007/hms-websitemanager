"use client";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, ArrowRight, X, Users, Gem, Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryImage } from "@/types/hotel";
import styles from "./RoomCard.module.css";

export function RoomCardGallery({
  images,
  roomName,
}: {
  images: GalleryImage[];
  roomName: string;
}) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<number | null>(null);
  const image = images[active] || images[0];
  const show = (direction: number) =>
    setActive((current) => (current + direction + images.length) % images.length);
  useEffect(() => {
    if (expanded) dialog.current?.showModal();
  }, [expanded]);
  const controls =
    images.length > 1 ? (
      <div className={styles.photoControls}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.previous}`}
          aria-label={`Previous photo of ${roomName}`}
          onClick={() => show(-1)}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label={`Next photo of ${roomName}`}
          onClick={() => show(1)}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    ) : null;
  const badge = /deluxe/i.test(roomName)
    ? "Deluxe"
    : /suite/i.test(roomName)
      ? "Suite"
      : /family/i.test(roomName)
        ? "Family"
        : null;
  return (
    <>
      <div className={styles.media}>
        <div
          className={styles.photo}
          onTouchStart={(event) => {
            touch.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touch.current !== null && images.length > 1) {
              const distance = event.changedTouches[0].clientX - touch.current;
              if (Math.abs(distance) > 45) show(distance < 0 ? 1 : -1);
            }
            touch.current = null;
          }}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || roomName}
              fill
              sizes="(max-width: 700px) 100vw, 45vw"
              className={styles.image}
            />
          ) : (
            <span className={styles.noImage}>Room photos coming soon</span>
          )}
          {badge && (
            <span className={styles.roomBadge}>
              {badge === "Deluxe" ? (
                <Crown size={18} />
              ) : badge === "Suite" ? (
                <Gem size={18} />
              ) : (
                <Users size={18} />
              )}
              {badge}
            </span>
          )}
          {controls}
          {image && (
            <button
              type="button"
              className={styles.galleryLink}
              onClick={() => setExpanded(true)}
              aria-label={`View gallery for ${roomName}`}
            >
              <Images size={18} />
              <span>
                {active + 1} / {images.length}
              </span>
              <span className={styles.galleryLabel}>
                View gallery <ArrowRight size={18} />
              </span>
            </button>
          )}
        </div>
        {images.length > 1 && (
          <div className={styles.thumbnails} aria-label={`Photos of ${roomName}`}>
            {images.slice(0, 5).map((photo, index) => (
              <button
                type="button"
                key={`${photo.id}-${index}`}
                aria-label={`Show photo ${index + 1} of ${roomName}`}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              >
                <Image src={photo.url} alt="" fill sizes="120px" />
                {index === 4 && images.length > 5 && <span>+{images.length - 5}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {expanded &&
        image &&
        createPortal(
          <dialog
            ref={dialog}
            className={styles.lightbox}
            aria-label={`${roomName} gallery`}
            onClose={() => setExpanded(false)}
            onKeyDown={(event) => {
              if (images.length < 2) return;
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                show(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                show(1);
              }
            }}
          >
            <button
              type="button"
              className={styles.close}
              aria-label="Close gallery"
              onClick={() => dialog.current?.close()}
            >
              <X size={24} />
            </button>
            <Image
              src={image.url}
              alt={image.alt || roomName}
              fill
              sizes="100vw"
              className={styles.fullImage}
            />
            {controls}
            <span className={styles.caption} aria-live="polite">
              {roomName} � {active + 1} / {images.length}
            </span>
          </dialog>,
          document.body,
        )}
    </>
  );
}
