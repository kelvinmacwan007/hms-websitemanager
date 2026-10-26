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

`manager-responsive.browser.mjs` signs into the local HMS manager using the first
connection in `.env.local`. It checks all 13 editor sections, expanded fields,
appearance tabs, unsaved actions and preview controls at 11 widths from 320px to
1920px, plus two phone landscape sizes. It checks horizontal overflow, clipped
controls, overlapping header actions and sidebar scrolling, and captures screenshots
under `artifacts/manager-responsive`. Edits stay in the browser; it does not save
or publish website changes. It signs out when the checks finish.
