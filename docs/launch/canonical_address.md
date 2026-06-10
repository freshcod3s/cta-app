# Canonical Address Binder

**Locked:** 2026-05-22. Single source of truth for the company's physical-address string and its propagation across product surfaces. Companion to the D&B gate test (single-surface submission first, fan-out only after acceptance).

## Locked string

| Field | Value |
|---|---|
| Street | `117 State Route 34` |
| PMB | `PMB 7027` |
| City | `Hurricane` |
| State | `WV` |
| ZIP | `25526` |
| Phone | `304-597-3440` |

**Single-line form-field rendering — PRIMARY (form-fill default)** — use in D-U-N-S, SOS, Mercury, Apple, anywhere one string is expected:

```
117 State Route 34 PMB 7027, Hurricane, WV 25526
```

**Single-line, no-comma — SECONDARY (tolerated only)** — use only when a specific form's data-entry rules require dropping the city/state comma; rare, since most structured forms use separate city/state fields:

```
117 State Route 34 PMB 7027, Hurricane WV 25526
```

**Three-line postal block rendering** — use in CAN-SPAM email footers, postal mail blocks:

```
<LLC name>
117 State Route 34 PMB 7027
Hurricane, WV 25526
```

The first line of the 3-line block is the registered LLC name (kept out of this versioned file per OPSEC scrubber posture; substitute mentally when reading). Both the primary single-line and the 3-line postal block use the comma between city and state (USPS / postal convention); the no-comma single-line is a tolerated secondary form for forms that explicitly forbid the comma.

## Format rules

- Mixed case, never all caps.
- "State Route 34" — never `SR 34` or `Rt 34`.
- "PMB 7027" — never `#7027`, `Suite 7027`, or `Box 7027`.
- 5-digit ZIP only — never ZIP+4.
- State: `WV` — never `West Virginia` in address lines.
- Phone: `304-597-3440` — no parens, dash-separated.

## Propagation rule (HEDGE — DO NOT VIOLATE)

This string is the D&B gate test address. It currently lives on **one** production surface: the CTA Worker's `SENDER_POSTAL_ADDRESS` secret (deployed 2026-05-19 for CAN-SPAM compliance on email footers — predates this binder).

**Honest accounting:** the CAN-SPAM footer is a public surface. Anyone on the CTA waitlist has received an email containing this address since 2026-05-19. The address is therefore **not pre-public** — D&B can technically discover it via OSINT before any formal submission. The hedge below applies FORWARD to AAO / Mercury / Apple / IRS, not to the existing email surface.

**No further propagation until D&B accepts** a fresh D-U-N-S submission with this address as physical HQ.

- D&B accepts → propagate to remaining surfaces in lockstep with the AAO filing.
- D&B rejects → pivot to commercial-address strategy. Only the Worker secret needs to be reverted (or kept; CAN-SPAM § 7704(a)(5) doesn't require the sender address to match HQ-of-record).

## Surface inventory

### Already on iPostal1

| # | Surface | Where | Since |
|---|---|---|---|
| 1 | CTA Worker `SENDER_POSTAL_ADDRESS` secret | Set via `wrangler secret put` in the CTA Worker repo; consumed by `src/alerts/email.ts` for CAN-SPAM footers | 2026-05-19 |

### Pre-D&B (do not touch until D&B accepts)

In-repo surfaces:

| # | Surface | Path | Notes |
|---|---|---|---|
| 2 | cta-app About screen | `app/(drawer)/about.tsx` | No physical address rendered today (press email only). If address is ever added, lives here. |
| 3 | CTA Worker `/privacy` page | `congress-trade-alerts/src/privacy.html` | Audit at propagation time |
| 4 | CTA Worker `/terms` page | `congress-trade-alerts/src/terms.html` | Audit at propagation time |
| 5 | CTA Worker `/press` route | `congress-trade-alerts/src/routes/press.ts` | Audit at propagation time |
| 6 | Brand site About page | brand-site Astro repo, `src/pages/about.astro` | Audit at propagation time |
| 7 | Brand site Contact page | brand-site Astro repo, `src/pages/contact.astro` | Audit at propagation time |
| 8 | Brand site Privacy / CTA | brand-site Astro repo, `src/pages/privacy/cta/` | Placeholder today; full policy will include physical |
| 9 | Brand site Privacy / Track Lobby | brand-site Astro repo, `src/pages/privacy/tracklobby/` | Placeholder today; full policy will include physical |
| 10 | Formation docs (Culloden/Beckley refs) | formation docs umbrella: `00_START_HERE.md`, `STATUS.md`, `01_llc_status/STATUS.md` | Reference old addresses; update post-AAO |
| 11 | CTA Worker repo umbrella canonical | `congress-trade-alerts/CLAUDE.md:86-103` | Mirrors this binder; keep in sync |
| 12 | Brand umbrella canonical | Brand umbrella CLAUDE.md (lines ~100-123) | Mirrors this binder; keep in sync |

External surfaces (not in any repo):

| # | Surface | Current | Action |
|---|---|---|---|
| 13 | D&B D-U-N-S | Case 10436878 submitted with Culloden (2026-05-20); pending iResearch cancellation | **GATE TEST:** fresh submission with iPostal1. Paste sheet at `06_duns/DUNS-paste-sheet-iPostal1.md` in the formation umbrella |
| 14 | WV SOS Principal Office | Beckley (formation address) | File AAO post-D&B-acceptance |
| 15 | Operating Agreement | Beckley (original) | Notarize Amendment No. 2 (Beckley → iPostal1) post-D&B |
| 16 | IRS Form 8822-B | SS-4 has a private Culloden address (intentionally private per OPSEC) | File **only if updating** — current SS-4 value is intentional |
| 17 | Mercury bank | Verify at portal check | Update post-D&B |
| 18 | Apple Developer portal | Verify at portal check | Update pre-Org-conversion (post-D&B) |
| 19 | App Store Connect | TBD | Set at first listing submission |
| 20 | Google Play Console | TBD | Set at first listing submission |
| 21 | Beehiiv newsletter | TBD | Set at signup; CAN-SPAM compliant |
| 22 | Cloudflare account billing | Unknown | Verify; update if needed |
| 23 | EU DSA fields (at EU launch) | N/A | Apple auto-pulls D&B address; ensure D&B = iPostal1 before EU launch |

## Maintenance protocol

When a surface flips from "pre-D&B" to "deployed":

1. Update its row above with `(deployed YYYY-MM-DD)`.
2. After each propagation round, grep for stale strings:
   ```
   rg -i "Culloden|220 Howard|Beckley|25510|25801" ~/Projects/
   ```
   Surface any hits in a follow-up commit.

If this string ever changes (D&B rejects → pivot, or future move):

1. Update **this file first**.
2. Update every "Already on iPostal1" surface in lockstep.
3. Re-validate every "pre-D&B" surface remains pre-propagation.

## Email-routing context

A verified Cloudflare Email Routing destination for the brand domain has existed since 2026-05-12. Active aliases on the brand domain (all forwarding to the same verified destination):

- `press@` (since 2026-05-12)
- `hello@` (since 2026-05-12)
- `privacy@` (since 2026-05-12)
- `developer@` (since 2026-05-22, per Apple Org work-email requirement — rule `7c336e96808148a8a3c10095fa8b0cdd`)
- Catch-all (forwards everything else)

## OPSEC note

The SS-4 physical address (Culloden) is intentionally private and differs from any public-facing address. **Do not propagate iPostal1 to IRS unless the OPSEC posture changes.** The OA currently recites Beckley; Amendment No. 2 changes it to iPostal1 post-D&B.

The LLC name, brand domain, and Cloudflare routing destination email are kept out of this versioned binder per the standing OPSEC posture (the brand-name / destination-email scrubber on file writes — `~/.claude/scripts/opsec-scrub.sh`). Substitute mentally when reading.
