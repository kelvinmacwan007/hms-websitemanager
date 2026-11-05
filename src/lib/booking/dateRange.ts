import { offsetDate } from "./settings.ts";

export type StayDateLimits = {
  minArrival: string;
  maxArrival: string;
  minStay: number;
  maxStay: number;
};

export function canSelectStayDate(
  day: string,
  checkIn: string,
  selecting: "start" | "end",
  limits: StayDateLimits,
) {
  if (day < limits.minArrival) return false;
  if (selecting === "start" || !checkIn || day <= checkIn) return day <= limits.maxArrival;
  return day >= offsetDate(checkIn, limits.minStay) && day <= offsetDate(checkIn, limits.maxStay);
}
