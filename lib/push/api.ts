// Backend client for the CTA-31 push token endpoints (live at
// https://congresstradealerts.com/api/push/token).
//
// Wire contract (CTA-31 commit 99ef4ce):
//   POST   /api/push/token   { token, platform, subscription_prefs? }
//                            -> 200 { ok: true, registered: boolean }
//                            -> 400 { ok: false, error: <code> }
//                            -> 429 { ok: false, error: 'rate_limited' }
//   DELETE /api/push/token   { token }
//                            -> 200 { ok: true, deleted: boolean }
//                            -> 400 { ok: false, error: <code> }
//
// Throws PushApiError on any non-2xx so callers can branch on .code
// instead of digging through .response.

import { API_BASE_URL } from "@/lib/api/client";

export type PushApiErrorCode =
  | "invalid_token"
  | "invalid_platform"
  | "invalid_subscription_prefs"
  | "invalid_json"
  | "rate_limited"
  | "network"
  | "unknown";

export class PushApiError extends Error {
  constructor(
    public code: PushApiErrorCode,
    public status: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "PushApiError";
  }
}

type RegisterEnvelope = { ok: true; registered: boolean };
type DeleteEnvelope = { ok: true; deleted: boolean };
type ErrorEnvelope = { ok: false; error: string };

const KNOWN_ERROR_CODES = new Set<PushApiErrorCode>([
  "invalid_token",
  "invalid_platform",
  "invalid_subscription_prefs",
  "invalid_json",
  "rate_limited",
]);

function logDev(...args: unknown[]) {
  // __DEV__ is React Native's global. Production builds tree-shake the
  // body away when this is false.
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // eslint-disable-next-line no-console
    console.log("[push.api]", ...args);
  }
}

function asErrorCode(raw: string | undefined): PushApiErrorCode {
  if (raw && KNOWN_ERROR_CODES.has(raw as PushApiErrorCode)) {
    return raw as PushApiErrorCode;
  }
  return "unknown";
}

export async function postPushToken(
  token: string,
  platform: "ios" | "android",
  subscriptionPrefs?: Record<string, unknown>,
): Promise<{ registered: boolean }> {
  const body: Record<string, unknown> = { token, platform };
  if (subscriptionPrefs) body.subscription_prefs = subscriptionPrefs;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/push/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    logDev("POST network error", e);
    throw new PushApiError("network", 0, String(e));
  }

  let json: RegisterEnvelope | ErrorEnvelope;
  try {
    json = (await res.json()) as RegisterEnvelope | ErrorEnvelope;
  } catch (e) {
    logDev("POST parse error", res.status, e);
    throw new PushApiError("unknown", res.status, "non_json_response");
  }

  logDev("POST", res.status, json);

  if (!res.ok || json.ok === false) {
    const code = asErrorCode(
      json.ok === false ? (json as ErrorEnvelope).error : undefined,
    );
    throw new PushApiError(code, res.status);
  }

  return { registered: (json as RegisterEnvelope).registered };
}

export async function deletePushToken(
  token: string,
): Promise<{ deleted: boolean }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/push/token`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    logDev("DELETE network error", e);
    throw new PushApiError("network", 0, String(e));
  }

  let json: DeleteEnvelope | ErrorEnvelope;
  try {
    json = (await res.json()) as DeleteEnvelope | ErrorEnvelope;
  } catch (e) {
    logDev("DELETE parse error", res.status, e);
    throw new PushApiError("unknown", res.status, "non_json_response");
  }

  logDev("DELETE", res.status, json);

  if (!res.ok || json.ok === false) {
    const code = asErrorCode(
      json.ok === false ? (json as ErrorEnvelope).error : undefined,
    );
    throw new PushApiError(code, res.status);
  }

  return { deleted: (json as DeleteEnvelope).deleted };
}
