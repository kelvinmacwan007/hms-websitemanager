# Booking and payment integration

**Read-only testing is active.** Reservation creation and payments are disabled in
the UI, public API, and service adapter. The flow described below is retained for
future activation, and cannot currently submit a booking or charge a card.

The documented HMS connection is implemented. See [setup and endpoint mapping](hms-integration.md).

In live mode, guest checkout revalidates room availability and sends indexed
multipart fields to `POST /api/v1/FrontDesk/iu/reservation`. A returned ID is
verified against reservation and payment details; response code `2` alone is not
accepted as success because the supplied outline also uses it for failure.

The payment page retrieves the final HMS total and outstanding balance, then
requires guest authorization for that amount. The server checks the balance again
before calling `POST /api/v1/Payment/card-payment`. Browser estimates never become
the charge amount. The payment is marked paid only when HMS reports success and
reservation details report zero balance. Unknown status values are not presented
as confirmed reservations.

The supplied endpoint accepts raw card details. This implementation sends them
through the application server to HMS without saving card data, security codes or
guest details in booking records or logs. It does not use a hosted gateway, signed
webhooks, refunds or tokenization, because the outline provides none of those
contracts. Confirm direct-card processing and deployment payment compliance with
the HMS/payment operator before production use.

A durable shared booking directory provides per-attempt locks and persisted write
intent. Reservation and payment writes are not automatically retried after an
ambiguous result. The hotel must investigate partial failures or stale locks.
Backend inventory enforcement, status enums, cancellation/refunds and production
recovery still need confirmation. Separate browser attempts cannot be deduplicated
by HMS without a documented backend idempotency contract.

`WEBSITE_ENV=mock` keeps the existing demo payment approval/decline/pending previews.
The demo endpoint never charges or creates reservations. The older hosted gateway
and quote/hold interfaces remain unconfigured; the documented live flow does not
use them. No live bookings or payments have been tested without API credentials.
