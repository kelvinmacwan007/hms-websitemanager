import { isMockMode } from "../api/mode";

/** Explicit UAT opt-in also supports hosted staging builds. Never enables HMS writes. */
export function isDemoPaymentMode() {
  return isMockMode() || process.env.WEBSITE_DEMO_PAYMENTS === "true";
}
