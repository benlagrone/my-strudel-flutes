#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SOURCE_ROOT="${STRUDEL_SOURCE_ROOT:-${PROJECT_DIR}/../strudel}"
TARGET_ROOT="${PROJECT_DIR}/.deploy-docs"

if [[ ! -d "${SOURCE_ROOT}/website/src/pages" || ! -d "${SOURCE_ROOT}/docs" ]]; then
  echo "Strudel docs source not found at ${SOURCE_ROOT}" >&2
  echo "Set STRUDEL_SOURCE_ROOT to the local strudel repo root before running this script." >&2
  exit 1
fi

mkdir -p "${TARGET_ROOT}/website/src" "${TARGET_ROOT}/docs"

rsync -a --delete "${SOURCE_ROOT}/website/src/pages/" "${TARGET_ROOT}/website/src/pages/"
rsync -a --delete "${SOURCE_ROOT}/docs/" "${TARGET_ROOT}/docs/"

echo "Prepared deploy docs snapshot at ${TARGET_ROOT}"
