// Committee Power Ranking card (web parity: cg-committees). The member's
// committee seats ranked by trading overlap -- how many disclosed trades
// (and dollars, at range-high) fall in each committee's jurisdiction. Each
// row deep-links to the committee detail screen (/committee/[name]).
//
// Ordering is by overlap (conflicted count, then dollars), NOT a numeric
// "influence score". A committee with no overlapping trades still shows,
// ranked last, labeled honestly.
//
// Rows nest Pressables inside ProfileCard's Pressable and win the tap
// (navigate), while the card body still opens the InfoSheet explainer.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import type { CommitteeTreeNode } from "@/features/members/api/types";
import { ProfileCard } from "@/features/members/components/ProfileCard";
import {
  committeeExposure,
  type CommitteeExposure,
} from "@/features/members/profileDerive";
import { ctaColors } from "@/lib/theme/tokens";
import { formatMoneyShort } from "@/lib/util/display";

function Row({ row, max }: { row: CommitteeExposure; max: number }) {
  const router = useRouter();
  const hasOverlap = row.conflictCount > 0;
  const pct = max > 0 ? Math.round((row.conflictDollars / max) * 100) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.committee}${row.role ? `, ${row.role}` : ""}. ${
        hasOverlap
          ? `${row.conflictCount} overlapping trades`
          : "no overlapping trades"
      }. Open committee.`}
      onPress={() =>
        router.push(`/committee/${encodeURIComponent(row.committee)}`)
      }
      android_ripple={{ color: "rgba(99,102,241,0.10)" }}
      className="py-2.5"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {row.committee}
          </Text>
          {row.role ? (
            <Text className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {row.role}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={15} color={ctaColors.accent} />
      </View>
      {hasOverlap ? (
        <>
          <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <View
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.max(4, pct)}%`,
                backgroundColor: ctaColors.late,
              }}
            />
          </View>
          <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {row.conflictCount.toLocaleString()} overlapping trades ·{" "}
            {formatMoneyShort(row.conflictDollars)}
          </Text>
        </>
      ) : (
        <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
          — no overlapping trades
        </Text>
      )}
    </Pressable>
  );
}

export function CommitteePowerCard({
  trades,
  committeeTree,
}: {
  trades?: TradeRecord[] | null;
  committeeTree?: CommitteeTreeNode[] | null;
}) {
  if (!committeeTree || committeeTree.length === 0) return null;
  const rows = committeeExposure(trades ?? [], committeeTree);
  if (rows.length === 0) return null;

  const withOverlap = rows.filter((r) => r.conflictCount > 0).length;
  const max = Math.max(...rows.map((r) => r.conflictDollars), 0);

  return (
    <ProfileCard
      title="Committee Power Ranking"
      infoSlug="profile-committees"
      accessory={
        <Text className="text-[11px] text-gray-500 dark:text-gray-400">
          {withOverlap > 0 ? `${withOverlap} with overlap` : "no overlap"}
        </Text>
      }
    >
      {rows.map((row, i) => (
        <View
          key={row.committee}
          className={
            i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
          }
        >
          <Row row={row} max={max} />
        </View>
      ))}
    </ProfileCard>
  );
}
