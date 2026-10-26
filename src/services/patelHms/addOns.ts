import type { Tenant, HotelAddOn } from "@/types/hotel";
import { getHmsConnection, getHmsWebsiteIntegration } from "./websiteIntegration";

export async function fetchAddOns(tenant: Tenant): Promise<HotelAddOn[]> {
  const currency = getHmsConnection(tenant).currency;
  return (await getHmsWebsiteIntegration(tenant).getAddOns()).map((item) => ({
    id: item.id,
    name: item.name.trim(),
    description: item.description || "",
    price: { amount: item.rateAmount, currency },
    taxFree: item.isTaxFree === 1,
    startDate: item.applicableStartDate?.slice(0, 10) || undefined,
    endDate: item.applicableEndDate?.slice(0, 10) || undefined,
  }));
}
