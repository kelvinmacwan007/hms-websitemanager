# Website integration handoff

The documented room and booking endpoints are now implemented; see
[HMS configuration and current flow](hms-integration.md). The public provider loads
hotel content from a server-only snapshot and operational rooms from the documented
room-types endpoint. The older quote/hold/hosted-gateway design below describes
additional backend capabilities, not the current direct-card booking flow.

The frontend follows the booking-engine flow PDF. The standalone `/website-manager`
is available locally and on the configured shared manager domain with separate login. With the live HMS connection it loads actual
property metadata, room types, amenities and photos. In live read-only testing,
Save draft applies website-owned content to the local website server. Banner slides
can be selected from API photos or uploaded and reordered; the favicon, social
links, copy, SEO, appearance and other editorial settings are managed here. API
identity, logos, gallery, amenities, room records and rates are excluded from saved
content. No HMS data is written. Production presentation storage can be enabled through `WEBSITE_DATA_DIR`; editing requires a manager session bound to the hotel.
The current HMS Swagger has no website draft/media/publish endpoints.
The shared manager domain uses hashed account credentials and signed sessions. Existing portal embedding callbacks remain supported. See [Hostinger deployment](deployment-hostinger.md).

## Hotel portal integration

Pass a `WebsiteDocument` as `initialContent`: a fresh read-only PMS hotel snapshot,
merged with the hotel's saved presentation draft. Existing version-1 backups remain
supported. Room type IDs and rate IDs must be the actual PMS IDs, consistently used
in context, rooms and availability responses.

`onSaveDraft` and `onPublish` now receive `WebsitePresentationPayload` from
`Portal/content.ts`, **not** the full `WebsiteDocument`. It contains:

- Property/tenant references and the saved setup step.
- Property presentation, photos, branding, pages, homepage sections and policies.
- Room presentation/visibility keyed by `pmsRoomTypeId`.
- Rate visibility keyed by `pmsRoomTypeId` and `pmsRatePlanId`.
- Booking rules, payment policy and promotion definitions.
- Contact form recipient inbox in `content.enquiryEmail` (optional, one email address).

The portal's Contact & location section stores the enquiry recipient separately
from the PMS public contact email. Draft restore/import preserves this setting and
save/publish callbacks include it. An empty value leaves delivery unconfigured.
The backend must validate and persist the recipient per authorized property and
use the published setting server-side when delivering contact requests. Do not
accept a recipient supplied by a public form submission. The current contact form
remains a local preview; saving this setting does not activate email delivery.

It deliberately excludes occupancy, inventory, operational rates, prices, extras
charges and PMS address/contact fields. Local JSON backups include a snapshot for
preview, but importing/restoring them preserves the current PMS operational data.

Callbacks must resolve only after a successful persisted save or publish, and reject
with a useful error on failure. The backend must authorize the property from the
authenticated session, independently of IDs in the payload, validate the payload,
and atomically maintain draft vs published revisions. The browser's publish checks
are usability checks; the backend must enforce them independently.

Pass `connection` with the backend-owned `status` (`OFF`, `SETUP_REQUIRED`, `READY`,
`LIVE`, `DISABLED`), `pmsConnected`, `gatewayConnected` and optional `websiteUrl`.
Publishing requires an enabled property, a verified PMS connection, valid content,
and a booking preview of the current draft. Full/deposit payments additionally
require `gatewayConnected`. Frontend status does not activate/deactivate a property.

Website Studio opens directly in the content editor. The setup wizard and overview
cards have been removed; legacy saved setup-step fields remain supported in backups.
The booking preview is local, runs on the loaded snapshot, and never creates holds,
charges or reservations. Recheck this preview after restoring or changing a draft.

Room types must be supplied automatically from Patel HMS. Website Studio cannot
create or delete room types; it stores presentation and visibility against existing
PMS IDs. Imports cannot introduce custom rooms. Automatic live loading requires the
confirmed Patel HMS endpoint and portal connection described below.

## Public provider response fields

The file-backed hotel snapshot and documented HMS adapter supply these normalized
fields. A future hotel-content endpoint can replace the snapshot:

```ts
timeZone?: string; // IANA zone supplied by PMS, e.g. "Asia/Kolkata"
currency?: string; // ISO currency supplied by PMS
bookingSettings?: {
  minStay: number; maxStay: number; // 1..30 nights
  minAdvanceDays: number; advanceWindow: number; // 0..730 days
  maxRooms: number; // 1..10
  requirePhone: boolean; requireAddress: boolean;
};
paymentSettings?: {
  mode: "pay-at-property" | "full" | "deposit";
  depositPercent: number; // 1..100
};
// HotelRoom and RatePlan:
visible?: boolean;
```

Legacy omitted settings use the existing search limits, UTC, and pay-at-property.
Supply the actual PMS timezone in production. Omitted visibility retains legacy
visibility; the backend must explicitly return `false` for newly imported PMS room
types/rates until the hotel enables them, as required by the PDF.

Return published visibility in the context response. The public provider applies it
to room lists, room details and availability, even when another response has stale
visibility flags. Hidden rates cannot be selected through cart URLs; a room with no
visible rates is hidden. Live availability still comes from PMS, not editor drafts.
The backend must return current PMS restrictions, taxes and final quotes, and must
also enforce room/rate visibility and booking rules on reservation writes.

Promotion definitions include enabled state, code, type, value, date range, applicable
PMS room IDs and paid/free-night counts. Empty applicability means all room types.
Fixed discounts use the property's currency. The frontend configures these settings;
only the backend quote service should compute discounts and stacking rules.

## Backend work still needed for a live booking

1. Authenticated draft/media persistence and atomic publishing; tenant/domain lookup,
   property activation and permissions; merge published content into public reads.
2. Confirmed PMS API adapters for room types, rates, restrictions and live inventory;
   an authoritative final quote and validation immediately before booking/payment.
3. Temporary holds with expiry/release and concurrent inventory protection.
4. Idempotent reservation creation, verified reservation status and secure confirmation
   access; confirmation email ownership.
5. Hosted gateway integration for online payments; signed webhooks, recovery/retries
   and a `NEEDS_ATTENTION` alert when payment succeeds but PMS confirmation fails.
6. Super Admin controls, dashboard data, connection health, sync/activity logs and
   support operations. No operational metrics or connection states are fabricated.

The direct reservation and card-payment writes from the supplied outline are now
implemented separately from the unconfigured quote/hold/hosted gateway interfaces.
Live operation requires credentials, a property snapshot and durable shared booking
storage. See the current-flow guide for supported options and recovery limitations.

## Amenities

Hotel and room amenities support optional `enabled: boolean`. Missing values retain
legacy visibility; explicit `false` hides the amenity from public reads and previews.
Save/publish payloads retain disabled amenities so the hotel can turn them back on.
The editor provides 16 predefined icon choices plus custom names/descriptions/icons.
Merge these presentation settings into normalized hotel/room responses from Patel HMS.
