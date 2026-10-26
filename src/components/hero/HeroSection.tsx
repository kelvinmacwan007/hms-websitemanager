import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { ArrowUpRight, MapPin } from "lucide-react";
import { HeroMotion } from "./HeroMotion";
import { HeroSlider } from "./HeroSlider";
import type { GalleryImage, Hotel } from "@/types/hotel";

export function HeroSection({ hotel }: { hotel: Hotel }) {
  const candidates = hotel.heroSlides?.length
    ? hotel.heroSlides
    : [hotel.heroImage, ...hotel.gallery];
  const seen = new Set<string>();
  const images = candidates.filter((image): image is GalleryImage => {
    if (!image?.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
  const location = [hotel.location.city, hotel.location.country]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <HeroSlider images={images}>
      <HeroMotion>
        {location && (
          <p className={websiteClassName("hero-location")}>
            <MapPin size={14} />
            {location}
          </p>
        )}
        <p className={websiteClassName("hero-hotel-name")}>Welcome to {hotel.name}</p>
        <Heading as="h1" surface="photo" className={websiteClassName("display mt-5")}>
          {hotel.website?.pages.home.title || (
            <>
              A little <em>escape.</em>
              <br />A longer <em>exhale.</em>
            </>
          )}
        </Heading>
        <p className={websiteClassName("hero-description mt-7 max-w-2xl text-lg leading-8")}>
          {hotel.website?.pages.home.description || hotel.tagline || hotel.description}
        </p>
        <div className={websiteClassName("hero-actions mt-9 flex flex-wrap gap-3")}>
          <Link
            hotel={hotel}
            href="/booking"
            className={websiteClassName("brand-button hero-book")}
          >
            <span className={websiteClassName("button-text-container")}>
              <span className={websiteClassName("button-text")}>
                Find your stay <ArrowUpRight size={18} />
              </span>
            </span>
          </Link>
          <Link hotel={hotel} href="/rooms" className={websiteClassName("hero-room-link")}>
            Explore rooms <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className={websiteClassName("hero-bottom-note")}>
          <span />
          Slow mornings. New surroundings. Time for you.
        </div>
      </HeroMotion>
    </HeroSlider>
  );
}
