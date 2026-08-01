// Trade Constellation layout math (web parity: aggregateTrades +
// rankCommitteesByExposure + the d3-force settle, ported to plain JS so the
// RN SVG port carries NO d3 dependency -- decision (b) from the Phase-0
// recon). Pure + deterministic: same input -> same layout (no Math.random;
// angular jitter is index-derived), so it's testable and stable across
// re-renders.
//
// Model: one bubble per ticker, sized by disclosed dollar volume (sqrt
// scale). Committees the member trades into become concentric RINGS
// (ranked by overlap). A conflicted bubble seeds onto its committee's ring
// and draws a thin edge to it; non-conflicted bubbles sit in the inner
// core. A short collision-relaxation pass separates overlaps while keeping
// each bubble pinned to its ring radius.
import type { TradeRecord } from "@/features/trades/api/types";
import type { CommitteeTreeNode } from "@/features/members/api/types";
import { committeeExposure } from "@/features/members/profileDerive";

// Ring palette (web parity: RING_COLORS).
export const RING_COLORS = [
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#22d3ee",
];

const NODE_CAP = 30; // mobile cap (web uses 30 mobile / 60 desktop)
const RING_CAP = 5; // fewer rings than web's 8 -- smaller canvas
const LABEL_CAP = 10; // label the top-N bubbles by disclosed value

export type CNodeConflict = {
  severity: "direct" | "adjacent";
  committee: string;
};

export type CNode = {
  key: string;
  ticker: string | null;
  label: string;
  totalHi: number;
  conflict: CNodeConflict | null;
  sector: string | null;
  x: number;
  y: number;
  r: number;
  ringIdx: number; // -1 = inner core
  targetR: number; // radius the relaxation attracts this node to
  labeled: boolean; // top-LABEL_CAP by value -> draw the ticker label
};

export type CRing = {
  name: string;
  radius: number;
  colorIdx: number;
  conflictCount: number;
  // The overflow "Other" ring (committees past RING_CAP). Not a real
  // committee name -- callers must not link it to /committee/{name}.
  isOther?: boolean;
};

export type Constellation = {
  nodes: CNode[];
  rings: CRing[];
  center: { x: number; y: number; r: number; label: string };
  moreCount: number;
  width: number;
  height: number;
};

function aggregate(
  trades: TradeRecord[],
): Omit<CNode, "x" | "y" | "r" | "ringIdx" | "targetR" | "labeled">[] {
  const byKey = new Map<
    string,
    {
      ticker: string | null;
      label: string;
      totalHi: number;
      conflict: CNodeConflict | null;
      sector: string | null;
    }
  >();
  for (const t of trades) {
    const ticker = (t.ticker ?? "").trim() || null;
    const key = ticker ?? (t.asset_name ?? "").trim() ?? "OTHER";
    if (!key) continue;
    const hi = t.amount_high && t.amount_high > 0 ? t.amount_high : 1000;
    const cur =
      byKey.get(key) ??
      {
        ticker,
        label: ticker ?? (t.asset_name ?? "OTHER").slice(0, 12),
        totalHi: 0,
        conflict: null as CNodeConflict | null,
        sector: null as string | null,
      };
    cur.totalHi += hi;
    if (!cur.sector && t.sector) cur.sector = t.sector;
    // keep the highest-severity conflict (direct overrides adjacent)
    const c = t.conflict;
    if (c && c.committee) {
      const sev = c.severity === "direct" ? "direct" : "adjacent";
      if (!cur.conflict || (sev === "direct" && cur.conflict.severity !== "direct")) {
        cur.conflict = { severity: sev, committee: c.committee };
      }
    }
    byKey.set(key, cur);
  }
  return Array.from(byKey.entries()).map(([key, v]) => ({ key, ...v }));
}

function committeeMatch(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
}

export function computeConstellation(
  trades: TradeRecord[],
  committeeTree: CommitteeTreeNode[],
  name: string,
  width: number,
  height: number,
): Constellation | null {
  if (!trades || trades.length === 0 || width < 40 || height < 40) return null;

  const agg = aggregate(trades).sort((a, b) => b.totalHi - a.totalHi);
  if (agg.length === 0) return null;
  const visible = agg.slice(0, NODE_CAP);
  const moreCount = Math.max(0, agg.length - visible.length);

  // Rings = the member's committees ranked by exposure -- UNFILTERED (web
  // parity: ranked.slice(0,8)). Zero-conflict committees still ring the
  // disc so the layout keeps structure instead of collapsing every bubble
  // into the core band. Committees past the cap fold into one "Other" ring
  // (web parity: otherComms), which catches conflicted bubbles whose
  // committee didn't make the visual cap.
  const ranked = committeeExposure(trades, committeeTree ?? []);
  const ringComms = ranked.slice(0, RING_CAP);
  const otherComms = ranked.slice(RING_CAP);
  const hasOther = otherComms.length > 0;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2 - 22;
  const ringCount = ringComms.length + (hasOther ? 1 : 0);

  // Ring band 0.35-0.95 of maxR (web parity: _sizeCanvas ringRadii).
  const ringRadius = (i: number) =>
    maxR * (0.35 + 0.6 * ((i + 1) / Math.max(ringCount, 1)));
  const rings: CRing[] = ringComms.map((c, i) => ({
    name: c.committee,
    radius: ringRadius(i),
    colorIdx: i % RING_COLORS.length,
    conflictCount: c.conflictCount,
  }));
  if (hasOther) {
    rings.push({
      name: "Other",
      radius: ringRadius(ringComms.length),
      colorIdx: ringComms.length % RING_COLORS.length,
      conflictCount: otherComms.reduce((s, c) => s + c.conflictCount, 0),
      isOther: true,
    });
  }

  // sqrt size scale toward the web's [9, 44], proportional to the disc.
  // (The old Math.min(26, maxR * 0.28) clamp meant 26 always won at phone
  // sizes -- the responsive term was dead code.)
  const maxHi = Math.max(...visible.map((n) => n.totalHi), 1);
  const rMin = 8;
  const rMax = Math.max(18, Math.min(44, maxR * 0.26));
  const sizeFor = (hi: number) =>
    rMin + (Math.sqrt(hi) / Math.sqrt(maxHi)) * (rMax - rMin);

  // Assign each node a ring (matched committee), the Other ring (conflicted
  // but past the ring cap, web parity), or the inner core (-1). `visible`
  // is sorted by value desc, so index < LABEL_CAP = the top bubbles.
  const withRing = visible.map((n, idx) => {
    let ringIdx = -1;
    if (n.conflict) {
      const found = ringComms.findIndex((c) =>
        committeeMatch(c.committee, n.conflict!.committee),
      );
      ringIdx = found >= 0 ? found : hasOther ? ringComms.length : -1;
    }
    return {
      ...n,
      ringIdx,
      r: sizeFor(n.totalHi),
      labeled: idx < LABEL_CAP,
    };
  });

  // Seed positions: group by ring, spread evenly by angle around the ring.
  const groups = new Map<number, typeof withRing>();
  for (const n of withRing) {
    const g = groups.get(n.ringIdx) ?? [];
    g.push(n);
    groups.set(n.ringIdx, g);
  }
  const GOLDEN = 2.399963; // golden angle -> even phyllotaxis packing
  const coreBase = 26 + 18; // clear of the center node
  // Core disc reaches the innermost ring (or 90% of the disc when the
  // member has no committees at all) instead of a fixed 44px band -- the
  // fixed band left ~2/3 of the canvas empty for ring-less members.
  const coreMax = rings.length ? rings[0].radius - 14 : maxR * 0.9;
  const coreSpan = Math.max(24, coreMax - coreBase);
  const nodes: CNode[] = [];
  for (const [ringIdx, group] of groups) {
    const count = group.length;
    group.forEach((n, i) => {
      let ang: number;
      let targetR: number;
      if (ringIdx >= 0) {
        // ring nodes: even angular spread on the committee ring
        const phase = (ringIdx + 1) * 0.7;
        ang = (i / count) * Math.PI * 2 + phase;
        targetR = rings[ringIdx].radius;
      } else {
        // core nodes: sunflower layout -> fills the inner disc evenly
        ang = i * GOLDEN;
        const t = count > 1 ? i / (count - 1) : 0;
        targetR = coreBase + Math.sqrt(t) * coreSpan;
      }
      nodes.push({
        ...n,
        targetR,
        x: cx + Math.cos(ang) * targetR,
        y: cy + Math.sin(ang) * targetR,
      });
    });
  }

  // Collision relaxation: push overlapping bubbles apart, then re-pin each to
  // its ring radius so the ring metaphor stays legible.
  const centerR = 26;
  const ITER = 40;
  for (let iter = 0; iter < ITER; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d === 0) {
          dx = (i - j) * 0.5 + 0.1;
          dy = 0.1;
          d = Math.hypot(dx, dy);
        }
        const minD = a.r + b.r + 3;
        if (d < minD) {
          const push = (minD - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
    // SOFT radial attraction toward each node's target radius (web parity:
    // forceRadial(0.35)). The pull is partial and decays across iterations
    // (like d3's alpha), so collision pressure can push crowded nodes off
    // their exact radius -- the old hard re-pin (blend 1) snapped every
    // ring node back each pass, so collision could only ever slide nodes
    // angularly and dense rings never spread. Clearance of the center node
    // stays a hard floor; the disc edge is a hard ceiling.
    const decay = 1 - iter / ITER;
    for (const n of nodes) {
      let ang = Math.atan2(n.y - cy, n.x - cx);
      if (Number.isNaN(ang)) ang = 0;
      const minClear = centerR + n.r + 4;
      const cur = Math.hypot(n.x - cx, n.y - cy);
      const want = Math.max(minClear, n.targetR);
      const blend = (n.ringIdx >= 0 ? 0.35 : 0.22) * decay;
      let rr = cur + (want - cur) * blend;
      rr = Math.min(Math.max(rr, minClear), maxR);
      n.x = cx + Math.cos(ang) * rr;
      n.y = cy + Math.sin(ang) * rr;
    }
  }

  const last = name.trim().split(/\s+/).pop() ?? name;
  return {
    nodes,
    rings,
    center: { x: cx, y: cy, r: centerR, label: last.slice(0, 8) },
    moreCount,
    width,
    height,
  };
}
