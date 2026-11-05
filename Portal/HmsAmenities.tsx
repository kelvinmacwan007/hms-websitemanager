"use client";

import { useEffect, useState } from "react";
import { Card, HmsSyncButton } from "./editor-fields";
import { AmenityIcon } from "../src/components/amenities/AmenityIcon";
import styles from "./HmsAmenities.module.css";

type Amenity = { id: string; label: string; rooms: string[]; iconUrl?: string };

export function HmsAmenities() {
  const [items, setItems] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/website/amenities", {
          method: "POST",
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not fetch amenities.");
        setItems(result.amenities);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Could not fetch amenities.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refresh]);

  return (
    <Card
      title="Amenities from Patel HMS"
      description="Amenities assigned to your active room types. Manage these in Patel HMS."
      action={
        <HmsSyncButton
          label="Sync amenities from Patel HMS"
          syncing={loading}
          onSync={() => setRefresh((value) => value + 1)}
        />
      }
    >
      {loading && (
        <p className="wm-note" role="status">
          Fetching amenities from Patel HMS…
        </p>
      )}
      {error && (
        <p className="wm-domain-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <>
          <p className="wm-note" role="status">
            {items.length} amenities found
          </p>
          {!items.length && (
            <p className="wm-note">No amenities are assigned to active room types in Patel HMS.</p>
          )}
          <div
            className={styles.viewport}
            role="region"
            aria-label="HMS amenities"
            tabIndex={0}
            data-lenis-prevent
          >
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.card}>
                    <span className={styles.icon}>
                      <AmenityIcon iconUrl={item.iconUrl} />
                    </span>
                    <strong>{item.label}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}
