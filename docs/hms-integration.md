# Documented Patel HMS connection

**Current testing mode is read-only.** Reservation creation, payment submissions,
and other POST actions at `/api/booking/hms` are blocked before parsing input or
contacting HMS. The service adapters also reject reservation/payment writes.
The UI shows availability and forecasts without guest submission or card forms.
Login, room availability and forecasts still use POST because the documented API
requires that method for those authentication/data-read operations. GET lookups
remain available. API credentials are still required to retrieve actual HMS data.
The write-flow sections below describe retained implementation, currently disabled.

Default API origin: `https://dev-aiapi.patelhms.com`. Availability and booking now
use the supplied API outline without provisional `/api/v1/website/*` calls.
Mock mode remains available and never calls HMS.

Room photos use HMS `roomTypeImagesPath`. Relative paths are resolved against the
configured API origin; absolute HTTPS image URLs are preserved. API room photos
also populate the hotel's gallery and hero images, with duplicate URLs removed.
Missing photos are left empty rather than replaced with demo images.

## Configure a hotel

### Login-driven Website Studio

With `WEBSITE_MANAGER_AUTH=hms`, sign in using the HMS username, password and
customer code. Studio discovers properties from the authenticated account's
`currentWorkProfile` and `workProfiles`; hotels no longer need credentials added
to `PATEL_HMS_TENANTS_JSON` before signing in. Accounts with multiple properties
choose their hotel before entering Studio. Each property has separate drafts,
published content and website routing.

Studio fetches HMS data with the signed-in account's credentials. Connections
are encrypted with AES-256-GCM under `WEBSITE_DATA_DIR/hms-connections`, using a
key derived from `WEBSITE_MANAGER_SESSION_SECRET`. Session-specific connections
keep concurrent manager logins independent. The public website uses the latest
successful login connection for its property, allowing HMS reads after logout.
Keep the storage directory and session secret durable and private; changing the
secret requires reconnecting hotels. Passwords never enter manager cookies or
browser responses.

Authenticated HMS property membership grants Studio access by default. Optional
`WEBSITE_MANAGER_EDITORS_JSON` entries restrict access to listed usernames for
that tenant; an empty list denies all editors. Existing configured properties
retain their tenant IDs. Newly discovered properties receive stable IDs derived
from customer code and property ID. HMS must return the hotel name and IANA
timezone to load the manager.

Existing tenant settings supply currency, rate package and stay times. New hotels
use `PATEL_HMS_DEFAULT_CURRENCY` (default `INR`),
`PATEL_HMS_DEFAULT_CHECK_IN` (default `15:00`) and
`PATEL_HMS_DEFAULT_CHECK_OUT` (default `12:00`). Configure these to match HMS.
During development, `http://localhost:3000` opens the manager login flow;
production uses `WEBSITE_MANAGER_HOST`.

### Static hotel connections

Ask the HMS administrator for the API `userIdentity`, `password`, `customerCode`,
`propertyId`, property currency, timezone, and check-in/out times. A base URL alone
cannot authenticate or select a property. The configured local property has been verified for login, six room types,
room photos and dated rate/availability responses.
Reservation and payment writes remain disabled and have not been tested live.

Create `.env.local` (ignored by Git), using actual values:

```dotenv
WEBSITE_ENV=live
PATEL_HMS_API_URL=https://dev-aiapi.patelhms.com
PATEL_HMS_TENANTS_JSON={"hotel-a":{"userIdentity":"REPLACE","password":"REPLACE","customerCode":"REPLACE","propertyId":"REPLACE","currency":"INR","checkInTime":"15:00","checkOutTime":"12:00"}}
PATEL_HMS_PROPERTIES_FILE=config/hms-properties.local.json
PATEL_HMS_BOOKING_STORE=.data/hms-bookings
PATEL_HMS_LOCAL_TENANT_ID=hotel-a
PATEL_HMS_ROOT_DOMAIN=patelhms.com
```

`PATEL_HMS_PROPERTIES_FILE` is optional: omit it to use the property name, address,
logo and timezone returned by login. Both `currentWorkProfile` and `workProfiles`
are supported, selecting only the configured property ID. To supply additional
presentation, copy `config/hms-properties.example.json` to the local snapshot path
and replace its property ID with the same ID in the connection map. The tenant key `hotel-a` resolves from
`hotel-a.patelhms.com`. `PATEL_HMS_LOCAL_TENANT_ID` allows localhost during development
only. Restart the dev server after changing environment values. Keep real snapshots
and connection credentials private. Per-tenant `baseUrl` can override the default.

The login profile supplies property identity and location. The live Swagger exposes
`POST /api/v1/RoomManagement/room-types`, which supplies the room catalogue, descriptions,
bed types, amenities and `roomTypeImages[].imageNamePath`. This is a data read even
though its HTTP method is POST. Catalogue rooms stay visible with unknown availability
and no price until a dated rate/availability response is available. HMS always supplies
operational room data. Optional snapshot room presentation may use the same
HMS room IDs. Only the documented standard rate is selectable (`hms-standard`), since
the outline has no rate-plan selection field on reservation creation.

Configure `propertyPackageId` in the tenant connection to select the hotel's
rate package for dated availability. The website uses `averageRate` for the
requested stay, including weekend pricing. Keep `currency` consistent with HMS;
the room response does not supply a currency code. Website Studio checks dated
HMS rates separately from the price-free catalogue; a failed rate check does not
prevent access to the editor.

## Connected operations

| HMS endpoint                                                            | Website use                                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `POST /api/v1/Account/login`                                            | Server-only bearer token, shared concurrent login and expiry handling |
| `POST /api/v1/FrontDesk/getall/reservation-room-types`                  | Rooms, search, cart and final availability revalidation               |
| `POST /api/v1/FrontDesk/get/rate-forecast`                              | Daily-rate forecast in checkout                                       |
| `GET /api/v1/Base/dropdown/country`                                     | Guest country selector                                                |
| `GET /api/v1/Base/dropdown/state/{countryId}`                           | Dependent state selector                                              |
| `GET /api/v1/Base/dropdown/city/{stateId}`                              | Dependent city selector                                               |
| `GET /api/v1/Base/autocomplete/location-by-zipcode/{zipcode}`           | Guest ZIP lookup                                                      |
| `GET /api/v1/Base/autocomplete/guest-firstname/{query}`                 | Server-only `findGuests("firstName", query)`                          |
| `GET /api/v1/Base/autocomplete/guest-lastname/{query}`                  | Server-only `findGuests("lastName", query)`                           |
| `GET /api/v1/Base/autocomplete/guest-mobile/{query}`                    | Server-only `findGuests("mobile", query)`                             |
| `POST /api/v1/FrontDesk/iu/reservation`                                 | Indexed multipart reservation creation                                |
| `POST /api/v1/Payment/card-payment`                                     | Server proxy for the documented direct card payment                   |
| `GET /api/v1/FrontDesk/get/reservation-details/{reservationId}`         | Property/stay verification, payable balance and reservation status    |
| `GET /api/v1/FrontDesk/get/reservation-payment-details/{reservationId}` | Final total and payment verification                                  |

Public reads and writes use `/api/booking/hms`. The three existing-guest searches
remain server-only because they return other guests' personal information. An
authenticated hotel portal may call those methods within its own authorization.

## Booking behavior and limits

The live flow is search → cart → guest checkout → create reservation → review the
HMS total and balance → card payment → reservation status. Each room gets a lead
adult guest and explicit adult/child allocation. Search, room details and cart
retain adults, children and pet requests. Pets do not count toward human occupancy. Every room
requires an adult, and the server verifies the adult, child and requested-pet totals.
The party summary is recorded in the documented `ReservationNotes` field; pet counts
are recorded in per-room `SpecialRequest` fields. Unknown pet policies remain
requests requiring hotel confirmation and do not set `IsPetAllowed` to true.
Child age boundaries and numeric HMS pet-policy mapping are deliberately deferred
until the hotel's policy is configured. No age cutoff or extra-guest/pet charge
is invented by the picker. Extras, promotions, deposits and alternative rate plans
are not offered by this adapter. The site
charges only the reviewed full HMS balance and rejects a changed amount. Forecast
data is informational (the API documents 14 days), never an authoritative charge.

The outline uses reservation response code `2` for both success and failure. The
adapter requires an ID, then checks its property, dates, room types and guest counts.
Unknown numeric reservation statuses are not described as confirmed. Payment is
marked paid only after HMS returns success and the reservation balance is zero.

Random booking access tokens bind reservations to an HttpOnly, SameSite cookie.
The client retains only the random attempt token in session storage. Persistent
session records contain tenant/property references, an input fingerprint and
operation state. Card values and guest details are not stored or logged by this
integration. Card data travels through the application server to the documented
endpoint; this is a direct-card flow, not hosted payment.

Write intent is persisted before contacting HMS and locked per attempt. Writes are
never automatically replayed after an uncertain result. On a timeout, partial
failure or payment awaiting reconciliation, the guest is directed to the hotel and
another write for that attempt is blocked. Keep the booking directory durable and
shared across application instances, with atomic directory creation/rename.
An interrupted worker may leave a lock requiring administrator investigation.
Different browser attempts can still create different reservations: the outline
has no backend idempotency key, inventory hold, cancellation or refund endpoints.
Production needs backend inventory enforcement and an operational recovery process.
Old session records require a retention policy; deleting them also removes
duplicate-attempt protection.

Confirm direct-card processing with the HMS/payment operator and the deployment's
payment compliance requirements before production use. The outline does not
document hosted checkout, webhooks, a pre-booking tax quote or reservation status
enum. These capabilities have not been invented. Live testing needs test credentials.
