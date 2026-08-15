"""Create the App Review contact detail for a version.

Names come ONLY from ASC_CONTACT_FIRST / ASC_CONTACT_LAST -- resolved from the
process env first, then from Windows Credential Manager GENERIC entries with
those exact target names. The values are never printed, logged, or written by
this script; output refers to them as [NAME]. Fails loud (exit 2, nothing sent)
if either cannot be resolved.

Usage: review_contact.py <appStoreVersionId> <notes-file>
Optional env: ASC_CONTACT_EMAIL, ASC_CONTACT_PHONE (defaults: LLC support line).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from asc import call


def _credman(target):
    """Read a Windows Credential Manager GENERIC credential's secret (CredReadW).
    Value-blind: returned to the caller only, never printed."""
    import ctypes, ctypes.wintypes as w

    class CRED(ctypes.Structure):
        _fields_ = [("Flags", w.DWORD), ("Type", w.DWORD), ("TargetName", w.LPWSTR),
                    ("Comment", w.LPWSTR), ("LastWritten", w.FILETIME),
                    ("CredentialBlobSize", w.DWORD), ("CredentialBlob", ctypes.POINTER(ctypes.c_byte)),
                    ("Persist", w.DWORD), ("AttributeCount", w.DWORD), ("Attributes", ctypes.c_void_p),
                    ("TargetAlias", w.LPWSTR), ("UserName", w.LPWSTR)]

    adv = ctypes.windll.advapi32
    pc = ctypes.POINTER(CRED)()
    if not adv.CredReadW(target, 1, 0, ctypes.byref(pc)):
        return ""
    try:
        n = pc.contents.CredentialBlobSize
        raw = ctypes.string_at(pc.contents.CredentialBlob, n)
        # cmdkey / Credential Manager GUI store the secret as UTF-16-LE.
        return raw.decode("utf-16-le", errors="ignore").strip("\x00").strip()
    finally:
        adv.CredFree(pc)


def need(name):
    v = os.environ.get(name, "").strip()
    src = "env"
    if not v and os.name == "nt":
        v = _credman(name)
        src = "credman"
    if not v:
        sys.stderr.write(
            f"FATAL: {name} not found -- not in this process env and no Windows Credential "
            f"Manager generic entry named '{name}'. Nothing was sent.\n")
        sys.exit(2)
    sys.stderr.write(f"  {name}: resolved from {src} (value not shown)\n")
    return v


first, last = need("ASC_CONTACT_FIRST"), need("ASC_CONTACT_LAST")
version_id, notes_path = sys.argv[1], sys.argv[2]
notes = open(notes_path, encoding="utf-8").read()

body = {"data": {"type": "appStoreReviewDetails",
    "attributes": {"contactFirstName": first, "contactLastName": last,
                   "contactEmail": os.environ.get("ASC_CONTACT_EMAIL", "hello@freshcod3s.com"),
                   "contactPhone": os.environ.get("ASC_CONTACT_PHONE", "+13045973440"),
                   "demoAccountRequired": False, "notes": notes},
    "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": version_id}}}}}
r = call("POST", "/v1/appStoreReviewDetails", body)
print("POST /v1/appStoreReviewDetails ->", r.status_code)
if r.status_code == 201:
    a = r.json()["data"]["attributes"]
    print("  id:", r.json()["data"]["id"])
    print("  contactFirstName: [NAME] (len %d)  contactLastName: [NAME] (len %d)"
          % (len(a.get("contactFirstName") or ""), len(a.get("contactLastName") or "")))
    print("  contactEmail:", a.get("contactEmail"), " contactPhone:", a.get("contactPhone"),
          " demoAccountRequired:", a.get("demoAccountRequired"), " notes_len:", len(a.get("notes") or ""))
else:
    print(json.dumps(r.json(), indent=1)[:1500])
