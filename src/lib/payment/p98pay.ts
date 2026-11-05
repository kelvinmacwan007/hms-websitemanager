export type P98PayConfig = {
  environment: "uat";
  widgetId: string;
  currency: "USD";
};
export type CheckoutGuest = { firstName: string; lastName: string; email: string };
export type P98PayOptions = {
  showSinglePage: boolean;
  hideLogo: boolean;
  hideTitle: boolean;
  hideMerchantName: boolean;
  showBackgroundTransparent: boolean;
  showReceipt: boolean;
  showReciept: boolean;
  fieldsValue: Array<{ name: string; value: string; isReadOnly: boolean }>;
  events: Array<{ onBeforeSubmit?: () => void; onAfterSubmit?: (data: unknown) => void }>;
};

export const P98PAY_UAT_SCRIPT = "https://paymentwidget.uat.p98pay.com/checkoutWidget.js";

export function checkoutWidgetOptions(
  amount: number,
  guest: CheckoutGuest,
  onResponse: (data: unknown) => void,
): P98PayOptions {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("A positive checkout amount is required.");
  return {
    showSinglePage: false,
    hideLogo: true,
    hideTitle: true,
    hideMerchantName: false,
    showBackgroundTransparent: true,
    showReceipt: true,
    // The current UAT script uses this spelling; the supplied guide uses showReceipt.
    showReciept: true,
    fieldsValue: [
      { name: "firstName", value: guest.firstName, isReadOnly: Boolean(guest.firstName) },
      { name: "lastname", value: guest.lastName, isReadOnly: Boolean(guest.lastName) },
      { name: "email", value: guest.email, isReadOnly: Boolean(guest.email) },
      { name: "amount", value: amount.toFixed(2), isReadOnly: true },
    ],
    // A widget response is informational. It never authorizes booking or paid status.
    events: [{ onAfterSubmit: (data) => onResponse(data) }],
  };
}
