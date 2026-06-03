// Profile-screen identity header: portrait + name (large) + party badge +
// chamber/state/district + years-served line.
//
// Mirrors the visual language of features/trades/components/MemberHeader
// (portrait + party-color badge + chamber/state line) but is driven by a
// MemberProfile (richer per-member resource) instead of a single
// TradeRecord. Kept as a separate member-feature component rather than
// generalizing MemberHeader -- the two consume different domain models
// and "no abstraction until 3+ real uses."
//
// Party badge: cta-dem (D), cta-rep (R), neutral gray otherwise.
// district shows only for House members (Senate has no district).
import { Image, Text, View } from "react-native";

import type { MemberProfile } from "@/features/members/api/types";

type Props = { profile: MemberProfile };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MemberProfileHeader({ profile }: Props) {
  const partyClass =
    profile.party === "D"
      ? "bg-cta-dem"
      : profile.party === "R"
        ? "bg-cta-rep"
        : "bg-gray-500";

  const districtSuffix =
    profile.chamber === "House" && profile.district
      ? `-${profile.district}`
      : "";

  // chamber/state line: tolerate null chamber/state from the worker
  // (former members can have gaps) by filtering empties out.
  const locationParts = [profile.chamber, profile.state].filter(
    (p): p is string => !!p && p.length > 0,
  );
  const locationLine = locationParts.length
    ? `${locationParts.join(" - ")}${districtSuffix}`
    : "Chamber data unavailable";

  return (
    <View className="flex-row items-center gap-4 p-4">
      {profile.photo_url ? (
        <Image
          source={{ uri: profile.photo_url }}
          className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700"
          accessibilityLabel={`${profile.name} portrait`}
        />
      ) : (
        <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Text className="text-2xl font-bold text-gray-600 dark:text-gray-300">
            {initials(profile.name)}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {profile.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          {profile.party ? (
            <View className={`rounded-full px-2 py-0.5 ${partyClass}`}>
              <Text className="text-xs font-semibold text-white">
                {profile.party}
              </Text>
            </View>
          ) : null}
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {locationLine}
          </Text>
        </View>
        {profile.years_served != null ? (
          <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {profile.years_served} yr
            {profile.years_served === 1 ? "" : "s"} in Congress
          </Text>
        ) : null}
      </View>
    </View>
  );
}
