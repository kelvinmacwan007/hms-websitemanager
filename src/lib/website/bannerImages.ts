import type { GalleryImage, Hotel } from "../../types/hotel";

/** An empty banner selection uses only the property's cover, never its room gallery. */
export function bannerImages(hotel: Pick<Hotel, "heroSlides" | "heroImage">): GalleryImage[] {
  const selected = hotel.heroSlides?.filter((image) => Boolean(image.url?.trim())) ?? [];
  const candidates = selected.length ? selected : hotel.heroImage ? [hotel.heroImage] : [];
  const seen = new Set<string>();
  return candidates
    .filter((image) => {
      if (!image.url?.trim() || seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    })
    .slice(0, 7);
}
