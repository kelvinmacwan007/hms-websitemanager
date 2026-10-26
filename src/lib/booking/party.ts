import type { AvailabilitySearch } from "../../types/hotel";

export function guestParty(
  search: Pick<AvailabilitySearch, "guests" | "adults" | "children" | "pets">,
) {
  return {
    adults: search.adults ?? search.guests,
    children: search.children ?? 0,
    pets: search.pets ?? 0,
  };
}

export function stayQuery(search: AvailabilitySearch) {
  const query = new URLSearchParams({
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    guests: String(search.guests),
    rooms: String(search.rooms),
  });
  for (const key of ["adults", "children", "pets"] as const)
    if (search[key] !== undefined) query.set(key, String(search[key]));
  return query;
}

export function partySummary(
  search: Pick<AvailabilitySearch, "guests" | "adults" | "children" | "pets">,
) {
  const party = guestParty(search);
  return [
    `${party.adults} ${party.adults === 1 ? "adult" : "adults"}`,
    ...(party.children ? [`${party.children} ${party.children === 1 ? "child" : "children"}`] : []),
    ...(party.pets
      ? [`${party.pets} ${party.pets === 1 ? "pet requested" : "pets requested"}`]
      : []),
  ].join(", ");
}

export function allocateParty(
  rooms: { occupancy: number; petsAllowed?: boolean }[],
  search: AvailabilitySearch,
) {
  const party = guestParty(search);
  const allocation = rooms.map(() => ({ adults: 1, children: 0, pets: 0 }));
  let adults = party.adults - rooms.length;
  let children = party.children;
  if (adults < 0) throw new Error("Each room needs at least one adult.");
  for (let index = 0; index < rooms.length; index++) {
    const extra = Math.min(adults, rooms[index].occupancy - 1);
    allocation[index].adults += extra;
    adults -= extra;
  }
  for (let index = 0; index < rooms.length; index++) {
    const count = Math.min(children, rooms[index].occupancy - allocation[index].adults);
    allocation[index].children = count;
    children -= count;
  }
  if (adults || children) throw new Error("The selected rooms cannot accommodate your guests.");
  const petRooms = rooms
    .map((room, index) => ({ ...room, index }))
    .filter((room) => room.petsAllowed !== false);
  if (party.pets && !petRooms.length) throw new Error("The selected rooms do not allow pets.");
  for (let index = 0; index < party.pets; index++)
    allocation[petRooms[index % petRooms.length].index].pets++;
  return allocation;
}
