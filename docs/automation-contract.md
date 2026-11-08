# LendLoop — Automation Contract

This document is the Phase 1 integration contract. It is intentionally stricter than the product summary.

## Directional secrets
Use two independent secrets:
- `CONVEX_TO_N8N_SECRET` — signs request notifications from Convex to n8n.
- `N8N_TO_CONVEX_SECRET` — signs overdue fetch, claim, complete, and error calls from n8n to Convex.

A secret is valid for one direction only. Rotate independently. Never place literal secret values in exported workflow JSON.

## Signature format
Header:
```text
x-lendloop-signature: v1=<64 lowercase hex characters>
x-lendloop-timestamp: <13-digit Unix milliseconds>
```

Rules:
- HMAC-SHA256.
- Validate the signature format and length before comparison.
- Reject timestamps outside ±5 minutes.
- Use constant-time comparison.
- Reject missing headers before computing.

## Canonical strings
| Direction | Secret | Canonical input |
|---|---|---|
| Convex → n8n request notification | `CONVEX_TO_N8N_SECRET` | `${timestamp}.${rawBody}` |
| n8n → Convex `GET /api/automation/overdue` | `N8N_TO_CONVEX_SECRET` | `${timestamp}.GET.${path}` |
| n8n → Convex `POST /api/automation/reminders/claim` | `N8N_TO_CONVEX_SECRET` | `${timestamp}.POST.${path}.${rawBody}` |
| n8n → Convex `POST /api/automation/reminders/complete` | `N8N_TO_CONVEX_SECRET` | `${timestamp}.POST.${path}.${rawBody}` |
| n8n → Convex `POST /api/automation/errors` | `N8N_TO_CONVEX_SECRET` | `${timestamp}.POST.${path}.${rawBody}` |

`path` is the request pathname only, with no query string. `rawBody` is the exact bytes sent.

## Raw-body rule
- n8n Webhook node: enable **Raw Body** and verify the raw string. Do not use `JSON.stringify(parsedBody)`.
- Parse JSON only after verification.
- Convex HTTP actions: read `await request.text()` and verify those bytes.
- n8n → Convex writes: n8n signs the exact `bodyString` it sends; do not let the HTTP node re-serialize it.
- Pin and test the n8n version because raw-body field names can vary.

## Request notifications: Convex → n8n
Webhook path: `/webhook/lendloop/request-notification`.

Payload fields:
```json
{
  "eventId": "...",
  "eventType": "request_created | request_approved | request_declined | request_cancelled | loan_returned",
  "borrowRequestId": "...",
  "toolName": "...",
  "status": "pending | approved | declined | cancelled | returned",
  "startDate": "2026-11-10",
  "returnBy": "2026-11-12",
  "recipient": { "name": "...", "email": "..." },
  "actorName": "..."
}
```

Rules:
- The outbound action claims the event from `pending` to `processing` with a lease before sending.
- Maximum 5 attempts.
- Exponential backoff.
- Missing n8n URL marks the event `skipped`.
- Exhausted attempts remain `failed` and appear in the activity feed.
- At-least-once delivery. Use the event ID for n8n-side dedupe where possible.

## Overdue fetch: n8n → Convex
`GET /api/automation/overdue`, signed with `N8N_TO_CONVEX_SECRET`.

Response:
```json
{
  "loans": [
    {
      "borrowRequestId": "...",
      "reminderKey": "reminder:<id>:2026-11-08",
      "toolName": "...",
      "borrowerName": "...",
      "borrowerEmail": "...",
      "returnBy": "2026-11-07",
      "daysOverdue": 2
    }
  ]
}
```

Only approved, unreturned requests with `endDate <= todayInNairobi` are returned. Do not include descriptions, conditions, or unrelated user data.

## Reminder claim
`POST /api/automation/reminders/claim`

Request:
```json
{
  "borrowRequestId": "...",
  "reminderKey": "reminder:<id>:2026-11-08",
  "channel": "email"
}
```

Responses:
```json
{ "status": "claimed", "leaseToken": "uuid", "attempt": 1 }
{ "status": "already_sent" }
{ "status": "busy" }
{ "status": "exhausted" }
{ "status": "not_applicable" }
```

Claim rules inside one serializable mutation:
1. Re-read the borrow request.
2. If it is not approved, is returned, or is no longer overdue, return `not_applicable`.
3. Find the event by `idempotencyKey`.
4. `sent` → `already_sent`.
5. `processing` with an active lease → `busy`.
6. Expired `processing` lease → reclaim with a new lease token.
7. `failed` with attempts remaining → reclaim.
8. `failed` exhausted → `exhausted`.
9. No event → insert `processing` with a 10-minute lease.

Maximum 3 claim attempts per reminder day.

## Reminder completion
`POST /api/automation/reminders/complete`

Request:
```json
{
  "borrowRequestId": "...",
  "reminderKey": "...",
  "leaseToken": "uuid",
  "status": "sent | failed",
  "providerMessageId": "optional",
  "sentAt": "2026-11-08T06:00:00.000Z",
  "error": "optional, sanitized"
}
```

Rules:
- Lease token must match the active claim.
- A stale token cannot complete.
- A `sent` event cannot be overwritten by a later stale or failed completion.
- A failed completion records a sanitized error and leaves the event retryable if attempts remain.
- Provider idempotency keys are passed using `reminderKey` when the provider supports them.

## Error workflow
`POST /api/automation/errors`

Payload:
```json
{
  "workflow": "overdue-reminders",
  "executionId": "...",
  "message": "sanitized, truncated",
  "occurredAt": "2026-11-08T06:01:00.000Z"
}
```

Do not include message bodies, tokens, emails, or full stack traces containing secrets.

## Event states
```text
pending → processing → sent
                    ├→ failed
                    └→ skipped
```

A stale worker must not overwrite a newer claim or a `sent` event.

## Residual risk
Database idempotency prevents concurrent duplicate sends and duplicate records. It cannot make email delivery exactly-once if n8n crashes after the provider accepts the message and before `complete` runs. Use provider idempotency where available; otherwise document at-least-once delivery.
