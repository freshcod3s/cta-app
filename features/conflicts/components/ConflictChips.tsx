// Conflicts view -- the labeled chips under each ranked row. Every chip
// states its REASON; tiers are explicit, never a black-box score.
//
//   Tier-A (amber)  -- DOCUMENTED: late filing (45-day STOCK Act). The ranking
//                      driver. Amber = the same cta-late token as the LATE pill.
//   Tier-B (slate)  -- committee-jurisdiction overlap. Secondary, lower
//                      confidence: computed on the member's CURRENT roster, not
//                      as-of the trade date -- so it carries that caveat in the
//                      copy and never affects ordering.
//   Owner   (slate) -- self/spouse/joint/dependent, IF the served record
//                      carries owner_type. Omitted cleanly when absent.
//
// Custom brand colors are applied via inline style (borderColor / color) the
// same way ConflictScore does, to dodge NativeWind opacity-modifier issues on
// non-palette colors.
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Landmark, ShieldAlert, User } from "lucide-react-native";

import { ctaColors } from "@/lib/theme/tokens";
import { lateReason, ownerLabel, type ConflictTrade } from "../ranking";

// Shared chip shell: a bordered pill with an icon + text. `tone` picks the
// accent; "warn" is the amber statutory tier, "muted" is secondary context.
function Chip({
  tone,
  icon,
  label,
  accessibilityLabel,
}: {
  tone: "warn" | "muted";
  icon: ReactNode;
  label: string;
  accessibilityLabel: string;
}) {
  const warn = tone === "warn";
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      className="flex-row items-center gap-1 rounded-full border border-gray-300 px-2 py-0.5 dark:border-gray-600"
      style={warn ? { borderColor: ctaColors.late } : undefined}
    >
      {icon}
      <Text
        className={
          warn
            ? "text-[11px] font-semibold"
            : "text-[11px] font-medium text-gray-600 dark:text-gray-300"
        }
        style={warn ? { color: ctaColors.late } : undefined}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// Tier-A: documented late filing. Only rendered for late rows.
export function TierADocumentedChip({ lagDays }: { lagDays: number }) {
  return (
    <Chip
      tone="warn"
      icon={<ShieldAlert size={12} color={ctaColors.late} />}
      label={`A - ${lateReason(lagDays)}`}
      accessibilityLabel={`Tier A documented. ${lateReason(lagDays)}`}
    />
  );
}

// Tier-B: committee-jurisdiction overlap. Reads the conflict INLINE off the
// served trade record -- the Worker now attaches it to /api/trades + :id (like
// disclosure_lag_days), so there is NO per-row profile fetch and no fan-out:
// ranking + chips cover the full loaded set with zero fetch gaps. Renders
// nothing when there's no overlap; the full detail is one tap away on the
// trade-detail ConflictScore screen.
//
// Caveat is BASIS-DRIVEN: 'current_roster' (today) keeps the honest
// "based on current assignment" note; 'as_of_date' (Ticket 2, behind the same
// field) relaxes it to "as of the trade date". Missing basis => current_roster.
export function CommitteeOverlapChip({ trade }: { trade: ConflictTrade }) {
  const conflict = trade.conflict ?? null;
  if (!conflict) return null;

  const kind = conflict.severity === "direct" ? "Direct" : "Adjacent";
  const caveat =
    conflict.basis === "as_of_date"
      ? "as of the trade date"
      : "based on current assignment";
  return (
    <View className="flex-row items-center gap-1.5">
      <Chip
        tone="muted"
        icon={<Landmark size={12} color="#9ca3af" />}
        label={`B - Committee overlap (${kind})`}
        accessibilityLabel={
          `Tier B, secondary. ${kind} committee-jurisdiction overlap on ` +
          `${conflict.committee}, ${caveat}.`
        }
      />
      <Text
        className="text-[10px] italic text-gray-400 dark:text-gray-500"
        numberOfLines={1}
      >
        {caveat}
      </Text>
    </View>
  );
}

// Owner type chip -- forward-compatible. Renders only when the served record
// carries an owner_type the Worker has populated.
export function OwnerTypeChip({ trade }: { trade: ConflictTrade }) {
  const label = ownerLabel(trade.owner_type);
  if (!label) return null;
  return (
    <Chip
      tone="muted"
      icon={<User size={12} color="#9ca3af" />}
      label={label}
      accessibilityLabel={`Owner: ${label}`}
    />
  );
}
