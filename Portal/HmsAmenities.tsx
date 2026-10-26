"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "./editor-fields";
import { AmenityIcon } from "../src/components/amenities/AmenityIcon";
import { ScrollableHmsList } from "./ScrollableHmsList";

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
        <button
          type="button"
          className="wm-button wm-button-small"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw size={15} />
          {loading ? "Fetching…" : "Refresh from HMS"}
        </button>
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
          <ScrollableHmsList visibleCount={3} label="HMS amenities">
            <ul className="wm-amenity-list" style={{ listStyle: "none", padding: 0 }}>
              {items.map((item) => (
                <li key={item.id} className="wm-amenity-item">
                  <div className="wm-amenity-row">
                    <span className="wm-amenity-icon">
                      <AmenityIcon iconUrl={item.iconUrl} />
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.rooms.join(", ")}</small>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollableHmsList>
        </>
      )}
    </Card>
  );
}
