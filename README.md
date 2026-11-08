# LendLoop

LendLoop is a neighborhood tool-lending board. Neighbors list tools, request them for date ranges, approve or decline requests on their own tools, and mark loans returned. Admins moderate listings, view all loans, and mark trusted lenders. n8n handles request notifications and daily overdue reminders.

## documents

- [Product spec](docs/product-spec.md)
- [Permission matrix](docs/permission-matrix.md)
- [Acceptance tests](docs/acceptance-tests.md)
- [Automation contract](docs/automation-contract.md)
- [Wireframes](docs/wireframes.md)
- [Risk register](docs/risks.md)

## Key decisions

- Roles: `user` and `admin`.
- Admin powers are limited to removing any listing, viewing all loans, marking trusted lenders, and viewing audit logs. Admin status alone does not authorize request transitions.
- One `borrowRequests` entity holds the full request/loan lifecycle.
- Dates are date-only half-open intervals: `[startDate, endDate)`, interpreted in `Africa/Nairobi`.
- The UI asks for a return-by date; the server stores the next day as the exclusive `endDate`.
- A loan is overdue the day after its return-by date.
- An overdue, unreturned tool cannot be rebooked; a removed tool cannot be approved.
- Convex enforces every permission.
- n8n uses directional HMAC secrets and exact raw-body verification.
- Overdue reminders use fetch → claim → send → complete with leases and idempotency keys.
- Notifications are logged mocks for the demo; a real provider is optional.



## Automation

Phase 4 adds signed n8n automation:

- request notifications on borrow-request transitions
- daily overdue reminders with claim/lease/completion
- signed error workflow reporting
- automation activity on request cards

Local setup:

```bash
cp .env.n8n.example .env.n8n
# edit .env.n8n with generated secrets
docker compose up -d
bash n8n/import-credentials.sh
```

Import the workflows from `n8n/workflows/` into n8n and activate the request and overdue workflows. See [n8n/README.md](n8n/README.md) for details.
