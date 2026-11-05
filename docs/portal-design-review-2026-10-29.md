# Portal design review — 29 October 2026

Reviewed the authenticated local portal without saving or publishing hotel changes.

## Changes

- Fixed mobile readiness banners: messages have their own flexible column and actions move below the message.
- Fixed setup headings on phones so status badges and sync actions cannot squeeze the title or description.
- Gave editing forms more width beside the guest preview on desktop.
- Standardized card title alignment, disabled controls, keyboard focus, menu form text, and side-panel spacing and colors through the shared design system.
- Corrected the Amenities settings heading to match the navigation.
- Preserved the requested dashboard colors, static HMS amenity cards, disconnected Analytics state, and connection-details popup.
- Removed unused Analytics placeholder styles and documented the shared layout rules in `Portal/DESIGN_SYSTEM.md`.

## Verification

- Authenticated browser review of all 14 sections at 320, 390, 768, 1024, and 1440 pixels: no horizontal overflow, escaped controls, or JavaScript page errors.
- Inspected desktop and mobile screenshots, plus Appearance tabs, the banner side panel, loaded HMS amenities, and the connection popup at 320 pixels.
- Checked popup open/close and Escape dismissal from both entry points, homepage shortcut, toggle text versus switch click behavior, banner editor dismissal, and static amenity cards. Five actual HMS amenities loaded.
- All 142 automated tests passed.
- Portal ESLint and formatting checks passed.
- TypeScript checking of the source passed using an isolated configuration that excludes generated output.

## Remaining external limitations

The normal project typecheck encounters syntax errors in existing generated `.next/dev/types/routes.d.ts` and `validator.ts`; source checking does not validate these generated files. These files were not edited during the design review.

HMS rates remain unavailable for the reviewed property, so publishing correctly remains blocked. Analytics integration remains unavailable and its Connect button stays disabled. Amenity labels and available icons remain owned by HMS; missing icons use the existing fallback.

Browser reports and screenshots are available locally in `artifacts/portal-design-review/`.
