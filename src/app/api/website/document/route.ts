import { readLimitedText } from "@/lib/api/body";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getOperationalProvider } from "@/lib/api/provider";
import { developmentAuthorization } from "@/lib/website/authorization";
import { getWebsitePersistence } from "@/lib/website/persistence";
import { validatePresentation, presentationDocument } from "@/lib/website/presentation";
import { contentIssues } from "../../../../../Portal/content";
import { isMockMode } from "@/lib/api/mode";
import { publishHotelDomain, publicHotelUrl } from "@/lib/tenant/domains";
import { isManagerHost } from "@/lib/manager/session";
import { hmsRateReadiness, HMS_RATES_REQUIRED } from "@/services/patelHms/rateReadiness";

export async function POST(request: Request) {
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json(
      { error: "Portal access denied; production authentication is not configured." },
      { status: 403 },
    );
  }
  const persistence = getWebsitePersistence();
  if (!persistence)
    return Response.json({ error: "Production persistence is not configured." }, { status: 503 });
  let body;
  try {
    const raw = await readLimitedText(request, 20000000);
    if (raw.length > 20_000_000)
      return Response.json({ error: "Document too large." }, { status: 413 });
    body = JSON.parse(raw);
    if (
      !body ||
      !["draft", "publish", "apply-website", "apply-draft", "apply-publish"].includes(body.action)
    )
      throw new Error();
    if (
      isManagerHost(request.headers.get("host")) &&
      !["apply-draft", "apply-publish"].includes(body.action)
    )
      return Response.json(
        { error: "Save a website draft or select Publish website." },
        { status: 403 },
      );
    if (
      ["apply-draft", "apply-publish"].includes(body.action) &&
      !isManagerHost(request.headers.get("host"))
    )
      return Response.json({ error: "Use the authenticated Website Manager." }, { status: 403 });
    if (!isMockMode() && !["apply-website", "apply-draft", "apply-publish"].includes(body.action))
      return Response.json(
        { error: "Only website content can be applied during HMS testing." },
        { status: 403 },
      );
  } catch {
    return Response.json({ error: "Invalid document request." }, { status: 400 });
  }
  try {
    const hotel = await getOperationalProvider().getHotel(tenant);
    if (!hotel.configured)
      return Response.json({ error: "Property unavailable." }, { status: 409 });
    const payload = validatePresentation(hotel, body.document);
    if (
      !isMockMode() &&
      ["publish", "apply-publish", "apply-website"].includes(body.action) &&
      (await hmsRateReadiness(tenant, presentationDocument(hotel, payload).hotel)) !== true
    )
      return Response.json({ error: HMS_RATES_REQUIRED }, { status: 409 });
    let websiteUrl: string | undefined;
    if (["apply-website", "apply-draft", "apply-publish"].includes(body.action)) {
      // Persist website-owned presentation only; every operational field remains an HMS read.
      const websiteFields = [
        "tagline",
        "description",
        "longDescription",
        "branding",
        "heroImage",
        "heroSlides",
        "offers",
        "dining",
        "testimonials",
        "policies",
        "faqs",
        "seo",
        "website",
        "enquiryEmail",
        "socialLinks",
      ];
      const brandingFields = [
        "faviconUrl",
        "primaryColor",
        "secondaryColor",
        "accentColor",
        "fontHeading",
        "fontBody",
        "websiteStyle",
        "buttonStyle",
        "imageStyle",
        "cornerRadius",
        "motion",
      ];
      const editorial = {
        ...payload,
        rooms: [],
        rateVisibility: [],
        promotions: [],
        content: { ...payload.content },
      };
      for (const key of Object.keys(editorial.content))
        if (!websiteFields.includes(key)) Reflect.deleteProperty(editorial.content, key);
      editorial.content.branding = Object.fromEntries(
        Object.entries(payload.content.branding).filter(([key]) => brandingFields.includes(key)),
      );
      if (body.action === "apply-publish") {
        const issues = contentIssues(presentationDocument(hotel, editorial));
        if (issues.length) return Response.json({ error: issues.join(" ") }, { status: 422 });
      }
      await persistence.saveDraft(tenant.id, editorial);
      if (body.action !== "apply-draft") await persistence.publishDocument(tenant.id, editorial);
      if (body.action === "apply-publish") {
        const domain = await publishHotelDomain(tenant.id, hotel.id);
        websiteUrl = publicHotelUrl(domain.publishedSubdomain!);
      }
    } else if (body.action === "publish") {
      const issues = contentIssues(presentationDocument(hotel, payload));
      if (issues.length) return Response.json({ error: issues.join(" ") }, { status: 422 });
      if (payload.paymentSettings.mode !== "pay-at-property")
        return Response.json({ error: "A verified payment gateway is required." }, { status: 409 });
      await persistence.publishDocument(tenant.id, payload);
    } else await persistence.saveDraft(tenant.id, payload);
    // Host-resolved pages and presentation file reads are request-time. PMS read cache stays intact.
    return Response.json(
      {
        saved: true,
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
        action: body.action,
        websiteUrl,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && /mismatch|Invalid|valid|schema|field/i.test(error.message)
            ? error.message
            : "Document operation failed. Retry or contact your administrator.",
      },
      { status: 422 },
    );
  }
}
