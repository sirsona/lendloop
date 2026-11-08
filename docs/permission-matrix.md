# LendLoop — Permission Matrix

Every capability must be enforced by a Convex function. A capability without an enforcing function does not exist.

Column meanings:
- **Any signed-in user:** authenticated, but row-level scoping still applies.
- **Owner/lender:** the user who owns the tool.
- **Borrower:** the user who created the request.
- **Admin:** additional admin-only capability. “Only if party” means admin status adds nothing.

| Action | Guest | Any signed-in user | Owner/lender | Borrower | Admin | Convex enforcement |
|---|---:|---:|---:|---:|---:|---|
| View public available tools | Yes | Yes | Yes | Yes | Yes | `tools.listPublic` |
| See owner name/email on public page | No | No | No | No | No | `tools.listPublic` returns only `_id`, `name`, `category` |
| View full tool details when signed in | No | Yes | Yes | Yes | Yes | `tools.listBoard` |
| Create listing | No | Yes | — | — | Yes | `tools.create` |
| Edit own listing | No | — | Yes | — | Only if owner | `tools.update` |
| Remove own listing | No | — | Yes | — | Only if owner | `tools.remove` |
| Remove anyone's listing | No | No | No | No | Yes | `tools.adminRemove` |
| Request someone else's tool | No | Yes, not own | — | — | Yes, not own | `borrowRequests.create` |
| Approve request on own tool | No | — | Yes | No | Only if lender | `borrowRequests.approve` |
| Decline request on own tool | No | — | Yes | No | Only if lender | `borrowRequests.decline` |
| Cancel own pending request | No | — | No | Yes | Only if borrower | `borrowRequests.cancel` |
| Mark own approved loan returned | No | — | Yes, if lender | Yes, if borrower | Only if party | `borrowRequests.markReturned` |
| View own borrowing requests | No | Yes, own only | — | Yes | Yes, own only | `borrowRequests.listMine` |
| View incoming requests on own tools | No | — | Yes | — | Yes, own tools only | `borrowRequests.listIncoming` |
| View all loans | No | No | No | No | Yes | `admin.listAllBorrowRequests` |
| View admin user directory (name/email) | No | No | No | No | Yes | `admin.listUsers` |
| View own removed listing | No | — | Yes | — | Only if owner | `tools.listMine` |
| View requests involving removed tools | No | — | Yes | Yes | Yes | `borrowRequests.listMine`, `borrowRequests.listIncoming`, `admin.listAllBorrowRequests` |
| Mark lender Trusted | No | No | No | No | Yes | `admin.setTrustedLender` |
| View audit logs | No | No | No | No | Yes | `audit.list` |
| Change roles | No | No | No | No | No UI | CLI-only/internal operation; no public mutation |

## Enforcement invariants
1. Resolve caller from `ctx.auth.getUserIdentity()` and a server-side user record.
2. `tools.update` and owner-side `tools.remove` verify `tool.ownerId === currentUser._id`.
3. `tools.adminRemove` requires admin and soft-removes without deleting loan history.
4. `borrowRequests.create` derives borrower from identity and lender from tool owner; the client cannot choose either.
5. `approve` and `decline` require caller to be lender. Admin status alone is insufficient.
6. `cancel` requires caller to be borrower and status pending.
7. `markReturned` requires caller to be lender or borrower and status approved. Admin status alone is insufficient.
8. All-loans, trusted-lender, and audit queries/mutations require admin.
9. Trusted-lender status never changes authorization.
10. Role is never accepted from client-controlled arguments or profile updates.
11. Public query never returns owner, condition, description, availability dates, trusted status, or pending counts.
12. Admin removal does not cancel approved requests; parties retain history access.
13. A removed tool cannot be approved.
14. An overdue, unreturned tool blocks new requests and approvals until returned.
15. Approval re-checks overlap and overdue state inside the mutation.
16. Admin all-loans projections omit emails; the separate admin user directory may include email for trusted-lender administration.
17. Audit rows are immutable and admin-readable only.
18. A missing enforcing function means the capability is not implemented.

The names above are the proposed public Convex API contract. Internal helpers may be added but must not expose additional user capabilities.
