import type { BookingSettings, PaymentSettings } from "../../types/hotel";

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  minStay: 1,
  maxStay: 30,
  advanceWindow: 365,
  minAdvanceDays: 0,
  maxRooms: 10,
  requirePhone: true,
  requireAddress: false,
};
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  mode: "pay-at-property",
  depositPercent: 25,
};

export function propertyDate(timeZone = "UTC", now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function offsetDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function bookingSettingsIssues(settings: BookingSettings): string[] {
  const issues: string[] = [];
  for (const [key, min, max] of [
    ["minStay", 1, 30],
    ["maxStay", 1, 30],
    ["advanceWindow", 0, 730],
    ["minAdvanceDays", 0, 730],
    ["maxRooms", 1, 10],
  ] as const) {
    if (!Number.isInteger(settings[key]) || settings[key] < min || settings[key] > max)
      issues.push(`${key}: enter a whole number from ${min} to ${max}.`);
  }
  if (settings.minStay > settings.maxStay) issues.push("Minimum stay cannot exceed maximum stay.");
  if (settings.minAdvanceDays > settings.advanceWindow)
    issues.push("Minimum advance notice cannot exceed the booking window.");
  return issues;
}
