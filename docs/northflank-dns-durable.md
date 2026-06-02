# Northflank DNS on Durable (elevateforhumanity.org)

**Symptom:** Mobile shows “can’t be reached”; desktop may show SSL errors. HTTPS to `elevateforhumanity.org` fails because DNS points at the wrong IP.

## Root cause

Production runs on Northflank (`elevate-lms`). Custom domains are verified and attached in Northflank, but **public DNS still points apex and www at `20.232.216.67`**. That address does not present a valid TLS certificate for your domain. Browsers (especially mobile) use HTTPS first → connection fails.

Northflank’s edge for this project resolves to **`34.145.171.7`** (via `*.elev-5vfk.dns.northflank.app` → `lb.*.northflank.com`).

## Fix in Durable (required)

Run locally:

```bash
pnpm tsx scripts/northflank/print-cname-targets.ts
```

### Apex — `elevateforhumanity.org`

**Preferred:** CNAME flattening / ALIAS at `@` →

`elevateforhumanity.org.elev-5vfk.dns.northflank.app`

**If Durable only allows A on apex:** delete `20.232.216.67` and set:

| Type | Host | Value |
|------|------|--------|
| A | `@` | `34.145.171.7` |

(Confirm with `dig +short elevateforhumanity.org.elev-5vfk.dns.northflank.app` — use that IP if it changes.)

### WWW — `www.elevateforhumanity.org`

| Type | Host | Value |
|------|------|--------|
| CNAME | `www` | `www.elevateforhumanity.org.elev-5vfk.dns.northflank.app` |

Remove any **A** record for `www` pointing at `20.232.216.67`.

### Admin — `admin.elevateforhumanity.org`

| Type | Host | Value |
|------|------|--------|
| CNAME | `admin` | `admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app` |

## Verify (after 5–60 minutes)

```bash
dig +short elevateforhumanity.org @8.8.8.8
dig +short www.elevateforhumanity.org @8.8.8.8
curl -sSI https://elevateforhumanity.org/ | head -5
```

Expect HTTPS **200** or **308** (not SSL errors). The app redirects `www` → apex in `proxy.ts` and `next.config.mjs`.

## App deploy

LMS on Northflank `main` is healthy at `https://site--elevate-lms--pknyktykz4wg.code.run/`. No code deploy fixes wrong DNS.
