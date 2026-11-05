import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { demoHotel } from "../src/providers/mock/demoHotel.ts";
const require = createRequire(import.meta.url);
const root = process.cwd();
const modules = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  new Function("require", "exports", outputText)((specifier) => {
    if (specifier === "server-only") return {};
    if (specifier.startsWith("node:") || specifier === "react") return require(specifier);
    if (specifier === "next/headers")
      return {
        headers: async () => new Headers(),
        cookies: async () => ({ get: () => undefined }),
      };
    const target = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : path.resolve(path.dirname(filename), specifier);
    return load(target.endsWith(".ts") ? target : `${target}.ts`);
  }, exports);
  return exports;
}
const { createWebsiteDocument, presentationPayload } = load("Portal/content.ts");
const { normalizeHotel, validatePresentation, mergeRoomPresentation } = load(
  "src/lib/website/presentation.ts",
);
const { DevelopmentWebsitePersistence, getWebsitePersistence } = load(
  "src/lib/website/persistence.ts",
);
const { publicProvider } = load("src/lib/api/publicProvider.ts");
const { pageEnabled, publicNavigation } = load("src/lib/website/pages.ts");
const { getBookingBackend, validateQuote } = load("src/lib/booking/backend.ts");
const { getPaymentGateway } = load("src/lib/payment/gateway.ts");
const { developmentAuthorization } = load("src/lib/website/authorization.ts");
const { transitionTransaction } = load("src/lib/booking/transactions.ts");
const { validateEnquiry, enquiryRecipient } = load("src/lib/contact/delivery.ts");
const { validateMedia } = load("src/lib/website/media.ts");
const { loadPreview, savePreview } = load("src/lib/website/preview.ts");
const hotel = () => structuredClone(demoHotel);
const { websiteSetupReadiness } = load("Portal/setup-readiness.ts");

test("publishing requires complete hotel sync and website, including verified rates", () => {
  const ready = createWebsiteDocument(hotel());
  ready.hotel.name = "Test hotel";
  ready.hotel.description = "Hotel description";
  ready.hotel.branding.logoUrl = "https://example.com/logo.png";
  ready.hotel.branding.primaryColor = "#1c355e";
  ready.hotel.heroSlides = [];
  ready.hotel.heroImage = { id: "hero", url: "https://example.com/hero.jpg", alt: "Hotel" };
  ready.pages.home.title = "Welcome";
  assert.ok(ready.hotel.rooms.length);
  assert.equal(websiteSetupReadiness(ready, true).canPublish, true);
  for (const rateState of [false, null]) {
    const result = websiteSetupReadiness(ready, rateState);
    assert.equal(result.synced, false);
    assert.equal(result.canPublish, false);
  }
  for (const change of [
    (doc) => {
      doc.hotel.name = "";
    },
    (doc) => {
      doc.hotel.description = "";
    },
    (doc) => {
      doc.hotel.branding.logoUrl = "";
    },
    (doc) => {
      doc.hotel.branding.primaryColor = "";
    },
    (doc) => {
      doc.hotel.rooms = [];
    },
  ]) {
    const document = structuredClone(ready);
    change(document);
    assert.equal(websiteSetupReadiness(document, true).canPublish, false);
  }
  for (const change of [
    (doc) => {
      doc.hotel.heroImage.url = "";
    },
    (doc) => {
      doc.hotel.heroImage.url = "javascript:alert(1)";
    },
    (doc) => {
      doc.pages.home.title = "   ";
    },
  ]) {
    const document = structuredClone(ready);
    change(document);
    const result = websiteSetupReadiness(document, true);
    assert.equal(result.synced, true);
    assert.equal(result.websiteReady, false);
    assert.equal(result.canPublish, false);
    assert.match(result.error, /Complete Website/);
  }
});
test("temporary previews are tenant scoped, expire and cannot be read in production", () => {
  const priorEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  const current = hotel();
  const document = presentationPayload(createWebsiteDocument(current));
  try {
    const token = savePreview(current.tenantId, current, document);
    assert.equal(loadPreview(token, current.tenantId).document, document);
    assert.equal(loadPreview(token, "another-hotel"), null);
    const changed = structuredClone(document);
    changed.pages.home.title = "An unsaved preview";
    assert.equal(savePreview(current.tenantId, current, changed, token), token);
    assert.equal(
      loadPreview(token, current.tenantId).document.pages.home.title,
      "An unsaved preview",
    );
    assert.notEqual(document.pages.home.title, "An unsaved preview");
    globalThis.websitePreviewDrafts.get(token).expires = 0;
    assert.equal(loadPreview(token, current.tenantId), null);
    const next = savePreview(current.tenantId, current, document);
    process.env.NODE_ENV = "production";
    assert.equal(loadPreview(next, current.tenantId), null);
  } finally {
    if (priorEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = priorEnv;
  }
});
const payload = () => presentationPayload(createWebsiteDocument(hotel()));
const tenant = { id: demoHotel.tenantId, hostname: "localhost" };
const temp = mkdtempSync(path.join(tmpdir(), "patelhms-publish-"));
test.after(() => rmSync(temp, { recursive: true, force: true }));
const store = new DevelopmentWebsitePersistence(temp);

test("draft persists presentation without operational data", async () => {
  const edit = payload();
  edit.content.name = "Draft name";
  await store.saveDraft(tenant.id, edit);
  assert.equal((await store.loadDraft(tenant.id)).content.name, "Draft name");
  assert.equal(JSON.stringify(await store.loadDraft(tenant.id)).includes("inventoryCount"), false);
});

test("all header templates survive drafts and publishing without replacing the HMS logo", async () => {
  for (const template of ["minimal", "centered", "contact", "announcement", "transparent"]) {
    const current = hotel();
    const edit = presentationPayload(createWebsiteDocument(current));
    edit.content.branding.header = {
      template,
      announcementText: "Plan your next stay",
      announcementPage: "/booking",
      announcementLabel: "Book a room",
    };
    const validated = validatePresentation(current, edit);
    const headerStore = new DevelopmentWebsitePersistence(path.join(temp, `header-${template}`));
    await headerStore.saveDraft(tenant.id, validated);
    const draft = await headerStore.loadDraft(tenant.id);
    assert.deepEqual(draft.content.branding.header, edit.content.branding.header);
    await headerStore.publishDocument(tenant.id, draft);
    const published = normalizeHotel(current, await headerStore.loadPublished(tenant.id));
    assert.equal(published.branding.header.template, template);
    assert.equal(published.branding.logoUrl, current.branding.logoUrl);
    assert.equal(published.contact.phone, current.contact.phone);
  }
  const invalid = payload();
  invalid.content.branding.header = { template: "unsupported" };
  assert.throws(() => validatePresentation(hotel(), invalid), /header template/);
  invalid.content.branding.header = {
    template: "announcement",
    announcementPage: "javascript:alert(1)",
  };
  assert.throws(() => validatePresentation(hotel(), invalid), /announcement page/);
  invalid.content.branding.header = { template: "announcement", announcementText: "x".repeat(181) };
  assert.throws(() => validatePresentation(hotel(), invalid), /announcement under/);
});
test("saving draft does not create published state", async () =>
  assert.equal(await store.loadPublished(tenant.id), null));
test("publishing changes public configuration", async () => {
  await store.publishDocument(tenant.id, await store.loadDraft(tenant.id));
  assert.equal(normalizeHotel(hotel(), await store.loadPublished(tenant.id)).name, "Draft name");
});

test("published hotels retain live add-ons outside the editable document", async () => {
  const current = hotel();
  current.addOns = [
    {
      id: "breakfast",
      name: "Breakfast",
      description: "",
      price: { amount: 20, currency: "USD" },
      taxFree: false,
    },
  ];
  current.addOnsUnavailable = false;
  const edit = payload();
  edit.content.name = "Published hotel";
  const result = await provider(edit, current).getHotel(tenant);
  assert.equal(result.name, "Published hotel");
  assert.deepEqual(result.addOns, current.addOns);
  assert.equal(result.addOnsUnavailable, false);
  const document = createWebsiteDocument(result);
  assert.equal(Object.hasOwn(document.hotel, "addOns"), false);
  assert.equal(Object.hasOwn(document.hotel, "addOnsUnavailable"), false);
  assert.equal(Object.hasOwn(document.hotel, "website"), false);
  assert.doesNotThrow(() => validatePresentation(result, presentationPayload(document)));
  current.addOns = [];
  current.addOnsUnavailable = true;
  const unavailable = normalizeHotel(current, edit);
  assert.deepEqual(unavailable.addOns, []);
  assert.equal(unavailable.addOnsUnavailable, true);
});
test("publishing Hotel A leaves Hotel B unchanged", async () =>
  assert.equal(await store.loadPublished("hotel2"), null));
test("cross-tenant store writes are rejected", async () =>
  assert.rejects(store.saveDraft("hotel2", payload()), /mismatch/));
test("cross-property presentation is rejected", () => {
  const edit = payload();
  edit.propertyId = "other";
  assert.throws(() => normalizeHotel(hotel(), edit), /mismatch/);
});
test("room names slugs descriptions images amenities sizes merge", () => {
  const edit = payload();
  Object.assign(edit.rooms[0], {
    displayName: "Ocean King Retreat",
    slug: "ocean-king",
    description: "Custom description",
    size: "40 m²",
  });
  const result = normalizeHotel(hotel(), edit).rooms[0];
  assert.equal(result.name, "Ocean King Retreat");
  assert.equal(result.slug, "ocean-king");
  assert.equal(result.description, "Custom description");
  assert.equal(result.size, "40 m²");
});
test("fresh PMS price and inventory survive presentation", () => {
  const edit = payload();
  edit.rooms[0].displayName = "Ocean King Retreat";
  const current = hotel();
  current.rooms[0].ratePlans[0].price.amount = 279;
  current.rooms[0].ratePlans[0].inventoryCount = 2;
  const result = normalizeHotel(current, edit).rooms[0];
  assert.equal(result.name, "Ocean King Retreat");
  assert.equal(result.ratePlans[0].price.amount, 279);
  assert.equal(result.ratePlans[0].inventoryCount, 2);
});
test("operational presentation injection rejected", () => {
  const edit = payload();
  edit.content.location = { address: "Hijacked" };
  assert.throws(() => validatePresentation(hotel(), edit), /fields/);
  delete edit.content.location;
  edit.rooms[0].occupancy = 99;
  assert.throws(() => validatePresentation(hotel(), edit), /fields/);
});
function provider(edit = null, sourceHotel = hotel()) {
  return publicProvider(
    {
      getHotel: async () => sourceHotel,
      getRooms: async () => sourceHotel.rooms,
      searchAvailability: async () => sourceHotel.rooms,
      getRoomBySlug: async () => null,
    },
    async () => edit,
  );
}
test("hidden rooms stay in PMS but disappear publicly", async () => {
  const edit = payload();
  edit.rooms[0].visible = false;
  assert.equal((await provider(edit).getHotel(tenant)).rooms.length, 3);
  assert.equal(hotel().rooms.length, 4);
});
test("hidden rate disappears publicly", async () => {
  const edit = payload();
  edit.rateVisibility[0].visible = false;
  assert.equal((await provider(edit).getRooms(tenant))[0].ratePlans.length, 1);
});
test("presentation room order controls public order", async () => {
  const edit = payload();
  edit.rooms.reverse();
  assert.equal((await provider(edit).getRooms(tenant))[0].id, edit.rooms[0].pmsRoomTypeId);
});
test("renamed room slug resolves through PMS identifier", async () => {
  const edit = payload();
  edit.rooms[0].slug = "new-room";
  assert.equal(
    (await provider(edit).getRoomBySlug(tenant, "new-room")).id,
    edit.rooms[0].pmsRoomTypeId,
  );
  assert.equal(await provider(edit).getRoomBySlug(tenant, demoHotel.rooms[0].slug), null);
});
test("page visibility is normalized", () => {
  const edit = payload();
  edit.pages.offers.enabled = false;
  assert.equal(pageEnabled(normalizeHotel(hotel(), edit), "offers"), false);
});
test("section visibility survives normalization", () => {
  const edit = payload();
  edit.homeSections[0].enabled = false;
  assert.equal(normalizeHotel(hotel(), edit).website.homeSections[0].enabled, false);
});
test("section order survives normalization", () => {
  const edit = payload();
  edit.homeSections.reverse();
  assert.deepEqual(
    normalizeHotel(hotel(), edit).website.homeSections.map((item) => item.id),
    edit.homeSections.map((item) => item.id),
  );
});
test("navigation excludes disabled available pages", () => {
  const edit = payload();
  edit.pages.dining.enabled = false;
  assert.equal(
    publicNavigation(normalizeHotel(hotel(), edit)).some((item) => item.href === "/dining"),
    false,
  );
});
test("malformed persisted JSON fails rather than falling back", async () => {
  writeFileSync(path.join(temp, "broken.published.json"), "{");
  await assert.rejects(store.loadPublished("broken"));
});
test("malformed persisted document is rejected by normalization", () => {
  const edit = payload();
  edit.pages.rooms.enabled = "yes";
  assert.throws(() => normalizeHotel(hotel(), edit));
});
test("provider errors do not silently produce mock inventory", async () => {
  const p = publicProvider({
    getHotel: async () => {
      throw new Error("PMS timeout");
    },
  });
  await assert.rejects(p.getHotel(tenant), /PMS timeout/);
});
test("production never selects development persistence", () => {
  const prior = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.equal(getWebsitePersistence(), null);
  } finally {
    process.env.NODE_ENV = prior;
  }
});
test("unconfigured quote and reservation never return success", async () => {
  await assert.rejects(getBookingBackend().quote({}), /EXTERNAL DEPENDENCY/);
  await assert.rejects(getBookingBackend().createReservation({}), /EXTERNAL DEPENDENCY/);
});
test("expired or cross-tenant quotes rejected", () => {
  assert.throws(() =>
    validateQuote(
      { authoritative: true, tenantId: "other" },
      { tenantId: tenant.id, propertyId: demoHotel.id },
    ),
  );
});
test("unconfigured gateway cannot charge capture or accept webhook", async () => {
  await assert.rejects(getPaymentGateway().createPaymentSession({}), /EXTERNAL DEPENDENCY/);
  await assert.rejects(
    getPaymentGateway().handleWebhook(new Uint8Array(), new Headers()),
    /EXTERNAL DEPENDENCY/,
  );
});
test("confirmation requires verified backend reservation", () => {
  assert.throws(
    () => transitionTransaction({ state: "PAYMENT_PENDING", paymentRequired: false }, "CONFIRMED"),
    /Verified/,
  );
});
test("paid reservation failure enters refund recovery", () => {
  assert.equal(
    transitionTransaction({ state: "RESERVATION_PENDING", verifiedPayment: true }, "FAILED").state,
    "REFUND_PENDING",
  );
});
test("production rejects localhost development authorization", async () => {
  const prior = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await assert.rejects(
      developmentAuthorization.authorize(
        new Request("http://localhost/api", { headers: { origin: "http://localhost" } }),
        tenant,
        demoHotel.id,
      ),
    );
  } finally {
    process.env.NODE_ENV = prior;
  }
});
test("development authorization rejects cross-origin writes", async () =>
  assert.rejects(
    developmentAuthorization.authorize(
      new Request("http://localhost/api", { headers: { origin: "http://evil.example" } }),
      tenant,
      demoHotel.id,
    ),
  ));
test("website-only edits preserve API identity, logos, gallery and room data", () => {
  const current = hotel();
  current.branding.logoUrl = "https://example.com/api-logo.png";
  const editorial = payload();
  editorial.rooms = [];
  editorial.rateVisibility = [];
  delete editorial.content.name;
  delete editorial.content.gallery;
  delete editorial.content.amenities;
  editorial.content.branding = { faviconUrl: "/favicon.svg", primaryColor: "#0d3263" };
  const result = normalizeHotel(current, editorial);
  assert.equal(result.name, current.name);
  assert.equal(result.branding.logoUrl, current.branding.logoUrl);
  assert.equal(result.branding.faviconUrl, "/favicon.svg");
  assert.deepEqual(result.gallery, current.gallery);
  assert.deepEqual(
    result.rooms[0].ratePlans.map(({ id, price, inventoryCount }) => ({
      id,
      price,
      inventoryCount,
    })),
    current.rooms[0].ratePlans.map(({ id, price, inventoryCount }) => ({
      id,
      price,
      inventoryCount,
    })),
  );
});
test("live development allows local website editing and production blocks it", async () => {
  const priorEnv = process.env.NODE_ENV;
  const priorWebsite = process.env.WEBSITE_ENV;
  try {
    process.env.NODE_ENV = "development";
    process.env.WEBSITE_ENV = "live";
    const request = (route) =>
      new Request(`http://localhost${route}`, { headers: { origin: "http://localhost" } });
    await developmentAuthorization.authorize(request("/api/website/colors"), tenant, demoHotel.id);
    await developmentAuthorization.authorize(
      request("/api/website/document"),
      tenant,
      demoHotel.id,
    );
    process.env.NODE_ENV = "production";
    await assert.rejects(
      developmentAuthorization.authorize(request("/api/website/colors"), tenant, demoHotel.id),
    );
  } finally {
    if (priorEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = priorEnv;
    if (priorWebsite === undefined) delete process.env.WEBSITE_ENV;
    else process.env.WEBSITE_ENV = priorWebsite;
  }
});
test("contact validation blocks header injection and uses configured recipient", () => {
  const enquiry = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    phone: "",
    enquiry: "other",
    message: "Hello",
  };
  assert.equal(validateEnquiry(enquiry).firstName, "Jane");
  assert.throws(() =>
    validateEnquiry({ ...enquiry, email: "jane@example.com\r\nBCC:attacker@example.com" }),
  );
  const current = hotel();
  current.contact.enquiryEmail = "help@example.com";
  assert.equal(enquiryRecipient(current), "help@example.com");
});
test("media rejects spoofed MIME and extensions", async () => {
  await assert.rejects(validateMedia(new File(["not PNG"], "logo.png", { type: "image/png" })));
  await assert.rejects(validateMedia(new File(["not PNG"], "logo.svg", { type: "image/png" })));
});

test("media accepts images up to 5 MB and rejects larger uploads", async () => {
  const bytes = new Uint8Array(5 * 1024 * 1024);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const result = await validateMedia(new File([bytes], "item.png", { type: "image/png" }));
  assert.equal(result.bytes.length, bytes.length);
  await assert.rejects(
    validateMedia(new File([bytes, new Uint8Array(1)], "item.png", { type: "image/png" })),
    /5 MB/,
  );
});
test("operational merge keeps capacity bed type and availability", () => {
  const current = hotel().rooms;
  const edited = structuredClone(current);
  edited[0].occupancy = 99;
  edited[0].availabilityStatus = "sold-out";
  const result = mergeRoomPresentation(current, edited);
  assert.equal(result[0].occupancy, current[0].occupancy);
  assert.equal(result[0].availabilityStatus, current[0].availabilityStatus);
});

test("production persistence requires an explicitly configured durable directory", async () => {
  const priorEnv = process.env.NODE_ENV,
    priorDir = process.env.WEBSITE_DATA_DIR;
  const directory = mkdtempSync(path.join(tmpdir(), "manager-persistence-"));
  try {
    process.env.NODE_ENV = "production";
    process.env.WEBSITE_DATA_DIR = directory;
    const persistence = getWebsitePersistence();
    assert.ok(persistence);
    const document = presentationPayload(createWebsiteDocument(hotel()));
    await persistence.publishDocument(document.tenantId, document);
    assert.deepEqual(
      await persistence.loadPublished(document.tenantId),
      JSON.parse(JSON.stringify(document)),
    );
  } finally {
    if (priorEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = priorEnv;
    if (priorDir === undefined) delete process.env.WEBSITE_DATA_DIR;
    else process.env.WEBSITE_DATA_DIR = priorDir;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("hotel addresses remain private until publish, and saving a published address updates routing immediately", async () => {
  const before = {
    env: process.env.NODE_ENV,
    root: process.env.WEBSITE_DATA_DIR,
    configs: process.env.PATEL_HMS_TENANTS_JSON,
    host: process.env.WEBSITE_MANAGER_HOST,
  };
  const rootDir = path.join(temp, "domains");
  process.env.NODE_ENV = "production";
  process.env.WEBSITE_DATA_DIR = rootDir;
  process.env.WEBSITE_MANAGER_HOST = "websites.patelhms.com";
  process.env.PATEL_HMS_TENANTS_JSON = JSON.stringify({
    [tenant.id]: { propertyId: demoHotel.id },
    other: { propertyId: "other-property" },
  });
  const {
    registerHotelDomain,
    chooseHotelDomain,
    publishHotelDomain,
    unpublishHotelDomain,
    hotelDomain,
    registeredTenant,
  } = load("src/lib/tenant/domains.ts");
  try {
    const selected = await registerHotelDomain(tenant.id, demoHotel.id, "The Demo Hotel");
    const reserved = await chooseHotelDomain(tenant.id, demoHotel.id, selected);
    assert.equal(reserved.publishedSubdomain, undefined);
    assert.equal(await registeredTenant(selected), undefined);
    await getWebsitePersistence().saveDraft(tenant.id, payload());
    assert.equal(await registeredTenant(selected), undefined);
    await assert.rejects(publishHotelDomain(tenant.id, demoHotel.id), /published website/);
    await getWebsitePersistence().publishDocument(tenant.id, payload());
    assert.equal(await registeredTenant(selected), undefined);
    await publishHotelDomain(tenant.id, demoHotel.id);
    assert.equal(await registeredTenant(selected), tenant.id);
    const renamed = await chooseHotelDomain(tenant.id, demoHotel.id, "hotel2");
    assert.equal(renamed.subdomain, "hotel2");
    assert.equal(renamed.publishedSubdomain, "hotel2");
    assert.equal(await registeredTenant("hotel2"), tenant.id);
    assert.equal(await registeredTenant(selected), undefined);
    await registerHotelDomain("other", "other-property", "Other Hotel");
    await chooseHotelDomain("other", "other-property", selected);
    await assert.rejects(chooseHotelDomain("other", "other-property", "hotel2"), /unavailable/);
    assert.equal(await registeredTenant("hotel2"), tenant.id);
    assert.equal((await hotelDomain("other")).subdomain, selected);
    await assert.rejects(chooseHotelDomain(tenant.id, "wrong-property", "new-name"), /mismatch/);
    await publishHotelDomain(tenant.id, demoHotel.id);
    assert.equal(await registeredTenant("hotel2"), tenant.id);
    assert.equal(await registeredTenant(selected), undefined);
    await assert.rejects(unpublishHotelDomain(tenant.id, "wrong-property"), /mismatch/);
    assert.equal(await registeredTenant("hotel2"), tenant.id);
    const savedDraft = await getWebsitePersistence().loadDraft(tenant.id);
    const savedPublished = await getWebsitePersistence().loadPublished(tenant.id);
    const otherDomain = await hotelDomain("other");
    await unpublishHotelDomain(tenant.id, demoHotel.id);
    assert.equal(await registeredTenant("hotel2"), undefined);
    assert.equal((await hotelDomain(tenant.id)).subdomain, "hotel2");
    assert.deepEqual(await getWebsitePersistence().loadDraft(tenant.id), savedDraft);
    assert.deepEqual(await getWebsitePersistence().loadPublished(tenant.id), savedPublished);
    assert.deepEqual(await hotelDomain("other"), otherDomain);
    await assert.rejects(chooseHotelDomain("other", "other-property", "hotel2"), /unavailable/);
    await unpublishHotelDomain(tenant.id, demoHotel.id);
    await publishHotelDomain(tenant.id, demoHotel.id);
    assert.equal(await registeredTenant("hotel2"), tenant.id);
  } finally {
    for (const [key, value] of [
      ["NODE_ENV", before.env],
      ["WEBSITE_DATA_DIR", before.root],
      ["PATEL_HMS_TENANTS_JSON", before.configs],
      ["WEBSITE_MANAGER_HOST", before.host],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
