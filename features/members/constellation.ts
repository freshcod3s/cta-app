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
  targetR: number; // radius the relaxation re-pins this node to
};

export type CRing = {
  name: string;
  radius: number;
  colorIdx: number;
  conflictCount: number;
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
): Omit<CNode, "x" | "y" | "r" | "ringIdx" | "targetR">[] {
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

  // Rings = committees with overlap, ranked by exposure (cap RING_CAP).
  const ranked = committeeExposure(trades, committeeTree ?? []).filter(
    (c) => c.conflictCount > 0,
  );
  const ringComms = ranked.slice(0, RING_CAP);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2 - 22;
  const ringCount = Math.max(ringComms.length, 1);

  const rings: CRing[] = ringComms.map((c, i) => ({
    name: c.committee,
    radius: maxR * (0.45 + 0.5 * ((i + 1) / ringCount)),
    colorIdx: i % RING_COLORS.length,
    conflictCount: c.conflictCount,
  }));

  // sqrt size scale -> radius [6, rMax]
  const maxHi = Math.max(...visible.map((n) => n.totalHi), 1);
  const rMax = Math.max(12, Math.min(26, maxR * 0.28));
  const sizeFor = (hi: number) =>
    6 + (Math.sqrt(hi) / Math.sqrt(maxHi)) * (rMax - 6);

  // Assign each node a ring (matched committee) or the inner core (-1).
  const withRing = visible.map((n) => {
    let ringIdx = -1;
    if (n.conflict) {
      const idx = ringComms.findIndex((c) =>
        committeeMatch(c.committee, n.conflict!.committee),
      );
      ringIdx = idx; // -1 if the committee didn't make the ring cap
    }
    return { ...n, ringIdx, r: sizeFor(n.totalHi) };
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
  const coreSpan = Math.max(24, maxR * 0.32);
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
    // re-pin toward each node's target radius (ring or sunflower band),
    // keeping clear of the center node. A soft blend lets collisions spread
    // nodes angularly without collapsing the ring/disc structure.
    for (const n of nodes) {
      let ang = Math.atan2(n.y - cy, n.x - cx);
      if (Number.isNaN(ang)) ang = 0;
      const minClear = centerR + n.r + 4;
      const cur = Math.hypot(n.x - cx, n.y - cy);
      const want = Math.max(minClear, n.targetR);
      // ring nodes pin hard to their ring; core nodes keep some freedom
      const blend = n.ringIdx >= 0 ? 1 : 0.5;
      const rr = cur + (want - cur) * blend;
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
