import type { HotelAddOn } from "@/types/hotel";
import { selectedAddOnRequests } from "@/lib/booking/addOnRequests";
import { websiteClassName } from "@/lib/ui/websiteStyles";

export function AddOnRequests({
  items,
  selected,
}: {
  items: HotelAddOn[];
  selected: string | string[] | undefined;
}) {
  const requests = selectedAddOnRequests(items, selected);
  if (!requests.length) return null;
  return (
    <section
      aria-label="Requested add-ons"
      className={websiteClassName("container my-6 rounded-md border border-line p-5")}
    >
      <h2 className={websiteClassName("text-lg font-semibold")}>Your selected add-ons</h2>
      <ul className={websiteClassName("mt-3 grid gap-2 text-sm")}>
        {requests.map(({ item, quantity }) => (
          <li key={item.id}>
            {quantity} × {item.name}
          </li>
        ))}
      </ul>
      <p className={websiteClassName("mt-3 text-xs text-muted")}>
        Listed add-on prices are estimates. Please arrange these optional services with the hotel;
        availability and final charges require hotel confirmation.
      </p>
    </section>
  );
}
