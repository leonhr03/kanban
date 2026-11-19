#!/usr/bin/env bash
# Baut das Kanban-Board und kopiert es per SSH (über Tailscale) auf den Server-Laptop.
set -euo pipefail

# ---- Anpassen ----
SERVER_USER="${SERVER_USER:-leon}"                      # Benutzername auf dem Server-Laptop
SERVER_HOST="${SERVER_HOST:-100.79.126.110}"            # Tailscale-Name oder IP
SERVER_PATH="${SERVER_PATH:-/home/leon/server/kanban}"  # Zielordner auf dem Server
# ------------------

cd "$(dirname "$0")"

echo "==> Baue Projekt..."
npm run build

echo "==> Kopiere nach $SERVER_USER@$SERVER_HOST:$SERVER_PATH ..."
ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p '$SERVER_PATH'"
rsync -avz --delete dist/ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

echo "==> Fertig! -> https://fedora.latxa-stairs.ts.net/kanban/"
