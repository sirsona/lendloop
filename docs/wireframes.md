# LendLoop — Low-Fidelity Wireframes

These are structural sketches, not final visual designs.

## `/` — Public
```text
┌────────────────────────────────────────────────────────────┐
│ LendLoop                                      [Sign in]     │
│ Borrow what you need. Lend what you don’t.                  │
├────────────────────────────────────────────────────────────┤
│ Available now                                               │
│ ┌──────────────────────┐  ┌──────────────────────┐          │
│ │ Cordless drill       │  │ Garden spade         │          │
│ │ Power tools          │  │ Garden               │          │
│ └──────────────────────┘  └──────────────────────┘          │
│                                                            │
│ Sign in to lend or borrow.                                  │
└────────────────────────────────────────────────────────────┘
```
Public cards show only tool name and category. No owner, condition, description, availability dates, trusted status, or pending counts. Empty state: “No tools are available right now. Sign in to be the first neighbor to lend a tool.”

## `/board` — Authenticated
```text
┌────────────────────────────────────────────────────────────┐
│ LendLoop                         [User button] [Sign out]   │
├────────────────────────────────────────────────────────────┤
│ [Browse] [My listings] [My requests] [Incoming requests]   │
├────────────────────────────────────────────────────────────┤
│ Browse                         Category: [All categories v] │
│ ┌──────────────────────────┐ ┌───────────────────────────┐  │
│ │ Tool name                │ │ Tool name                 │  │
│ │ Category · Condition     │ │ Category · Condition      │  │
│ │ Available                │ │ On loan · return by 12 Nov│  │
│ │ Owner · Trusted badge    │ │ Owner · Trusted badge     │  │
│ │ 2 pending requests       │ │ Available again 13 Nov    │  │
│ │ [Request]                │ │ [Request future dates]    │  │
│ └──────────────────────────┘ └───────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```
Browse: category filter; authenticated cards show name, category, condition, owner, trusted badge, `available`/`on_loan`, optional `isOverdue`, pending-request count, and upcoming reservation. Do not show Request for own tools. An on-loan non-overdue tool may allow future requests after its return-by date; an overdue tool blocks new requests and approvals.

My listings: `[+ Create tool]`; own tools with edit/remove actions, pending-request counts, and a “Removed” badge for soft-deleted listings. Listing form: name, category, condition, description. Confirm removal.

My requests: requests made by current user; show tool (with “Removed” label when applicable), lender, borrow-from, inclusive return-by, status, activity. Cancel pending only.

Incoming requests: requests for current user's tools; show borrower, dates, status, “Removed” label; approve/decline pending; mark approved loans returned. Approve is disabled when the tool is removed or has an overdue unreturned loan. Admin powers do not bypass party checks.

## `/admin` — Admin only
```text
┌────────────────────────────────────────────────────────────┐
│ LendLoop Admin                                              │
├────────────────────────────────────────────────────────────┤
│ [All loans] [Users] [Listings] [Audit log]                  │
├────────────────────────────────────────────────────────────┤
│ All loans: tool · lender name · borrower name · dates · status
│ Users: name · email · role · trusted-lender toggle          │
│ Listings: active tool · owner name · availability · [Remove]│
│ Audit: time · actor ID · action · resource type/ID          │
└────────────────────────────────────────────────────────────┘
```
No role-management UI. Admin can view all loans, mark trusted, remove any listing, and view audit logs. Admin cannot approve/decline/return unless a party. Emails are not part of the default all-loans projection; the separate Users tab may show them for trusted-lender administration.

## Required states
Loading; empty; error; signed out; no tools; no requests; removed listing (history remains available to parties); overdue tool; notification failed; future reservation; approval blocked by removed/overdue state.

## Interaction notes
Show server errors inline. Confirm destructive actions. Disable impossible UI actions for clarity, but enforce every permission in Convex. Keep public and authenticated queries separate. On narrow screens, navigation may collapse but all areas must remain reachable.
