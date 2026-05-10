#!/bin/sh
# Bootstrap demo-rpg-data into the local @revisium/standalone (no auth).
#
# Prerequisite: standalone must be running.
#   $ npm run revisium:standalone
#
# Targets are resolved from .revisium/revisium-cli.config.json
# (instance: local, contexts: demo-rpg / demo-rpg-head). Idempotent.

set -e

echo "→ revisium project ensure"
npx revisium project ensure --context demo-rpg

echo "→ revisium migrate apply --commit"
npx revisium migrate apply --file ./revisium/migrations.json --commit --context demo-rpg

echo "→ revisium endpoint ensure --type REST_API"
npx revisium endpoint ensure --type REST_API --context demo-rpg-head

echo "→ Fetching OpenAPI spec from /master/head"
SPEC_URL="http://localhost:8888/endpoint/openapi/admin/demo-rpg-data/master/head/openapi.json"
# Endpoint registration may take a moment to propagate; retry up to 5x.
for attempt in 1 2 3 4 5; do
  if curl -sf "$SPEC_URL" -o revisium/openapi.json.tmp; then
    mv revisium/openapi.json.tmp revisium/openapi.json
    echo "✓ Saved revisium/openapi.json"
    break
  fi
  if [ "$attempt" = "5" ]; then
    rm -f revisium/openapi.json.tmp
    echo "✗ Failed to fetch OpenAPI spec from $SPEC_URL" >&2
    exit 1
  fi
  sleep "$attempt"
done

echo "→ npx @hey-api/openapi-ts"
npx @hey-api/openapi-ts

echo "✓ Bootstrap complete. Generated client in src/__generated__/demo-rpg-data"
