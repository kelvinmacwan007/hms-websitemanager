import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { readLimitedText } from "../src/lib/api/body.ts";
import { allowLogin } from "../src/lib/manager/loginLimit.ts";
import {
  registerSession,
  activeSession,
  revokeSession,
  newSessionId,
} from "../src/lib/manager/sessionStore.ts";
import { hmsWebsiteAccess } from "../src/lib/manager/access.ts";
import nextConfig from "../next.config.mjs";

test("body limits bound streamed bytes without trusting Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(20));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readLimitedText(
      new Request("http://localhost", { method: "POST", body: stream, duplex: "half" }),
      10,
    ),
    /too large/,
  );
  assert.equal(cancelled, true);
  await assert.rejects(
    readLimitedText(new Request("http://localhost", { method: "POST", body: "ééé" }), 5),
  );
  assert.equal(
    await readLimitedText(new Request("http://localhost", { method: "POST", body: "valid" }), 5),
    "valid",
  );
});

test("login counters enforce atomic limits across concurrent workers and expire", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "patelhms-limits-"));
  try {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => allowLogin(root, "account", 5, 60_000)),
    );
    assert.equal(results.filter(Boolean).length, 5);
    assert.equal(await allowLogin(root, "account", 5, 120_000), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("server sessions reject replay after logout, altered tokens, policy changes and expiration", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "patelhms-sessions-"));
  try {
    const id = newSessionId();
    await registerSession(root, "signed-token", Date.now() + 60_000, "policy-a", id);
    assert.equal(await activeSession(root, id, "signed-token", "policy-a"), true);
    assert.equal(await activeSession(root, id, "other-token", "policy-a"), false);
    assert.equal(await activeSession(root, "../../outside", "signed-token", "policy-a"), false);
    await revokeSession(root, id);
    assert.equal(await activeSession(root, id, "signed-token", "policy-a"), false);
    const changed = newSessionId();
    await registerSession(root, "token", Date.now() + 60_000, "old-policy", changed);
    assert.equal(await activeSession(root, changed, "token", "new-policy"), false);
    const expired = newSessionId();
    await registerSession(root, "token", Date.now() - 1, "policy", expired);
    assert.equal(await activeSession(root, expired, "token", "policy"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("actual login, manager authorization and logout enforce website grants and revoke cookies", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "patelhms-auth-"));
  const names = [
    "NODE_ENV",
    "WEBSITE_DATA_DIR",
    "WEBSITE_MANAGER_HOST",
    "WEBSITE_MANAGER_AUTH",
    "WEBSITE_MANAGER_SESSION_SECRET",
    "PATEL_HMS_TENANTS_JSON",
    "WEBSITE_MANAGER_EDITORS_JSON",
  ];
  const previous = Object.fromEntries(names.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    NODE_ENV: "production",
    WEBSITE_DATA_DIR: root,
    WEBSITE_MANAGER_HOST: "websites.example.com",
    WEBSITE_MANAGER_AUTH: "hms",
    WEBSITE_MANAGER_SESSION_SECRET: "a".repeat(64),
    PATEL_HMS_TENANTS_JSON: JSON.stringify({
      hotelA: { propertyId: "property-a", userIdentity: "owner" },
    }),
    WEBSITE_MANAGER_EDITORS_JSON: '{"hotelA":["owner"]}',
  });
  const nativeRequire = createRequire(import.meta.url),
    modules = new Map(),
    jar = new Map();
  let savedOptions;
  let logoReads = 0;
  const hostHeaders = new Headers({ host: "websites.example.com" });
  function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    new Function("require", "exports", outputText)((specifier) => {
      if (specifier === "server-only") return {};
      if (specifier === "@/lib/tenant/resolveTenant")
        return { resolveTenant: async () => ({ id: "hotelA", hostname: "websites.example.com" }) };
      if (specifier === "@/services/patelHms/websiteIntegration")
        return {
          getHmsConnection: () => ({ baseUrl: "https://hms.example.com" }),
          getHmsWebsiteIntegration: () => ({
            refreshPropertyProfile: async () => {
              logoReads++;
              return { propertyId: "property-a", propertyLogoPath: "/hotel-logo.png" };
            },
          }),
        };
      if (specifier.startsWith("node:")) return nativeRequire(specifier);
      if (specifier === "next/headers")
        return {
          headers: async () => hostHeaders,
          cookies: async () => ({
            get: (name) => (jar.has(name) ? { value: jar.get(name) } : undefined),
            set: (name, value, options) => {
              jar.set(name, value);
              savedOptions = options;
            },
          }),
        };
      if (specifier === "@/lib/manager/hmsAuth")
        return {
          authenticateHmsManager: async () => ({
            expires: Date.now() + 8 * 3600_000,
            properties: [{ tenantId: "hotelA", propertyId: "property-a", name: "Hotel A" }],
          }),
        };
      const target = specifier.startsWith("@/")
        ? path.join(process.cwd(), "src", specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      return load(target.endsWith(".ts") ? target : `${target}.ts`);
    }, exports);
    return exports;
  }
  const request = (username = "owner", extra = {}) =>
    new Request("http://localhost/api/manager/login", {
      method: "POST",
      headers: { host: "websites.example.com", origin: "https://websites.example.com", ...extra },
      body: JSON.stringify({ username, password: "test-password", customerCode: "customer" }),
    });
  try {
    const login = load("src/app/api/manager/login/route.ts").POST;
    const logout = load("src/app/api/manager/logout/route.ts").POST;
    const { managerSession } = load("src/lib/manager/session.ts");
    assert.equal(hmsWebsiteAccess("staff", "hotelA"), false);
    assert.equal((await login(request("staff"))).status, 403);
    assert.equal((await login(request("owner", { origin: "https://evil.example" }))).status, 403);
    assert.equal((await login(request())).status, 200);
    assert.equal(savedOptions.httpOnly, true);
    assert.equal(savedOptions.secure, true);
    assert.ok(savedOptions.maxAge <= 1800);
    const original = new Map(jar);
    assert.equal((await managerSession()).tenantId, "hotelA");
    const sync = load("src/app/api/website/logo/route.ts").POST;
    assert.equal((await sync(request("owner", { origin: "https://evil.example" }))).status, 403);
    assert.equal(logoReads, 0);
    const synced = await sync(request());
    assert.equal(synced.status, 200);
    assert.equal((await synced.json()).logoUrl, "https://hms.example.com/hotel-logo.png");
    assert.equal(logoReads, 1);
    const response = await logout(request());
    assert.equal(response.status, 200);
    for (const [key, value] of original) jar.set(key, value);
    assert.equal(await managerSession(), null);
    assert.equal((await login(request())).status, 200);
    process.env.WEBSITE_MANAGER_EDITORS_JSON = '{"hotelA":[]}';
    assert.equal(await managerSession(), null);
    assert.equal((await login(request())).status, 403);
    process.env.WEBSITE_MANAGER_EDITORS_JSON = "{}";
    assert.equal((await login(request("staff"))).status, 200);
    assert.equal((await managerSession()).username, "staff");
    const { readConnection, bindManagerConnection, managerConnection } = load(
      "src/lib/manager/connections.ts",
    );
    const staffSession = await managerSession();
    assert.equal(readConnection("hotelA").userIdentity, "staff");
    const tenant = { id: "hotelA", hostname: "websites.example.com" };
    bindManagerConnection(tenant, staffSession.id);
    assert.equal(managerConnection(tenant).password, "test-password");
    assert.equal(
      readFileSync(
        path.join(
          root,
          "hms-connections",
          nativeRequire("node:crypto").createHash("sha256").update("hotelA").digest("hex") +
            ".json",
        ),
        "utf8",
      ).includes("test-password"),
      false,
    );
    for (let i = 0; i < 10; i++)
      await login(request("rate-test", { "x-forwarded-for": `192.0.2.${i}` }));
    assert.equal(
      (await login(request("rate-test", { "x-forwarded-for": "192.0.2.254" }))).status,
      429,
    );
  } finally {
    for (const key of names) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    await rm(root, { recursive: true, force: true });
  }
});

test("security headers keep same-origin guest previews and prevent shared API caching", async () => {
  const rules = await nextConfig.headers();
  const headers = Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "SAMEORIGIN");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'self'/);
  assert.ok(
    rules
      .find((rule) => rule.source === "/api/:path*")
      .headers.some(
        (header) => header.key === "Cache-Control" && header.value.includes("no-store"),
      ),
  );
});
