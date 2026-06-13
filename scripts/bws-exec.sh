#!/usr/bin/env bash
#
# scripts/bws-exec.sh — vault-first secret injection wrapper (Bitwarden Secrets Manager).
#
# Runs ANY command with secrets injected from the Bitwarden Secrets Manager
# vault. The bootstrap access token is fetched from the Windows Credential
# Manager at runtime, exported only for this process, never written to disk,
# never echoed, and unset on exit via a trap.
#
# USAGE
#   scripts/bws-exec.sh <command> [args...]                       # default: isolated
#   BWS_ENV_MODE=minimal scripts/bws-exec.sh <node-toolchain> ... # allowlisted env
#   BWS_INHERIT_ENV=1    scripts/bws-exec.sh <command> ...        # full inherit (escape hatch)
#
# BOOTSTRAP TOKEN RESOLUTION  (most robust Git Bash-compatible method)
#   The BWS access token unlocks the vault, so it cannot itself live in the
#   vault. It is stored as a Windows Credential Manager *Generic* credential
#   (default target "bws_access_token") and read at runtime via the Win32
#   CredRead API (scripts/cred-get.ps1, invoked through powershell.exe).
#     * cmdkey can create/list/delete generic creds but CANNOT read the secret
#       back  -> unusable for retrieval.
#     * The PowerShell CredentialManager module is NOT installed by default
#       -> not reliable.
#     * Win32 CredRead via P/Invoke is built into Windows, needs no module, and
#       returns the secret on stdout  -> chosen.
#
# ONE-TIME SETUP (Joe, on this machine — token NEVER pasted into chat/logs):
#   Preferred (hidden input, no shell history):
#       powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-bws-token.ps1
#   Or the Credential Manager GUI (see set-bws-token.ps1 header).
#
# PROJECT ID (non-secret) comes from .bws-project (committed) or $BWS_PROJECT_ID.
#
# CHILD ENVIRONMENT MODES — verified against bws v2.1.0
# (crates/bws/src/command/run.rs). Read before changing:
#   * bws runs the wrapped command as `powershell -c "<joined args>"` on Windows.
#   * bws ALWAYS removes BWS_ACCESS_TOKEN from the child's environment
#     (env_remove() in inherit mode; env_clear() in --no-inherit-env mode), so
#     the bootstrap token NEVER reaches the wrapped command in ANY mode.
#   * --no-inherit-env does NOT strip everything: on Windows it preserves PATH,
#     SystemRoot, ComSpec, windir (+ injected secrets) and nothing else — too
#     little for Node tools (no APPDATA/USERPROFILE/TEMP), hence "minimal".
#
#   isolated (DEFAULT)  bws run --no-inherit-env
#                       child = {PATH, SystemRoot, ComSpec, windir} + secrets.
#                       Tightest; usually too tight for expo/eas.
#   minimal (BWS_ENV_MODE=minimal)  inherit mode, but the env handed to bws is
#                       rebuilt from an explicit allowlist via `env -i`, so
#                       child = {allowlist} + secrets (still no token).
#                       Default for dev.sh / deploy.sh.
#   full (BWS_INHERIT_ENV=1, alias BWS_ENV_MODE=full)  inherit, no pruning.
#                       child = (entire parent env minus BWS_ACCESS_TOKEN) +
#                       secrets. Broadest exposure: every other shell var —
#                       INCLUDING any OTHER secrets you have exported — reaches
#                       the child. Escape hatch only; prefer minimal.
#
# The wrapped command's environment carries the INJECTED VAULT SECRETS in every
# mode. That is why the SECRETS POLICY forbids env/printenv/set as the wrapped
# command, and why this script refuses them (guard below): dumping the env would
# print the secret VALUES.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CRED_TARGET="${BWS_CRED_TARGET:-bws_access_token}"
PROJECT_FILE="$PROJECT_ROOT/.bws-project"

err() { printf 'bws-exec: %s\n' "$*" >&2; }

# --- require a command ---
if [ "$#" -eq 0 ]; then
  err "no command given. Usage: bws-exec.sh <command> [args...]"
  exit 64
fi

# --- POLICY guard: never dump the env — it carries the injected vault secrets ---
case "$1" in
  env|printenv|set|export|declare|typeset)
    err "refusing to run env-dumping command '$1' under bws run (SECRETS POLICY)."
    exit 65
    ;;
esac

# --- resolve project id (non-secret) ---
if [ -z "${BWS_PROJECT_ID:-}" ] && [ -f "$PROJECT_FILE" ]; then
  BWS_PROJECT_ID="$(grep -vE '^[[:space:]]*(#|$)' "$PROJECT_FILE" | head -n1 | tr -d '[:space:]' || true)"
fi
if [ -z "${BWS_PROJECT_ID:-}" ]; then
  err "BWS_PROJECT_ID not set and $PROJECT_FILE has no project UUID."
  err "Put the (non-secret) Secrets Manager project UUID in .bws-project, then retry."
  exit 66
fi

# --- clear the bootstrap token no matter how we exit ---
cleanup() { unset BWS_ACCESS_TOKEN 2>/dev/null || true; }
trap cleanup EXIT INT TERM

# --- read the bootstrap token from Windows Credential Manager ---
CRED_PS1="$SCRIPT_DIR/cred-get.ps1"
if [ ! -f "$CRED_PS1" ]; then
  err "helper not found: $CRED_PS1"
  exit 67
fi
CRED_PS1_WIN="$(cygpath -w "$CRED_PS1")"

set +e
BWS_ACCESS_TOKEN="$(powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$CRED_PS1_WIN" "$CRED_TARGET")"
cred_rc=$?
set -e
if [ "$cred_rc" -ne 0 ] || [ -z "${BWS_ACCESS_TOKEN:-}" ]; then
  err "could not read secret NAME '$CRED_TARGET' from provider 'Windows Credential Manager' (cred-get rc=$cred_rc)."
  err "store it first: scripts/set-bws-token.ps1 (or the Credential Manager GUI)."
  exit 68
fi
export BWS_ACCESS_TOKEN

# --- resolve the child-environment mode (default: isolated) ---
env_mode="${BWS_ENV_MODE:-}"
if [ -z "$env_mode" ]; then
  if [ "${BWS_INHERIT_ENV:-0}" = "1" ]; then env_mode="full"; else env_mode="isolated"; fi
fi

# Allowlist for "minimal" mode. Names match case-insensitively against the live
# environment. To fix a "command/var not found" failure under minimal mode, ADD
# the variable NAME here (do NOT fall back to full inherit). BWS_ACCESS_TOKEN is
# kept so bws can authenticate; bws strips it from the child itself.
BWS_ENV_ALLOWLIST="${BWS_ENV_ALLOWLIST:-PATH SystemRoot APPDATA LOCALAPPDATA USERPROFILE TEMP TMP HOME ComSpec PROGRAMFILES PATHEXT windir BWS_ACCESS_TOKEN}"

# --- run the wrapped command with vault-injected secrets ---
set +e
case "$env_mode" in
  full)
    bws run --project-id "$BWS_PROJECT_ID" -- "$@"
    run_rc=$?
    ;;
  minimal)
    # Build the child environment EXPLICITLY (true allowlist). Collect only the
    # allowlisted vars from the live env (matched case-insensitively, original
    # casing preserved), then run bws with EXACTLY those via `env -i`. Inherit
    # mode (no --no-inherit-env) so bws hands the allowlist to the child; bws
    # then removes BWS_ACCESS_TOKEN and injects the vault secrets, so the child
    # sees {allowlist} + secrets and never the token.
    #   - Why not --no-inherit-env: it ignores this allowlist and would give the
    #     child only bws's hardcoded PATH/SystemRoot/ComSpec/windir.
    #   - Why env -i (not unset-prune): a true include-list, so vars with names
    #     bash can't unset (e.g. "ProgramFiles(x86)", hyphenated names) and other
    #     stray exports never leak through.
    minimal_env=()
    while IFS='=' read -r _en _ev; do
      for _w in $BWS_ENV_ALLOWLIST; do
        if [ "${_en,,}" = "${_w,,}" ]; then minimal_env+=( "$_en=$_ev" ); break; fi
      done
    done < <(env)
    env -i "${minimal_env[@]}" bws run --project-id "$BWS_PROJECT_ID" -- "$@"
    run_rc=$?
    ;;
  isolated|*)
    bws run --project-id "$BWS_PROJECT_ID" --no-inherit-env -- "$@"
    run_rc=$?
    ;;
esac
set -e

if [ "$run_rc" -ne 0 ]; then
  err "wrapped command exited $run_rc — '$1' [mode $env_mode, project $BWS_PROJECT_ID, provider Bitwarden Secrets Manager]"
fi
exit "$run_rc"
