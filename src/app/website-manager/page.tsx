import type { Metadata } from "next";
import WebsiteManager from "../../../Portal/ClientWebsiteManager";
import { createWebsiteDocument } from "../../../Portal/content";
import { getOperationalProvider } from "@/lib/api/provider";
import { getWebsitePersistence } from "@/lib/website/persistence";
import { presentationDocument } from "@/lib/website/presentation";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { headers } from "next/headers";
import { isManagerHost, managerSession } from "@/lib/manager/session";
import { registerHotelDomain, publicHotelUrl, hotelDomain } from "@/lib/tenant/domains";
import { notFound, redirect } from "next/navigation";
import { isMockMode } from "@/lib/api/mode";
import { loadWebsiteColors } from "@/lib/website/colors";
import { hmsRateReadiness } from "@/services/patelHms/rateReadiness";
import { ConnectionRetry } from "../../../Portal/ConnectionRetry";

export const metadata: Metadata = {
  title: "Website Studio | Patel HMS",
  icons: { icon: { url: "/branding/patel-hms-favicon.png", type: "image/png" } },
  description: "A standalone workspace for managing your hotel website.",
  robots: { index: false, follow: false },
};

// Local development preview only; production still requires authenticated portal access.
export default async function WebsiteManagerPage() {
  const hostedManager = isManagerHost((await headers()).get("host"));
  if (process.env.NODE_ENV === "production" && !hostedManager) notFound();
  if (hostedManager && !(await managerSession())) redirect("/manager-login");
  const tenant = await resolveTenant();
  if (
    !hostedManager &&
    !tenant.hostname.split(":")[0].endsWith(".localhost") &&
    tenant.hostname.split(":")[0] !== "localhost"
  )
    notFound();
  let hotel;
  try {
    hotel = await getOperationalProvider().getHotel(tenant);
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))
      return <ConnectionRetry />;
    throw error;
  }
  const websiteUrl = hostedManager
    ? publicHotelUrl(await registerHotelDomain(tenant.id, hotel.id, hotel.name))
    : undefined;
  const colors = await loadWebsiteColors(tenant.id, hotel.id);
  const persistence = getWebsitePersistence();
  const publishedPayload = await persistence?.loadPublished(tenant.id);
  const payload = (await persistence?.loadDraft(tenant.id)) ?? publishedPayload;
  const initialContent = payload
    ? presentationDocument(hotel, payload)
    : createWebsiteDocument(hotel);
  const hmsRatesReady = isMockMode()
    ? undefined
    : await hmsRateReadiness(tenant, initialContent.hotel);
  if (colors && (!hostedManager || !payload))
    initialContent.hotel.branding = { ...initialContent.hotel.branding, ...colors };
  return (
    <WebsiteManager
      apiPreview={!isMockMode()}
      initialContent={initialContent}
      initialHasSavedWebsite={Boolean(payload)}
      initialWasPublished={Boolean(publishedPayload)}
      hmsRatesReady={hmsRatesReady}
      hostedManager={hostedManager}
      websiteUrl={websiteUrl}
      domain={hostedManager ? await hotelDomain(tenant.id) : undefined}
    />
  );
}
