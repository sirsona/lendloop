#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT_DIR:-/home/sirsona/Code/Mctaba/Projects/lendloop}"
cd "$PROJECT"

test -f .env.n8n || { echo "Missing .env.n8n"; exit 1; }

OUT=$(grep '^CONVEX_TO_N8N_SECRET=' .env.n8n | cut -d= -f2-)
IN=$(grep '^N8N_TO_CONVEX_SECRET=' .env.n8n | cut -d= -f2-)
test -n "$OUT" && test -n "$IN" || { echo "Missing HMAC secrets in .env.n8n"; exit 1; }

TMP=$(mktemp)
chmod 600 "$TMP"
python3 - "$TMP" "$OUT" "$IN" <<'PY'
import json, sys
out, inbound, path = sys.argv[2], sys.argv[3], sys.argv[1]
creds = [
    {"id": "lendloop-outbound", "name": "LendLoop Outbound HMAC", "type": "crypto", "data": {"hmacSecret": out}},
    {"id": "lendloop-inbound", "name": "LendLoop Inbound HMAC", "type": "crypto", "data": {"hmacSecret": inbound}},
]
with open(path, "w") as f:
    json.dump(creds, f)
PY

docker compose cp "$TMP" n8n:/tmp/lendloop-creds.json >/dev/null
rm -f "$TMP"
docker compose exec -T n8n n8n import:credentials --input=/tmp/lendloop-creds.json
