"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BookingSettings } from "@/types/hotel";
import { DEFAULT_BOOKING_SETTINGS } from "@/lib/booking/settings";

const Context = createContext({ settings: DEFAULT_BOOKING_SETTINGS, today: "", timeZone: "UTC" });
export function BookingSettingsProvider({
  settings = DEFAULT_BOOKING_SETTINGS,
  today,
  timeZone = "UTC",
  children,
}: {
  settings?: BookingSettings;
  today: string;
  timeZone?: string;
  children: ReactNode;
}) {
  return <Context.Provider value={{ settings, today, timeZone }}>{children}</Context.Provider>;
}
export const useBookingSettings = () => useContext(Context);
