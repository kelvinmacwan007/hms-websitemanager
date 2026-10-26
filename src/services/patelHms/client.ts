import "server-only";

/** Shared transport for the two existing server-side authentication adapters. */
export async function hmsFetch(url: string | URL, init: RequestInit = {}) {
  const target = new URL(url);
  if (
    (target.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && target.hostname === "localhost")) ||
    target.username ||
    target.password
  )
    throw new Error("Patel HMS API must use HTTPS without URL credentials.");
  return fetch(target, {
    ...init,
    redirect: "error",
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
}

type RequestOptions = {
  path: string;
  init?: RequestInit;
};

export class PatelHmsClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor() {
    this.baseUrl = process.env.PATEL_HMS_API_URL ?? "";
    this.apiKey = process.env.PATEL_HMS_API_KEY;
    this.apiSecret = process.env.PATEL_HMS_API_SECRET;
  }

  async request<T>({ path, init }: RequestOptions): Promise<T> {
    if (!this.baseUrl) {
      throw new Error("PATEL_HMS_API_URL is not configured.");
    }

    if (process.env.PATEL_HMS_WEBSITE_API_VERIFIED !== "true")
      throw new Error(
        "BLOCKED EXTERNAL DEPENDENCY: normalized website API contract is not verified.",
      );
    const isRead = !init?.method || init.method.toUpperCase() === "GET";
    const response = await hmsFetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
        ...(this.apiSecret ? { "x-api-secret": this.apiSecret } : {}),
        ...init?.headers,
      },
      ...(isRead && !init?.cache ? { next: { revalidate: 120 } } : {}),
    });

    if (!response.ok) {
      throw new Error("Patel HMS request failed.");
    }

    return response.json() as Promise<T>;
  }
}

export const patelHmsClient = new PatelHmsClient();
import "server-only";
