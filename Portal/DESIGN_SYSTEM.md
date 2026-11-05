# HMS portal styling

Use `styles/tokens.css` for shared sizes, colors, typography, radii, and spacing.
`styles/design-system.css` is the final stylesheet in `website-manager.css` and
defines shared component appearance across editor sections.

- Use `PortalIcon` for decorative header icons: a 46px peach tile with a 24px navy Lucide icon.
- Use `Card` for content cards. Supply its `icon`, `title`, `description`, and `action` props.
- Use `wm-portal-heading` for custom card headers, with an `h2` and optional description.
- Card headings use `--wm-text-heading` (20px); page titles use `--wm-text-page` (26px).
- Body text uses 14px, field labels 13px, and captions 12px tokens.
- All action buttons are 46px high; icon-only buttons and header icon tiles are 46px square. Text buttons share 16px horizontal padding.
- Use `wm-button`, `wm-button-primary`, and `wm-button-small` for actions.
- Card gaps and padding use the shared spacing tokens: 24px desktop, 16px mobile.
- The workspace owns vertical spacing with `gap`; direct page children must not add vertical margins. Keep the readiness banner in the shared workspace on every section.
- Card title containers flex to fill available space. Keep icons beside titles and push actions to the end, rather than separating titles from their icons.
- Disabled shared buttons use the disabled surface/text tokens and remain clearly legible. Keyboard focus uses `--wm-focus-ring`.
- Warning banners use an icon/text/action grid. On phones, the action moves below the text; never squeeze the message beside a fixed-width button.
- Section styles should define layout and specialized controls, without overriding shared header icon or heading sizes.
- Keep these rules scoped to the portal. Guest previews and hotel typography samples retain their own appearance.

Use `showToast(message, type)` from `toast.ts` for action feedback. Supported types are `success`, `warning`, `info`, and `error`. Toasts appear at the bottom right, respect mobile safe areas, and render inside an open dialog when necessary. Keep persistent setup/readiness information in its owning card.

Property connection details open in the shared modal from either the warning banner or dashboard. Amenities are static HMS icon/name cards; do not add accordion content. Analytics remains explicitly disconnected until an integration exists; never show invented visitor totals.
