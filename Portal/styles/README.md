# Website Manager styles

`../website-manager.css` is the only import used by React components. Its import order is intentional:

1. `tokens.css`: shared PatelHMS palette, surfaces and corner sizes.
2. `editor.css`: global editor primitives and the embeddable manager's shell, cards, buttons, fields, uploads, navigation and dialogs.
3. `studio.css`: Website Studio presentation, brand controls, setup journey and live preview.
4. `responsive.css`: shared Studio header layout, mobile action bar, safe areas, input sizing, tabs and preview dialog controls.
5. `logo-identity.css`: the reference layout using shared HMS navy, cream and peach tokens, separate logo and favicon cards, browser preview and responsive container layouts.
6. `setup-reference.css`: the address card, actionable color notification and setup tracker, using shared HMS theme tokens and mobile breakpoints.
7. `guest-preview.css`: the guest preview header, segmented device tabs, monitor frame, stand, size label and footer. The live iframe retains each device's actual viewport dimensions.
8. `brand-colors.css`: the palette generator, copyable current swatches, suggested palettes and custom color cards with picker/HEX controls and individual Copy/Reset actions. Container queries adapt the layout to the editor width while preserving the preview column.
9. `typography-experience.css`: font selection cards, image-based style cards and experience controls. Animation and smooth scrolling are independent settings.
10. `homepage.css`: the shared section header card with icon, Help and Undo, plus homepage welcome/banner fields, slider uploader, photo library and reorderable section rows. Every editor section uses the same responsive header styling.
11. `contact.css`: website URL, enquiry inbox, inline social profile rows and contact page settings, with responsive fields and a dedicated contact preview action.
12. `spacing.css`: shared page/card padding and section gaps. Desktop uses 24px; mobile uses 16px. Card headings and bodies share the same horizontal inset, and grid gaps own the space between cards rather than additional card margins.
13. `sidebar.css`: navy HMS navigation, hotel identity card, grouped links, peach active state, desktop collapse rail and mobile drawer styling.
14. `setup-strip.css`: header-level six-step tracker and completion summary above the website address, adapting to three columns on phones.
15. `header-actions.css`: saved status, action buttons, live website switch with publishing menu and separated account action; mobile actions retain the bottom toolbar.

Styles are shared across every manager section. Reuse `wm-card`, `wm-card-heading`, `wm-card-body`, `wm-field`, `wm-button` and `wm-icon-button` rather than styling individual pages. Keep public hotel website styles outside this directory.

Use the `--wm-*` tokens for theme colors and standard surfaces. Component-specific dimensions and states stay with the component styles. Studio-specific changes use `.wm-studio-dashboard`; the portable editor continues using the base styles.

Responsive rules remain in cascade order. Repeated selectors at different breakpoints, or rules that compose with grouped selectors, are intentional. Do not move them together without checking desktop, tablet and mobile layouts. Edit an existing declaration rather than appending another theme patch.

Logo & favicon uses three separate bordered cards beside the desktop preview column. The cards adapt to the available editor width. The public website preview renders separate real website routes and does not inherit editor CSS.
