"use client";
import { useEffect, useState } from "react";
import { Card } from "./editor-fields";
import { AddOnList } from "../src/components/extras/AddOnList";
import type { HotelAddOn } from "../src/types/hotel";
import { ScrollableHmsList } from "./ScrollableHmsList";

export function HmsAddOns() {
  const [items, setItems] = useState<HotelAddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/website/add-ons", {
          method: "POST",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not fetch add-ons.");
        setItems(result.items);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Could not fetch add-ons.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refresh]);
  return (
    <Card
      title="Add-ons from Patel HMS"
      description="Active services and listed rates from HMS. Manage these in Patel HMS; final charges are confirmed by the hotel."
      action={
        <button
          type="button"
          className="wm-button wm-button-small"
          disabled={loading}
          onClick={() => setRefresh((v) => v + 1)}
        >
          Refresh from HMS
        </button>
      }
    >
      {loading ? (
        <p role="status">Fetching add-ons...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : items.length ? (
        <ScrollableHmsList visibleCount={4} label="HMS add-ons">
          <AddOnList items={items} />
        </ScrollableHmsList>
      ) : (
        <p>No active add-ons found in Patel HMS.</p>
      )}
    </Card>
  );
}
