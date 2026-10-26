# Upload this ZIP to Hostinger

Use **Node.js Web App → Upload files / ZIP**, with **Next.js** and **Node.js 22.x**. The archive has `package.json` at its root; the application folders have their original structure.

| Setting                        | Value           |
| ------------------------------ | --------------- |
| Root directory                 | `.`             |
| Install command                | `npm ci`        |
| Build command                  | `npm run build` |
| Output directory, if requested | `.next`         |
| Start command, if requested    | `npm run start` |

For your existing deployment, keep your current hPanel environment variables and persistent `WEBSITE_DATA_DIR`. Back up that directory before redeploying. This ZIP includes source and public assets, but excludes private credentials, local website data, `node_modules`, and build output. Hostinger installs and builds on Linux.

For a new deployment, configure private environment variables from `.env.example` in hPanel. In particular:

```dotenv
NODE_ENV=production
WEBSITE_ENV=live
PATEL_HMS_ROOT_DOMAIN=kelvinmacwan.com
WEBSITE_MANAGER_HOST=websites.kelvinmacwan.com
WEBSITE_MANAGER_AUTH=hms
WEBSITE_DATA_DIR=/YOUR/DURABLE/WRITABLE/DATA/DIRECTORY
```

Also set `PATEL_HMS_API_URL`, `PATEL_HMS_TENANTS_JSON` and a random `WEBSITE_MANAGER_SESSION_SECRET` of at least 32 characters. Retain your existing values when updating an existing app. Set `NEXT_PUBLIC_SITE_URL` to the hotel's public HTTPS URL. Do not use localhost settings on the server.

On a new server, privately migrate the existing website presentations, domain registry and uploaded media to the configured data directory. Existing hotel content is not embedded in this source package. Do not migrate active manager sessions or login-attempt counters.

Connect manager and hotel domains to the same Node application and data directory. Keep the published domains' DNS and SSL configuration. Uploading this archive does not configure wildcard routing or certificates.

After deployment: sign in, check the actual preview, verify live HMS prices, and publish or update the website. Do not replace newer server data with old local copies.

See [deployment details](docs/deployment-hostinger.md) and [security and operations](docs/security.md).
