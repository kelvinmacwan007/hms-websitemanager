import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { ContactLocation } from "@/components/common/ContactLocation";

export async function generateMetadata() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  return createHotelMetadata(hotel, "/contact");
}
export default async function ContactPage() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  if (!pageEnabled(hotel, "contact")) notFound();
  return (
    <SiteShell hotel={hotel}>
      <ContactLocation hotel={hotel} />
    </SiteShell>
  );
}
