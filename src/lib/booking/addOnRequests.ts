import type { HotelAddOn } from "../../types/hotel";

export function selectedAddOnRequests(items: HotelAddOn[], raw: string | string[] | undefined) {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const seen = new Set<string>();
  return values.slice(0, 50).flatMap((value) => {
    try {
      const [id, quantity] = JSON.parse(value);
      const item = items.find((item) => item.id === id);
      if (!item || seen.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
        return [];
      seen.add(id);
      return [{ item, quantity }];
    } catch {
      return [];
    }
  });
}
