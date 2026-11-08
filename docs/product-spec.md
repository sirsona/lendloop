# LendLoop — Product Specification

## Product statement
LendLoop is a neighborhood tool-lending board. Neighbors can list tools they are willing to lend, request a tool for a date range, approve or decline requests on their own tools, and mark loans as returned. An admin can moderate listings, view all loans, and mark trusted lenders. Automation sends request notifications and daily overdue reminders through n8n.

## Jobs to be done
- “I want to lend my tools without dealing with strangers manually.”
- “I want to borrow a specific tool for specific dates.”
- “I want to know whether a tool is available before asking.”
- “I want to approve requests on my own terms.”
- “I want reminders when a loan is overdue.”
- “As an admin, I want visibility and moderation without reading private messages.”

## Success criteria
1. A new user can list a tool in under two minutes.
2. Another user can request it without seeing the owner's private details on the public page.
3. The owner can approve or decline from one screen.
4. The borrower receives a notification (logged mock is acceptable for the demo).
5. An overdue loan produces one logical reminder per day per loan, subject to the at-least-once delivery limitation.
6. An overdue, unreturned tool cannot appear available or receive a new approval.
7. A removed tool cannot receive a new approval.
8. A normal user cannot perform an admin action, even by calling Convex directly.

## Scope and non-goals
In scope: public available-tool board; Clerk accounts; own listing CRUD; date-range requests; lender approve/decline; borrower cancellation; lender/borrower return marking; admin listing moderation, all-loan visibility, trusted-lender badge, audit-log visibility; signed Convex/n8n automation; logged mock notifications.

Non-goals: payments, images, chat, ratings, waitlists, recurring loans, multi-tool requests, deposits, notification preferences, role-management UI, required real email provider, mobile app, multi-tenancy, and pagination beyond a sensible `.take(100)` demo cap.

## Roles and authorization principles
- Roles are `user` and `admin`.
- Admin powers are limited to removing any listing, viewing all loans, marking a lender trusted, and viewing audit logs.
- Admin status alone does not authorize approval, decline, cancellation, or return actions on requests where the admin is not the relevant party.
- An admin who owns a tool acts as its lender.
- Trusted Lender is a badge only; it grants no permissions. It is shown only in authenticated views.
- Role changes have no UI. Provision the first admin through a CLI-only, verified-email operation. Never accept a role from client input.
- Normal user synchronization never changes an existing role and never promotes or demotes an admin.
- Admin all-loans views use a minimal projection: tool name, lender name, borrower name, dates, status, and IDs. Emails are not part of this projection.
- A separate admin-only user directory may show name and email so the admin can identify a lender and toggle trusted status.
- Convex enforces every protected operation; UI hiding is not authorization.

## Borrow-request lifecycle
One entity, `borrowRequests`, represents both the request and approved loan.

```text
pending
  ├── approve ──► approved ──► returned
  ├── decline ──► declined
  └── cancel  ──► cancelled
```

| Current | Action | Actor | Next |
|---|---|---|---|
| pending | approve | lender | approved |
| pending | decline | lender | declined |
| pending | cancel | borrower | cancelled |
| approved | return | lender or borrower | returned |
| declined / returned / cancelled | — | — | terminal |

Rules:
- Dates cannot be edited after creation. Cancel and re-request.
- No partial returns.
- Terminal states cannot transition again.
- Approval re-checks availability and the removed/overdue blocks below.
- Multiple pending requests for one tool are allowed, except that one borrower may hold at most one pending request for the same tool with an overlapping date range.
- Only approved, unreturned requests block availability or overlap.
- Admin cannot force a transition unless a party.
- A removed tool cannot be approved. Pending requests on a removed tool may be declined by the lender or cancelled by the borrower.
- If a tool has an overdue, unreturned approved request, no new request may be created for that tool and no new approval may occur until it is returned.

## Date semantics
Store `YYYY-MM-DD` date-only strings, not epoch timestamps for loan-date comparisons.

- `startDate`: first loan day, inclusive.
- `endDate`: first day the tool is available again, exclusive.
- UI asks for **Borrow from** and **Return by** (inclusive).
- Store `endDate = returnBy + 1 calendar day`; display `returnBy = endDate - 1 calendar day`.
- Intervals are half-open: `[startDate, endDate)`.
- Overlap iff `existing.startDate < new.endDate AND existing.endDate > new.startDate`.
- Maximum loan length is 90 inclusive use days: `daysBetween(startDate, endDate) <= 90`.
- A one-day loan is allowed when `returnBy === startDate`; its stored `endDate` is the following day.
- Optional request message: max 300 characters; no control characters; never included in public data or audit metadata.

Example: Loan A borrows 10 Nov and returns by 12 Nov; stored as `startDate=2026-11-10`, `endDate=2026-11-13`. Loan B starting 13 Nov is allowed. Loan C starting 12 Nov is blocked. There is no same-day handoff on the inclusive return-by date.

Timezone is `Africa/Nairobi`. Kenya has no DST, so a fixed UTC+3 helper is acceptable. `todayInNairobi < endDate` means not overdue; `todayInNairobi >= endDate` means overdue. A loan returned by 12 Nov becomes overdue on 13 Nov. Reminder key: `reminder:<borrowRequestId>:<YYYY-MM-DD>` using Nairobi date.

### Current, future, and overdue loans
- **Current/held loan:** approved, unreturned request with `startDate <= todayInNairobi`.
- **Overdue loan:** current/held loan with `endDate <= todayInNairobi`.
- **Future reservation:** approved, unreturned request with `startDate > todayInNairobi`. It does not hide the tool today, but it blocks overlapping requests.
- A current loan is still considered held until it is marked returned, even after its `endDate`.
- An overdue loan blocks all new requests and approvals for that tool until it is returned.

## Availability, status, and listing rules

### Public page
A tool is publicly listed only if:
- it is not removed, and
- it has no current/held loan: no approved, unreturned request with `startDate <= todayInNairobi`.

Pending requests do not hide a tool. Future approved reservations do not hide a tool today.

Public query returns only `{ _id, name, category }`. It never returns owner, condition, description, availability dates, trusted status, or pending-request counts.

### Authenticated board
Tool status is one of:
- `available`: no current/held loan.
- `on_loan`: a current/held loan exists. Include `isOverdue` when `endDate <= todayInNairobi`.

`pendingRequestCount` is a separate badge, not a status. `upcomingReservation` is optional read-only information for the next approved future request. Pending requests and future reservations never change the today availability status.

### Create-request gates
`borrowRequests.create` must reject when:
- the tool is removed;
- the caller owns the tool;
- dates are invalid, in the past, over 90 inclusive days, or the return-by precedes start;
- the caller already has an overlapping pending request for the same tool;
- an approved, unreturned request overlaps the requested interval;
- the tool has an overdue, unreturned approved request.

### Approve gates
`borrowRequests.approve` must reject when:
- the caller is not the lender (admin status alone is insufficient);
- the request is not pending;
- the tool is removed;
- an approved, unreturned request overlaps;
- the tool has an overdue, unreturned approved request.

The overlap and overdue checks must run inside the same Convex mutation as the approval. Convex mutations are serializable; do not rely on a prior client-side check.

### Return, decline, cancel
- `markReturned`: lender or borrower only; request must be approved. Returning clears the tool’s held/overdue state.
- `decline`: lender only; request must be pending. Allowed for removed tools.
- `cancel`: borrower only; request must be pending. Allowed for removed tools.

### Removal
- Owner removal and admin removal are soft deletes.
- Removed tools disappear from public and browse views.
- Removed tools remain visible to the owner in **My listings**, to the borrower in **My requests**, and to the lender in **Incoming requests**, with a “Removed” label.
- Removed tools cannot be edited.
- Existing approved loans remain returnable.
- Pending requests on removed tools are preserved; approval is blocked; decline and cancel remain available.
- Admin removal does not cancel approved loans.

### Validation
- Name: 2–80 characters.
- Category and condition: exact enums.
- Description: 10–600 characters.
- Message: optional, max 300 characters.

### Categories
| Value | Label |
|---|---|
| `power_tools` | Power tools |
| `garden` | Garden |
| `kitchen` | Kitchen |
| `camping` | Camping |
| `other` | Other |

### Conditions
| Value | Label |
|---|---|
| `new` | New |
| `good` | Good |
| `fair` | Fair |
| `worn` | Worn |

## Conceptual data dictionary (not schema)
- **User:** `_id`, `tokenIdentifier` (unique Clerk identity), `name`, `email`, `role` (`user|admin`), `trustedLender`, `createdAt`.
- **Tool:** `_id`, `ownerId`, `name`, `category`, `condition`, `description`, `isRemoved`, `removedAt`, `removedBy`, `createdAt`, `updatedAt`.
- **BorrowRequest:** `_id`, `toolId`, `borrowerId`, `lenderId`, `startDate`, `endDate`, `status`, optional `message`, `createdAt`, `updatedAt`, optional `decidedAt`, optional `returnedAt`.
- **AutomationEvent:** `_id`, optional `borrowRequestId`, `kind`, `status`, `idempotencyKey`, `eventType`, `attempts`, optional `leaseToken`, optional `leaseExpiresAt`, optional `lastError`, optional `providerMessageId`, `createdAt`, `updatedAt`, optional `processedAt`.
- **AuditLog:** `_id`, `actorId`, `action`, `resourceType`, `resourceId`, optional `metadata`, `createdAt`.

Derived values are not stored as authoritative fields:
- `on_loan`, `isOverdue`, `pendingRequestCount`, `upcomingReservation`.

Data minimization:
1. Public query returns only `{ _id, name, category }`.
2. Notification payload contains event ID/type, recipient details needed for delivery, tool name, dates, and status only.
3. Audit metadata contains IDs and action names, not descriptions or emails.
4. Admin loan lists show names, not emails.

## Audit log
Audit rows are inserted in the same Convex mutation as the business action. They are immutable: no update or delete function exists. Only admins can read them.

Audited actions:
- `tool.created`
- `tool.updated`
- `tool.removed_by_owner`
- `tool.removed_by_admin`
- `request.created`
- `request.approved`
- `request.declined`
- `request.cancelled`
- `request.returned`
- `admin.trusted_lender_changed`
- `user.role_changed` (only when a CLI/internal role operation uses the audit-writing helper)

Each row records actor ID, action, resource type, resource ID, timestamp, and minimal metadata. No descriptions, message bodies, emails, or tokens.

## Automation contract
The detailed signing, endpoint, payload, claim, lease, retry, and error contracts live in [`automation-contract.md`](automation-contract.md).

Summary:
- Convex → n8n request notifications use `CONVEX_TO_N8N_SECRET`.
- n8n → Convex reminder and error calls use `N8N_TO_CONVEX_SECRET`.
- HMAC is verified over the exact raw request body.
- Request notification action: max 5 attempts with exponential backoff; missing n8n URL is `skipped`, not retried forever.
- Overdue flow: fetch → claim → send → complete.
- Reminder claim: 10-minute lease; max 3 attempts per reminder day; claim re-checks approved/overdue/not-returned.
- `sent` is terminal and cannot be overwritten by a stale or failed completion.
- One reminder key per loan per Nairobi day.
- Error workflow records sanitized failures.
- At-least-once email delivery is the accepted limitation unless the provider supports idempotency keys.

Event states:
```text
pending → processing → sent
                    ├→ failed
                    └→ skipped
```

## Admin bootstrap
- First admin: CLI-only `internal.users.provisionAdmin`, requiring a verified email.
- No public mutation accepts a role.
- Normal `users.sync` never changes an existing role.
- No role-management UI.
- Any future role operation must be admin-only or CLI-only and must write an audit row.

## Screens
- `/`: public read-only tool grid and sign-in call to action.
- `/board`: Browse, My listings, My requests, Incoming requests.
- `/admin`: admin-only all-loans view, trusted-lender controls, listing moderation, audit logs.
See `wireframes.md`.

## Two-minute explanation
LendLoop is a neighborhood tool-lending board. Guests see only currently available tools and categories. Signed-in users list their own tools, request others for date ranges, and approve or decline requests on their own tools. Admins can remove any listing, view all loans, and mark trusted lenders, but they do not automatically act on other people's requests. Dates are date-only half-open intervals in Africa/Nairobi; a loan is overdue the day after its return-by date, and an overdue unreturned tool cannot be rebooked. Convex enforces every permission. n8n receives signed request notifications and runs a daily overdue workflow that claims each reminder before sending, then writes back idempotently. Raw request bodies are verified with directional HMAC secrets. Failures are visible through an error workflow and an automation activity feed.
