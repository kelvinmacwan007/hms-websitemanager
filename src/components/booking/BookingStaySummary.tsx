import { formatMoney, formatStayDate } from "@/lib/utils/format";
import { cartSubtotal, type CartLine } from "@/lib/booking/cart";
import { partySummary } from "@/lib/booking/party";
import type { AvailabilitySearch, HotelExtra } from "@/types/hotel";
import styles from "./BookingStaySummary.module.css";

export function BookingStaySummary({
  hotelName,
  search,
  lines,
  total,
  currency,
  extras = [],
}: {
  hotelName: string;
  search: AvailabilitySearch;
  lines: CartLine[];
  total: number;
  currency: string;
  extras?: HotelExtra[];
}) {
  const nights = (Date.parse(search.checkOut) - Date.parse(search.checkIn)) / 86400000;
  const roomTotal = cartSubtotal(lines, nights);
  const extraTotal = extras.reduce(
    (sum, extra) => sum + extra.price.amount * (extra.charge === "per-night" ? nights : 1),
    0,
  );
  const services = Math.max(0, total - roomTotal - extraTotal);
  const money = (amount: number) => formatMoney({ amount, currency });
  return (
    <aside className={styles.summary} aria-label="Your stay summary">
      <h2>Your stay summary</h2>
      <strong className={styles.hotel}>{hotelName}</strong>
      <p>
        {formatStayDate(search.checkIn)} to {formatStayDate(search.checkOut)}
      </p>
      <p>
        {nights} {nights === 1 ? "night" : "nights"} &middot; {partySummary(search)} &middot;{" "}
        {search.rooms} {search.rooms === 1 ? "room" : "rooms"}
      </p>
      <dl>
        <div>
          <dt>Room subtotal</dt>
          <dd>{money(roomTotal)}</dd>
        </div>
        {extras.map((extra) => (
          <div key={extra.id}>
            <dt>{extra.name}</dt>
            <dd>{money(extra.price.amount * (extra.charge === "per-night" ? nights : 1))}</dd>
          </div>
        ))}
        {services > 0 && (
          <div>
            <dt>Requested services</dt>
            <dd>{money(services)}</dd>
          </div>
        )}
        <div>
          <dt>Taxes &amp; local charges</dt>
          <dd>Not included</dd>
        </div>
      </dl>
      <div className={styles.total}>
        <span>Estimated total</span>
        <strong>
          {money(total)}
          <small>{currency}</small>
        </strong>
      </div>
      <p className={styles.note}>
        Final rates, taxes and service charges are confirmed by the hotel.
      </p>
    </aside>
  );
}
