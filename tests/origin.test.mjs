import assert from "node:assert/strict";
import test from "node:test";
import { requestOrigin } from "../src/lib/api/origin.ts";

test("production manager origin remains HTTPS behind an HTTP reverse proxy", () => {
  const before = { node: process.env.NODE_ENV, manager: process.env.WEBSITE_MANAGER_HOST };
  try {
    process.env.NODE_ENV = "production";
    process.env.WEBSITE_MANAGER_HOST = "websites.kelvinmacwan.com";
    const request = new Request("http://localhost:3000/api/manager/login", {
      headers: { host: "websites.kelvinmacwan.com", origin: "https://websites.kelvinmacwan.com" },
    });
    assert.equal(requestOrigin(request), "https://websites.kelvinmacwan.com");
    assert.notEqual(requestOrigin(request), "https://attacker.example");
    assert.equal(
      requestOrigin(
        new Request("http://localhost:3000/api/test", {
          headers: { host: "another.example", "x-forwarded-proto": "https" },
        }),
      ),
      "http://another.example",
    );
    process.env.NODE_ENV = "development";
    assert.equal(requestOrigin(request), "http://websites.kelvinmacwan.com");
  } finally {
    for (const [key, value] of [
      ["NODE_ENV", before.node],
      ["WEBSITE_MANAGER_HOST", before.manager],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
