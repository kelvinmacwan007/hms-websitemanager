import { notFound } from "next/navigation";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { CheckoutWidgetPreview } from "@/components/booking/CheckoutWidgetPreview";
import { getCheckoutWidgetConfig } from "@/lib/payment/p98payConfig";

export const metadata = {
  title: "UAT payment widget preview",
  robots: { index: false, follow: false },
};

export default function WidgetPreviewPage() {
  if (!isDemoPaymentMode() || !getCheckoutWidgetConfig()) notFound();
  return <CheckoutWidgetPreview />;
}
