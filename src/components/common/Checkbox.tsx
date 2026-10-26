"use client";

import type { InputHTMLAttributes } from "react";

/** Keep inside a label, or supply aria-label/aria-labelledby. */
export function Checkbox({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span className={`relative inline-block h-6 w-6 shrink-0 align-middle ${className}`}>
      <input
        {...props}
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed forced-colors:appearance-auto forced-colors:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded border-2 border-brand bg-transparent text-[var(--color-on-accent)] transition duration-200 peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--color-accent)] peer-disabled:opacity-50 motion-reduce:transition-none forced-colors:hidden [&_svg]:scale-0 peer-checked:[&_svg]:scale-100"
      >
        <svg
          className="h-4 w-4 fill-none stroke-current stroke-2 transition-transform duration-200 motion-reduce:transition-none"
          viewBox="0 0 12 10"
          focusable="false"
        >
          <polyline points="1.5 6 4.5 9 10.5 1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}
