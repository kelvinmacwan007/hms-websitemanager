# Architecture and maintenance

## Data flow

```text
Request hostname
  -> tenant resolver
  -> mock or HMS provider
  -> operational hotel / rooms / dated availability
  -> saved website presentation
  -> public route and template
```

`src/lib/tenant` validates hotel hostnames. `src/lib/api/provider.ts` selects the provider and applies website presentation. Hostname resolution selects the property; it does not authenticate a portal user.

HMS adapters in `src/services/patelHms` own authentication and operational reads. Catalogue rooms provide descriptions, images and facilities. Dated availability provides prices and inventory. Keep credentials, tokens and property configuration on the server.

## Website Studio

`src/app/website-manager/page.tsx` loads the selected hotel's operational data, saved presentation and live rate readiness. `Portal/ConnectedWebsiteManager.tsx` provides persistence callbacks. `Portal/WebsiteManager.tsx` owns draft state, navigation, save/discard and preview controls.

`Portal/editor-sections.tsx` maps each section to its page settings. `Portal/editor-fields.tsx` provides shared cards, fields, switches, uploads and editor context. Brand controls are split into identity, colors, typography and appearance components.

`Portal/content.ts` validates editor documents and builds presentation-only payloads. `src/lib/website` validates ownership, applies presentation and handles persistence. Preserve HMS IDs and operational fields when changing editor features.

`Portal/ActualWebsitePreview.tsx` renders real public routes inside an iframe. Temporary preview documents stay separate from saved presentation. `src/components/layout/WebsitePreviewBridge.tsx` applies immediate theme changes and preserves preview navigation.

## Where to make changes

| Change                       | Location                                                 |
| ---------------------------- | -------------------------------------------------------- |
| Public homepage              | `src/templates/default/HomeTemplate.tsx`                 |
| Public page content          | `src/app/<page>/page.tsx`                                |
| Header and footer            | `src/components/navigation`, `src/components/layout`     |
| Website theme and appearance | `src/lib/branding`, `src/app/globals.css`                |
| Editor sections and fields   | `Portal/editor-sections.tsx`, `Portal/editor-fields.tsx` |
| Editor styles                | `Portal/styles` via `Portal/website-manager.css`         |
| HMS endpoint adapters        | `src/services/patelHms/websiteIntegration.ts`            |
| Room/rate mapping            | `src/services/patelHms/roomMapping.ts`                   |
| Booking validation and state | `src/lib/booking`                                        |
| Local website persistence    | `src/lib/website/persistence.ts`                         |

## Local files

`.env.local` holds secrets; `config/*.local.json` can hold property snapshots. `.data` contains saved website content and durable booking-attempt state. These are ignored, private runtime data and must not be removed during source cleanup.

`node_modules`, `.next` and `*.tsbuildinfo` are generated. They can be recreated by installation/build tools. Do not remove a running development server's `.next` directory. Browser scripts write reports under ignored `artifacts` directories as needed.

## Integration boundaries

Website Studio is enabled on the configured manager host with separate signed login sessions. HMS login sessions are scoped to a configured property verified against the returned work profiles. Suggested/editable subdomains stay private until Publish website; draft saves do not alter live presentation. `WEBSITE_DATA_DIR` enables durable production storage; direct public hotel domains cannot authorize editing. See [Hostinger deployment](deployment-hostinger.md). Booking/payment adapter contracts remain in place and tested, even when read-only testing disables the live write flow. Mock providers and mock media are intentional fixtures, not unused production data.
