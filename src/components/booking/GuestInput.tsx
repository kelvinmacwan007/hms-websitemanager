"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { formatGuestValue, guestFieldError } from "@/lib/booking/guestValidation";

export function GuestInput({
  countryCode = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { countryCode?: string }) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [issue, setIssue] = useState({ message: "", country: countryCode });
  const error = issue.country === countryCode ? issue.message : "";
  const setError = (message: string) => setIssue({ message, country: countryCode });
  useEffect(() => {
    ref.current?.setCustomValidity("");
  }, [countryCode]);
  function validate(input: HTMLInputElement, format = false) {
    if (format && input.type !== "number") {
      const value = formatGuestValue(input.name, input.value, countryCode);
      // Controlled fields retain ownership of their value.
      if (props.value === undefined) input.value = value;
    }
    const message = guestFieldError(input.name, input.value, input.required, countryCode);
    input.setCustomValidity(message);
    setError(message);
  }
  return (
    <>
      <input
        ref={ref}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [props["aria-describedby"], error ? `${id}-error` : ""].filter(Boolean).join(" ") ||
          undefined
        }
        onBlur={(event) => {
          validate(event.currentTarget, true);
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          event.currentTarget.setCustomValidity("");
          setError("");
          props.onChange?.(event);
        }}
        onInvalid={(event) => {
          validate(event.currentTarget);
          props.onInvalid?.(event);
        }}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-sm font-normal text-red-700">
          {error}
        </span>
      )}
    </>
  );
}
