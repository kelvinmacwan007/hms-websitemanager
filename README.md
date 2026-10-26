# PatelHMS Hotel Website & Website Studio

A multi-tenant hotel website and visual website manager built with Next.js 16, React 19, TypeScript and Tailwind CSS. Hotel identity, room content, availability and rates are connected to Patel HMS. Website presentation is managed separately.

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env.local`, choose the provider and configure the tenant:

- `WEBSITE_ENV=mock` uses the included demo hotels without calling HMS.
- `WEBSITE_ENV=live` uses HMS. Set `PATEL_HMS_TENANTS_JSON` and `PATEL_HMS_LOCAL_TENANT_ID` for localhost.
- Production defaults to HMS unless mock mode is explicitly selected.

```bash
npm run dev
```

Open [the hotel website](http://localhost:3000) or [Website Studio](http://localhost:3000/website-manager). Keep credentials in server-only environment variables. Never use `NEXT_PUBLIC_*` for secrets.

## Project map

| Folder                  | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `src/app`               | Public pages, Website Studio entry point and API routes                |
| `src/components`        | Public website and booking components                                  |
| `src/templates`         | Hotel homepage template                                                |
| `src/providers`         | HMS and mock implementations of the website data provider              |
| `src/services/patelHms` | Server-only HMS authentication, catalogue and booking adapters         |
| `src/lib`               | Tenant resolution, branding, booking, persistence and shared utilities |
| `src/types`             | Shared hotel and booking contracts                                     |
| `Portal`                | Reusable Website Manager components and editor state                   |
| `Portal/styles`         | Shared manager tokens, editor primitives and Studio presentation       |
| `public`                | Static brand assets and mock hotel images                              |
| `config`                | Example property configuration; local snapshots are ignored            |
| `tests`                 | Unit, integration and browser verification                             |
| `docs`                  | Architecture, integration and payment documentation                    |

See [the architecture guide](docs/project-structure.md) for data flow and change locations.

## Website Studio

Website Studio runs locally and can also be enabled at `websites.kelvinmacwan.com` using the existing PatelHMS login API. Verified work profiles open their connected hotel workspace. Hotel subdomains are suggested from HMS names, can be edited under `kelvinmacwan.com`, and activate only after publishing. Saving a draft leaves the public website unchanged. See [Hostinger deployment](docs/deployment-hostinger.md).

Live mode keeps HMS identity, room content, inventory and rates managed by HMS. The editor manages banners, favicon, colors, fonts, appearance, page copy and visibility, SEO, offers, dining, reviews, FAQs, policies, social links and booking preferences. Each page's settings live in its individual sidebar section.

Changes update the actual public website routes inside the live preview. Unsaved preview snapshots are temporary and do not publish changes. **Save changes** applies presentation settings to the local website through the configured filesystem persistence. `WEBSITE_DATA_DIR` enables production storage; local defaults are `.data`. Preserve website documents, colors, uploaded media and the hotel domain registry.

The setup journey checks live HMS rates separately from the room catalogue. Click a step to open the relevant section and receive guidance. Saving never overwrites HMS operational data.

See [manager styling conventions](Portal/styles/README.md) and [the website API handoff](docs/website-api-handoff.md).

## HMS and booking

[HMS integration](docs/hms-integration.md) explains connection fields and endpoint mapping. Set the property's currency to match HMS and configure `propertyPackageId` for dated rate searches. The website uses the API's `averageRate` for the requested stay, including weekend rates; catalogue data intentionally has no invented prices.

Read-only HMS testing is enforced at the API and service layers. Login and documented data reads use POST where required by HMS. Reservation creation and real payment submissions are blocked. Development demo payments do not charge guests. Retained write adapters require verified backend and payment integration before production use.

See [payment integration](docs/payment-integration.md) and [client integration requirements](docs/client-integration-requirements.md).

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run format` formats source; `npm run format:check` checks it. Browser verification scripts are described in [tests/README.md](tests/README.md).

Generated dependencies, builds and QA output are ignored. Preserve `.env.local`, `.data` and local property snapshots when cleaning the project. Manager sessions authorize hotel editing independently of domain routing. HMS reservation/payment writes remain disabled.

## Security

See [Security and operations](docs/security.md) for editor grants, revocable sessions, remaining dependency findings and required production server protections.
