/** Browser-reported UAT results are for demo navigation only, never payment verification. */
export type UatReceipt = { amount: number; currency: "USD"; savedAt: number };

function receiptKey(hotel: string, query: string) {
  const params = new URLSearchParams(query);
  params.delete("uat");
  params.sort();
  return `hms-uat-receipt:${hotel}:${params}`;
}

export function saveUatReceipt(hotel: string, query: string, amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  try {
    sessionStorage.setItem(
      receiptKey(hotel, query),
      JSON.stringify({ amount, currency: "USD", savedAt: Date.now() }),
    );
  } catch {
    /* A missing browser record must not be presented as payment success. */
  }
}

export function readUatReceipt(hotel: string, query: string): UatReceipt | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(receiptKey(hotel, query)) || "null");
    if (
      !value ||
      value.currency !== "USD" ||
      !Number.isFinite(value.amount) ||
      value.amount <= 0 ||
      !Number.isFinite(value.savedAt) ||
      value.savedAt > Date.now() ||
      Date.now() - value.savedAt > 30 * 60_000
    )
      return null;
    return { amount: value.amount, currency: "USD", savedAt: value.savedAt };
  } catch {
    return null;
  }
}

export function isReportedUatSuccess(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  const status = result.transactionStatus ?? result.TransactionStatus;
  if (status !== undefined)
    return (
      status === 2 ||
      status === 16 ||
      (typeof status === "string" && ["authorized", "success"].includes(status.toLowerCase()))
    );
  return result.success === true;
}

/** The current SDK renders this receipt only for its authorized result. No raw payload is read. */
export function hasReportedUatReceipt(root: ParentNode): boolean {
  return Boolean(
    root.querySelector("#widget-printable-content.widget-reciept-content") ||
    root.querySelector(
      'img[alt="success"][src="https://paymentwidget.uat.p98pay.com/images/green-check-mark-icon.jpg"]',
    ),
  );
}
