"use client";

export function ConnectionRetry() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[#0d3263]">
        Hotel connection is taking longer than usual
      </h1>
      <p className="text-slate-600">
        HMS did not respond in time. Your saved website settings are safe. Try loading the editor
        again.
      </p>
      <button
        type="button"
        className="rounded-lg bg-[#0d3263] px-6 py-3 font-semibold text-white"
        onClick={() => window.location.reload()}
      >
        Retry connection
      </button>
    </main>
  );
}
