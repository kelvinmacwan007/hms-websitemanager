import "server-only";
import { hmsFetch } from "../../services/patelHms/client";
import { hmsManagerProperties } from "./hmsAccess";

export async function authenticateHmsManager(
  username: string,
  password: string,
  customerCode: string,
) {
  const baseUrl = process.env.PATEL_HMS_API_URL || "https://dev-aiapi.patelhms.com";
  const response = await hmsFetch(new URL("/api/v1/Account/login", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIdentity: username, password, customerCode }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok)
    throw new Error(`PatelHMS authentication service returned HTTP ${response.status}.`);
  const data = await response.json();
  const expires = Date.parse(data.expiration);
  if (
    typeof data.token !== "string" ||
    !data.token ||
    !Number.isFinite(expires) ||
    expires <= Date.now()
  )
    return null;
  const configs = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON || "{}");
  return { expires, properties: hmsManagerProperties(data, configs, customerCode, true) };
}
