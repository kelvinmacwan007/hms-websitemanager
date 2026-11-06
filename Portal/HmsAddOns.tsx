"use client";
import { useEffect, useState } from "react";
import { Card, HmsSyncButton } from "./editor-fields";
import { AddOnList } from "../src/components/extras/AddOnList";
import type { HotelAddOn } from "../src/types/hotel";

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
        const result = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(
            response.status === 401 || response.status === 403
              ? "Please sign in to the website manager again, then sync add-ons."
              : result?.error || "Could not fetch add-ons. Please try syncing again.",
          );
        if (!result || !Array.isArray(result.items))
          throw new Error("No valid add-ons response was received. Please try syncing again.");
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
        <HmsSyncButton
          label="Sync add-ons from Patel HMS"
          syncing={loading}
          onSync={() => setRefresh((v) => v + 1)}
        />
      }
    >
      {loading ? (
        <p role="status">Fetching add-ons...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : items.length ? (
        <div role="region" aria-label="HMS add-ons">
          <AddOnList items={items} singleColumn />
        </div>
      ) : (
        <p>No active add-ons found in Patel HMS.</p>
      )}
    </Card>
  );
}
