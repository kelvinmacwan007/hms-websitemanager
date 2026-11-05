# P98Pay UAT checkout

In development, demo checkout uses the provided P98Pay UAT widget on
`/booking/payment`. Select a stay, review guest details, then continue to payment.
The standalone widget preview uses the same component and theme.

Guest review and UAT payment now share the checkout stepper. Continuing to payment
rechecks the selected stay on the server, then mounts the provider widget inside
the current page. Returning to guest details preserves the entered fields. A
changed total is shown before payment; unavailable inventory stops progression.
The direct `/booking/payment` route remains available for existing links.

All booking routes share the website shell and one persistent progress indicator.
Route loading is confined to the step content container, with the current title
and summary heading still visible. The header/footer and stepper do not remount
when changing steps. Booking links reset the scroll immediately so the stepper
remains in view while content loads. Page-level progress components register
their state with the layout, including inline payment and UAT confirmation.

Hotel context reads are deduplicated within a server render only; inventory and
payment totals are not cached across users or requests. The widget has bounded
loading feedback, removes its mount when leaving the payment step, and its
callback never marks a booking paid. The script is preloaded during guest review.
The provider's own responsive form remains inside the Payment step; its mobile
Next control is part of the hosted payment form.

An explicit success/authorization callback or the current SDK's rendered UAT
receipt advances to `/booking/confirmation` and step 5. The current script does
not expose the documented completion callback consistently, so the receipt
fallback is restricted to its own widget shadow root. Only a minimal, tab-scoped
test record (amount, USD currency and timestamp) is stored for 30 minutes; no
provider response, card fields or guest information is copied into that record.
The confirmation identifies the result as browser-reported and unverified, and
does not claim an HMS reservation exists. Failed or unknown callbacks do not
advance, and a confirmation URL alone cannot display a completed test result.

## Live room data with test payments

For local or hosted staging testing, set `WEBSITE_ENV=live` and
`WEBSITE_DEMO_PAYMENTS=true`. Keep `NODE_ENV=production` on Hostinger: it controls
the Next.js runtime, not whether the HMS service is staging. Here `live` selects
the API provider rather than mock data; `PATEL_HMS_API_URL` selects the actual
upstream environment. The supplied `https://dev-aiapi.patelhms.com` is staging.
Configure these values in `.env.local` locally or Hostinger environment settings,
then rebuild/redeploy. Configure the HMS tenant or open the connected hotel's Website
Studio preview. Search dates, select rooms, continue through extras and guest
details, then choose **Continue to payment** in the same browser tab.

The payment page resolves the selected stay against current HMS rates. The UAT
widget receives the room subtotal (nightly rate × nights × room quantity) plus
selected extras and add-ons. It does not use the standalone preview's fixed
USD 15.55 amount. The current test merchant requires the stay currency to be USD;
the integration does not convert or relabel other currencies. No HMS reservation
is created or marked as paid by a test payment.

- Widget script is loaded directly from the provider over HTTPS.
- Guest first name, last name and email are transferred within the browser tab,
  scoped to the hotel and stay selection, and expire after 30 minutes.
- Amount comes from the server-resolved stay selection and is read-only in the widget.
- The supplied test merchant is configured for USD; other currencies are blocked.
- Card details are entered in the provider widget. The application does not collect,
  log or store card fields or widget response payloads.
- Browser callbacks never set an HMS reservation to paid or confirmed.
- The UAT merchant is disabled on hosted builds unless `WEBSITE_DEMO_PAYMENTS=true`.
  This explicit staging opt-in never enables HMS reservation or payment writes.
  Remove it before using the deployment for actual guest bookings.

## Before enabling live payments

The supplied Website Integration API document describes raw-card payment submission
and reservation/payment balance reads. It does not document how a widget transaction
is linked to an HMS reservation, nor a P98Pay server verification endpoint or signed
webhook contract. The widget guide describes browser events, which are insufficient
for independent verification.

Live checkout needs a production merchant configuration per hotel, a server-created
payment reference bound to the reservation and amount/currency, verified transaction
results, idempotency and reconciliation with HMS. Do not submit the same payment
through the raw-card endpoint after the hosted widget has charged it.

## UAT merchant portal inspection (2026-10-28)

Read-only inspection confirmed active authorization and failure JSON POST webhooks
to the existing Patel HMS payment-link callback. Those entries use No Auth.
The authentication selector also offers API Key, Bearer Token and Basic Auth.
No portal settings were saved or changed.

The portal's Show DTO screen lists MerchantId, TransactionId, TransactionStatus,
ProcessorAuthCode, AvsVerificationCode, CvvVerificationCode and ResultMessage.
It does not display amount, currency, a booking reference or a signature field.
Its status enumeration distinguishes Authorized (2) from Success (16), alongside
Created (0), Failed (5), Cancelled (8), Hold (13) and Denied (14).
This is a field schema, not a delivery log or evidence of a successful payment.

Before automatic booking confirmation, obtain the provider's server-side lookup
contract and a supported booking/reference linkage, plus the HMS contract for
recording an externally processed payment. Do not infer payment verification from
the existing No Auth webhook or equate authorization with settled payment.

## Automated checks

`npm test` covers options, invalid amounts, production gating and transient guest
storage. With a mock development server on port 3001, run:

```powershell
node tests/p98pay-checkout.browser.mjs
```

This checks guest-review navigation, widget loading, name/email prefill, the locked
test amount, HMS button colors and mobile overflow. It never submits a payment.
