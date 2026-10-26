# Security and operations

Application hardening completed on 9 October 2026. This is not a penetration test or a guarantee of complete security. Deploy the updated source and lockfile to apply these changes; the existing hosted application is unchanged until redeployed.

## Authentication and hotel isolation

Website Studio continues to authenticate against the existing PatelHMS login API. The verified work profile must match a configured tenant/property/customer. Property membership alone no longer grants website editing permission. By default, only that property's configured `userIdentity` can edit. To grant individual staff accounts, configure exact HMS login identities per tenant:

```dotenv
WEBSITE_MANAGER_EDITORS_JSON={"knot":["ho-knot-admin","approved-editor"]}
```

An explicit list replaces the default for that tenant; `{"knot":[]}` denies everyone. Missing or malformed configuration fails closed. Grants never replace the HMS property-membership check. Account aliases must be listed explicitly. These grants require an application restart when changed through environment variables.

Sessions expire after 30 minutes or the HMS token expiration, whichever is sooner. Browser cookies are signed, HttpOnly, SameSite=Lax and Secure in production, with no cross-subdomain cookie domain. A separate server-side record stores a digest, expiration and policy fingerprint, never the entered password or upstream token. Logout deletes that record, blocking cookie replay. Permission changes, local password-hash changes and tenant configuration changes invalidate affected sessions when the new configuration is loaded. Existing stateless cookies are rejected after this upgrade, so staff must sign in again.

Disabling an account or changing its password solely inside HMS does **not** immediately revoke an already-issued Website Studio session. Without an HMS revocation/introspection contract, it can remain usable until its maximum 30-minute expiry. To revoke access immediately here, remove its editor grant and restart, delete its server session record, or rotate the manager session secret to invalidate all sessions. Integration with HMS account-change notifications remains future work. MFA depends on the HMS authentication service; this app does not add MFA to its existing login contract.

## Request and browser protections

- Login has persistent, atomic fixed-window limits: 100 total attempts/minute and 10 per account/customer combination/minute. Counters are shared by Node workers using the same filesystem, survive process restarts and ignore spoofable forwarding headers. The global limit bounds storage and protects upstream login calls; it also means a sustained attack can temporarily deny legitimate logins. Add perimeter/WAF limits before public rollout.
- Request readers stop at the byte limit while streaming, including chunked requests and multipart image uploads. Existing smaller field validations remain in place. Large website document/preview requests retain the existing 20 MB compatibility ceiling.
- Manager mutations retain same-origin and tenant-scoped authorization. Public booking write restrictions, HMS contracts, operational hotel/room/rate ownership and explicit publishing behavior are preserved.
- Headers disable content sniffing, limit referrer exposure, deny camera/microphone/geolocation, block plugin objects and cross-origin framing, and prevent shared caching of manager/API responses. Same-origin guest previews remain supported.
- The current CSP intentionally does not restrict script sources, because Next.js hydration and the existing styles require a separate nonce-based CSP migration. It provides framing/object/base/form protections, not comprehensive XSS prevention. No HSTS with `includeSubDomains` is forced while the deployment's wildcard TLS is unfinished.
- Uploaded images retain extension/MIME/signature checks, a 2 MB file limit, random filenames and tenant-scoped reads. Signatures are not a full antivirus or image-decoding validation service. Configure disk quotas, monitoring and media retention on the server.

## Dependencies and residual findings

Next.js is updated from 16.3.5 to 16.3.8; Sharp is updated to 0.35.5 and source-map-js to 1.2.2. This removes the reported critical Next.js dependency finding. The [Next.js advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) identifies 16.3.6 as the patched version for the next/og issue; this project does not use ImageResponse.

The audit still reports **9 dependency findings: 7 high and 2 moderate**, in the Tailwind 3/ESLint build-tool dependency chains, including braces/micromatch and postcss-selector-parser. Build tools are in production dependencies because the existing Hostinger build requires them. These findings are not evidence of a reachable guest-route exploit, but they remain unresolved. Build only trusted source/configuration in an isolated build environment. The audit's proposed Tailwind 4 migration changes CSS behavior and needs dedicated visual regression testing; it was not forced as part of authentication hardening. Do not use `npm audit fix --force` blindly or downgrade Next.js to satisfy the ESLint transitive finding.

Run `npm audit` regularly and reassess the dependency findings before production launch. Keep Node on a supported, patched release. Use `npm ci` with the committed lockfile for reproducible installs.

## Required server configuration

1. Set `NODE_ENV=production`, the correct manager hostname/root domain, and a randomly generated manager secret with at least 32 characters. Rotate previously shared testing credentials and production secrets before launch. Keep `.env` files, `.data`, repository metadata and private config outside any static document root.
2. Set `WEBSITE_DATA_DIR` to durable private storage writable only by the dedicated non-root application user. Session records, login counters, published content and media use this storage. Back up content/media securely; exclude manager session and rate-limit directories from backups and deployment ZIPs. Expired session records are swept on subsequent login; expired counters are swept on subsequent login-limit checks.
3. Use one application instance for website-content writes. Authentication counters and session records coordinate through the shared local filesystem, but the existing domain/content mutation code is not a multi-server transactional database. Multiple machines need a shared transactional store and distributed abuse controls before scaling.
4. Terminate HTTPS with a valid manager and wildcard hotel certificate. Use Cloudflare Full (strict) only after origin TLS is configured. Restrict the origin to trusted reverse-proxy traffic and expose only required ports; bind Node to localhost/private networking. Keep SSH key-based, firewall rules minimal and OS packages patched.
5. Set proxy request-body limits and request/header timeouts, login/API rate limits and disk quotas. Account for the 20 MB editor document ceiling and 2.2 MB multipart upload ceiling. Public read/contact/upload in-process limits remain single-process controls; perimeter limits must protect against traffic across workers and restarts. Never pass arbitrary client forwarding headers as trusted identities.
6. Bypass CDN caching for `/api/*`, `/manager-login`, `/website-manager`, preview queries and authenticated HTML. Do not configure a blanket Cache Everything rule on the manager hostname. Preserve Host and HTTPS origin handling at the proxy. Enable HTTPS-only access and HSTS once certificate coverage is verified.
7. Monitor failed logins, permission errors, disk space, certificate renewal and application failures. Avoid logging passwords, tokens, full request bodies or personal guest/payment details. Test backup restoration and maintain an incident-response plan.

## Verification

`tests/security.test.mjs` exercises actual login/logout/session handlers with a mocked HMS response, checking authorization grants, cookie settings, logout replay, grant revocation and forwarded-header bypass attempts. It also checks concurrent filesystem login limits, oversized streamed bodies, byte counting, expired sessions and security-header configuration. The wider suite covers tenant isolation, publishing, upload signatures, booking validation and HMS read-only behavior. These are automated regression checks, not an external penetration test or an audit of the future server.
