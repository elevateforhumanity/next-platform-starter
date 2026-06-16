# Installed Secrets

## SendGrid Email API Key

**API Key:** `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`

**Installed in:** Northflank environment variables as `SENDGRID_API_KEY`

**Used by:** `lib/email/sendgrid.ts`

**Status:** Ready to use once deployed to Northflank

---

## To Apply

Add to Northflank:
1. Go to your Northflank dashboard
2. Find the elevate-lms service
3. Add environment variable: `SENDGRID_API_KEY=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`
4. Redeploy

---

## Related Files

- `lib/email/sendgrid.ts` - SendGrid HTTP API implementation
- `lib/email/email-service.ts` - Email template service
- `lib/communication/announcements.ts` - Announcement email system
