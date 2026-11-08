# LendLoop — Architecture

## System context

LendLoop has four trust boundaries:

```text
Browser
  │ Clerk session
  ▼
Next.js server/client
  │ Convex client
  ▼
Convex deployment
  ├── database
  ├── authorization
  ├── scheduler/actions
  └── HTTP actions
        ▲
        │ signed requests
        ▼
      n8n
```

- Clerk owns authentication.
- Convex owns data, authorization, loan rules, and the event ledger.
- n8n owns delivery workflows. It has no database access.
- Next.js owns presentation and route protection, but is not the authorization boundary.

## Read path

```mermaid
sequenceDiagram
  participant Guest
  participant Next
  participant Convex
  participant DB

  Guest->>Next: GET /
  Next->>Convex: tools.listPublic
  Convex->>DB: active tools + approved loans
  DB-->>Convex: rows
  Convex-->>Next: {_id,name,category}
  Next-->>Guest: public cards
```

The public projection intentionally excludes owner, condition, description, dates, trusted status, and pending counts.

## Authenticated listing and request

```mermaid
sequenceDiagram
  participant Borrower
  participant Next
  participant Convex
  participant DB
  participant N8n
  participant Lender

  Borrower->>Next: request tool for dates
  Next->>Convex: borrowRequests.create
  Convex->>DB: validate + insert pending request
  Convex->>DB: insert audit row
  Convex->>DB: insert automationEvent(pending)
  Convex-->>Next: requestId
  Convex->>N8n: scheduled signed notification
  N8n-->>Lender: mock email
```

The request mutation never performs network I/O. It writes the request and an automation event, then schedules a Convex Node action.

## Approval

```mermaid
sequenceDiagram
  participant Lender
  participant Convex
  participant DB

  Lender->>Convex: borrowRequests.approve
  Convex->>DB: request must be pending
  Convex->>DB: actor must be lender
  Convex->>DB: tool must not be removed
  Convex->>DB: re-check overdue and overlap
  Convex->>DB: status=approved
  Convex->>DB: audit + automationEvent
```

Approval re-checks the rules because availability can change between request creation and approval.

## Overdue reminders

```mermaid
sequenceDiagram
  participant Cron as n8n schedule
  participant Http as Convex HTTP actions
  participant Convex
  participant DB

  Cron->>Http: signed GET /overdue
  Http->>Convex: listOverdue
  Convex->>DB: approved loans with endDate <= today
  DB-->>Convex: minimal loan rows
  Convex-->>Cron: loans
  Cron->>Http: signed POST /claim
  Http->>Convex: claimReminder
  Convex->>DB: create/lease automationEvent
  Convex-->>Cron: claimed + leaseToken
  Cron->>Cron: mock send
  Cron->>Http: signed POST /complete
  Http->>Convex: completeReminder
  Convex->>DB: sent/failed
```

The claim step is what makes the reminder safe: two concurrent n8n workers cannot both own the same reminder day.

## Data model

```text
users
  tokenIdentifier, name, email, role, trustedLender

tools
  ownerId, name, category, condition, description,
  isRemoved, removedAt, removedBy

borrowRequests
  toolId, borrowerId, lenderId, startDate, endDate,
  status, message, decidedAt, returnedAt

automationEvents
  borrowRequestId, kind, status, idempotencyKey,
  eventType, attempts, leaseToken, leaseExpiresAt,
  lastError, providerMessageId

auditLogs
  actorId, action, resourceType, resourceId, metadata
```

Indexes support owner, borrower, lender, tool/status, status, idempotency, and audit lookups. There is no separate `loans` table; one request row carries the full lifecycle.

## Date semantics

```text
UI:     [ startDate ... returnBy ]   inclusive display
Server: [ startDate ... endDate )    endDate = returnBy + 1 day
Overdue: todayInNairobi >= endDate
```

This avoids off-by-one errors at the return boundary. All date comparisons use the same `Africa/Nairobi` helper.

## Failure boundaries

| Failure | Behavior |
|---|---|
| n8n unavailable | Request event fails and is visible; app data remains valid |
| Missing webhook config | Event becomes `skipped`, not retried forever |
| Reminder worker dies | Lease expires after 10 minutes |
| Concurrent reminder claims | One gets `claimed`; others get `busy` |
| Duplicate completion | Sent state is not overwritten |
| Loan returned after fetch | Claim re-check returns `not_applicable` |
| Bad signature | HTTP 401; no state change |
| Workflow error | Error workflow records sanitized `workflow_error` |
