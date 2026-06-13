#!/usr/bin/env bash
#
# scripts/dev.sh — start the Expo dev server with vault-injected secrets.
#
# Mirrors cta-app's dev command (`npm start` -> `expo start`) but runs it under
# scripts/bws-exec.sh so Secrets Manager values (e.g. EXPO_PUBLIC_* / build-time
# vars) are injected from the Bitwarden vault instead of a local .env file.
#
# Extra args pass straight through to `expo start`, e.g.:
#   scripts/dev.sh --web
#   scripts/dev.sh --clear
#   scripts/dev.sh --tunnel
#
# BWS_ENV_MODE=minimal: expo is a Node toolchain, so the child gets an explicit
# allowlist of env vars (PATH, SystemRoot, APPDATA, USERPROFILE, TEMP, ... — see
# bws-exec.sh) plus the injected vault secrets, and nothing else. The bootstrap
# token never reaches the child (bws strips it). If expo reports a missing
# variable, add that NAME to BWS_ENV_ALLOWLIST in bws-exec.sh — do not switch to
# full inherit (BWS_INHERIT_ENV=1), which would expose the whole shell env.
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export BWS_ENV_MODE=minimal
exec "$SCRIPT_DIR/bws-exec.sh" npx expo start "$@"
