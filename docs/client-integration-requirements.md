# PatelHMS Website and Booking Engine Requirements

PatelHMS will provide every registered hotel with its own website and booking engine using one shared template. Each website will get its information from PatelHMS, and website reservations will be saved back into the correct hotel's PMS account.

This document lists the information needed from the PatelHMS product and development teams to complete that connection.

## 1. How the platform should work

Hotel Sunrise and Hotel Seaview, for example, will use the same design, but each will display its own name, logo, photos, rooms, prices and policies.

When a guest opens a website, the system should identify the hotel from its website address, load that hotel's published information, check availability and prices, process the booking and return a verified reservation reference.

The template should be maintained in one place. Adding a hotel should require setup in PatelHMS, without copying the website code or building another design.

## 2. Identifying and activating hotels

Each hotel website will open on its own PatelHMS subdomain, such as `hotel1.patelhms.com` or `hotel2.patelhms.com`. All of these addresses will use the same website application and template.

Please provide or confirm:

- The unique property ID for each hotel and its customer/account ID, if separate.
- How PatelHMS links each unique subdomain, such as `hotel1`, to the correct property ID.
- Where this subdomain is assigned and stored when a hotel is set up, and how duplicate names are prevented.
- How a registered hotel activates, publishes or disables its website.
- How the system checks whether the hotel is allowed to use the website service.
- Who manages DNS routing and HTTPS coverage for the hotel subdomains under `patelhms.com`.

For example, opening `hotel1.patelhms.com` should load the property linked to `hotel1`. Its content, availability, bookings and payment settings must all belong to that property. The subdomain does not have to be the same as the internal PMS property ID; PatelHMS needs to provide the link between them.

An unknown or inactive domain must not display another hotel. The server must check property access so changing a hotel ID in a request cannot expose another hotel's bookings or guest information.

## 3. Information supplied by PatelHMS

Please confirm which fields already exist and how the website can read them through an API. An API is the connection used to exchange information between the website and the PMS.

| Information        | Details needed for each hotel                                                   |
| ------------------ | ------------------------------------------------------------------------------- |
| Hotel profile      | Name, descriptions, address, map location, phone, email and social links        |
| Branding           | Logo, website icon and any permitted colour choices                             |
| Photos             | Main banner, gallery and images linked to the correct room types                |
| Rooms              | IDs, names, descriptions, beds, size, facilities and occupancy limits           |
| Rates and packages | IDs, meal plans, cancellation terms and links to room types                     |
| Website content    | Amenities, dining, offers, FAQs and other supported sections                    |
| Extras             | Services, prices and whether charges apply per night, guest or stay             |
| Policies           | Check-in/out, children, pets, cancellations, refunds, privacy and booking terms |
| Settings           | Currency, time zone, page titles/descriptions and sections to display           |

Hotels should manage this information in PatelHMS. If a required field is missing, we need to agree on adding it to the PMS and making it available to the website. Optional sections should be hidden when a hotel has no content for them.

Please confirm how quickly PMS changes should appear on the website and how the website is notified of updates. Only information intended for public display should be included in public website responses.

## 4. Availability and final prices

We need working API examples for:

- Searching available rooms by hotel, dates, adults, children and room count.
- Matching website rooms and packages to their exact PMS room type and rate IDs.
- Getting the final payable amount, including nightly prices, taxes, discounts and extras.
- Checking prices and availability again before payment.
- Applying each hotel's occupancy, child-age, minimum/maximum stay and advance booking rules.
- Holding rooms during checkout, if supported, and releasing expired holds.
- Preventing two guests from booking the last available room at the same time.

PatelHMS should decide the final price and available inventory. The website should not maintain a separate set of room prices or stock.

The supplied forecast covers 14 days, while the current website permits searches for up to 30 nights. Please confirm how we obtain complete prices for longer stays.

## 5. Creating reservations

Please provide a working reservation request and response covering:

- Single-room and multiple-room bookings.
- Required guest fields and how guests are assigned to rooms.
- Selected rates, packages, extras and the final price or quote reference.
- Reservation ID, guest-facing reference and the meaning of each booking status.
- How website bookings are identified in PatelHMS.
- How a booking can be checked after a timeout without creating it twice.
- How guests can securely access only their own confirmation.
- Whether online cancellation is required at launch or hotel staff will handle it.

The supplied outline uses response code `2` for both reservation success and failure. Please clarify the correct responses before reservation creation is connected.

## 6. Payments for each hotel

Please confirm:

- The payment provider and whether PatelHMS already connects to it.
- Whether each hotel uses its own payment account or PatelHMS manages payments centrally, and how funds reach the correct hotel.
- Where each hotel's payment settings are stored and how the website uses them securely.
- Whether full payment, deposits or pay-at-hotel options are supported through PMS settings.
- Whether the reservation is created before or after payment.
- What happens if payment succeeds but booking creation fails, or a held booking is not paid.
- How payments, cancellations and refunds are recorded in PatelHMS.

We need test access, documentation for hosted checkout or secure payment fields, and instructions for verifying payment notifications. These notifications allow the server to verify a payment even if the guest closes the browser.

The supplied direct card-payment endpoint is now connected through the website's server proxy. Credentials and live test access are still required. Confirm the direct-card deployment requirements with the payment operator; hosted checkout and tokenization are not documented by the supplied outline.

## 7. Confirmations and day-to-day operation

Please agree on:

- Whether PatelHMS or the website sends confirmation emails/SMS messages, so guests do not receive duplicates.
- The hotel name, sender address and contact details used in each hotel's messages.
- Where the shared website application will be hosted and who manages it.
- What guests should see when the PMS is unavailable. A booking must not appear confirmed without verification.
- Who receives alerts when a booking or payment needs manual attention.
- The expected number of hotels and simultaneous visitors for the first release.

## 8. What to provide first

1. **Current API documentation**, with example requests and responses. A Postman collection is helpful if available.
2. **Test API address and integration access**, with login instructions, expiry rules and request limits.
3. **Two separate test hotels**, with different photos, room types, rates and policies, so we can check that hotel data stays separate.
4. **Domain-to-hotel lookup details**, including website activation and access rules.
5. **Test booking and payment access**, with permission to create and cancel test reservations.
6. **A PatelHMS technical contact** who can clarify API behaviour and missing fields.

For the current adapter, the connection details include an API base URL, integration username/password, customer code, property ID and currency. Please confirm whether this is the intended platform authentication method or whether PatelHMS provides a different service-access method for all hotels.

Please share passwords and secret keys securely, separately from this document. Production access will be needed before launch.

## 9. Checks before launch

We will verify that:

- Both test hotels use the same template while showing only their own information.
- PMS content changes appear on the correct website.
- Prices, policies and room availability match PatelHMS.
- Single-room and multiple-room bookings reach the correct property.
- Successful, declined and pending payments are handled correctly.
- Repeated requests do not create duplicate bookings or charges.
- Sold-out rooms and changed prices are handled before confirmation.
- Unknown domains, inactive hotels and altered property IDs cannot expose another hotel's data.
- A new hotel can be activated without changing the template code.

The current project contains a shared template, an initial structure for selecting hotels and a demo booking flow. Live hotel lookup, PMS content, reservations and payments still need to be connected and verified. Some existing API paths are provisional and need confirmation against the real PatelHMS API.
