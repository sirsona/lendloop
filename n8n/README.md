# n8n automation

Local n8n setup for LendLoop.

## Run

```bash
cd /home/sirsona/Code/Mctaba/Projects/lendloop

# Requires .env.n8n, created from .env.n8n.example.
docker compose up -d

# Create the two n8n Crypto credentials referenced by the workflows.
bash n8n/import-credentials.sh
```

Open <http://127.0.0.1:5678> and import:

```text
n8n/workflows/request-notification.json
n8n/workflows/overdue-reminders.json
n8n/workflows/error-handler.json
```

Activate the request and overdue workflows. After import, set:

```text
Workflow Settings → Error Workflow → LendLoop — Error Handler
```

The workflow JSON intentionally does not contain a local error-workflow ID; IDs differ per n8n instance.

## Credentials

The workflow signatures use n8n Crypto credentials, not `$env` secrets:

```text
LendLoop Outbound HMAC  (id: lendloop-outbound)
LendLoop Inbound HMAC   (id: lendloop-inbound)
```

`n8n/import-credentials.sh` reads the secrets from `.env.n8n` and imports both credentials with those exact IDs. The IDs are stable so the workflows can reference them.

## Local URLs

```text
Convex API:        http://127.0.0.1:3210
Convex HTTP:       http://127.0.0.1:3211
n8n:               http://127.0.0.1:5678
n8n webhook:       http://127.0.0.1:5678/webhook/lendloop/request-notification
```

Inside Docker, n8n reaches Convex through:

```text
http://host.docker.internal:3211
```

`docker-compose.yml` maps `host.docker.internal` to the host gateway.

## Workflows

- **Request Notification** — signed Convex → n8n webhook; verifies raw body; mock-sends.
- **Overdue Reminders** — daily 09:00 Africa/Nairobi; signed GET, claim, mock send, complete.
- **Error Handler** — n8n Error Trigger; sanitized signed report to Convex.

The request and overdue workflows use n8n Crypto nodes with the imported credentials. The Code nodes only prepare canonical strings, build the HTTP bodies, and log the mock output.

## Test

```bash
npx convex data automationEvents
```

A successful request notification has:

```text
kind: request_notification
status: sent
```

A successful reminder has:

```text
kind: overdue_reminder
status: sent
```

An n8n failure creates:

```text
kind: workflow_error
status: failed
```

No secrets belong in workflow JSON or git.
