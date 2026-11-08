# LendLoop — Acceptance Tests

## Public and data minimization
- [ ] Guest sees only `_id`, name, and category for available tools.
- [ ] Guest cannot retrieve owner name/email, condition, description, availability dates, trusted status, or pending counts through the public query.
- [ ] Guest sees a sign-in action.
- [ ] Public hides a tool with a current/held or overdue approved request.
- [ ] Public shows a tool with only a future approved reservation.
- [ ] Public does not hide a tool merely because it has pending requests.
- [ ] Removed tools do not appear publicly.

## Authentication and listings
- [ ] Signed-in user can access `/board`.
- [ ] User creates a listing with valid enum values.
- [ ] Convex rejects invalid category or condition.
- [ ] Name outside 2–80 characters and description outside 10–600 characters are rejected.
- [ ] User edits/removes only own listing.
- [ ] Admin removes any listing.
- [ ] Removed listing disappears from public and browse.
- [ ] Removed listing remains visible in the owner's My listings with a “Removed” label.
- [ ] Removed listing remains visible in the borrower's My requests with a “Removed” label.
- [ ] Removed listing remains visible in the lender's Incoming requests.
- [ ] Removed tools cannot be edited.
- [ ] Approved loan remains visible to parties after listing removal and can still be returned.
- [ ] Pending requests on a removed listing remain; lender can decline and borrower can cancel.
- [ ] Approval fails for a request whose tool was removed after creation.
- [ ] Non-owner cannot edit or remove another user's listing.

## Requests and dates
- [ ] User cannot request own tool.
- [ ] User cannot request a removed tool.
- [ ] Start date before Nairobi today is rejected.
- [ ] Return-by before start date is rejected.
- [ ] A one-day loan (`returnBy === startDate`) is accepted.
- [ ] A 90-inclusive-day loan is accepted; 91 days is rejected.
- [ ] Dates are stored as date-only strings.
- [ ] UI return-by converts to exclusive `endDate` by adding one calendar day; display reverses this.
- [ ] Optional message longer than 300 characters or containing control characters is rejected.
- [ ] A borrower cannot hold two overlapping pending requests for the same tool; non-overlapping pending requests are allowed.
- [ ] Pending requests do not block availability or other requests.
- [ ] Approved, unreturned requests block overlapping requests.
- [ ] Approval re-checks overlap.
- [ ] Adjacent half-open intervals are allowed; a start on the prior inclusive return-by date is blocked.
- [ ] An overdue unreturned loan blocks new requests for the tool.
- [ ] An overdue unreturned loan blocks new approvals for the tool.
- [ ] After the overdue loan is returned, requests and approvals resume.
- [ ] A future approved reservation does not hide the tool today but blocks overlapping requests.
- [ ] A currently on-loan, non-overdue tool can receive a future request starting on/after its `endDate`; an overlapping future request is rejected.
- [ ] Lender approves/declines own tool requests; unrelated admin cannot.
- [ ] Borrower cancels own pending request.
- [ ] Lender or borrower marks approved loan returned; unrelated admin cannot.
- [ ] Returned/declined/cancelled are terminal.
- [ ] Dates cannot be edited after creation.
- [ ] A returned overdue loan clears the tool’s held/overdue state.

## Availability and status
- [ ] Authenticated status is `on_loan` when any approved, unreturned request has `startDate <= todayInNairobi`.
- [ ] `isOverdue` is true when that held request has `endDate <= todayInNairobi`.
- [ ] Status is `available` when there is no current/held loan.
- [ ] `pendingRequestCount` is separate from status and does not change availability.
- [ ] `upcomingReservation` is informational only and does not change today’s status.
- [ ] Not overdue when `todayInNairobi < endDate`; overdue when `todayInNairobi >= endDate` and not returned.
- [ ] Return-by 12 Nov is not overdue on 12 Nov and is overdue on 13 Nov.
- [ ] Date helper handles month/year boundaries.
- [ ] Public excludes removed tools and current/held/overdue tools.
- [ ] Pending requests do not hide a tool.

## Admin and audit
- [ ] Non-admin cannot call admin functions directly.
- [ ] Admin views all loans and marks a lender trusted.
- [ ] Admin all-loans projection contains names and dates but not emails.
- [ ] The admin user directory is admin-only and may show name/email for trusted-lender administration.
- [ ] Trusted badge grants no permissions and appears only in authenticated views.
- [ ] Admin cannot approve/decline/return unless the admin is the relevant party.
- [ ] Client cannot change role; repeated sync cannot downgrade admin or promote ordinary user.
- [ ] First admin is provisioned by a CLI-only, verified-email operation.
- [ ] Each audited business mutation writes exactly one audit row in the same transaction.
- [ ] Audit actions cover tool create/update/remove, request create/approve/decline/cancel/return, trusted-lender change, and any role operation.
- [ ] Audit metadata has IDs/action names, not descriptions/emails/messages.
- [ ] No public mutation edits/deletes audit records; non-admin cannot read them.

## Automation and security
- [ ] Request create, approve, decline, cancel, and return emit the specified event and recipient.
- [ ] Valid HMAC over exact raw body passes; tampered body and wrong secret fail.
- [ ] GET overdue uses the canonical `${timestamp}.GET.${path}` signature.
- [ ] POST claim/complete/error uses `${timestamp}.POST.${path}.${rawBody}`.
- [ ] Stale timestamp outside ±5 minutes fails.
- [ ] Malformed signature fails cleanly without a buffer-length exception.
- [ ] Header format is `v1=<64 lowercase hex>`; directional secrets differ.
- [ ] Request notification retries at most 5 times with backoff; missing n8n URL is skipped, not retried forever.
- [ ] Request notification failure is visible in automation activity.
- [ ] Overdue fetch returns only approved, unreturned requests where `endDate <= Nairobi today`.
- [ ] Overdue fetch returns only the minimal fields needed by n8n.
- [ ] Reminder key is `reminder:<borrowRequestId>:<Nairobi YYYY-MM-DD>`.
- [ ] Concurrent claims produce at most one active lease; an active lease returns `busy`.
- [ ] Claim re-checks approval, overdue status, and not-returned state; a loan returned after fetch returns `not_applicable`.
- [ ] Expired processing lease can be reclaimed; failed event can retry while attempts remain; exhausted event cannot.
- [ ] Reminder claim stops at 3 attempts for the same reminder day.
- [ ] Wrong lease token cannot complete; stale completion cannot overwrite a newer claim; sent cannot be overwritten with failed.
- [ ] Duplicate reminder key creates one logical event.
- [ ] Workflow order is fetch → claim → send → complete.
- [ ] Error workflow records a sanitized failure with no PII.
- [ ] Exported n8n JSON contains no secret values.
- [ ] At-least-once delivery residual risk is documented.
- [ ] Provider idempotency, when available, is passed using the reminder key.

## Documentation and delivery
- [ ] Root README links to product spec, permissions, acceptance tests, automation contract, wireframes, and risks.
- [ ] README covers Next.js, Clerk, Convex, n8n setup and workflow import.
- [ ] README covers raw-body HMAC and date semantics.
- [ ] Docker Compose starts pinned n8n.
- [ ] Env examples contain placeholders only.
- [ ] Production note covers secret rotation, n8n hardening, provider idempotency, and at-least-once risk.
- [ ] The duplicate export folder is absent; docs live only under `/docs`.

## Manual end-to-end
1. User A creates a tool; User B requests it.
2. Verify `request_created` notification event targets A.
3. A approves; verify `request_approved` targets B.
4. Attempt overlap and verify rejection, including approval-time re-check.
5. A or B marks returned; second return attempt fails.
6. Admin removes another listing and marks a lender trusted.
7. Admin cannot approve/return a request where they are not a party.
8. Run overdue workflow: fetch, claim, mock-send, complete.
9. Run again same Nairobi day; no second logical reminder.
10. Tamper with signed request; verify rejection.
11. Trigger workflow error; verify visible error record.
12. Mark an overdue loan returned, then retry claim; verify `not_applicable`.
13. Approve a request whose tool was removed; verify rejection.
