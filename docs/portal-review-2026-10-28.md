# Portal and guest website review — 28 October 2026

Reviewed the connected local HMS portal and separate mock guest website. No hotel
content was saved or published, no payment was submitted, and no reservation was
created during the review.

## Corrections

- Restored the portal navigation opener at tablet widths (761–1100px).
- Kept preview device controls inside narrow 320px layouts.
- Moved the publish-readiness notice above both editor columns so the editor and
  guest preview start together. Dashboard setup remains immediately after its header.
- Missing or expired checkout details now offer a return to guest details, preserving
  the stay selection, rather than opening a blank payment widget.
- Room reservations show an immediate capacity error and prevent continuing with
  more guests than the selected rooms accommodate. Server validation remains in place.
- Capped public banner fallback collections at seven images as well as enforcing
  the existing editor limit.
- Updated browser checks for the current dashboard, hydrated guest selector and
  optional-extra fixtures.

## Verification

- 141 unit tests passed; TypeScript and lint passed.
- All 14 available portal sections plus five appearance tabs checked at 1440,
  1024, 390 and 320px, including banner and item side panels.
- 13 public routes checked at 1440, 768, 390 and 320px: home, rooms, about,
  experiences, dining, menu, offers, gallery, reviews, contact, FAQ, policies and booking.
- No horizontal overflow, escaped controls or client runtime errors in those scans.
- Room type/amenity filters, reset and availability search passed.
- Guest selector checked at eight widths, with adults/children/pets preserved through
  room details, cart and checkout; invalid capacity recovery passed.
- Reservation extras, price changes, cart handoff and removal passed.
- Menu tabs, item creation/editing and mobile item form passed.
- Guest review to payment passed with name/email prefill, locked amount, HMS styling,
  mobile layout and recovery after session details are removed. No card data entered.

Screenshots and machine-readable findings are in `artifacts/portal-review`,
`artifacts/public-review`, `artifacts/payment`, `artifacts/menu` and related test folders.
The repeatable cross-page check is `tests/portal-review.browser.mjs`.

## Outstanding external dependencies

The connected HMS portal reported that rates could not be verified. Publishing stays
disabled until Sync hotel data and Website are complete. The review did not change
that safeguard or the HMS read-only policy.

P98Pay UAT checkout is usable for testing. Automatic paid/confirmed booking status
still needs a documented server verification contract, transaction-to-reservation
linkage and an HMS contract for recording externally processed payments; see
`docs/p98pay-checkout.md`. Production payments and reservation writes were not tested.
