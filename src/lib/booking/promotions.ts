import type { WebsitePromotion } from "../../../Portal/content";
/** Eligibility only. The authoritative quote service must price and apply the discount. */
export function validatePromotion(
  promotions: WebsitePromotion[],
  code: string,
  checkIn: string,
  roomTypeIds: string[],
  nights: number,
) {
  const promotion = promotions.find(
    (item) => item.code === code.trim().toUpperCase() && item.enabled,
  );
  if (
    !promotion ||
    (promotion.from && checkIn < promotion.from) ||
    (promotion.until && checkIn > promotion.until) ||
    (promotion.roomTypeIds.length &&
      roomTypeIds.some((id) => !promotion.roomTypeIds.includes(id))) ||
    (promotion.type === "stay-free" && nights < promotion.buyNights + promotion.freeNights)
  )
    throw new Error("Promotion is not eligible for this stay.");
  return promotion;
}
