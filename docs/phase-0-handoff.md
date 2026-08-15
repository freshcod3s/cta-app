# Phase-0 Handoff — Android-thread terminal

Cross-thread blockers carried out of the `android-hardening` branch.
Each item enumerates target chat, current status, and unblock criteria.
The android-hardening branch is functionally complete; the items below
are not blocked by mobile code -- they're blocked by upstream LLC /
infrastructure / web-side work.

**OPSEC posture:** field-path-only. Placeholders `<BRAND_DOMAIN>`,
`<LLC_NAME>`, `<DEV_HANDLE>`, `<SERVICE_ACCOUNT_EMAIL>`,
`<PLAY_CONSOLE_APP_ID>`, `<SUPPORT_EMAIL>` substitute for Joe-side
literals at execution time.

---

## Item 3 — Play Console org account on `<LLC_NAME>` seller identity

| Field | Value |
|---|---|
| Target chat | LLC chat |
| Current status | BLOCKED on D-U-N-S issuance |
| Unblock criteria | D-U-N-S case 10436878 complete + Google Play Console in-place upgrade from individual `<DEV_HANDLE>` account to `<LLC_NAME>` seller identity |

References:
- D-U-N-S case 10436878 submitted 2026-05-20 with iPostal1 address per
  `docs/launch/canonical_address.md`. Typical 7-10 business day
  turnaround.
- LLC migration sequence per `CLAUDE.md` Decisions Log: D-U-N-S ->
  Apple Org -> Google Play. Google Play upgrade happens after Apple
  Org migration completes.
- Existing `<DEV_HANDLE>` Play account: not yet provisioned (per
  `CLAUDE.md` Decisions Log 2026-05-21 — Google Play Console
  enrollment deferred until LLC identity is in hand).

Downstream impact: Item 4 chains directly on this. Item 7 is
independent.

---

## Item 4 — Play service-account-key.json provisioning

| Field | Value |
|---|---|
| Target chat | LLC chat (chained on Item 3) |
| Current status | BLOCKED on Item 3 |
| Unblock criteria | Item 3 complete, then Play Console -> Settings -> API access -> Service accounts -> create + role grant per `docs/android-internal-testing.md` section 3 |

References:
- File destination: `store/google-play/service-account-key.json` per
  `eas.json:submit.production.android.serviceAccountKeyPath`.
- Full click-path runbook: `docs/android-internal-testing.md` section 3
  (subsections 3a through 3f).
- Required Play Console permissions (per section 3d step 6):
  - Release to production, exclude devices, and use Play App Signing
  - Release apps to testing tracks
  - Manage testing tracks and edit tester lists
  - View app information and download bulk reports
- `.gitignore` verification step: `docs/android-internal-testing.md`
  section 3f. The key file must never land in git history.

Downstream impact: blocks the first
`eas submit -p android --profile production` invocation.

---

## Item 7 — Privacy policy URL live with Data Safety field-set

| Field | Value |
|---|---|
| Target chat | `<BRAND_DOMAIN>` site chat |
| Current status | NOT STARTED |
| Unblock criteria | `<BRAND_DOMAIN>/privacy` live with the field-set per `docs/data-safety-form.md` |

References:
- Existing privacy surface lives at `congress-trade-alerts/src/privacy.html`
  per `docs/launch/canonical_address.md` row 3. The privacy URL gets
  edited on the worker repo, not a new file in cta-app.
- Required field-set (per `docs/data-safety-form.md`):
  - Data collection enumeration:
    - Device IDs (Expo push token; row 1 of the per-data-type schema)
    - Other user-generated content (`subscription_prefs.members[]`;
      row 2)
    - App activity > Other actions (push engagement `{trade_id}` taps;
      row 3)
  - Data sharing: explicit "no third-party sharing" declaration.
  - Encryption in transit: HTTPS declaration.
  - Encryption at rest: secure-store / keystore declaration for push
    token; "not encrypted" tolerated for trade-data cache because it's
    public data.
  - Deletion mechanism:
    - In-app: Settings -> push off triggers
      `lib/push/api.ts:107-140` DELETE.
    - Account-level: `<SUPPORT_EMAIL>` contact path (CAN-SPAM contact
      surface; placeholder until LLC identity surfaces a different
      address).
- Per `CLAUDE.md` three-surface email rule: when `<SUPPORT_EMAIL>`
  appears on the privacy page, it must match the same value mirrored
  in `app/(drawer)/about.tsx` PRESS_EMAIL constant + worker repo
  `privacy.html` + worker repo `press.ts`. Any change updates all
  three or the surfaces drift.

Downstream impact: Play Console rejects submission without a reachable
privacy URL containing this field-set.

---

## Out of this handoff

The android-hardening branch handled everything mobile-code-side. The
following are explicitly OUT of this handoff (done or post-launch):

- **Item 1 + Item 2** — real adaptive monochrome icon + real notification
  status-bar icon. DEFERRED-POST-LAUNCH per Joe ruling 2026-05-27 (T3).
  Design-side work; not launch-gating.
- **Item 5** — T4 channel-importance bump (DEFAULT -> HIGH). DONE on
  `android-hardening` branch commit a941dcf.
- **Item 6** — EAS-managed keystore backup. DONE 2026-05-27 (Phase-0
  item 6 confirmed via STEP 1 of the terminal sequence; marker landed
  in commit d760125 against `docs/android-launch-checklist.md`).

---

## Sequencing summary

| Step | Item | Blocked by | Parallel with |
|---|---|---|---|
| 1 | Item 3 — Play Console org upgrade | D-U-N-S issuance (case 10436878) + Apple Org migration | Item 7 |
| 2 | Item 4 — service-account JSON | Item 3 | -- |
| 3 | Item 7 — privacy URL | Web-side worker repo edit | Item 3 |

Earliest realistic first-submission window: gated by Item 3
(D-U-N-S 7-10 business days from 2026-05-20 submission) plus Apple
Org migration time. Item 7 can land in parallel and should not delay
the critical path.

---

Last validated: 2026-05-27 against branch `android-hardening` tip d760125.
