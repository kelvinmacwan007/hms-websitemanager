import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Image from "next/image";
import Link from "next/link";
import type { Offer } from "@/types/hotel";
import { defaultTemplateCopy as copy } from "@/templates/default/copy";

export function OfferSection({
  offers,
  copyOverride,
}: {
  offers?: Offer[];
  copyOverride?: { title: string; eyebrow: string };
}) {
  if (!offers?.length) return null;

  return (
    <section className={websiteClassName("bg-[var(--color-accent-soft)] py-12 md:py-16 lg:py-20")}>
      <div className={websiteClassName("container")}>
        <p className={websiteClassName("eyebrow")}>
          {copyOverride?.eyebrow || copy.home.offersEyebrow}
        </p>
        <Heading as="h2" className={websiteClassName("section-title mt-4 max-w-3xl")}>
          {copyOverride?.title || copy.home.offersTitle}
        </Heading>
        <div className={websiteClassName("mt-10 grid gap-6 lg:grid-cols-2")}>
          {offers.slice(0, 2).map((offer) => (
            <article
              key={offer.id}
              className={websiteClassName(
                `premium-card glow-card offer-card grid overflow-hidden ${offer.image ? "md:grid-cols-[0.95fr_1.05fr]" : ""}`,
              )}
            >
              {offer.image ? (
                <div
                  className={websiteClassName(
                    "image-frame offer-card-media relative aspect-[4/3] md:aspect-auto",
                  )}
                >
                  <Image
                    src={offer.image.url}
                    alt={offer.image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 45vw, 25vw"
                    className={websiteClassName("image-cover")}
                  />
                </div>
              ) : null}
              <div className={websiteClassName("p-7")}>
                {offer.badge ? <p className={websiteClassName("eyebrow")}>{offer.badge}</p> : null}
                <Heading as="h3" className={websiteClassName("mt-3 font-display text-3xl")}>
                  {offer.title}
                </Heading>
                <p className={websiteClassName("mt-4 leading-7 text-muted")}>{offer.description}</p>
                <Link className={websiteClassName("brand-button mt-7")} href="/offers">
                  <span className={websiteClassName("button-text-container")}>
                    <span className={websiteClassName("button-text")}>View offers</span>
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
