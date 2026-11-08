# LendLoop — Risk Register

| Risk | Mitigation |
|---|---|
| Overdue unreturned tool is shown available or rebooked | Define held state by status and `startDate <= today`, not only `endDate`; block public listing, new requests, and new approvals until return. |
| Removed tool request is approved | `approve` re-reads the tool and rejects removed tools; decline/cancel remain allowed. |
| Duplicate reminder email after crash | Claim + lease; claim re-checks returned/overdue state; provider idempotency where available; document at-least-once residual risk. |
| Claim after return race | Claim returns `not_applicable` if the request is no longer approved/overdue or has been returned. |
| Concurrent approvals overlap | Re-check overlap and overdue state inside the approval mutation; Convex serializable mutations prevent a stale successful write. |
| n8n raw-body behavior changes | Pin image; assert raw body is a string; test signatures against exact bytes. |
| GET/POST signature mismatch | Separate canonical strings; test GET with no body and POST with exact raw bytes. |
| Secret leak in exported workflow JSON | Environment/credential references only; gitleaks scan; review workflow exports; separate directional secrets. |
| Admin self-promotion | No client role input; verified-email CLI-only bootstrap; sync never changes existing roles; no role UI. |
| Public data leak | Separate public query; return only opaque ID, name, category; test response shape. |
| Admin PII overexposure | All-loans projection uses names, dates, status, IDs; emails omitted unless required. |
| Date/timezone bug | Date-only strings; fixed Nairobi UTC+3; half-open intervals; boundary tests. |
| Overdue final-day ambiguity | `endDate` exclusive; return-by day is not overdue; next day is overdue; test 12/13 Nov. |
| Local n8n unreachable from Convex cloud | Expose webhook via ngrok or Cloudflare Tunnel; Convex cloud cannot call localhost. |
| Scope creep | Non-goals list; one borrow-request entity; logged mock notifications. |
| Environment interpolation bug | Use Compose `env_file`; avoid duplicate `${...}` interpolation. |
| Missing error visibility | n8n error workflow and sanitized failed automation events. |
| Duplicate pending request spam | At most one overlapping pending request per borrower/tool; test. |
| 90-day/message abuse | Server-side validation; test 90/91 days and 300/301 characters. |
| Stale worker overwrites newer result | Lease token on claim; validate on completion; never overwrite `sent`. |
| Excessive personal data in logs | Minimal notification payload; audit metadata uses IDs/action names; sanitize errors. |
| Unbounded demo queries | Document `.take(100)` cap; pagination out of scope. |
| Runtime behavior changes | Pin and test n8n version; upgrade deliberately. |
| Root README/docs drift | Single docs directory; root README links all docs; remove duplicate export folders. |
