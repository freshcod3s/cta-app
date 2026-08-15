# Console runsheet — ASO tranche 1 (target entry: Fri Aug 7)

CTA-ASO-1, staged 2026-08-02. Field-by-field entry for the Google Play
Console session. Executable by Joe manually OR driven via the Chrome
extension under the standing console rules (writes are Joe's; the final
publish click is Joe's in every case).

> **Read first**
> - **The app name is LOCKED to "Congress Trade Alerts" (21/30)** — matching
>   congresstradealerts.com and the other properties named for it, per Product
>   Invariant 10. "Congress Stock Trade Alerts" is rejected and must not be
>   re-staged from this runsheet or anywhere else.
> - ~~The name row in section 1 is therefore a no-op against the live listing,
>   which already renders "Congress Trade Alerts". Separately, the rejected
>   name is still sitting in the Play pending change set from the 2026-08-09
>   vc7 commit (approved, held by managed publishing, not serving); clearing
>   it there is a Console decision, not a consequence of this file.~~
>   **CORRECTED 2026-08-10 — the struck text above is false.** The pending set
>   was PUBLISHED on 2026-08-10, so the live listing now serves the rejected
>   27-character name. The name row is not a no-op: it is the corrective edit.
>   That edit was saved in Console the same day and is sitting under "Changes
>   not yet submitted for review"; sending it is Joe's Console step.
> - All edits below PARK under managed publishing (it is ON for this app).
>   Nothing goes live until Joe clicks publish, and Google may re-review
>   first.
> - **A title change may trigger a listing re-review.** Expect "Changes in
>   review" rather than instant staging. The current live listing stays up
>   throughout — no availability risk.
> - App: **Congress Trade Alerts** (`com.congresstradealerts.cta`), Play
>   Console → the CTA app only. Nothing in this runsheet touches release
>   tracks, payments, Data Safety, or any other app.
> - Every paste below comes from `store/google-play/metadata.txt` at the
>   repo's master HEAD. Do not retype by hand — copy from the file.
> - If any field shows an unexpected char counter, a new required
>   declaration, or any sign that saving would push an unreleased change
>   live: STOP, screenshot, report.

## 1. Main store listing — text fields

Console page: **Grow users → Store presence → Main store listing**

| Field | Action | Value |
|---|---|---|
| App name | Leave as-is | `Congress Trade Alerts` (counter must read 21/30). Reverted 2026-08-10; this now matches the serving listing, so there is nothing to type. |
| Short description | Replace | `Track House and Senate stock trades with alerts on new STOCK Act disclosures.` (counter must read 77/80) |
| Full description | Replace entire contents | The FULL_DESCRIPTION block in `store/google-play/metadata.txt` — from "Congress Trade Alerts tracks the stock transactions..." through "...Open source under the AGPL-3.0 license." (counter must read 2516/4000) |

Verification before saving: the description's Privacy section must be
byte-identical to what is live today (it is carried verbatim), and the
final line must be "Free. No ads. No account required. Open source under
the AGPL-3.0 license."

## 2. Main store listing — graphics

Same Console page, Graphics section.

| Asset | Action | File |
|---|---|---|
| Feature graphic | Replace | `store/google-play/aso/feature-graphic-1024x500.png` (1024x500 PNG) |
| Phone screenshots | Replace all with these six, in this order | `store/google-play/aso/final/screenshot-01.png` … `screenshot-06.png` (each 1080x1920 PNG) |

Order matters — it is the narrative: 1 feed, 2 alerts, 3 follow, 4
committee-overlap flags, 5 official filing, 6 free/no-ads/no-account.
Delete the old vc4-era screenshots after uploading (Console keeps them
until removed). App icon is NOT part of this tranche — do not touch it.

## 3. Save and park

1. Click **Save** on Main store listing. Expect either "Saved" or a
   review-required banner.
2. Go to **Publishing overview**. The changes should appear under
   "Changes ready to publish" (or "Changes in review" if the title change
   triggered re-review).
3. **STOP HERE.** Do not click "Publish changes". The publish click is
   Joe's, at a time of his choosing, after re-review clears if one runs.

## 4. What is NOT in this tranche

- No release-track actions, no new build, no versionCode change.
- No Data Safety edits (the current declaration already matches the
  carried Privacy text).
- No category, contact-details, or app-content changes
  (category stays Finance).
- No icon change.
- `push-cta-listing.mjs` (untracked, repo root) must NOT be used for this
  — listing edits are Console-only for this enforcement-flagged app.

## 5. Substitutions vs the ticket (for the record)

- Screenshot 5 headline is **"Open The Official .gov Filing"**, substituted
  from the ticket's "Open Every Official Filing": 91% of historical rows
  serve no source link yet (worker-side backfill gap, flagged separately),
  so "Every" fails the fact audit. Evidence: `docs/aso/fact-audit-tranche1.md`
  rows 14 and 28.
- Screenshot 4 needed NO substitution — committee-overlap flags are a
  shipped, visible surface (Conflicts screen, Tier-B chips).

## 6. After Joe publishes (whenever that is)

- Re-fetch the public listing page and confirm the new title renders and
  the six screenshots appear in order.
- The serving listing is the proof — Console "saved" is not "live".
