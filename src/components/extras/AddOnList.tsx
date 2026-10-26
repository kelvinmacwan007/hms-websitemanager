import type { HotelAddOn } from "@/types/hotel";
import { formatMoney } from "@/lib/utils/format";

export function AddOnList({ items }: { items: HotelAddOn[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-line bg-surface p-6">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          {item.description && <p className="mt-2 text-sm text-muted">{item.description}</p>}
          <p className="mt-4 font-semibold">Listed rate: {formatMoney(item.price)}</p>
          <p className="mt-1 text-sm text-muted">
            {item.taxFree ? "Tax-free" : "Applicable taxes may apply"}
          </p>
          {(item.startDate || item.endDate) && (
            <p className="mt-2 text-sm text-muted">
              Available {item.startDate ? `from ${item.startDate}` : ""}
              {item.endDate ? ` until ${item.endDate}` : ""}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
