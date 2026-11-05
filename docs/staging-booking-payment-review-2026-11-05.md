# Staging reservation and payment integration review

Reviewed on 5 November 2026 using the supplied `Website Integration API.docx`,
the logged-in Patel HMS development portal and the P98Pay UAT merchant portal.
This was a read-only inspection. No reservation, payment, webhook test or settings
change was submitted. Portal configuration is not evidence that a payment has
been successfully linked to a reservation.

## Confirmed from the document

- Authentication, room availability, a 14-day rate forecast and guest lookup
  endpoints are documented.
- `POST /api/v1/FrontDesk/iu/reservation` accepts indexed multipart room and guest
  fields and returns a reservation ID in its success example.
- Both reservation success and failure examples use `response: 2`; this needs
  clarification. The creation example does not show how to submit the selected
  rate/package, add-ons or a quote reference.
- `POST /api/v1/Payment/card-payment` accepts raw card fields and a reservation ID.
  This is a separate payment path from the hosted P98Pay widget. It must not be
  called to record a payment already processed by the widget.
- Reservation and payment-details GET endpoints provide totals, taxes and
  balances. The document does not describe a widget transaction lookup,
  reservation-reference linkage, authenticated webhook contract or an API for
  recording an already-processed external payment.

## Confirmed in the portals

### Patel HMS development portal

The create-reservation form at `https://dev.patelhms.com/create-reservation`
shows a Best Available Rate selector, six room types, guest fields, corporate
and source selectors, add-ons, taxes and Cash/Card payment choices. For the
form's displayed 5–6 November 2026 stay, Family Twin Room showed USD 189 average
per night. Viewing this form does not establish the integration account's API
write permissions or the required fields accepted by the API.

### P98Pay UAT portal

The logged-in merchant is VitreousTsysTestMerchant, explicitly marked UAT.
Under Integrations/Others → Webhooks Configuration → Transaction, four entries
were displayed as Active, using HTTP POST, JSON and No Auth:

- On Authorization and Failed to
  `https://dev.patelhms.com/api/payment-link-webhook-response`.
- On Authorization and Failed to a temporary ngrok address with the same
  callback path.

The On Authorization field-info schema lists MerchantId, TransactionId,
TransactionStatus, ProcessorAuthCode, AvsVerificationCode, CvvVerificationCode
and ResultMessage. It does not display amount, currency, reservation reference
or signature fields. Authentication in headers or server-side verification may
exist elsewhere; these were not established by the screen.

The displayed transaction statuses are Created=0, Authorized=2, Failed=5,
Cancelled=8, Hold=13, Denied=14 and Success=16. Authorized and Success are
different states; their capture/settlement meanings require the provider's
contract.

Widgets shows an existing Express Payment checkout widget. Its basic-details
summary includes First Name, Last Name, Email and Invoice Number(s); Additional
Fields shows `--`. This does not establish that an invoice field can carry an
HMS reservation reference or that the callback returns it.

## Message to the developers

We have reviewed the Website Integration API document and the staging HMS and
P98Pay UAT portals. Room selection and UAT payment display are connected in the
website. To create a staging HMS reservation and record its verified widget
payment, please provide the following:

1. **The approved end-to-end sequence.** Should the website create an unpaid
   reservation first, then an HMS payment link or P98Pay checkout session? Please
   provide a complete working example from room search to confirmed paid
   reservation, with the exact APIs and sample request/response bodies.
2. **The existing callback integration.** P98Pay already calls
   `/api/payment-link-webhook-response` on dev.patelhms.com. Does that handler
   support standalone checkout-widget payments, or only HMS-generated payment
   links? How is its TransactionId mapped to the correct reservation/property?
   Please provide the API that creates the required link/session/reference.
3. **Trusted payment verification.** Please supply the server-side transaction
   lookup API and credentials/scopes, or the webhook authentication/signature
   specification. We need to verify merchant, reservation reference, amount,
   currency and final status. The portal displays No Auth and its field-info
   schema does not show amount/currency/reference. Please explain any existing
   verification performed by HMS and provide webhook payload/header examples,
   retries, event identifiers and duplicate/out-of-order handling.
4. **Authorization, capture and HMS posting.** What do Authorized=2 and
   Success=16 mean for this merchant? Is capture automatic, and which event
   confirms payment? Does the existing callback update the HMS balance? If not,
   provide the API for recording a verified external payment without charging
   the card again. We will not use `/Payment/card-payment` after widget payment.
5. **Reservation and price contract.** Correct the success/failure `response: 2`
   examples. Provide required versus optional guest fields, status enums,
   single/multi-room examples, rate/package/add-on fields and server-calculated
   final totals including taxes, child/pet charges and rounding. Confirm how the
   website obtains the final payable quote and prevents a changed price or
   concurrent inventory sale before confirmation.
6. **Retries, unpaid inventory and cleanup.** Provide idempotency support or
   lookup by website booking reference after a timeout. Confirm whether unpaid
   reservations hold inventory, their expiry, and the cancellation/release API.
   Define recovery for payment success with booking/posting failure and for
   declines, pending results, refunds and abandoned checkout.
7. **A reproducible staging test case.** Provide an approved test property,
   write-enabled integration account, property/package IDs and matching UAT
   merchant/currency, plus provider-issued test cards for success, decline and
   pending outcomes. Confirm allowed hosted origins and webhook delivery access.
   Explain whether both the HMS and temporary ngrok callbacks should remain
   active. Please supply one redacted example containing the reservation ID,
   transaction ID, verified payment status and resulting HMS balance.

Please share credentials securely, separately from this request. We can first
verify unpaid reservation creation if supported, then verify payment linkage.
Enabling a UAT widget alone does not create or pay an HMS reservation.
