import "server-only";
import { isDemoPaymentMode } from "./demoMode";
import type { P98PayConfig } from "./p98pay";

/** The supplied merchant widget is UAT-only and must never charge a live booking. */
export function getCheckoutWidgetConfig(): P98PayConfig | null {
  if (!isDemoPaymentMode()) return null;
  if (process.env.NODE_ENV !== "development" && process.env.WEBSITE_DEMO_PAYMENTS !== "true")
    return null;
  return { environment: "uat", widgetId: "cnmbiqhj", currency: "USD" };
}
