#!/usr/bin/env bash
# Starts the whole site inside a GitHub Codespace (also works on any machine
# with Docker): local Supabase with the test data, then Next.js on port 3000.
# Run automatically when the Codespace starts; safe to run again.
set -euo pipefail
cd "$(dirname "$0")/.."
LOG_DIR=/tmp/lady-a-beauty
mkdir -p "$LOG_DIR"

if [ -n "${CODESPACE_NAME:-}" ]; then
  SITE_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
else
  SITE_URL="http://localhost:3000"
fi

echo "▶ Base de données (Supabase local, 2 à 4 minutes au premier démarrage)…"
for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done
npx supabase start -x vector,logflare,imgproxy,supavisor,postgres-meta >"$LOG_DIR/supabase.log" 2>&1 \
  || { echo "Échec de Supabase : voir $LOG_DIR/supabase.log"; exit 1; }
# A database created by an earlier start gets the newer migrations (contents, schema).
npx supabase migration up >>"$LOG_DIR/supabase.log" 2>&1 \
  || { echo "Échec de la mise à jour de la base : voir $LOG_DIR/supabase.log"; exit 1; }

if [ ! -f .env.local ]; then
  echo "▶ Configuration (.env.local)…"
  eval "$(npx supabase status -o env | grep -E '^(API_URL|PUBLISHABLE_KEY|SECRET_KEY)=')"
  cat > .env.local <<ENV
NEXT_PUBLIC_SITE_URL=${SITE_URL}
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}
SUPABASE_SECRET_KEY=${SECRET_KEY}
APP_SECRET=$(openssl rand -base64 33 | tr '+/' '-_')
CRON_SECRET=$(openssl rand -base64 33 | tr '+/' '-_')
EMAIL_FROM="Lady A Beauty <rendez-vous@example.com>"
EMAIL_TRANSPORT=mailpit
ENV
fi

# Test admin account, with a password generated for this Codespace only.
if [ ! -f .codespace-admin.txt ]; then
  PASSWORD="$(openssl rand -base64 18 | tr -d '+/=' | cut -c1-16)"
  npm run --silent admin:create -- admin@lady-a-beauty.test "$PASSWORD" >/dev/null
  printf 'E-mail : admin@lady-a-beauty.test\nMot de passe : %s\n' "$PASSWORD" > .codespace-admin.txt
fi

echo "▶ Construction du site…"
npm run build >"$LOG_DIR/build.log" 2>&1 || { echo "Échec du build : voir $LOG_DIR/build.log"; exit 1; }
pkill -f "next-server" 2>/dev/null || true
nohup npm run start -- -p 3000 >"$LOG_DIR/site.log" 2>&1 &
for _ in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3000 && break; sleep 1; done

# Lets you send the link to someone else (otherwise only you can open it).
if [ -n "${CODESPACE_NAME:-}" ]; then
  gh codespace ports visibility 3000:public -c "$CODESPACE_NAME" >/dev/null 2>&1 || true
fi

echo
echo "✔ Site prêt : ${SITE_URL}"
echo "  Administration : ${SITE_URL}/admin"
cat .codespace-admin.txt | sed 's/^/  /'
echo "  E-mails de test : onglet « Ports », port 54324"
