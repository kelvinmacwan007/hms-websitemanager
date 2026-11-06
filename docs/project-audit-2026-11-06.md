# Local verification and security review ? 6 November 2026

## Changes made

- Updated Next.js and eslint-config-next from 16.3.8 to 16.4.5. The initial npm audit identified 11 affected packages (one critical, one high and nine moderate).
- Applied compatible dependency fixes for the remaining affected packages. Scoped the typescript-estree minimatch override to ^11.0.1 because its declared dependency still selects an affected version. ESLint and the production build pass with this override; revisit when the upstream dependency range is updated.
- Fixed a checkout hydration error: Node and Edge resolve different country names with Intl.DisplayNames. The phone dropdown now uses a shared country-name JSON file and deterministic sorting.
- Added coverage for all 245 phone-country names and SVG flag assets and a production browser regression for phone controls.
- Updated existing checkout browser selectors for the custom phone control. Added a hydration wait before interacting with date-picker controls on cold SSR pages.
- Fixed three existing Prettier failures without changing their behavior.

## Passed

- Production webpack build on Next.js 16.4.5, including its TypeScript check.
- Full ESLint, standalone TypeScript check, Prettier check, and all 160 automated tests.
- npm audit: zero reported vulnerabilities, including development dependencies. Production-only audit also reports zero.
- All 13 public routes returned HTTP 200 at six viewport widths: 1920, 1440, 1024, 768, 390 and 320. The audit found no page overflow, captured runtime/hydration errors, failed HTTP resources, broken loaded images, missing checked control names or incorrect visible main-heading counts.
- Website Studio navigation through all 14 sections at five widths: 1440, 1024, 768, 390 and 320. No page overflow or captured runtime errors. Some Appearance tabs sit outside the viewport inside their intentional horizontally scrollable tab strip.
- Focused browser scripts: full booking flow, booking results, date/guest/room pickers, menu, motion, payment-widget guest handoff, booking hydration, contained loading, reservation panel, guest picker, header scrolling, button states, guest review/edit, and phone controls.
- Phone browser regression: US default, 10-digit US cap, all 245 local SVG assets served successfully, UK/India formatting, national-number preservation when changing calling codes, international paste, invalid-number feedback, dropdown wheel scrolling, Escape dismissal and mobile bounds. Offscreen flag images use browser lazy loading.
- Production HTTP security smoke: security headers and no-store responses, hidden powered-by header, unauthenticated edits rejected, cross-origin login/edit/contact requests rejected, Secure/HttpOnly/SameSite=Lax session cookies, revoked-session replay rejected after logout, invalid location parameters rejected, and unrelated hostnames rejected with HTTP 404.
- Automated security tests also cover tenant boundaries, tampered/expired sessions, login throttling, streamed-body limits, upload MIME/signature/size validation, reservation ownership, duplicate payment prevention and read-only integration policy.

One date-picker check initially timed out during the concurrent cold-page run. It passed independently; the test now waits for hydration before clicking. A focused checkout test then exposed the real country-label hydration error described above, which was fixed and retested.

## Scope and remaining limits

Testing used a separate local production mock instance, disposable local manager data and an HTTPS test proxy. No live hotel data was saved or published, no real reservation was created and no payment was submitted. The payment-widget check simulates only the displayed test receipt; it is not proof of provider settlement.

These results apply to this local source/build, not the deployed Hostinger environment. A deployed integration test, real provider UAT settlement, live HMS write verification, full accessibility/cross-browser testing and independent penetration testing remain unverified. The current HMS integration policy intentionally blocks writes.

General API abuse limiting and draft-preview storage are process-local. Multiple replicas require coordinated storage/rate limiting. Existing CSP headers protect framing, object embedding, base URLs and form destinations; they do not provide a strict script-src policy. HTTPS termination, HSTS, secret rotation, filesystem permissions, backups and deployment configuration must also be verified in the hosting environment. A zero-result dependency audit does not guarantee absence of vulnerabilities.

The development server was restarted on port 3000 with the patched dependencies.

## Evidence

Local ignored browser results/screenshots are under artifacts/project-audit/ and the individual artifacts folders. Tests are under tests/, including phone-input.browser.mjs and guest-validation.test.mjs. The local HTTPS smoke fixture is tmp/security-isolated-2026-11-06.cjs; it uses disposable test credentials only.

Advisories consulted: [Next.js image optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [minimatch glob amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).
