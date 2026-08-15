"""Upload screenshots to one ASC screenshot set, in filename order.
Usage: upload_screenshots.py <appStoreVersionLocalizationId> <displayType> <dir>
Reads ASC_* env like asc.py. Reports per-file acceptance."""
import hashlib, os, sys, glob, json
sys.path.insert(0, os.path.dirname(__file__))
from asc import call

loc_id, display_type, d = sys.argv[1], sys.argv[2], sys.argv[3]

# 1. find-or-create the set
r = call("GET", f"/v1/appStoreVersionLocalizations/{loc_id}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType")
sets = [s for s in r.json()["data"] if s["attributes"]["screenshotDisplayType"] == display_type]
if sets:
    set_id = sets[0]["id"]; print(f"set exists: {set_id}")
else:
    r = call("POST", "/v1/appScreenshotSets", {"data": {"type": "appScreenshotSets",
        "attributes": {"screenshotDisplayType": display_type},
        "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": loc_id}}}}})
    print("create set:", r.status_code); r.raise_for_status()
    set_id = r.json()["data"]["id"]; print(f"set created: {set_id}")

results = []
for path in sorted(glob.glob(os.path.join(d, "*.png"))):
    name = os.path.basename(path); data = open(path, "rb").read()
    md5 = hashlib.md5(data).hexdigest()
    # 2. reserve
    r = call("POST", "/v1/appScreenshots", {"data": {"type": "appScreenshots",
        "attributes": {"fileName": name, "fileSize": len(data)},
        "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}}}})
    if r.status_code != 201:
        results.append((name, f"reserve FAILED {r.status_code}: {r.text[:200]}")); continue
    ss = r.json()["data"]; ss_id = ss["id"]
    ops = ss["attributes"]["uploadOperations"]
    # 3. upload each part
    import requests
    ok = True
    for op in ops:
        chunk = data[op["offset"]: op["offset"] + op["length"]]
        hdrs = {h["name"]: h["value"] for h in op["requestHeaders"]}
        ur = requests.request(op["method"], op["url"], headers=hdrs, data=chunk, timeout=120)
        if ur.status_code not in (200, 201, 204):
            ok = False; results.append((name, f"part upload FAILED {ur.status_code}")); break
    if not ok: continue
    # 4. commit
    r = call("PATCH", f"/v1/appScreenshots/{ss_id}", {"data": {"type": "appScreenshots", "id": ss_id,
        "attributes": {"uploaded": True, "sourceFileChecksum": md5}}})
    st = r.json().get("data", {}).get("attributes", {}).get("assetDeliveryState", {}) if r.status_code == 200 else {}
    results.append((name, f"commit {r.status_code}, state={st.get('state')}, errors={st.get('errors')}"))

for n, s in results: print(f"  {n}: {s}")
print(json.dumps({"set_id": set_id, "count": len(results)}))
