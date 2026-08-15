# Cross-chat merge broadcast template

Fill this template after every `master` merge and paste it into every
other active CC chat (iOS thread, brand-site thread, worker thread,
etc.) BEFORE further work in those chats begins. Promoted from the
iOS broadcast pattern in the 2026-06-04 session into a standing
convention; codified in `CLAUDE.md` Section C of the workflow
conventions. The recipient chat runs its own Section A preflight
against the broadcast SHA before picking up tasks.

When to fill:
- Immediately after any `git push origin master`.
- Skip only if the merge is purely doc-only AND doesn't touch any
  shared code surfaces (rare; when in doubt, broadcast).

How to fill:
- Replace every `<placeholder>` with concrete values.
- Group commits by track (Track A / Track B / Track C / Gap N / etc.)
  matching how the work was scoped, OR by feature scope when the
  dispatch wasn't track-oriented.
- One line per commit: `<SHA>  <one-line message>` (no commit body).
- New-deps list: include only deps added in this delta, not the
  full `package.json` dependency tree.
- Conflict-surface list: focus on files where parallel branches are
  likely to have their own edits. Skip files only touched in
  doc-only ways.

---

## Empty template

```
master @ <SHA> (cta-app). <N> commits past <prior sync SHA>. Rebase
<other-branch> (currently <ITS SHA>) against master before any further
shared-code work; the surfaces below are cross-platform and will land
into your tree on rebase.

Shipped since your last sync:

  <Feature / Track group>:
    <SHA>  <one-line commit message>
    <SHA>  <one-line commit message>
    ...

  <Another group>:
    <SHA>  <one-line commit message>
    ...

  Docs:
    <SHA>  <one-line commit message>

New deps you will see on rebase:
    <package-name>  (added in <SHA> for <one-line reason>)

Files most likely to touch the conflict surface on rebase:
    <file path>  -- <one-line reason>
    <file path>  -- <one-line reason>

Orphaned-branch SHAs you may see referenced in older messages:
<orphaned-branch-name-1> (<SHA>) and <orphaned-branch-name-2> (<SHA>)
were deleted on <YYYY-MM-DD>; the work is on master under the new
SHAs above. Originals live in git reflog for ~90 days if recovery
is needed.

Rebase command:
    git fetch origin
    git checkout <other-branch>
    git rebase origin/master

Expect conflicts in the files listed above; the rest should rebase
cleanly.
```

---

## Canonical working example -- 2026-06-04 iOS broadcast

The Android thread merged Tracks B + C + Gap 1 + Gap 19 + theme lock
into `master` at SHA `a2b3511`. Master had moved 14 commits past
`22b834d` since the iOS thread's last sync at `ios-hardening` @
`5b35242`. The broadcast generated:

```
master @ a2b3511 (cta-app). 14 commits past 22b834d. Rebase
ios-hardening (currently 5b35242) against master before any further
shared-code work; the surfaces below are cross-platform and will
land into your tree on rebase.

Shipped on master since your last sync point:

  Track B (drawer richness):
    60c7da9  feat(faq): FAQ accordion -- 6 STOCK Act Q-and-A
    0fa69c0  feat(press): Press screen + media-kit link
    30055a9  feat(daily-dive): 7-day accountability digest
    c715680  feat(nav): wire those three into the drawer

  Track C (trade detail richness):
    954f40e  feat(news): NewsSection + worker news contract
    b773af0  feat(conflict): ConflictScore + conflict-detector contract
    2e682cd  feat(share): share-a-trade + copy link (expo-clipboard)
    bc1ae86  feat(trade-detail): compose all three into app/trade/[id].tsx

  Other:
    ae1283d  feat(billing): Upgrade button -> external Stripe Checkout
    1e3f286  feat(committees): committee detail page + data layer
    8cc52c2  feat(committees): tappable committee chips + wiring
    a2b3511  fix(theme): lock dark mode v1 per Product Invariant #6

  Docs:
    4452635  docs(parity): brand-parity-gaps post-A+B+C+Gap1
    9edb36e  docs(parity): mark Gap #19 closed

New deps you will see on rebase:
    expo-clipboard (added for Share Copy-Link affordance in 2e682cd)

Files most likely to touch ios-hardening conflict surface:
    app.json                 -- theme lock may touch userInterfaceStyle
    app/_layout.tsx          -- drawer wiring extended
    app/trade/[id].tsx       -- composition extended
    features/trades/components/CommitteeChips.tsx
                             -- props signature changed

Two orphaned-branch SHAs you may see referenced in older messages:
parallel-track-c-windows (a9c95a2) and feat/trade-detail-richness
(8306b4a) were deleted 2026-06-04; work is on master under the new
SHAs above.

Rebase command:
    git fetch origin
    git checkout ios-hardening
    git rebase origin/master
```

This is what a filled broadcast looks like end-to-end. Use it as the
shape reference when filling new broadcasts; do not copy its specific
SHAs / file paths / deps -- those are example-only and apply to the
2026-06-04 session.
