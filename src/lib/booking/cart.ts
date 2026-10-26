import type { AvailabilitySearch, HotelRoom, RatePlan } from "@/types/hotel";
import { stayQuery } from "./party.ts";

export type CartLine = { room: HotelRoom; rate: RatePlan; quantity: number };
type Params = Record<string, string | string[] | undefined>;

export function parseCartItems(
  params: Params,
): Array<{ roomSlug: string; rateId: string; quantity: number }> | null {
  const raw = Array.isArray(params.item)
    ? params.item
    : typeof params.item === "string"
      ? [params.item]
      : [];
  if (!raw.length || raw.length > 10) return null;
  const seen = new Set<string>();
  const items = [];
  for (const value of raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 3 ||
      typeof parsed[0] !== "string" ||
      typeof parsed[1] !== "string" ||
      !Number.isInteger(parsed[2]) ||
      parsed[2] < 1 ||
      parsed[2] > 10
    )
      return null;
    const key = JSON.stringify([parsed[0], parsed[1]]);
    if (seen.has(key)) return null;
    seen.add(key);
    items.push({ roomSlug: parsed[0], rateId: parsed[1], quantity: parsed[2] as number });
  }
  return items;
}

export function cartQuery(search: AvailabilitySearch, lines: CartLine[]): URLSearchParams {
  const query = stayQuery(search);
  lines.forEach(({ room, rate, quantity }) =>
    query.append("item", JSON.stringify([room.slug, rate.id, quantity])),
  );
  return query;
}

export function resolveCart(
  search: AvailabilitySearch,
  rooms: HotelRoom[],
  params: Params,
): CartLine[] | null {
  const requested = parseCartItems(params);
  if (!requested) return null;
  const lines: CartLine[] = [];
  const countByRoom = new Map<string, number>();
  for (const item of requested) {
    const room = rooms.find(
      (candidate) =>
        candidate.slug === item.roomSlug &&
        candidate.visible !== false &&
        candidate.availabilityStatus !== "sold-out",
    );
    const rate = room?.ratePlans.find(
      (candidate) =>
        candidate.id === item.rateId && candidate.visible !== false && candidate.available,
    );
    if (!room || !rate) return null;
    lines.push({ room, rate, quantity: item.quantity });
    countByRoom.set(room.id, (countByRoom.get(room.id) ?? 0) + item.quantity);
  }
  if (lines.reduce((sum, line) => sum + line.quantity, 0) !== search.rooms) return null;
  if (lines.reduce((sum, line) => sum + line.room.occupancy * line.quantity, 0) < search.guests)
    return null;
  if (new Set(lines.map((line) => line.rate.price.currency)).size !== 1) return null;
  if (search.pets && !lines.some((line) => line.room.petsAllowed !== false)) return null;
  if (
    lines.some(
      (line) =>
        (line.rate.inventoryCount ?? Number.POSITIVE_INFINITY) <
        (countByRoom.get(line.room.id) ?? 0),
    )
  )
    return null;
  return lines;
}

export function cartSubtotal(lines: CartLine[], nights: number): number {
  return lines.reduce((sum, line) => sum + line.rate.price.amount * line.quantity * nights, 0);
}

/** Recheck a room-detail reservation against current stay-specific rates. */
export function selectRequestedRoom(
  search: AvailabilitySearch,
  rooms: HotelRoom[],
  slug: string,
): CartLine[] | null {
  const room = rooms.find((room) => room.slug === slug);
  if (!room) return null;
  for (const rate of room.ratePlans) {
    const lines = resolveCart(search, rooms, {
      item: JSON.stringify([slug, rate.id, search.rooms]),
    });
    if (lines) return lines;
  }
  return null;
}
