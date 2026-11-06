import test from "node:test";
import { readFileSync } from "node:fs";
import { getCountries } from "libphonenumber-js";
import assert from "node:assert/strict";
import { guestFieldError, formatGuestValue } from "../src/lib/booking/guestValidation.ts";

test("guest names support international names but reject whitespace and digits", () => {
  for (const name of ["José", "O’Connor", "Anne-Marie", "李", "अमित"])
    assert.equal(guestFieldError("firstName", name, true), "");
  for (const name of ["   ", "123", "<script>"])
    assert.notEqual(guestFieldError("firstName", name, true), "");
});
test("phone validation and formatting respect country and international calling codes", () => {
  assert.equal(guestFieldError("phone", "2025550147", true, "US"), "");
  assert.equal(formatGuestValue("phone", "2025550147", "US"), "+1 202 555 0147");
  assert.equal(guestFieldError("phone", "+44 20 7946 0018", true, "IN"), "");
  for (const number of ["123", "2025550147ext4", "111111111111111111"])
    assert.notEqual(guestFieldError("phone", number, true, "US"), "");
  assert.notEqual(guestFieldError("phone", "2025550147", true), "");
});
test("postal validation and masks are country specific", () => {
  for (const [country, value] of [
    ["US", "12345-6789"],
    ["IN", "390001"],
    ["CA", "K1A 0B1"],
    ["GB", "SW1A 1AA"],
  ])
    assert.equal(guestFieldError("postalCode", value, true, country), "");
  assert.notEqual(guestFieldError("postalCode", "12345", true, "IN"), "");
  assert.notEqual(guestFieldError("postalCode", "12345", true, "CA"), "");
  assert.equal(formatGuestValue("postalCode", "k1a0b1", "CA"), "K1A 0B1");
  assert.equal(formatGuestValue("postalCode", "123456789", "US"), "12345-6789");
});
test("optional blanks remain valid and email requires a complete domain", () => {
  assert.equal(guestFieldError("postalCode", "", false, "IN"), "");
  assert.notEqual(guestFieldError("email", "person@host", true), "");
  assert.equal(guestFieldError("email", "person@example.com", true), "");
});

test("phone country names and flag assets cover every supported calling region", () => {
  const names = JSON.parse(
    readFileSync(new URL("../src/lib/booking/phoneCountryNames.json", import.meta.url), "utf8"),
  );
  for (const country of getCountries()) {
    assert.equal(typeof names[country], "string", `Missing country label: ${country}`);
    const flag = readFileSync(
      new URL(`../public/flags/${country.toLowerCase()}.svg`, import.meta.url),
      "utf8",
    );
    assert.match(flag, /<svg\b/, `Missing SVG flag: ${country}`);
  }
});
