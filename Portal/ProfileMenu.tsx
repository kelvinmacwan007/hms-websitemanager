"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { showToast } from "./toast";
import { safeImageUrl } from "./content";
import styles from "./ProfileMenu.module.css";

export function ProfileMenu({
  hotelName,
  faviconUrl,
  onSignOut,
}: {
  hotelName: string;
  faviconUrl?: string;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const setError = (message: string) => {
    if (message) showToast(message, "error");
  };
  const [failedFavicon, setFailedFavicon] = useState<string | null>(null);
  const favicon = safeImageUrl(faviconUrl);
  const words = hotelName.trim().split(/\s+/).filter(Boolean);
  const initials = (
    words.length > 1
      ? `${Array.from(words[0])[0]}${Array.from(words[words.length - 1])[0]}`
      : Array.from(words[0] || "Hotel")
          .slice(0, 2)
          .join("")
  ).toLocaleUpperCase();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const signOut = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    signOut.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className={`wm-account-bar ${styles.root}`}>
      <button
        ref={trigger}
        type="button"
        className={`wm-icon-button ${styles.avatar}`}
        aria-label="Open profile"
        title="Profile"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {favicon && failedFavicon !== favicon ? (
          <Image
            src={favicon}
            alt=""
            width={40}
            height={40}
            className={styles.favicon}
            onError={() => setFailedFavicon(favicon)}
          />
        ) : (
          <span className={styles.initials} aria-hidden="true">
            {initials}
          </span>
        )}
      </button>
      {open && (
        <div id={id} className={styles.panel} aria-label="Profile">
          <div className={styles.identity}>
            <strong>{hotelName}</strong>
            <span>Website account</span>
          </div>
          <button
            ref={signOut}
            type="button"
            className="wm-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await onSignOut();
              } catch {
                setError("Could not sign out. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <LogOut aria-hidden="true" />
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
