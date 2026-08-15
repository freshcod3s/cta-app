#!/usr/bin/env bash
#
# scripts/deploy.sh — run an EAS deploy action with vault-injected secrets.
#
# cta-app ships via EAS (Expo Application Services), not wrangler — there is no
# Cloudflare Worker in this repo. This wraps the `eas` CLI under
# scripts/bws-exec.sh so credentials such as EXPO_TOKEN (non-interactive EAS
# auth) come from the Bitwarden vault instead of a plaintext env var.
#
# Default action is a cloud build. Any args pass straight through to `eas`:
#   scripts/deploy.sh                                  # -> eas build
#   scripts/deploy.sh build --platform ios --profile production
#   scripts/deploy.sh submit --platform android
#   scripts/deploy.sh update --branch production
#
# BWS_ENV_MODE=minimal: eas is a Node toolchain, so the child gets an explicit
# allowlist of env vars (see bws-exec.sh) plus the injected vault secrets, and
# nothing else. The bootstrap token never reaches the child (bws strips it). If
# eas reports a missing variable, add that NAME to BWS_ENV_ALLOWLIST in
# bws-exec.sh — do not switch to full inherit (BWS_INHERIT_ENV=1).
#
# NOTE: pushing secrets to a Cloudflare Worker (the spec's sync-worker-secrets.sh
# / `wrangler secret put` flow) belongs in the Worker repo congress-trade-alerts,
# not here. See the SECRETS POLICY section of CLAUDE.md.
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export BWS_ENV_MODE=minimal
if [ "$#" -eq 0 ]; then
  set -- build
fi
exec "$SCRIPT_DIR/bws-exec.sh" eas "$@"
