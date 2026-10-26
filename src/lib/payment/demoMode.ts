import { isMockMode } from "../api/mode";

/** Simulation can accompany live read-only data in local development. Never enables HMS writes. */
export function isDemoPaymentMode() {
  return (
    isMockMode() ||
    (process.env.NODE_ENV === "development" && process.env.WEBSITE_DEMO_PAYMENTS === "true")
  );
}
