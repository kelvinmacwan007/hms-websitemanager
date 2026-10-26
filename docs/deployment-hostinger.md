# Hostinger deployment: Website Studio and hotel websites

## Domain layout

- Manager: `https://websites.kelvinmacwan.com`
- Hotel websites: `https://<hotel-name>.kelvinmacwan.com`

Hotel URLs are registered from the actual HMS property name when an authorized manager first opens that hotel's editor. Spaces become hyphens; duplicate names and reserved names receive a property-ID suffix. The registered name is persistent, so later hotel name changes do not silently break links. Website Studio signs in through the existing `/api/v1/Account/login` endpoint. It matches authenticated HMS work-profile property IDs and customer codes against configured HMS connections. A single property opens directly; multiple accessible connected properties show a selector. Unknown or unconnected properties cannot open another hotel's editor. Add a server-side HMS data connection for each hotel; automatic provisioning from the future PatelHMS Website Manager module is not yet available.

The source folders and route structure are preserved. New manager login and domain registration modules extend the existing application.

## Upload and build

Use Hostinger's **Node.js Web App**, choose ZIP upload and select **Next.js**.

| Setting              | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| Node                 | 22.x                                                   |
| Root                 | `.`                                                    |
| Install              | `npm ci` (production-only installs are also supported) |
| Build                | `npm run build`                                        |
| Output, if requested | `.next`                                                |
| Start, if requested  | `npm run start`                                        |

The ZIP places `package.json` at its root. Hostinger builds the source on Linux; Windows `node_modules` and `.next` are excluded. Use the server port Hostinger assigns.

## Private environment settings

Add these in hPanel before deployment. Required TypeScript, Tailwind and PostCSS build tools are declared in `dependencies`, so production-only installs include them. `NPM_CONFIG_INCLUDE=dev` is optional and also includes lint/format tooling. The build uses Webpack to avoid the Turbopack worker crash observed on Hostinger:

```dotenv
NODE_ENV=production
NPM_CONFIG_INCLUDE=dev
WEBSITE_ENV=live
PATEL_HMS_API_URL=https://dev-aiapi.patelhms.com
PATEL_HMS_ROOT_DOMAIN=kelvinmacwan.com
WEBSITE_MANAGER_HOST=websites.kelvinmacwan.com
WEBSITE_DATA_DIR=.data
WEBSITE_MANAGER_SESSION_SECRET=REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS
WEBSITE_MANAGER_AUTH=hms
PATEL_HMS_TENANTS_JSON=REPLACE_WITH_SERVER_ONLY_HMS_CONNECTION_JSON
NEXT_PUBLIC_SITE_URL=https://YOUR_PUBLISHED_HOTEL_SUBDOMAIN.kelvinmacwan.com
```

Paste JSON environment values into hPanel without surrounding dotenv quotes. Private credentials are not included in the ZIP. Retain the existing hPanel environment values or enter your server-side HMS connections and session secret there. Use the hotel's existing HMS username, password and customer code on the login screen. Passwords entered by staff and upstream access tokens are not stored in browser storage or the website registry. The browser receives only a signed, HttpOnly, Secure session scoped to the verified property. Sessions expire after 30 minutes or the HMS login expiration, whichever comes first. Removing or reassigning a configured property invalidates its existing sessions. Later SSO/launch-token integration requires the PatelHMS portal's verified contract; a link to Website Studio currently opens the login screen.

Optional standalone manager accounts remain available for installations without `WEBSITE_MANAGER_AUTH=hms`. The standalone account CLI and hashed account configuration are retained for backward compatibility, but are not used by this package.

The package retains read-only HMS behavior. Real bookings/payments remain blocked. The HMS origin is the currently configured development service; replace it with the approved production API origin and credentials when supplied by HMS.

## Persistence and existing content

`WEBSITE_DATA_DIR` must point to durable writable storage used by the manager and every public hotel domain. This source ZIP excludes local `.data`, login sessions, credentials and uploaded media. Retain the existing server's persistent data directory. For a new server, migrate the existing website presentations, domain registry and uploaded media privately before going live; do not copy active session records or login-attempt counters. Website settings stay separate from HMS operational data. The address registry distinguishes the reserved draft subdomain from the published subdomain. A suggestion or saved address alone does not activate a public website. Select **Publish website** to publish content and activate the selected address. Saving a draft leaves the live website untouched. Changing an address keeps the current published URL active until the next publish; after that, the old URL returns not found. Reserved/system names, invalid labels and names owned by other properties are rejected. The UI edits only the subdomain; the root domain is server-configured as `kelvinmacwan.com`.

Migration: legacy registry entries without `publishedSubdomain` are treated as unpublished, even if an old presentation file exists. Open the manager, review its content and explicitly publish to activate its URL.

The package may include the hotel's configured presentation snapshot as `config/hms-properties.hostinger.json`. If present, set `PATEL_HMS_PROPERTIES_FILE=config/hms-properties.hostinger.json`. It is server-side hotel content and contains no login credentials.

Back up the data directory before redeployment. If Hostinger recreates the app directory, configure an external persistent directory/mount and migrate your existing website data into it once. Do not overwrite newer saved website settings with an older deployment ZIP. Multiple app instances need shared storage and coordinated domain registration; this filesystem implementation targets a single Node.js application instance.

## DNS, routing and HTTPS

Map `websites.kelvinmacwan.com` and the hotel's public subdomain to the **same running Node app and the same storage**. Preserve the original Host header. Do not create a second isolated application instance for the hotel website; isolated instances cannot share saved settings or domain registration automatically.

For arbitrary future hotel names without manual domain setup, the hosting front end must support `*.kelvinmacwan.com` routing, wildcard DNS and HTTPS coverage. An application's generated URL does not create DNS records or certificates. Hostinger's standard subdomain documentation states that wildcard subdomain creation is not supported; confirm wildcard routing and certificate support for your specific Node app with Hostinger. If unavailable, add each generated hotel domain and its HTTPS certificate manually, or run the same app on a Hostinger VPS with wildcard routing. No DNS/account changes have been made by this package.

References:

- [Node.js ZIP deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger subdomain limitations](https://support.hostinger.com/en/articles/1583405-how-to-create-and-delete-subdomains-in-hostinger)

## Verify after deployment

1. Opening `websites.kelvinmacwan.com` redirects to manager sign-in.
2. Wrong credentials fail; a valid account opens only its assigned hotel's editor.
3. The manager header shows the generated public website URL.
4. Changing website copy updates the actual preview. Save draft leaves the public site unchanged. Publish activates the selected address and updates its public content.
5. Unpublished addresses and former addresses after a rename/publish return not found.
6. An authenticated HMS user cannot select a configured hotel absent from their returned work profiles.
7. Public guests cannot save documents or use a private manager preview.
8. Room photos, availability and USD rates still come from HMS.
9. Sign out returns to login and prevents reopening the manager without authentication.

Deployment to the actual Hostinger account has not been performed. Local production checks exercise manager authentication, private preview, persistence and public hotel routing.

See [Security and operations](security.md) before production deployment. Hardened sessions require persistent `WEBSITE_DATA_DIR` storage. Existing cookies are invalidated on upgrade.
