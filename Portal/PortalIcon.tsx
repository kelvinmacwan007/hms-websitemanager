import type { ReactNode } from "react";

/** Shared decorative icon tile for portal card headings. */
export function PortalIcon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`wm-heading-icon ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}
