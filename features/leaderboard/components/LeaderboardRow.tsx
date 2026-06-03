// Ranked member row for the leaderboard. Tap navigates to the member
// profile route the profiles slice owns: /member/{encodeURIComponent(name)}.
//
// Visual language mirrors TradeRow (avatar + name + party badge), with a
// leading rank number and a trailing metric whose meaning depends on
// `metric`:
//   "trade_count" -> disclosed trade count (most active disclosers)
//   "late_filer"  -> average disclosure lag in days; an OVERDUE pill
//                    (cta-late) appears when the average breaches the
//                    45-day STOCK Act window.
//
// initials() is duplicated from TradeRow / MemberHeader by design -- the
// project rule is "no abstraction until 3+ uses." This is the 3rd caller,
// so the orchestrator may want to promote it to lib/util/initials.ts; see
// notes. Kept local here to stay self-contained within the slice.
import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import type {
  LeaderboardMember,
  LeaderboardSort,
} from "@/features/leaderboard/api/types";
import { isOverdueAverage } from "@/features/leaderboard/api/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function partyBadgeClass(party: string): string {
  return party === "D"
    ? "bg-cta-dem"
    : party === "R"
      ? "bg-cta-rep"
      : "bg-gray-500";
}

type Props = {
  member: LeaderboardMember;
  rank: number;
  metric: LeaderboardSort;
};

export function LeaderboardRow({ member, rank, metric }: Props) {
  const overdue =
    metric === "late_filer" && isOverdueAverage(member.avg_lag_days);

  // Right-side metric value + caption per board.
  const lagDays =
    member.avg_lag_days == null ? null : Math.round(member.avg_lag_days);
  const metricValue =
    metric === "late_filer"
      ? lagDays == null
        ? "-"
        : `${lagDays}d`
      : member.trade_count.toLocaleString();
  const metricCaption =
    metric === "late_filer" ? "avg lag" : "disclosures";

  const subtitle =
    `${member.party || "?"}` +
    (member.chamber ? ` - ${member.chamber}` : "") +
    (member.state ? ` - ${member.state}` : "");

  const a11y =
    `Rank ${rank}, ${member.name}, ${subtitle}, ` +
    (metric === "late_filer"
      ? `average disclosure lag ${lagDays == null ? "unknown" : `${lagDays} days`}` +
        (overdue ? ", overdue" : "")
      : `${member.trade_count} disclosed trades`);

  return (
    <Link href={`/member/${encodeURIComponent(member.name)}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        className="h-[72px] flex-row items-center gap-3 px-4"
      >
        <Text
          className="w-6 text-center text-base font-bold text-gray-400 dark:text-gray-500"
          numberOfLines={1}
        >
          {rank}
        </Text>

        {member.photo_url ? (
          <Image
            source={{ uri: member.photo_url }}
            className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {initials(member.name)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {member.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <View
              className={`rounded-full px-1.5 py-0.5 ${partyBadgeClass(member.party)}`}
            >
              <Text className="text-[10px] font-bold text-white">
                {member.party || "?"}
              </Text>
            </View>
            <Text
              className="text-xs text-gray-600 dark:text-gray-400"
              numberOfLines={1}
            >
              {member.chamber}
              {member.state ? ` - ${member.state}` : ""}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <View className="flex-row items-center gap-1.5">
            {overdue && (
              <View className="rounded-full bg-cta-late px-2 py-0.5">
                <Text className="text-[10px] font-bold text-white">
                  OVERDUE
                </Text>
              </View>
            )}
            <Text
              className={`text-base font-bold ${overdue ? "text-cta-late" : "text-gray-900 dark:text-gray-100"}`}
              numberOfLines={1}
            >
              {metricValue}
            </Text>
          </View>
          <Text
            className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {metricCaption}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
