import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Image from "next/image";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { ChevronRight } from "lucide-react";
import type { Hotel } from "@/types/hotel";

export function FinalCta({
  hotel,
  copyOverride,
}: {
  hotel: Hotel;
  copyOverride?: { title: string; eyebrow: string };
}) {
  const leftPhoto =
    hotel.gallery.find((image) => /spa|wellness/i.test(image.alt)) ?? hotel.gallery[0];
  const rightPhoto =
    hotel.gallery.find((image) => /pool|terrace/i.test(image.alt)) ??
    hotel.heroImage ??
    hotel.gallery[1];
  return (
    <section className={websiteClassName("stay-cta")} aria-labelledby="stay-cta-title">
      <div className={websiteClassName("container stay-cta-inner")}>
        {leftPhoto && (
          <div className={websiteClassName("stay-cta-photo stay-cta-photo-left")}>
            <Image
              src={leftPhoto.url}
              alt={leftPhoto.alt}
              fill
              sizes="(max-width: 767px) 110px, 210px"
              className={websiteClassName("image-cover")}
            />
          </div>
        )}
        <div className={websiteClassName("stay-cta-copy")}>
          <p className={websiteClassName("stay-cta-eyebrow")}>
            {copyOverride?.eyebrow || "Book your stay"}
          </p>
          <Heading surface="brand" as="h2" id="stay-cta-title">
            {copyOverride?.title || (
              <>
                Make room for
                <br />
                <em>a little downtime.</em>
              </>
            )}
          </Heading>
          <p className={websiteClassName("stay-cta-description")}>
            Unhurried mornings, comfortable rooms, and time just for you.
            <br className={websiteClassName("hidden md:block")} /> Your next escape starts at{" "}
            {hotel.name}.
          </p>
          <Link hotel={hotel} href="/booking" className={websiteClassName("stay-cta-button")}>
            <span aria-hidden="true" className="!h-5 !w-5">
              <ChevronRight size={21} />
            </span>
            Check availability
          </Link>
        </div>
        {rightPhoto && (
          <div className={websiteClassName("stay-cta-photo stay-cta-photo-right")}>
            <Image
              src={rightPhoto.url}
              alt={rightPhoto.alt}
              fill
              sizes="(max-width: 767px) 110px, 210px"
              className={websiteClassName("image-cover")}
            />
          </div>
        )}
        <span className={websiteClassName("stay-cta-star stay-cta-star-one")} aria-hidden="true" />
        <span className={websiteClassName("stay-cta-star stay-cta-star-two")} aria-hidden="true" />
      </div>
    </section>
  );
}
