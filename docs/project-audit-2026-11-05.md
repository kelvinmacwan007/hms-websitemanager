# Project audit — 5 November 2026

The local production build passed the checks below. This is a scoped audit, not a claim that every integration or possible user action is verified.

## Passed

- Production build and TypeScript checks, lint, and all 155 automated tests.
- Thirteen public routes at widths 1920, 1440, 1024, 768, 390 and 320 pixels: HTTP 200, no page horizontal overflow, one visible main heading, no missing labels on checked visible main controls, no broken loaded visible images, and no captured runtime/hydration errors or failed HTTP resources.
- Ten focused browser checks: booking date pickers, room results, menu interactions, motion/reduced motion, UAT checkout, booking hydration, contained loading, reservation panel, guest picker, and header scrolling.
- Website Studio navigation through all fourteen sections at five widths (1440 through 320): no page horizontal overflow or captured runtime errors. Offscreen Appearance tabs are in a horizontally scrollable tab strip.
- Representative desktop and mobile screenshots inspected for public homepage, booking and Studio Appearance.

Automated browser checks used an isolated production mock instance and disposable local manager credentials/data. The local HTTPS manager fixture retained production origin and cookie behavior. It did not modify the connected hotel's content. UAT confirmation checks simulated the provider receipt; no payment was submitted.

## Open browser observations

The user's existing Edge session at localhost:3000/website-manager displayed The Grand Meridian Hotel with synced data, six room types, two banners, zero menu items and an unpublished website. Appearance opened correctly and showed the connected logo. Guest preview progressed from loading to a skeleton, then the development page reloaded to Dashboard; successful completion of that preview was not verified. No save, publish or resync action was taken.

## Remaining verification

### Hosted browser follow-up

Tested the actual websites.kelvinmacwan.com draft preview in the user's Edge session:

- Homepage loaded with connected hotel content and room images.
- Booking availability search returned six sample room types. Selecting one Family Twin Room enabled Review cart and capped selection at the requested one room.
- Cart carried the selected room, two adults and 5–6 November dates, calculating INR 189 for one night. Taxes were explicitly excluded.
- Extras opened with step 2 active, correctly showing no optional services and retaining INR 189.
- Guest checkout opened with step 3 active. Entered fictional guest details, acknowledged the sample-only conditions and successfully reviewed them. The result was “Your sample details are ready”; no payment or confirmation step followed. No hotel reservation, payment or message was submitted.
- Gallery loaded six images; its lightbox opened and advanced from image 1 to image 2, and Escape dismissed it.
- Contact loaded its Google map and enquiry fields. The action was “Check enquiry details”, not a verified message-delivery action. No enquiry was submitted.

Live blockers: the deployed flow is sample-only for this stay; its introductory checkout copy promises payment while the actual action only reviews details. The stay currency is INR while the configured test widget in local source supports USD only. Missing payment UI cannot be repaired by relabelling INR as USD. Deployment configuration and the merchant's correct currency contract must be checked. The room-search screen lacked a stepper, whereas cart, extras and guest screens displayed one. The existing local booking preview also displayed the Next.js error “notFound() is not allowed to use in root layout”; the hosted flow tested here did not show that error.

These hosted checks supplement the isolated audit. They do not establish that every editor mutation, payment transaction, public subdomain or reservation operation works.

- Reproduce and measure the connected-HMS guest preview reload/loading behavior without development rebuilds.
- Verify deployed Hostinger behavior separately; these checks do not establish deployment health.
- Populate hotel menu content and publish when ready. Google Analytics is explicitly unavailable in the current UI.
- A real provider UAT transaction, server-side payment verification, and actual HMS reservation creation were not tested. The current demo flow does not create a hotel reservation, and a browser-reported UAT success is not settlement evidence.
- Editor save/publish/upload persistence against the connected hotel was not exercised. Full accessibility, cross-browser, performance and penetration audits remain outside these checks.

## Evidence

Ignored local artifacts are under artifacts/project-audit/: public-results.json, manager-results.json, browser-results.json, per-check logs, and desktop/mobile screenshots. Test scripts and fixture data are under ignored tmp/. No application source changes were required by the completed checks.
