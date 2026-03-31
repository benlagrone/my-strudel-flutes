#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_HOST="${REMOTE_HOST:-89.117.151.145}"
REMOTE_DIR="${REMOTE_DIR:-/opt/jester-chat}"

if [[ -z "${REMOTE_USER}" ]]; then
  echo "Set REMOTE_USER before running this script." >&2
  echo "Example: REMOTE_USER=root ${0}" >&2
  exit 1
fi

bash "${SCRIPT_DIR}/prepare-docs.sh"

ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p '${REMOTE_DIR}'"

rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.env.production' \
  --exclude 'deploy/production/.env' \
  "${PROJECT_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  set -euo pipefail
  cd '${REMOTE_DIR}'
  if [[ ! -f deploy/production/.env ]]; then
    cp deploy/production/.env.example deploy/production/.env
    echo 'Created deploy/production/.env from the example. Fill in ACME_EMAIL and API keys, then rerun deploy.'
    exit 1
  fi
  docker compose -f deploy/production/compose.yaml up -d --build
  docker compose -f deploy/production/compose.yaml ps
"

echo "Remote deploy finished for ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
