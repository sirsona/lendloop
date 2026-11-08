# LendLoop — Demo Script

A 6–8 minute walkthrough for a reviewer.

## Setup

Keep two browser profiles:

- **Browser A:** `admin@example.com` (admin/lender)
- **Browser B:** `borrower@example.com` (borrower)

Run:

```bash
cd /home/sirsona/Code/Mctaba/Projects/lendloop
npx convex dev
npm run dev
```

Optional automation:

```bash
docker compose up -d
```

Open:

```text
http://localhost:3000
http://127.0.0.1:5678
```

## 1. Public page — data minimization

1. Open `/` in a signed-out window.
2. Point out that cards show only tool name and category.
3. Explain that owner, condition, description, dates, and pending counts are not exposed.

## 2. Create a listing

Browser A:

1. Open `/board`.
2. Go to **My listings**.
3. Click **+ List a tool**.
4. Create:
   - `Bosch GSB 18V-55 Cordless Drill`
   - Power tools
   - Good
   - `18V cordless drill with two batteries, charger, and a 24-piece bit set.`

Expected:

- Listing appears in My listings.
- Public page shows the name and category.
- No owner details publicly.

## 3. Request the tool

Browser B:

1. Open `/board`.
2. Browse to the drill.
3. Click **Request**.
4. Choose tomorrow through two days later.
5. Add a message.
6. Send.

Expected:

- Borrower sees `pending`.
- Lender sees the incoming request.
- Public page still shows the tool.
- Pending count is visible only to signed-in users.

## 4. Approve and show availability

Browser A:

1. Open **Incoming requests**.
2. Approve.

Expected:

- Status becomes `approved`.
- Public page hides the drill.
- Admin/user board shows `on loan`.
- The request card shows automation activity if n8n is configured.

## 5. Return

Browser B:

1. Open **My requests**.
2. Click **Mark returned**.

Expected:

- Status becomes `returned`.
- Public page shows the drill again.
- The tool is available.

## 6. Admin view

Browser A:

1. Click **Admin** in the board header.
2. Show:
   - All loans
   - Users and trusted-lender toggle
   - Listings
   - Audit log

Point out:

- Admin all-loans does not show emails.
- Admin cannot approve/decline/return unless a party.
- Trusted lender is a badge, not a permission.
- Audit log records the actions.

## 7. Automation

If n8n is running:

1. Create a request.
2. Open n8n **Executions**.
3. Show the signed request notification run.
4. Open the request card and show the activity line.
5. Trigger a bad signature:

```bash
curl -X POST http://127.0.0.1:5678/webhook/lendloop/request-notification \
  -H 'content-type: application/json' \
  -H "x-lendloop-timestamp: $(date +%s%3N)" \
  -H 'x-lendloop-signature: v1=0000000000000000000000000000000000000000000000000000000000000000' \
  --data '{"eventId":"demo-bad-signature"}'
```

Expected:

- Request workflow rejects it.
- Error workflow reports to Convex.
- `automationEvents` gains a `workflow_error`.

## 8. Overdue reminder

1. Create an approved loan with `endDate` in the past.
2. Open **LendLoop — Overdue Reminders** in n8n.
3. Click **Execute Workflow**.
4. Show the execution.
5. Check:

```bash
npx convex data automationEvents
```

Expected:

```text
kind: overdue_reminder
status: sent
```

Run again:

```text
claimReminder → already_sent
```

## 9. Close

Summarize:

- Server-enforced authorization
- Half-open date model
- Public data minimization
- Admin without transition bypass
- Audit trail
- Signed, leased, idempotent n8n automation
- Known limitation: mock email and at-least-once delivery

## Reset for another demo

Use the Convex dashboard to clear local test data, or keep the two listings and returned loan as demo history. Do not delete audit rows just to make the screen look clean.
