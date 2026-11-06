# Tests

## Automated checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs the `*.test.mjs` files with Node's test runner. These cover tenant routing, booking validation, read-only policy, HMS adapters, presentation ownership, publishing, themes and demo behavior. They do not create real reservations or payments.

## Browser checks

The `*.browser.mjs` scripts verify routes, responsive behavior, motion, booking demos and publishing. Start the appropriate development server before running them.

The current scripts use Playwright installed in the external `%TEMP%/hotel-homepage-qa` test environment and Microsoft Edge (`msedge`). They are optional verification tooling, not runtime dependencies. Most scripts accept `QA_URL` to target a local test server; inspect each script for its provider mode and other environment settings.

```bash
node tests/responsive.browser.mjs
node tests/website.browser.mjs
node tests/manager-responsive.browser.mjs
node tests/header-templates.browser.mjs
node tests/room-cards.browser.mjs
node tests/guest-picker.browser.mjs
node tests/booking-pickers.browser.mjs
node tests/website-controls.browser.mjs
node tests/booking-results.browser.mjs
node tests/site-layout.browser.mjs
```

Publishing/browser tests may save local presentation or interact with demo booking flows. Use a separate mock instance for those checks and review the script before running it against a hotel workspace. Do not run automated publishing tests against production.

Reports and screenshots are generated under ignored `artifacts` folders. Previous ad hoc QA output was archived outside the project during cleanup.

`site-layout.browser.mjs` checks portrait room cards on the homepage, the two-column
rooms grid, phone filters, and typography and overflow across public pages. It
does not save changes or create bookings.

`guest-picker.browser.mjs` checks the guest dropdown's counters, disabled limits,
keyboard dismissal, responsive bounds, and preservation of the party through
search, room details, cart and checkout. It does not submit reservations or payments.

`booking-pickers.browser.mjs` checks the themed date, guest and room selectors at
six viewport widths. It verifies two-month desktop and single-month mobile
calendars, disabled dates, two-click date ranges, checkout-only edits, cancellation,
room-reservation dates, separate guest/room counts, Escape dismissal, focus restoration and overflow.
Target a mock hotel host with `QA_URL`; it changes browser state only.

`website-controls.browser.mjs` verifies standard control heights and typography on
the homepage, Rooms, Contact and Booking at desktop/mobile widths, plus hover,
press, disabled, reduced-motion and motion-off states.

`booking-results.browser.mjs` checks the shared search-result cards at six widths,
including omitted amenities, preserved stay links, rate switching without losing
cart selections, quantity controls, galleries and cart handoff. It uses mock
availability and does not submit a reservation. It also checks the matching cart
room cards at five widths, including gallery access and removal to the empty state.

`manager-responsive.browser.mjs` signs into the local HMS manager using the first
connection in `.env.local`. It checks all 13 editor sections, expanded fields,
appearance tabs, unsaved actions and preview controls at 11 widths from 320px to
1920px, plus two phone landscape sizes. It checks horizontal overflow, clipped
controls, overlapping header actions and sidebar scrolling, and captures screenshots
under `artifacts/manager-responsive`. Edits stay in the browser; it does not save
or publish website changes. It signs out when the checks finish.

`booking-flow.browser.mjs` checks the five-step flow, preserves selected extras through guest checkout, verifies payment and confirmation guards, and checks responsive layouts at five widths. It uses mock hotel data on QA_URL (default port 3001) and never submits a payment. `booking-steps.test.mjs` checks step links preserve booking parameters. See docs/booking-flow-integration.md for HMS and P98Pay boundaries.

`phone-input.browser.mjs` checks the default US calling code, 10-digit US cap,
all 245 local flag assets, country search and wheel scrolling, UK/India masks,
international paste, validation, mobile bounds and hydration errors. Use an
isolated mock production server through `QA_URL`; it does not submit a booking.
