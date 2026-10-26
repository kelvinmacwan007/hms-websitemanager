import "server-only";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Hotel, Tenant, AvailabilitySearch } from "@/types/hotel";
import { validatePmsHotel } from "./validation";
import { getHmsConnection, getHmsWebsiteIntegration } from "./websiteIntegration";
import { hmsImageUrl } from "./roomMapping";
import { managerConnection, readConnection } from "@/lib/manager/connections";

// No hotel-content endpoint is documented. Load the portal-owned snapshot from
// a server-side file; room prices and inventory are always fetched from HMS.
export async function getPropertyContext(tenant: Tenant): Promise<Hotel> {
  const filename = process.env.PATEL_HMS_PROPERTIES_FILE;
  if (!filename || managerConnection(tenant) || readConnection(tenant.id)) {
    const connection = getHmsConnection(tenant);
    const profile = await getHmsWebsiteIntegration(tenant).getPropertyProfile();
    if (!profile.propertyName || !profile.ianaPropertyTimezone)
      throw new Error("The HMS login profile is missing hotel name or timezone.");
    new Intl.DateTimeFormat("en", { timeZone: profile.ianaPropertyTimezone });
    return validatePmsHotel(
      {
        id: profile.propertyId,
        tenantId: tenant.id,
        name: profile.propertyName,
        template: "default",
        configured: true,
        description: "",
        currency: connection.currency,
        timeZone: profile.ianaPropertyTimezone,
        branding: {
          logoUrl: profile.propertyLogoPath
            ? hmsImageUrl(profile.propertyLogoPath, connection.baseUrl)
            : undefined,
        },
        location: { address: profile.propertyAddress ?? "", city: "", country: "" },
        contact: {},
        rooms: [],
        gallery: [],
        amenities: [],
        extras: [],
      },
      tenant,
    );
  }
  const records = JSON.parse(await readFile(resolve(filename), "utf8")) as Record<string, Hotel>;
  const hotel = Object.hasOwn(records, tenant.id) ? records[tenant.id] : undefined;
  if (!hotel || hotel.id !== getHmsConnection(tenant).propertyId || !hotel.timeZone)
    throw new Error("Invalid HMS property snapshot or missing IANA timezone.");
  // Validate the timezone before using it for booking dates.
  new Intl.DateTimeFormat("en", { timeZone: hotel.timeZone });
  return validatePmsHotel(
    { ...hotel, currency: getHmsConnection(tenant).currency, extras: [] },
    tenant,
  );
}

export function getHmsStayTimes(tenant: Tenant, search: AvailabilitySearch) {
  const entries = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON ?? "{}");
  const entry =
    managerConnection(tenant) ??
    readConnection(tenant.id) ??
    (Object.hasOwn(entries, tenant.id) ? entries[tenant.id] : undefined);
  const checkInTime = entry?.checkInTime;
  const checkOutTime = entry?.checkOutTime;
  if (
    ![checkInTime, checkOutTime].every(
      (time) => typeof time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time),
    )
  )
    throw new Error("Configure property checkInTime and checkOutTime (HH:mm).");
  // HMS accepts property-local wall times in its reservation example.
  return {
    checkInDateTime: `${search.checkIn}T${checkInTime}:00`,
    checkOutDateTime: `${search.checkOut}T${checkOutTime}:00`,
  };
}
