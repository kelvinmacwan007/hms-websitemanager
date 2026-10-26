"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useMotionPreset } from "@/components/layout/MotionWrapper";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  Star,
  RotateCcw,
  Grid2X2,
  PanelsTopLeft,
  ChevronDown,
} from "lucide-react";
import { formatMoney } from "@/lib/utils/format";
import { BookingWidget } from "../booking/BookingWidget";
import { Checkbox } from "../common/Checkbox";
import { RoomCard } from "./RoomCard";
import { filterRooms } from "@/lib/booking/roomFilters";
import type { AvailabilitySearch, HotelRoom } from "@/types/hotel";
import styles from "./RoomsExplorer.module.css";

gsap.registerPlugin(Flip);

export function RoomsExplorer({
  rooms,
  catalogue,
  search,
  availabilityChecked,
  error,
}: {
  rooms: HotelRoom[];
  catalogue: HotelRoom[];
  search: AvailabilitySearch;
  availabilityChecked: boolean;
  error?: string;
}) {
  const params = useSearchParams();
  const [amenities, setAmenities] = useState(() => params.getAll("amenity"));
  const [types, setTypes] = useState(() => params.getAll("type"));
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const gridRef = useRef<HTMLDivElement>(null);
  const layoutState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const layoutAnimation = useRef<gsap.core.Timeline | null>(null);
  const preset = useMotionPreset();
  const changeView = (next: "grid" | "list") => {
    if (next === view) return;
    layoutAnimation.current?.progress(1).kill();
    const grid = gridRef.current;
    if (
      grid &&
      preset !== "off" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      layoutState.current = Flip.getState(
        grid.querySelectorAll("[data-motion-card], [data-motion-card] > *"),
      );
    }
    setView(next);
  };
  useLayoutEffect(() => {
    if (!layoutState.current) return;
    layoutAnimation.current = Flip.from(layoutState.current, {
      duration: 0.65,
      ease: "power3.inOut",
      nested: true,
      prune: true,
      onComplete: () => {
        layoutAnimation.current = null;
      },
    });
    layoutState.current = null;
  }, [view]);
  useLayoutEffect(
    () => () => {
      layoutAnimation.current?.progress(1).kill();
    },
    [],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [beds, setBeds] = useState<string[]>(() => params.getAll("bed"));
  const [guests, setGuests] = useState<number[]>(() =>
    params
      .getAll("capacity")
      .map(Number)
      .filter((value) => [1, 2, 3].includes(value)),
  );
  const [showAmenities, setShowAmenities] = useState(false);
  const prices = rooms.flatMap((room) => (room.startingPrice ? [room.startingPrice.amount] : []));
  const minPrice = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const currency = rooms.find((room) => room.startingPrice)?.startingPrice?.currency || "USD";
  const [priceRange, setPriceRange] = useState<[number, number] | null>(() => {
    const low = Number(params.get("minPrice")),
      high = Number(params.get("maxPrice"));
    return params.has("minPrice") &&
      params.has("maxPrice") &&
      Number.isFinite(low) &&
      Number.isFinite(high) &&
      low >= 0 &&
      high >= low
      ? [low, high]
      : null;
  });
  const range = priceRange || [minPrice, maxPrice];
  const bedOptions = [...new Set(catalogue.map((room) => room.bedType).filter(Boolean))];
  const [stars, setStars] = useState(() => {
    const value = Number(params.get("stars"));
    return [3, 4, 5].includes(value) ? value : 0;
  });
  const options = [
    ...new Map(
      catalogue
        .flatMap((room) => room.amenities.filter((item) => item.enabled !== false))
        .map((item) => [item.id, item]),
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label));
  const hasRatings = catalogue.some((room) => Number.isFinite(room.reviewRating));
  const visible = filterRooms(rooms, {
    amenities,
    types,
    stars: hasRatings ? stars : 0,
    beds,
    guests,
    priceRange,
  }).sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "recommended") return 0;
    if (!a.startingPrice) return b.startingPrice ? 1 : 0;
    if (!b.startingPrice) return -1;
    return (a.startingPrice.amount - b.startingPrice.amount) * (sort === "price-high" ? -1 : 1);
  });
  const filterCount =
    amenities.length +
    types.length +
    beds.length +
    guests.length +
    Number(Boolean(priceRange)) +
    Number(stars > 0 && hasRatings);
  const toggle = (values: string[], value: string) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  const clear = () => {
    setAmenities([]);
    setTypes([]);
    setStars(0);
    setBeds([]);
    setGuests([]);
    setPriceRange(null);
  };
  const hiddenFields = [
    ...amenities.map((value) => ({ name: "amenity", value })),
    ...types.map((value) => ({ name: "type", value })),
    ...beds.map((value) => ({ name: "bed", value })),
    ...guests.map((value) => ({ name: "capacity", value: String(value) })),
    ...(priceRange
      ? [
          { name: "minPrice", value: String(priceRange[0]) },
          { name: "maxPrice", value: String(priceRange[1]) },
        ]
      : []),
    ...(stars && hasRatings ? [{ name: "stars", value: String(stars) }] : []),
  ];
  return (
    <>
      <section
        id="rooms-availability"
        className={styles.availability}
        aria-label="Room availability"
      >
        <BookingWidget compact values={search} action="/rooms" hiddenFields={hiddenFields} />
      </section>
      <button
        type="button"
        className={styles.filterToggle}
        aria-expanded={filtersOpen}
        aria-controls="room-filter-panel"
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        <SlidersHorizontal size={17} />
        {filtersOpen ? "Hide filters" : "Filters"}
        {filterCount > 0 ? ` (${filterCount})` : ""}
      </button>
      <div className={`${styles.layout} ${filtersOpen ? styles.filtersOpen : ""}`}>
        <aside id="room-filter-panel" className={styles.sidebar} aria-label="Room filters">
          <section className={styles.filters}>
            <div className={styles.filterHeading}>
              <h2>Filters</h2>
              <button type="button" onClick={clear} disabled={!filterCount}>
                Reset all
              </button>
            </div>
            {maxPrice > minPrice && (
              <fieldset>
                <legend>Price per night</legend>
                <div className={styles.priceSlider}>
                  <input
                    aria-label="Minimum price per night"
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={range[0]}
                    onChange={(event) =>
                      setPriceRange([Math.min(Number(event.target.value), range[1]), range[1]])
                    }
                  />
                  <input
                    aria-label="Maximum price per night"
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={range[1]}
                    onChange={(event) =>
                      setPriceRange([range[0], Math.max(Number(event.target.value), range[0])])
                    }
                  />
                </div>
                <div className={styles.priceLabels}>
                  <span>{formatMoney({ amount: range[0], currency })}</span>
                  <span>{formatMoney({ amount: range[1], currency })}</span>
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend>Room types</legend>
              <div className={styles.options}>
                {catalogue.map((room) => (
                  <label key={room.id}>
                    <Checkbox
                      checked={types.includes(room.id)}
                      onChange={() => setTypes((current) => toggle(current, room.id))}
                    />
                    <span>{room.name}</span>
                    <small>1</small>
                  </label>
                ))}
              </div>
            </fieldset>
            {bedOptions.length > 0 && (
              <fieldset>
                <legend>Bed type</legend>
                <div className={styles.options}>
                  {bedOptions.map((bed) => (
                    <label key={bed}>
                      <Checkbox
                        checked={beds.includes(bed!)}
                        onChange={() => setBeds((current) => toggle(current, bed!))}
                      />
                      <span>{bed}</span>
                      <small>{catalogue.filter((room) => room.bedType === bed).length}</small>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend>Guests</legend>
              <div className={styles.options}>
                {[1, 2, 3].map((value) => (
                  <label key={value}>
                    <Checkbox
                      checked={guests.includes(value)}
                      onChange={() =>
                        setGuests((current) =>
                          current.includes(value)
                            ? current.filter((item) => item !== value)
                            : [...current, value],
                        )
                      }
                    />
                    <span>{value === 1 ? "1 Guest" : value === 2 ? "2 Guests" : "3+ Guests"}</span>
                    <small>
                      {
                        catalogue.filter((room) =>
                          value === 3 ? room.occupancy >= 3 : room.occupancy === value,
                        ).length
                      }
                    </small>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Amenities</legend>
              <div className={styles.options}>
                {options.length ? (
                  (showAmenities ? options : options.slice(0, 5)).map((item) => (
                    <label key={item.id}>
                      <Checkbox
                        checked={amenities.includes(item.id)}
                        onChange={() => setAmenities((current) => toggle(current, item.id))}
                      />
                      <span>{item.label}</span>
                      <small>
                        {
                          catalogue.filter((room) =>
                            room.amenities.some(
                              (amenity) => amenity.id === item.id && amenity.enabled !== false,
                            ),
                          ).length
                        }
                      </small>
                    </label>
                  ))
                ) : (
                  <p>No amenities listed yet.</p>
                )}
              </div>
              {options.length > 5 && (
                <button
                  className={styles.showMore}
                  type="button"
                  onClick={() => setShowAmenities(!showAmenities)}
                  aria-expanded={showAmenities}
                >
                  {showAmenities ? "Show less" : "Show more"}
                  <ChevronDown size={16} />
                </button>
              )}
            </fieldset>
            {hasRatings && (
              <fieldset>
                <legend>Guest review stars</legend>
                <div className={styles.options}>
                  <label>
                    <input
                      type="radio"
                      name="review-stars"
                      checked={!stars}
                      onChange={() => setStars(0)}
                    />{" "}
                    All ratings
                  </label>
                  {[5, 4, 3].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="review-stars"
                        checked={stars === value}
                        onChange={() => setStars(value)}
                      />
                      <span className={styles.stars}>
                        {Array.from({ length: value }, (_, index) => (
                          <Star key={index} size={13} fill="currentColor" />
                        ))}
                      </span>
                      <span>{value === 5 ? "5 stars" : `${value} stars & up`}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </section>
        </aside>
        <section id="room-results" className={styles.results} aria-label="Room results">
          <div className={styles.resultHeading}>
            <div>
              <h2>
                {visible.length} {visible.length === 1 ? "room" : "rooms"} &amp; suites
              </h2>
              <p>
                {error
                  ? "Showing room details while live availability is unavailable."
                  : `Rates for ${new Date(search.checkIn + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(search.checkOut + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${search.guests} ${search.guests === 1 ? "guest" : "guests"} · ${search.rooms} ${search.rooms === 1 ? "room" : "rooms"}${availabilityChecked ? " · Available stays" : ""}`}
              </p>
            </div>
            {filterCount > 0 && (
              <span className={styles.badge}>
                {filterCount} active {filterCount === 1 ? "filter" : "filters"}
              </span>
            )}
            <label className={styles.sort}>
              Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price (low to high)</option>
                <option value="price-high">Price (high to low)</option>
                <option value="name">Room name</option>
              </select>
            </label>
            <div className={styles.viewToggle} aria-label="Room view">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => changeView("grid")}
              >
                <Grid2X2 size={18} />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => changeView("list")}
              >
                <PanelsTopLeft size={18} />
              </button>
            </div>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <p className={styles.count} role="status" aria-live="polite">
            Showing {visible.length} of {rooms.length} room types
          </p>
          {visible.length ? (
            <div ref={gridRef} className={`${styles.grid} ${view === "list" ? styles.list : ""}`}>
              {visible.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  rateDates={{ checkIn: search.checkIn, checkOut: search.checkOut }}
                  search={search}
                  availabilityChecked={availabilityChecked}
                  layout={view === "grid" ? "vertical" : "responsive"}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <SlidersHorizontal size={28} />
              <h3>No rooms match your search.</h3>
              <p>Try other dates, fewer guests, or remove some filters.</p>
              {filterCount > 0 && (
                <button type="button" onClick={clear}>
                  <RotateCcw size={16} /> Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
