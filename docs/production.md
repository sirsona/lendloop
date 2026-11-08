# LendLoop — Production Readiness

This document describes what changes before running LendLoop outside a local demo.

## 1. Hosting

| Component | Local | Production |
|---|---|---|
| Next.js | `npm run dev` | Vercel or a Node host |
| Clerk | development instance | production instance |
| Convex | local backend | hosted deployment |
| n8n | Docker on localhost | always-on host with HTTPS |
| Email | mock Code node | email provider credential |

The n8n schedule only runs while n8n is running. A laptop sleeping at 09:00 means no reminders.

## 2. Environment variables

### Next.js

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
```

### Convex

```text
ADMIN_EMAILS
CONVEX_TO_N8N_SECRET
N8N_TO_CONVEX_SECRET
N8N_REQUEST_WEBHOOK_URL
```

### n8n

```text
N8N_ENCRYPTION_KEY
CONVEX_TO_N8N_SECRET
N8N_TO_CONVEX_SECRET
CONVEX_SITE_URL
GENERIC_TIMEZONE=Africa/Nairobi
```

Do not commit any of these values.

## 3. URLs

For a hosted deployment:

```text
CONVEX_SITE_URL=https://<deployment>.convex.site
N8N_REQUEST_WEBHOOK_URL=https://<n8n-host>/webhook/lendloop/request-notification
```

The local setup uses:

```text
CONVEX_SITE_URL=http://host.docker.internal:3211
```

The `host.docker.internal` mapping is only for Docker on the same machine.

## 4. Secrets rotation

Rotate the two HMAC secrets independently.

1. Generate a new secret.
2. Set it in Convex.
3. Update `.env.n8n` or the n8n credential.
4. Recreate/restart n8n.
5. Run `bash n8n/import-credentials.sh` if using the local credential import.
6. Publish the affected workflows.
7. Watch `automationEvents` for failures.

Do not rotate `N8N_ENCRYPTION_KEY` casually. It decrypts stored n8n credentials. Use n8n's documented key-rotation process if required.

## 5. n8n hardening

- Put n8n behind HTTPS.
- Enable n8n user management; do not expose the editor publicly without authentication.
- Set `N8N_SECURE_COOKIE=true` behind HTTPS.
- Restrict editor access to the operator.
- Store HMAC secrets as n8n Crypto credentials, not workflow fields.
- Disable environment access in Code nodes where possible. The current workflows need `CONVEX_SITE_URL`; consider replacing `$env` with a controlled workflow variable.
- Keep the version pinned.
- Back up the n8n data volume.
- Configure the error workflow.
- Monitor failed executions and `workflow_error` events.

## 6. Email delivery

Replace:

- `Mock notify` in Request Notification
- `Mock send` in Overdue Reminders

with a real provider node.

Requirements:

- Send only to the event recipient.
- Do not log recipient email or message bodies.
- Use `eventId` or `reminderKey` as the provider idempotency key.
- Keep the completion HTTP request after a successful send.
- Let a send failure follow the workflow error path.

At-least-once delivery means a retry can duplicate an email if the send succeeds but completion fails. Provider idempotency is the mitigation.

## 7. Data and retention

- Public projections are already minimal.
- Admin all-loans omits email.
- Audit and automation events grow without a retention policy.
- Add retention/archival before sustained use.
- Back up Convex and n8n volumes.
- Do not put message bodies or emails into audit metadata.

## 8. Scaling and abuse

Current caps are demo-oriented:

- 100 tools
- 200 requests/users in admin views
- 100 automation events per loan
- 1000 approved/pending rows in availability scans

Before production:

- Add pagination.
- Add rate limiting.
- Add request throttles per user/IP.
- Add monitoring/alerting.
- Consider background jobs for availability scans if data grows.
- Add indexes for the actual query patterns.

## 9. Verification

```bash
npx tsc --noEmit --incremental false
TMPDIR=/dev/shm npm test
npm run lint
npm run build
```

Then run the [demo](demo.md) against the production URLs.

## 10. Explicit non-goals

This repository does not include:

- payment handling
- file uploads
- real-time chat
- email verification UI beyond Clerk
- a production deployment pipeline
- a real email provider
- multi-region replication

Do not describe the demo as production-ready without addressing these.
