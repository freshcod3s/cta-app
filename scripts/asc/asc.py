"""Minimal App Store Connect API client. ES256 JWT from a local .p8.
Never prints key material. Usage: python asc.py <method> <path> [json-body-file]
Env: ASC_KEY_PATH (p8 path), ASC_KEY_ID, ASC_ISSUER_ID.
"""
import json, os, sys, time
import jwt, requests

BASE = "https://api.appstoreconnect.apple.com"

def token():
    with open(os.environ["ASC_KEY_PATH"], "rb") as f:
        key = f.read()
    now = int(time.time())
    return jwt.encode(
        {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        key, algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"},
    )

def call(method, path, body=None, raw=None, ctype="application/json"):
    h = {"Authorization": f"Bearer {token()}"}
    if body is not None or raw is not None:
        h["Content-Type"] = ctype
    url = path if path.startswith("http") else BASE + path
    r = requests.request(method, url, headers=h, json=body if body is not None else None, data=raw, timeout=60)
    return r

if __name__ == "__main__":
    m, p = sys.argv[1], sys.argv[2]
    body = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else None
    r = call(m, p, body)
    print(r.status_code)
    try:
        print(json.dumps(r.json(), indent=1))
    except Exception:
        print(r.text[:2000])
