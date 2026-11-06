import type { HotelAddOn } from "@/types/hotel";
import { formatMoney } from "@/lib/utils/format";
import styles from "./AddOnList.module.css";

export function AddOnList({
  items,
  singleColumn = false,
}: {
  items: HotelAddOn[];
  singleColumn?: boolean;
}) {
  return (
    <div className={`${styles.list} ${singleColumn ? styles.singleColumn : ""}`}>
      {items.map((item) => (
        <article key={item.id} className={styles.card}>
          <div className={styles.heading}>
            <h3>{item.name}</h3>
            <p className={styles.price} aria-label={`Listed rate: ${formatMoney(item.price)}`}>
              {formatMoney(item.price)}
            </p>
          </div>
          {item.description && <p className={styles.description}>{item.description}</p>}
        </article>
      ))}
    </div>
  );
}
