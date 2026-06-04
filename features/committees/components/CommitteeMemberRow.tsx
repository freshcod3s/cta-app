// Committee roster row -- 72pt fixed height. Taps through to the member
// profile (/member/{name}), mirroring the Link+Pressable nav pattern used by
// TradeRow / LeaderboardRow. Layout: [avatar] [name / party-state-district]
// [leadership badge]. Rank-and-file "Member" rows show no badge.
//
// initials() is duplicated from MemberHeader / TradeRow / LeaderboardRow /
// MemberProfileHeader -- the standing "promote to /lib/util/initials.ts"
// follow-up still applies; not expanded here to keep this slice surgical.
import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import type { CommitteeMember } from "../api/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Short display labels for the leadership badge (full role names overflow the
// trailing badge on a 72pt row).
const ROLE_LABEL: Record<string, string> = {
  Chairman: "Chair",
  "Ranking Member": "Ranking",
  "Vice Chairman": "Vice Chair",
  "Ex Officio": "Ex Officio",
};

type Props = { member: CommitteeMember };

export function CommitteeMemberRow({ member }: Props) {
  const partyClass =
    member.party === "D"
      ? "bg-cta-dem"
      : member.party === "R"
        ? "bg-cta-rep"
        : "bg-gray-500";

  const districtSuffix =
    member.chamber === "House" && member.district
      ? `-${member.district}`
      : "";
  const stateLine = member.state ? `${member.state}${districtSuffix}` : "";
  const locParts = [member.party, stateLine].filter(
    (p): p is string => !!p && p.length > 0,
  );
  const locLine = locParts.length ? locParts.join(" - ") : member.chamber;

  // Badge only for leadership; rank-and-file members are unbadged.
  const isLeadership = !!member.role && member.role !== "Member";
  const roleLabel = ROLE_LABEL[member.role] ?? member.role;
  const roleBg = member.role === "Chairman" ? "bg-cta-accent" : "bg-gray-500";

  return (
    <Link href={`/member/${encodeURIComponent(member.name)}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          `View ${member.name} profile` +
          (isLeadership ? `, ${member.role}` : "")
        }
        className="h-[72px] flex-row items-center gap-3 px-4"
      >
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
          <View className="flex-row items-center gap-2">
            {member.party ? (
              <View className={`rounded-full px-2 py-0.5 ${partyClass}`}>
                <Text className="text-[10px] font-bold text-white">
                  {member.party}
                </Text>
              </View>
            ) : null}
            <Text
              className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100"
              numberOfLines={1}
            >
              {member.name}
            </Text>
          </View>
          <Text
            className="mt-0.5 text-xs text-gray-600 dark:text-gray-400"
            numberOfLines={1}
          >
            {locLine}
          </Text>
        </View>

        {isLeadership ? (
          <View className={`rounded-full px-2 py-0.5 ${roleBg}`}>
            <Text className="text-[10px] font-bold tracking-wide text-white">
              {roleLabel}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}
