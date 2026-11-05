import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { SiteShell } from "@/components/layout/SiteShell";
import { RestaurantMenus } from "@/components/menu/RestaurantMenus";
import styles from "@/components/menu/RestaurantMenus.module.css";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function generateMetadata() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  return createHotelMetadata(hotel, "/menu");
}
export default async function MenuPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "dining")) notFound();
  return (
    <SiteShell hotel={hotel}>
      <main className={styles.page}>
        <h1 className={styles.heading}>{hotel.website?.pages.dining.title || "Menus"}</h1>
        {hotel.website?.pages.dining.description && (
          <p className={styles.description}>{hotel.website.pages.dining.description}</p>
        )}
        <RestaurantMenus menus={hotel.menus} />
      </main>
    </SiteShell>
  );
}
