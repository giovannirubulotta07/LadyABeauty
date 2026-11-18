#!/usr/bin/env bash
# Starts Docker (if needed) and the local Supabase stack.
# Uses Docker Hub images when the default ECR registry is unavailable.
set -euo pipefail
if ! docker info >/dev/null 2>&1; then
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
SUPABASE_INTERNAL_IMAGE_REGISTRY="${SUPABASE_INTERNAL_IMAGE_REGISTRY:-docker.io}" \
  npx supabase start -x vector,logflare,imgproxy,supavisor,postgres-meta >/dev/null
echo "Supabase local: http://127.0.0.1:54321 · Mailpit: http://127.0.0.1:54324"
