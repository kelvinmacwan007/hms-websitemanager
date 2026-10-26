import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
} from "../src/lib/manager/credentials.ts";
import { hotelSubdomain, validateHotelSubdomain } from "../src/lib/tenant/hotelDomain.ts";
import { hmsManagerProperties } from "../src/lib/manager/hmsAccess.ts";

test("manager passwords are salted and checked without storing plaintext", () => {
  const hash = hashPassword("strong-password-123");
  assert.ok(verifyPassword("strong-password-123", hash));
  assert.equal(verifyPassword("wrong", hash), false);
  assert.notEqual(hash, hashPassword("strong-password-123"));
  assert.equal(verifyPassword("x", "malformed"), false);
});

test("HMS login resolves only properties in verified work profiles for the matching customer", () => {
  const configs = {
    hotelA: { propertyId: "property-a", customerCode: "customer-a" },
    hotelB: { propertyId: "property-b", customerCode: "customer-b" },
  };
  const login = {
    user: {
      currentWorkProfile: { propertyId: "property-a", propertyName: "Hotel A" },
      workProfiles: [{ propertyId: "property-b" }],
    },
  };
  assert.deepEqual(hmsManagerProperties(login, configs, "customer-a"), [
    { tenantId: "hotelA", propertyId: "property-a", name: "Hotel A" },
  ]);
  assert.deepEqual(hmsManagerProperties({ user: {} }, configs, "customer-a"), []);
  assert.deepEqual(
    hmsManagerProperties(login, { ...configs, duplicate: configs.hotelA }, "customer-a"),
    [],
  );
});

test("signed HMS sessions remain scoped to the configured property and cannot use local account fallback", () => {
  const secret = "secret".repeat(10);
  const claims = {
    username: "hms-user",
    tenantId: "hotelA",
    propertyId: "property-a",
    auth: "hms",
    expires: 2000,
  };
  const token = signSession(claims, secret);
  assert.deepEqual(verifySession(token, secret, [], 1000, { hotelA: "property-a" }), claims);
  assert.equal(verifySession(token, secret, [], 1000, { hotelA: "property-b" }), null);
  assert.equal(
    verifySession(token, secret, [{ username: "hms-user", tenantId: "hotelA" }], 1000),
    null,
  );
  assert.equal(verifySession(token + "x", secret, [], 1000, { hotelA: "property-a" }), null);
});

test("HMS discovery creates stable isolated workspaces without preconfigured credentials", () => {
  const data = {
    user: {
      currentWorkProfile: { propertyId: "new-property", propertyName: "New Hotel" },
      workProfiles: [
        { propertyId: "new-property" },
        { propertyId: "second-property", propertyName: "Second Hotel" },
      ],
    },
  };
  const properties = hmsManagerProperties(data, {}, "customer-a", true);
  assert.equal(properties.length, 2);
  assert.equal(properties[0].name, "New Hotel");
  assert.deepEqual(properties, hmsManagerProperties(data, {}, "customer-a", true));
  assert.notEqual(
    properties[0].tenantId,
    hmsManagerProperties(data, {}, "customer-b", true)[0].tenantId,
  );
  assert.notEqual(properties[0].tenantId, properties[1].tenantId);
  assert.deepEqual(hmsManagerProperties({ user: {} }, {}, "customer-a", true), []);
});

test("chosen website addresses reject full domains, reserved labels and collisions", () => {
  assert.equal(validateHotelSubdomain(" Hotel2 "), "hotel2");
  for (const value of [
    "hotel2.patelhms.com",
    "https://hotel2",
    "-hotel",
    "hotel-",
    "a".repeat(64),
    "websites",
    "portal",
  ])
    assert.throws(() => validateHotelSubdomain(value));
  assert.throws(() => validateHotelSubdomain("taken", new Set(["taken"])));
});
test("manager sessions reject tampering, expiration, removed users and reassigned hotels", () => {
  const secret = "secret".repeat(10),
    users = [{ username: "admin", tenantId: "hotel-a", passwordHash: "unused" }],
    session = { username: "admin", tenantId: "hotel-a", expires: 2000 };
  const token = signSession(session, secret);
  assert.deepEqual(verifySession(token, secret, users, 1000), session);
  assert.equal(verifySession(token + "x", secret, users, 1000), null);
  assert.equal(verifySession(token, secret, users, 2000), null);
  assert.equal(verifySession(token, secret, [], 1000), null);
  assert.equal(verifySession(token, secret, [{ ...users[0], tenantId: "hotel-b" }], 1000), null);
  assert.equal(verifySession(token, "other".repeat(10), users, 1000), null);
  assert.equal(verifySession(token, "short", users, 1000), null);
});
test("hotel subdomains normalize names, avoid reserved labels and handle duplicate hotel names", () => {
  assert.equal(hotelSubdomain("The Grand Meridian Hotel", "123"), "the-grand-meridian-hotel");
  assert.equal(hotelSubdomain("H\u00f4tel C\u00f4te d\u2019Azur", "123"), "hotel-cote-d-azur");
  assert.equal(hotelSubdomain("Website", "abc-123"), "website-abc123");
  assert.equal(hotelSubdomain("Hotel", "abc-123", new Set(["hotel"])), "hotel-abc123");
  assert.ok(hotelSubdomain("a".repeat(100), "123").length <= 63);
  assert.throws(() => hotelSubdomain("Hotel", "abc123", new Set(["hotel", "hotel-abc123"])));
});
