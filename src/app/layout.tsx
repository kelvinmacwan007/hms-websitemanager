import { websiteClassName } from "@/lib/ui/websiteStyles";
import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createTheme } from "@/lib/branding/theme";
import { MotionWrapper } from "@/components/layout/MotionWrapper";
import "lenis/dist/lenis.css";
import "./globals.css";
import { isManagerHost, managerSession } from "@/lib/manager/session";
import { headers } from "next/headers";
import { loadPreview } from "@/lib/website/preview";
import { WebsitePreviewBridge } from "@/components/layout/WebsitePreviewBridge";
import { DevelopmentHydrationGuard } from "@/components/layout/DevelopmentHydrationGuard";

const headingFont = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-hotel-heading",
  display: "swap",
});
const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-hotel-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  if (isManagerHost((await headers()).get("host")) && !(await headers()).get("x-website-preview"))
    return {
      title: "Website Studio | Patel HMS",
      robots: { index: false, follow: false },
      icons: { icon: { url: "/branding/patel-hms-favicon.png", type: "image/png" } },
    };
  const tenant = await resolveTenant();
  let hotel;
  try {
    hotel = await getWebsiteProvider().getHotel(tenant);
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))
      return { title: "Hotel website" };
    throw error;
  }

  return {
    title: hotel.seo?.title ?? hotel.name,
    description: hotel.seo?.description ?? hotel.description,
    metadataBase: new URL(
      process.env.NODE_ENV === "production"
        ? `https://${tenant.hostname}`
        : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    ),
    icons: {
      icon: hotel.branding.faviconUrl || "/favicon.svg",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (isManagerHost((await headers()).get("host")) && !(await headers()).get("x-website-preview"))
    return (
      <html lang="en">
        <body suppressHydrationWarning>
          <DevelopmentHydrationGuard />
          {children}
        </body>
      </html>
    );
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  let hotel;
  try {
    hotel = await provider.getHotel(tenant);
  } catch (error) {
    if (!(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)))
      throw error;
  }
  const theme = createTheme(hotel?.branding ?? {});
  const previewToken =
    process.env.NODE_ENV !== "production" || (await managerSession())
      ? (await headers()).get("x-website-preview")
      : null;
  const preview = previewToken && loadPreview(previewToken, tenant.id);

  return (
    <html
      lang="en"
      data-website-appearance={
        hotel?.branding.websiteStyle ||
        hotel?.branding.buttonStyle ||
        hotel?.branding.imageStyle ||
        hotel?.branding.cornerRadius !== undefined
          ? "custom"
          : undefined
      }
      className={websiteClassName(
        `website-root motion-reduce:!scroll-auto ${headingFont.variable} ${bodyFont.variable}`,
      )}
      style={theme}
      data-site-motion={hotel?.branding.motion?.preset ?? "calm"}
    >
      <body
        // Browser extensions may add attributes before React hydrates this element.
        suppressHydrationWarning
        className={websiteClassName(
          "website-body [&:has([data-no-js])_div[hidden][id^='S:']]:!block [&:has([data-no-js])_[data-route-loading]]:hidden",
        )}
      >
        {/* This marker is parsed as an element only without JS, revealing completed streamed content. */}
        <DevelopmentHydrationGuard />
        <noscript>
          <span data-no-js className="hidden" />
        </noscript>
        <MotionWrapper motionConfig={hotel?.branding.motion}>{children}</MotionWrapper>
        {preview && previewToken && <WebsitePreviewBridge token={previewToken} />}
      </body>
    </html>
  );
}
