"use client";
import { P98CheckoutWidget } from "./P98CheckoutWidget";

export function CheckoutWidgetPreview() {
  return (
    <main
      className="container min-h-screen py-12"
      style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif', color: "#1c355e" }}
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Payment widget preview</h1>
        <p className="mb-6 mt-3 text-sm leading-6">
          The same HMS-themed widget is connected to the booking checkout. This standalone page uses
          an amount of USD 15.55.
        </p>
        <P98CheckoutWidget
          config={{ environment: "uat", widgetId: "cnmbiqhj", currency: "USD" }}
          amount={15.55}
          currency="USD"
          guest={{ firstName: "", lastName: "", email: "" }}
        />
      </div>
    </main>
  );
}
