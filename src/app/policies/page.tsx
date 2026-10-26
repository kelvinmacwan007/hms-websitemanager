import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { EmptyState } from "@/components/common/Status";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function generateMetadata() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  return { ...createHotelMetadata(hotel, "/policies"), title: `Hotel Policies | ${hotel.name}` };
}

export default async function PoliciesPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "policies")) notFound();
  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
        <p className={websiteClassName("eyebrow")}>
          {hotel.website?.pages.policies.eyebrow || <>Your stay</>}
        </p>
        <Heading as="h1" className={websiteClassName("section-title mt-4")}>
          {hotel.website?.pages.policies.title || "Hotel policies."}
        </Heading>
        {hotel.policies?.length ? (
          <div className={websiteClassName("mt-12 border-t border-line")}>
            {hotel.policies.map((policy) => (
              <section
                key={policy.title}
                className={websiteClassName(
                  "grid gap-3 border-b border-line py-7 md:grid-cols-[220px_1fr]",
                )}
              >
                <Heading as="h2" className={websiteClassName("text-lg font-bold")}>
                  {policy.title}
                </Heading>
                <p className={websiteClassName("leading-7 text-muted")}>
                  {hotel.website?.pages.policies.description || <>{policy.description}</>}
                </p>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Policy details are not listed"
            message="Please contact the hotel for current stay policies."
          />
        )}
        <Link hotel={hotel} href="/contact" className={websiteClassName("ghost-button mt-10")}>
          Contact the hotel
        </Link>
      </main>
    </SiteShell>
  );
}
