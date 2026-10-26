import { headers } from "next/headers";
import { isManagerHost } from "@/lib/manager/session";
import { notFound, redirect } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { EmptyState } from "@/components/common/Status";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { hotelJsonLd, createHotelMetadata, serializeJsonLd } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { HomeTemplate } from "@/templates/default/HomeTemplate";
import { HomeLoading } from "@/components/layout/HomeLoading";
import { roomDisplayRates } from "@/lib/booking/displayRates";

export async function generateMetadata() {
  if (isManagerHost((await headers()).get("host")) && !(await headers()).get("x-website-preview"))
    return { title: "Website Studio | Patel HMS" };
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  return createHotelMetadata(hotel);
}

export default async function Home() {
  if (isManagerHost((await headers()).get("host")) && !(await headers()).get("x-website-preview"))
    redirect("/website-manager");
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  if (!pageEnabled(hotel, "home")) notFound();

  if (!hotel.configured) {
    return (
      <SiteShell hotel={hotel}>
        <EmptyState
          title="Website Coming Soon"
          message="This hotel's website is currently being prepared."
        />
      </SiteShell>
    );
  }

  const { rooms, rateDates } = await roomDisplayRates(getWebsiteProvider(), tenant, hotel);
  return (
    <SiteShell hotel={hotel}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(hotelJsonLd(hotel)) }}
      />
      <HomeTemplate hotel={{ ...hotel, rooms }} rateDates={rateDates} />
      <HomeLoading />
    </SiteShell>
  );
}
