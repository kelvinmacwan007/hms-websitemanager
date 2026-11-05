# Booking flow and integration boundaries

The public flow uses five steps: Rooms (`/booking/cart`), Extras (`/booking/extras`), Guest details (`/booking/checkout`), Payment (`/booking/payment`), and Confirmation (`/booking/confirmation`). The existing room card design is shared with search results and remains unchanged.

Stay dates, party, room/rate IDs, quantities and selected services travel in the booking query. Previous completed steps are navigable; future steps are labels. The server resolves current room rates and catalog items again rather than trusting browser totals. Guest details are submitted through the existing checkout adapter; card details must never enter booking URLs or local storage.

HMS catalog services retain their server names, prices and availability dates. They are requests, not verified extra charges: the reservation adapter includes known selected service names and quantities in reservation notes, subject to hotel confirmation. A chargeable HMS extras contract is still needed before services can be added as payable reservation line items. Demo extras remain demo-only.

`HMS_READ_ONLY` remains enabled. Reservation and payment writes are blocked by the existing API guard. The stepper does not enable writes or bypass opaque reservation cookies, attempt tokens, idempotency locks, occupancy checks or server status verification.

P98Pay is currently a development/UAT hosted widget. Live enablement requires property-specific merchant configuration, a server-created payment reference bound to the reservation/amount/currency, authenticated settlement verification, and idempotent recording/reconciliation in HMS. See [P98Pay checkout](p98pay-checkout.md). Browser callbacks alone never confirm a reservation. The live confirmation step is completed only when server status reports `paid` with zero balance. No invoice or payment method is invented.

## Verification

`npm test`, isolated source TypeScript checking, and ESLint cover the source changes. `node tests/booking-flow.browser.mjs` uses the mock hotel on `QA_URL` (default port 3001); it checks cart handoff, extras, guest details, payment navigation, confirmation guards and responsive widths. It does not submit a real payment.
