import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { BookingFlowFrame } from "@/components/booking/BookingFlowFrame";
import { getBookingContext } from "@/lib/booking/context";
import { pageEnabled } from "@/lib/website/pages";

export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  const { hotel } = await getBookingContext();
  if (!pageEnabled(hotel, "booking")) notFound();
  return (
    <SiteShell hotel={hotel} showMobileBookingCta={false} animatePageEntry={false}>
      <BookingFlowFrame hotelName={hotel.name}>{children}</BookingFlowFrame>
    </SiteShell>
  );
}
