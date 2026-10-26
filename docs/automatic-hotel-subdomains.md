# Automatic Hotel Subdomain Setup for Patel HMS

Implementation and hosting guide for Kelvin Macwan and the Patel HMS deployment team  
Prepared 16 October 2026

## 1 Purpose and required outcome

This guide explains how one Patel HMS website application can automatically provide a separate public link for every hotel, such as `meridian.kelvinmacwan.com` and `stardust.kelvinmacwan.com`, while staff use `websites.kelvinmacwan.com` to manage their hotels.

The application already handles hotel discovery, address registration, publishing and hotel selection from the requested hostname. Fully automatic public links also require wildcard DNS, wildcard host routing and HTTPS coverage. Generating a link in the application does not configure these hosting services.

This is a setup specification, not confirmation that your current Hostinger plan supports wildcard routing. No DNS, certificates or hosting settings were changed while preparing this document.

## 2 How requests reach the correct hotel

```text
Hotel guest opens https://meridian.kelvinmacwan.com
    |
DNS resolves the hostname to the hosting destination
    |
HTTPS certificate is validated for that hostname
    |
Hosting proxy forwards the request to the shared Node app
    |
App reads the original Host header and finds the published domain record
    |
App loads only that hotel's content and HMS connection
```

Every hotel uses the same deployed application and templates. The hotel data and published address registry determine which hotel appears. A separate ZIP, app deployment or folder per hotel is unnecessary for this architecture.

The manager hostname must also reach this same application. Its explicit configuration selects the login and Studio flow rather than a public hotel page.

## 3 Access and infrastructure required

| Requirement | Who provides it | What must be available |
| --- | --- | --- |
| Domain and authoritative DNS access | Domain owner | Permission to edit the active DNS zone for kelvinmacwan.com |
| Node application hosting | Hosting administrator | Next.js server runtime and environment settings |
| Wildcard host routing | Hosting provider or server administrator | New hotel hostnames reach the existing Node application automatically |
| HTTPS coverage | Hosting provider or server administrator | Certificate valid for each hotel hostname and automated renewal |
| Durable application storage | Hosting administrator | Writable storage retained across restarts and deployments |
| HMS access | Patel HMS | Reachable API and valid hotel accounts with verified property membership |
| Backups and monitoring | Deployment team | Recoverable website content, domain records and encrypted connections |

For this project use Node.js 22, `npm ci`, `npm run build`, and `npm run start`. Set the server port through the hosting platform. Keep the application process running with the platform's process manager or, on a VPS, a service manager.

## 4 Choose the hosting route first

### Managed Hostinger Node application

Hostinger documents Node app deployment and connecting custom domains, but a custom-domain feature alone does not prove that arbitrary wildcard hostnames can reach the same app. Its current documentation describes individual subdomain creation and DNS setup [1][2].

Ask Hostinger to confirm all of these for your exact plan before changing DNS:

- Can `*.kelvinmacwan.com` route to one existing Node.js app without adding every hotel hostname manually?
- Can `websites.kelvinmacwan.com` and every hotel hostname use the same application and persistent storage?
- Is HTTPS automatically valid for a new hostname without manual certificate provisioning?
- Is the original incoming Host header preserved for the Node app?
- Which storage path survives redeployment, and is it backed up?

A DNS record alone is insufficient if the hosting front end only accepts registered individual hostnames. If wildcard routing is unavailable, manually adding domains is a temporary onboarding process, not a fully automatic solution. Confirm whether multiple domains can be attached to this same app; do not create isolated copies of the application as a substitute.

### VPS or another host with confirmed wildcard support

A VPS gives your administrator control over DNS targets, the reverse proxy and certificates. It also makes the administrator responsible for updates, access control, certificate renewal, backups and process supervision.

Choose a managed service only after it confirms the requirements above. Use a VPS or another suitable platform if your current managed plan cannot meet them. Moving DNS to another provider by itself does not remove origin-host restrictions.

## 5 Configure DNS

Edit DNS at the provider hosting the authoritative nameservers. This may be Hostinger, Cloudflare or another DNS provider. Keep existing website and email records intact.

Illustrative records for a VPS with a fixed public IPv4 address:

| Type | Host name | Destination | Purpose |
| --- | --- | --- | --- |
| A | * | YOUR_SERVER_IPV4 | New hotel subdomains |
| A | websites | YOUR_SERVER_IPV4 | Explicit manager address |

For managed hosting, use the A or CNAME destination supplied for your application. Do not use a guessed IP address. Do not create an A record and CNAME at the same DNS name. Add IPv6 records only when IPv6 is correctly served by the application endpoint.

Existing exact DNS names can take precedence over the wildcard. Audit old hotel records if a particular hotel reaches the wrong server. Do not change the root domain, mail records, MX or TXT records merely to enable hotel links.

DNS directs traffic; it does not create a hotel record, publish hotel content, configure the app's hostname acceptance or install HTTPS certificates.

## 6 Configure HTTPS and host routing

For the one-level addresses used here, the certificate should cover `*.kelvinmacwan.com`. This includes `meridian.kelvinmacwan.com` and `websites.kelvinmacwan.com`. Include `kelvinmacwan.com` separately only if the root domain will also be served. Do not assume the wildcard certificate covers names such as `www.meridian.kelvinmacwan.com`.

Let's Encrypt supports wildcard issuance through DNS-01 validation. Automate DNS validation and certificate renewal using an ACME client and a narrowly scoped DNS API credential, or use a hosting service that manages this process [3]. Keep DNS API credentials on the server and out of source code and upload packages.

On a VPS, configure the reverse proxy to accept the manager hostname and wildcard hotel hostnames. Preserve the incoming Host header. The following is an illustrative HTTPS server block; replace the placeholders, configure HTTP redirection and certificate issuance separately, and have the server administrator validate it before applying it.

```nginx
server {
    listen 443 ssl;
    server_name websites.kelvinmacwan.com *.kelvinmacwan.com;

    ssl_certificate     /PATH/TO/FULLCHAIN.pem;
    ssl_certificate_key /PATH/TO/PRIVATEKEY.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

This project selects hotels using the actual Host header. A proxy that replaces every hotel hostname with the manager hostname will break tenant selection. Arbitrary custom domains outside the configured root domain are a separate feature and are not provided by this wildcard setup.

## 7 Configure the application

Enter these values as environment variables on the server. The data path below is a placeholder that the hosting administrator must replace.

```dotenv
NODE_ENV=production
WEBSITE_ENV=live
PATEL_HMS_ROOT_DOMAIN=kelvinmacwan.com
WEBSITE_MANAGER_HOST=websites.kelvinmacwan.com
WEBSITE_MANAGER_AUTH=hms
WEBSITE_MANAGER_USERS_JSON=[]
PATEL_HMS_API_URL=https://YOUR_APPROVED_HMS_API_ORIGIN
WEBSITE_DATA_DIR=/YOUR/DURABLE/WRITABLE/DATA/DIRECTORY
WEBSITE_MANAGER_SESSION_SECRET=YOUR_PRIVATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
NEXT_PUBLIC_SITE_URL=https://hotel.kelvinmacwan.com
```

Use lowercase `hms`. Uppercase `HMS` does not enable HMS login in the current implementation. The session secret must be random, private and at least 32 characters. Keep it stable across ordinary redeployments: changing it invalidates sessions and also affects decryption of stored HMS connections. Plan secret rotation with connection recovery and fresh manager sign-in.

`PATEL_HMS_TENANTS_JSON` must be a JSON object. Retain the original object for existing configured hotels so their tenant identities and saved data remain associated. For a new installation relying on HMS discovery, use `{}`. Do not use `[]` for this variable. `WEBSITE_MANAGER_USERS_JSON=[]` is valid in HMS mode because local manager accounts are not used for authentication.

HMS login discovers hotels from verified account work profiles. Users can access only their verified hotels, with any configured `WEBSITE_MANAGER_EDITORS_JSON` restrictions also applied. Each hotel needs a working API connection. The app stores encrypted connections on the server after successful HMS sign-in; these files must survive deployments for public hotel data access. User credential changes may require a fresh sign-in to update a connection.

The current development API origin is `https://dev-aiapi.patelhms.com`. Use it only for the environment approved by Patel HMS; obtain the approved production origin and property configuration before a production rollout. Verify currency, rate package and hotel check-in and check-out times per property. Automatic discovery defaults to INR and 15:00 / 12:00 unless server configuration overrides them; do not assume those defaults suit every hotel.

`NEXT_PUBLIC_SITE_URL` is a development metadata fallback in the current code. Production metadata uses the resolved hotel hostname. Setting it to `hotel.kelvinmacwan.com` does not publish that address or force all hotels to share it.

Save environment changes and redeploy or restart the Node app so the runtime uses them.

## 8 Understand the current hotel onboarding flow

1. Staff open `https://websites.kelvinmacwan.com` and enter their HMS username, password and customer code.
2. The app verifies their HMS account and property membership. If several hotels are accessible, staff choose one.
3. When Studio loads the hotel, the app reserves a subdomain based on the property name. Reservation currently occurs through this manager workflow, not through a new-hotel webhook from HMS.
4. Staff review the website and choose Publish. The app records the published address and presentation.
5. Guests open the hotel address. DNS, HTTPS and wildcard routing bring the request to the app, which checks its published domain registry.

Names are normalized to lowercase letters, digits and hyphens. The app rejects invalid labels, reserved names such as `websites`, and collisions with other registered hotels. For generated names, a property-ID suffix can distinguish duplicates. If a collision still exists, an administrator must choose another valid label.

A newly reserved address is not publicly active until publication. Saving a new address for an already published website immediately updates its published routing in the current code. The old hostname then stops resolving to that hotel within the app; there is no automatic redirect from the old name. DNS may still resolve it, but the app should return not found.

## 9 Preserve data and plan for growth

The configured data directory contains the domain registry, website drafts and published content, uploads, encrypted HMS connections, and security state. Keep it outside a release directory that is replaced during deployment, restrict its permissions, and back it up with the matching secret managed separately.

Do not delete `.data` to resolve a login or hotel-loading error. Back up before migrations. A new server needs the existing hotel identity mapping, saved presentations, domain registry, uploads and usable connections to retain existing public links. Handle session migration and reauthentication deliberately.

The current domain registry is filesystem based and uses an in-process update queue. Target one Node application instance initially. Multiple independent workers or replicas need coordinated database transactions, unique domain constraints and shared persistent media storage. Temporary preview tokens are also currently held in process memory. A load-balanced rollout needs additional shared preview state or suitable routing.

Unknown and unpublished hotel labels must return not found rather than another hotel's content. Keep manager and API responses private and prevent any CDN from caching one hotel's page for a different hostname.

## 10 Acceptance checks before onboarding hotels

- Manager HTTPS opens the login screen and includes Customer code.
- Valid HMS staff access only hotels included in their verified work profiles.
- Two published hotels show different names, content and the correct HMS room data.
- A newly published hotel works without manual DNS or domain attachment. This is the key test of full automation.
- An unregistered random hotel hostname returns not found from the app, with valid HTTPS.
- Certificates are valid for the manager and several hotel names, and renewal is scheduled and monitored.
- Renaming a published address updates the Copy and Visit links; the previous hostname no longer serves that hotel.
- Restart and redeployment retain published websites, uploaded media and working HMS connections.
- Requests from an account for Hotel A cannot edit Hotel B, and guests cannot call manager write endpoints.

Example diagnostic commands, after substituting a real published address:

```powershell
Resolve-DnsName meridian.kelvinmacwan.com
Resolve-DnsName websites.kelvinmacwan.com
curl.exe -I https://meridian.kelvinmacwan.com
curl.exe -I https://websites.kelvinmacwan.com/manager-login
```

DNS lookup success alone is not proof of a working website. Also inspect the certificate, HTTP response and actual hotel identity in the browser.

## 11 Troubleshooting

| Symptom | Check first |
| --- | --- |
| New name does not resolve | Authoritative DNS zone and wildcard destination |
| DNS resolves but hosting error appears | Hostname acceptance and wildcard routing at the hosting front end |
| Certificate warning | Certificate name coverage, issuance and renewal |
| Correct HTTPS but hotel not found | Published domain registry, root domain and preserved Host header |
| Customer code missing | Exact lowercase WEBSITE_MANAGER_AUTH value and restart after changes |
| Hotel loading error | Server logs, HMS reachability, tenant object format, writable storage and decryptable connections |
| Existing hotels disappear after deploy | Persistent data path, retained data and stable tenant mappings |
| All hotel links show the same hotel | Proxy Host header, tenant resolution and any CDN cache key |

Use server logs to identify the actual exception before changing credentials or data. Redact passwords, access tokens and session secrets when sharing logs.

## 12 Hosting support request

Please confirm whether my current plan can route `*.kelvinmacwan.com` and `websites.kelvinmacwan.com` to one existing Next.js Node application, preserving the incoming Host header. I need new hotel subdomains to work without individual domain registration, with automatic HTTPS and renewal. Please provide the required DNS target, explain wildcard TLS support, and identify the writable persistent storage path that survives redeployment. If this is unsupported, please confirm the limitation so we can deploy the shared app on a VPS or another suitable platform.

## 13 Sources and implementation references

External hosting documentation was checked on 16 October 2026. The actual plan's features still need confirmation from Hostinger.

[1] Hostinger subdomain setup: https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/

[2] Hostinger Node custom domain setup: https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/

[3] Lets Encrypt challenge types and DNS validation: https://letsencrypt.org/docs/challenge-types/

[4] Hostinger Node deployment: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

Application references reviewed: `src/lib/tenant/hotelDomain.ts`, `src/lib/tenant/domains.ts`, `src/lib/tenant/resolveTenant.ts`, `src/app/website-manager/page.tsx`, `src/app/api/manager/login/route.ts`, `src/lib/manager/connections.ts`, `src/lib/website/storage.ts`, `src/lib/website/preview.ts` and `src/app/layout.tsx`.
