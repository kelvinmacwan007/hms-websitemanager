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
  return {
    ...createHotelMetadata(hotel, "/faq"),
    title: `Frequently Asked Questions | ${hotel.name}`,
  };
}

export default async function FaqPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "faq")) notFound();
  const questions = hotel.faqs ?? [];
  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
        <p className={websiteClassName("eyebrow")}>
          {hotel.website?.pages.faq.eyebrow || <>Before you arrive</>}
        </p>
        <Heading as="h1" className={websiteClassName("section-title mt-4")}>
          {hotel.website?.pages.faq.title || "Frequently asked questions."}
        </Heading>
        {hotel.website?.pages.faq.description && (
          <p className="mt-5 text-lg leading-8">{hotel.website.pages.faq.description}</p>
        )}
        {questions.length ? (
          <div className={websiteClassName("mt-12 border-t border-line")}>
            {questions.map(({ question, answer }) => (
              <details
                key={question}
                className={websiteClassName("group border-b border-line py-6")}
              >
                <summary
                  className={websiteClassName(
                    "cursor-pointer list-none pr-8 text-lg font-semibold marker:hidden",
                  )}
                >
                  {question}
                  <span className={websiteClassName("float-right text-brand group-open:rotate-45")}>
                    +
                  </span>
                </summary>
                <p className={websiteClassName("mt-4 max-w-2xl leading-7 text-muted")}>{answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No frequently asked questions are listed yet"
            message="Contact the hotel for current information."
          />
        )}
        <p className={websiteClassName("mt-10 text-muted")}>
          Need something else?{" "}
          <Link
            hotel={hotel}
            href="/contact"
            className={websiteClassName("font-semibold text-brand underline underline-offset-4")}
          >
            Contact our team
          </Link>
          .
        </p>
      </main>
    </SiteShell>
  );
}
