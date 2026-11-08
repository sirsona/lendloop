# LendLoop — Security and Privacy

## Assets

- Clerk identities and session tokens
- User email addresses
- Tool ownership and descriptions
- Borrow-request dates and messages
- Admin role and trusted-lender state
- Audit and automation event history
- Two directional HMAC secrets

## Trust boundaries

- **Browser:** untrusted. Every request is authorized again in Convex.
- **Next.js:** UI and route protection. Hiding a control is not authorization.
- **Clerk:** authentication authority. Convex validates the Clerk issuer.
- **Convex:** source of truth and authorization boundary.
- **n8n:** external automation worker. It cannot read the database; it only receives signed, minimal payloads.
- **Docker host:** holds local `.env.n8n` and the n8n encryption key.

## Authentication

Clerk issues the session. `ConvexProviderWithClerk` forwards the identity to Convex. `convex/lib/auth.ts` maps the Clerk `tokenIdentifier` to a user row.

Rules:

- Client-supplied roles are ignored.
- `users.sync` never changes an existing role.
- Admin bootstrap is CLI-only with a verified email.
- No public role-management mutation exists.
- `proxy.ts` protects `/board` and `/admin`, but Convex still authorizes every function.

## Authorization

Key invariants:

- A borrower cannot request their own tool.
- Only the lender can approve or decline.
- Only the borrower can cancel.
- Only the lender or borrower can mark returned.
- Admin status does not grant request-transition powers.
- Admin can remove any listing and mark trusted lenders.
- Trusted-lender state is a badge only; it grants no permissions.
- Removed tools cannot be approved.
- An overdue unreturned loan blocks new requests and approvals.
- Approval re-checks overlap and overdue state.

See [Permission matrix](permission-matrix.md).

## Data minimization

Public query returns only:

```text
_id, name, category
```

It excludes owner, email, condition, description, availability dates, trusted status, pending counts, and audit data.

Admin all-loans returns names and dates but not emails. The admin user directory may return email because trusted-lender administration needs a stable identifier.

Audit metadata contains IDs and action names, not message bodies, descriptions, or emails.

## Date and availability safety

- Date-only strings validated server-side.
- Half-open `[startDate, endDate)` ranges.
- No past start dates.
- 90 inclusive-day maximum.
- Overlap checks use half-open intervals.
- `endDate` is exclusive; UI return-by is inclusive.
- Overdue check uses `todayInNairobi >= endDate`.
- Pending requests do not hide availability.

These rules prevent a removed or overdue tool from being rebooked and prevent adjacent reservations from being incorrectly rejected.

## Automation security

### Directional signatures

```text
CONVEX_TO_N8N_SECRET  Convex → n8n notifications
N8N_TO_CONVEX_SECRET  n8n → Convex reminder/error calls
```

A signature is valid for one direction only.

### Format

```text
x-lendloop-timestamp: <13-digit Unix milliseconds>
x-lendloop-signature: v1=<64 lowercase hex characters>
```

HMAC-SHA256. Timestamps outside five minutes are rejected. The verifier checks format and length before constant-time comparison.

### Canonical strings

```text
Convex → n8n:       <timestamp>.<rawBody>
GET:                <timestamp>.GET.<path>
POST:               <timestamp>.POST.<path>.<rawBody>
```

The raw body must be the exact bytes sent. n8n Webhook Raw Body is read from binary data; Convex reads `await request.text()` before parsing.

### Leases and idempotency

- Request event keys: `request:<requestId>:<eventType>`.
- Reminder keys: `reminder:<requestId>:<Nairobi date>`.
- Request notifications retry up to five times with backoff.
- Reminder claims use a 10-minute lease and at most three attempts per day.
- Completion requires the current lease token.
- Sent reminders cannot be overwritten with failed.
- Returned loans cannot be claimed.

### Residual risk

Delivery is **at-least-once**. A worker can send an email and fail before completing the event; a retry can duplicate it. For production, pass the event/reminder key to the email provider as an idempotency key where supported.

## Audit

Audited actions include:

```text
tool.created
tool.updated
tool.removed_by_owner
tool.removed_by_admin
request.created
request.approved
request.declined
request.cancelled
request.returned
admin.trusted_lender_changed
```

Audit rows are written in the same mutation as the business change. There is no public mutation to edit or delete them. Only admins can read the audit log.

## Known gaps

- No rate limiting or abuse throttling.
- No email verification check beyond Clerk's configured sign-in policy.
- No file uploads, malware scanning, or content moderation.
- No pagination; queries are capped for the demo.
- No production deployment hardening in this repository.
- Local secrets live in `.env.n8n` and Convex environment variables.
- n8n runs with env access enabled for its Code nodes; restrict this in production.
- Notification delivery is a mock until a real provider node is added.

## Production checklist

- Use production Clerk keys and issuer.
- Use production Convex deployment and HTTP actions URL.
- Set strong random HMAC secrets; rotate independently.
- Run n8n behind HTTPS with authentication and a secure cookie.
- Store n8n credentials in n8n's credential store, not workflow JSON.
- Replace mock notifications with a provider that supports idempotency.
- Add rate limiting and query pagination.
- Back up Convex and the n8n database.
- Monitor failed automation events and n8n error executions.
- Define retention for audit and automation events.
