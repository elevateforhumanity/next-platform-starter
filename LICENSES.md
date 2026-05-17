# Third-Party License Obligations

This document records license compliance decisions for dependencies that require
explicit acknowledgment or carry usage conditions beyond standard permissive terms.

Last audited: 2026-05-17 (204 packages, automated scan via license-checker)

---

## Summary

| Category | Count |
|---|---|
| Permissive (MIT / Apache-2.0 / BSD / ISC) | 191 |
| Weak copyleft (LGPL / MPL) | 8 |
| Strong copyleft (GPL) | 1 |
| Proprietary / custom | 4 |

---

## Flagged Packages

### ffmpeg-static — GPL-3.0-or-later

**Package:** `ffmpeg-static@5.3.0`
**License:** GPL-3.0-or-later
**Risk level:** Low (SaaS deployment)

GPL-3.0 requires that software *distributed* with a GPL binary also be released
under GPL. Elevate LMS is a hosted SaaS platform — no binary distribution occurs.
The SaaS loophole means GPL-3.0 does not propagate to application code in this
deployment model.

**Additional mitigation:** `ffmpeg-static` is listed as a webpack external in
`lib/video/remotion-render.ts` and `app/api/generate-video/route.ts` — it is
never bundled or imported directly. The actual FFmpeg binary path at runtime is
resolved via `@ffmpeg-installer/ffmpeg` (LGPL-2.1), which is the safer
alternative. `ffmpeg-static` is retained only as a fallback binary presence in
the container image.

**Decision:** Retain. SaaS deployment model eliminates GPL distribution
obligation. Runtime path uses LGPL binary. Reviewed 2026-05-17.

---

### Remotion — Dual License (Free / Company)

**Packages:** `remotion@4.0.454`, `@remotion/bundler`, `@remotion/cli`,
`@remotion/renderer`, `@remotion/compositor-linux-x64-gnu`, `@remotion/core`
**License:** [Remotion License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
**Risk level:** None

Remotion uses a two-tier license model:
- **Free License** — non-profits, individuals, organizations with ≤3 employees
- **Company License** — for-profit organizations above the free tier threshold

**Entity using this software:** Elevate for Humanity
**Entity type:** Registered 501(c)(3) non-profit organization
**Eligibility:** Free License — non-profit organizations qualify unconditionally.
No sign-up or license key required under the free tier terms.

Remotion is used for AI-generated lesson video rendering (`remotion-src/`).
`@remotion/licensing` is installed and `registerUsageEvent()` is called with
`licenseKey: null` in `lib/video/remotion-render.ts` to correctly declare
free-tier usage on each render.

**Decision:** Compliant under Free License. No purchase or key required.
Reviewed 2026-05-17.

---

### @mailchimp/mailchimp_marketing — Mailchimp Proprietary SDK

**Package:** `@mailchimp/mailchimp_marketing@3.0.80`
**License:** [Mailchimp Client Library License](https://mailchimp.com/developer/)
**Risk level:** None

Mailchimp's SDK license permits use of the library solely to integrate with
Mailchimp's own services. Elevate LMS uses it exclusively for email marketing
campaign management via the Mailchimp API. This is the intended and permitted
use case.

The SDK may not be redistributed, sublicensed, or used to build a competing
email marketing product.

**Decision:** Compliant. Usage is within permitted scope. Reviewed 2026-05-17.

---

### MPL-2.0 Packages

**Packages:** `web-push@3.6.7`, `axe-core@4.11.4`, `@axe-core/playwright@4.11.3`,
`dompurify@3.4.2` (MPL-2.0 OR Apache-2.0)
**License:** Mozilla Public License 2.0
**Risk level:** None

MPL-2.0 is a weak copyleft license. It requires that modifications to the
MPL-licensed source files themselves be shared, but does not affect application
code that uses them as libraries. Using MPL-2.0 packages as dependencies in a
proprietary SaaS product is fully compliant.

**Decision:** Compliant. No action required. Reviewed 2026-05-17.

---

### LGPL-2.1 Packages

**Packages:** `@ffmpeg-installer/ffmpeg@1.1.0`, `@ffprobe-installer/ffprobe@2.1.2`
**License:** LGPL-2.1
**Risk level:** None

LGPL-2.1 permits use in proprietary software provided the library is linked
dynamically (not statically compiled in). npm/Node.js module resolution is
dynamic by nature. No static linking occurs.

**Decision:** Compliant. Reviewed 2026-05-17.

---

## Quarterly Audit Schedule

Dependency licenses should be re-audited quarterly or when major dependencies
are added. Run:

```bash
npx license-checker --json --out /tmp/licenses.json
```

Then review any packages not in the MIT / Apache-2.0 / BSD / ISC / ISC family.
