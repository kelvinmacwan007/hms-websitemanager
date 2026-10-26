"use client";

import { websiteClassName } from "@/lib/ui/websiteStyles";

import { ErrorState } from "@/components/common/Status";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <ErrorState
        title="We're having trouble loading hotel information."
        message="Please try again in a moment. A booking is confirmed only when you receive a verified reservation reference."
        action={
          <>
            {error.digest && (
              <p className="mt-4 text-sm" role="status">
                Error reference: {error.digest}
              </p>
            )}
            <button
              type="button"
              className={websiteClassName("brand-button mt-8")}
              onClick={() => retry()}
            >
              <span className={websiteClassName("button-text-container")}>
                <span className={websiteClassName("button-text")}>Try again</span>
              </span>
            </button>
          </>
        }
      />
    </>
  );
}
