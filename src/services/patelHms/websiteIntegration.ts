import "server-only";
import { managerConnection, readConnection } from "@/lib/manager/connections";
import { hmsFetch } from "./client";
import { reservationFormData } from "./reservationForm";
import { HMS_READ_ONLY } from "@/lib/api/hmsPolicy";
import type { Tenant } from "@/types/hotel";
import type {
  HmsConnection,
  HmsEnvelope,
  HmsForecastDay,
  HmsGuestMatch,
  HmsLocation,
  HmsOption,
  HmsPaymentDetails,
  HmsReservationDetails,
  HmsRoomType,
  HmsReservationRequest,
  HmsReservationCreateResponse,
  HmsCardPaymentRequest,
  HmsCardPaymentResponse,
  HmsPropertyProfile,
  HmsCatalogRoom,
  HmsAddOn,
} from "./integrationTypes";

type LoginResponse = {
  token: string;
  expiration: string;
  user?: { currentWorkProfile?: HmsPropertyProfile | null; workProfiles?: HmsPropertyProfile[] };
};
type RoomSearch = { checkInDateTime: string; checkOutDateTime: string; reservationId?: string };
type GuestSearchKind = "firstName" | "lastName" | "mobile";

const guestPaths: Record<GuestSearchKind, string> = {
  firstName: "guest-firstname",
  lastName: "guest-lastname",
  mobile: "guest-mobile",
};

// Configuration is server-only and keyed by the resolved tenant, never by a browser-supplied property ID.
export function getHmsConnection(tenant: Tenant): HmsConnection {
  const raw = process.env.PATEL_HMS_TENANTS_JSON;
  let configs: Record<string, HmsConnection>;
  try {
    configs = JSON.parse(raw || "{}") as Record<string, HmsConnection>;
  } catch {
    throw new Error("PATEL_HMS_TENANTS_JSON is invalid JSON.");
  }
  if (!configs || typeof configs !== "object" || Array.isArray(configs))
    throw new Error("PATEL_HMS_TENANTS_JSON must be a tenant map.");
  const entry =
    managerConnection(tenant) ??
    readConnection(tenant.id) ??
    (Object.hasOwn(configs, tenant.id) ? configs[tenant.id] : undefined);
  const config = entry && {
    ...entry,
    baseUrl: entry.baseUrl || process.env.PATEL_HMS_API_URL || "https://dev-aiapi.patelhms.com",
    currency: entry.currency || process.env.PATEL_HMS_DEFAULT_CURRENCY || "USD",
  };
  if (
    !config ||
    typeof config !== "object" ||
    ![
      config.baseUrl,
      config.userIdentity,
      config.password,
      config.customerCode,
      config.propertyId,
      config.currency,
    ].every((value) => typeof value === "string" && value.trim().length > 0)
  ) {
    throw new Error(`Patel HMS is not configured for tenant ${tenant.id}.`);
  }
  const url = new URL(config.baseUrl);
  if (
    (url.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("Patel HMS API must use HTTPS.");
  }
  return config;
}

export class HmsWebsiteIntegration {
  private token?: { value: string; expiresAt: number };
  private loginPromise?: Promise<string>;
  private profile?: HmsPropertyProfile;

  constructor(private readonly connection: HmsConnection) {}

  private async login(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    if (this.loginPromise) return this.loginPromise;
    this.loginPromise = this.acquireToken();
    try {
      return await this.loginPromise;
    } finally {
      this.loginPromise = undefined;
    }
  }

  private async acquireToken(): Promise<string> {
    const response = await hmsFetch(
      new URL("api/v1/Account/login", `${this.connection.baseUrl.replace(/\/$/, "")}/`),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userIdentity: this.connection.userIdentity,
          password: this.connection.password,
          customerCode: this.connection.customerCode,
        }),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? "Patel HMS login endpoint was not found (HTTP 404). Check PATEL_HMS_API_URL."
          : `Patel HMS login failed (HTTP ${response.status}).`,
      );
    const data = (await response.json()) as LoginResponse;
    if (!data.token || !Number.isFinite(Date.parse(data.expiration)))
      throw new Error("Patel HMS returned an invalid login response.");
    this.token = { value: data.token, expiresAt: Date.parse(data.expiration) };
    const profiles = [data.user?.currentWorkProfile, ...(data.user?.workProfiles ?? [])];
    const profile = profiles.find((item) => item?.propertyId === this.connection.propertyId);
    if (profile)
      this.profile = {
        propertyId: profile.propertyId,
        propertyName: profile.propertyName,
        propertyAddress: profile.propertyAddress,
        propertyLogoPath: profile.propertyLogoPath,
        ianaPropertyTimezone: profile.ianaPropertyTimezone,
      };
    return data.token;
  }

  private async request<T>(
    path: string,
    body?: object | FormData,
    retryAuth = true,
    retryTimeout = true,
  ): Promise<T> {
    const token = await this.login();
    const isWrite = path.endsWith("/iu/reservation") || path.endsWith("/card-payment");
    let response: Response;
    try {
      response = await hmsFetch(
        new URL(path.replace(/^\//, ""), `${this.connection.baseUrl.replace(/\/$/, "")}/`),
        {
          method: body ? "POST" : "GET",
          headers: {
            authorization: `Bearer ${token}`,
            ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}),
          },
          ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
          cache: "no-store",
        },
      );
    } catch (error) {
      if (
        !isWrite &&
        retryTimeout &&
        error instanceof Error &&
        ["TimeoutError", "AbortError"].includes(error.name)
      )
        return this.request(path, body, retryAuth, false);
      throw error;
    }
    if (response.status === 401) this.token = undefined;
    if (response.status === 401 && retryAuth && !isWrite) {
      return this.request(path, body, false, retryTimeout);
    }
    if (!response.ok) throw new Error(`Patel HMS request failed with HTTP ${response.status}.`);
    return response.json() as Promise<T>;
  }

  private async read<T>(path: string, body?: object): Promise<T> {
    const result = await this.request<HmsEnvelope<T>>(path, body);
    if (result.response !== 1 || result.data === undefined)
      throw new Error(result.message || "Patel HMS request failed.");
    return result.data;
  }

  getRoomTypes(search: RoomSearch): Promise<HmsRoomType[]> {
    return this.read("api/v1/FrontDesk/getall/reservation-room-types", {
      propertyId: this.connection.propertyId,
      ...(this.connection.propertyPackageId
        ? { propertyPackageId: this.connection.propertyPackageId }
        : {}),
      checkInDateTime: search.checkInDateTime,
      checkOutDateTime: search.checkOutDateTime,
    });
  }

  async getPropertyProfile(): Promise<HmsPropertyProfile> {
    await this.login();
    if (!this.profile)
      throw new Error("The configured property is not present in the login response.");
    return this.profile;
  }

  async refreshPropertyProfile(): Promise<HmsPropertyProfile> {
    this.token = undefined;
    this.profile = undefined;
    return this.getPropertyProfile();
  }

  async getRoomCatalog(): Promise<HmsCatalogRoom[]> {
    const rooms: HmsCatalogRoom[] = [];
    for (let pageNo = 1; pageNo <= 100; pageNo++) {
      const page = await this.read<{ records: HmsCatalogRoom[]; pager: { totalPages: number } }>(
        "api/v1/RoomManagement/room-types",
        {
          pager: { pageNo, pageSize: 100 },
          filter: { propertyIds: [this.connection.propertyId], roomTypeStatus: 1 },
        },
      );
      if (
        !Array.isArray(page.records) ||
        page.records.some((room) => room.propertyId !== this.connection.propertyId)
      )
        throw new Error("Invalid property room catalogue.");
      rooms.push(...page.records);
      if (pageNo >= page.pager.totalPages) return rooms;
    }
    throw new Error("Room catalogue exceeds supported pagination.");
  }

  async getAddOns(): Promise<HmsAddOn[]> {
    const records = await this.read<HmsAddOn[]>(
      `api/v1/RoomManagement/add-ons/${encodeURIComponent(this.connection.propertyId)}`,
    );
    if (
      !Array.isArray(records) ||
      records.some(
        (item) =>
          !item ||
          item.propertyId !== this.connection.propertyId ||
          typeof item.id !== "string" ||
          !item.id ||
          typeof item.name !== "string" ||
          !item.name.trim() ||
          !Number.isFinite(item.rateAmount) ||
          item.rateAmount < 0,
      )
    )
      throw new Error("Invalid property add-on catalogue.");
    const items = new Map<string, HmsAddOn>();
    for (const item of records) if (item.isActive === 1) items.set(item.id, item);
    return [...items.values()];
  }

  getRateForecast(roomTypeMasterId: string, fromDate: string): Promise<HmsForecastDay[]> {
    return this.read("api/v1/FrontDesk/get/rate-forecast", {
      propertyId: this.connection.propertyId,
      roomTypeMasterId,
      fromDate,
    });
  }

  getCountries(): Promise<HmsOption[]> {
    return this.read("api/v1/Base/dropdown/country");
  }
  getStates(countryId: number): Promise<HmsOption[]> {
    return this.read(`api/v1/Base/dropdown/state/${encodeURIComponent(countryId)}`);
  }
  getCities(stateId: number): Promise<HmsOption[]> {
    return this.read(`api/v1/Base/dropdown/city/${encodeURIComponent(stateId)}`);
  }
  getLocationByZipcode(zipcode: string): Promise<HmsLocation> {
    return this.read(`api/v1/Base/autocomplete/location-by-zipcode/${encodeURIComponent(zipcode)}`);
  }
  findGuests(kind: GuestSearchKind, query: string): Promise<HmsGuestMatch[]> {
    return this.read(`api/v1/Base/autocomplete/${guestPaths[kind]}/${encodeURIComponent(query)}`);
  }
  getReservationDetails(reservationId: string): Promise<HmsReservationDetails> {
    return this.read(
      `api/v1/FrontDesk/get/reservation-details/${encodeURIComponent(reservationId)}`,
    );
  }
  getPaymentDetails(reservationId: string): Promise<HmsPaymentDetails> {
    return this.read(
      `api/v1/FrontDesk/get/reservation-payment-details/${encodeURIComponent(reservationId)}`,
    );
  }

  async createReservation(input: Omit<HmsReservationRequest, "propertyId">): Promise<string> {
    if (HMS_READ_ONLY)
      throw new Error("HMS testing is read-only. Reservation creation is disabled.");
    const result = await this.request<HmsReservationCreateResponse>(
      "api/v1/FrontDesk/iu/reservation",
      reservationFormData({ ...input, propertyId: this.connection.propertyId }),
    );
    // The outline uses code 2 for both success and failure. Require an ID and
    // verify the reservation with the details endpoint before showing success.
    if (typeof result.data !== "string" || !result.data.trim())
      throw new Error("Patel HMS did not return a reservation ID.");
    return result.data;
  }

  async payByCard(input: HmsCardPaymentRequest): Promise<HmsCardPaymentResponse> {
    if (HMS_READ_ONLY) throw new Error("HMS testing is read-only. Payments are disabled.");
    const result = await this.request<HmsCardPaymentResponse>("api/v1/Payment/card-payment", input);
    if (typeof result.success !== "boolean") throw new Error("Invalid payment response.");
    return result;
  }
}

const integrations = new Map<string, HmsWebsiteIntegration>();

export function getHmsWebsiteIntegration(tenant: Tenant): HmsWebsiteIntegration {
  const connection = getHmsConnection(tenant);
  const key = `${tenant.id}:${JSON.stringify(connection)}`;
  let integration = integrations.get(key);
  if (!integration) {
    integration = new HmsWebsiteIntegration(connection);
    integrations.set(key, integration);
  }
  return integration;
}
