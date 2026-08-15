// Most Active Members -- top members by 90-day disclosed volume (web parity:
// the Featured Politicians row). Horizontal member cards; each deep-links to
// /member/[name] (route param stays the legal filing name). Header opens the
// explainer sheet.
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Info } from "lucide-react-native";

import { useFeaturedMembers } from "@/features/members/api/featured";
import type { FeaturedMember } from "@/features/members/api/featured";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import { displayName, formatMoneyShort } from "@/lib/util/display";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function loc(m: FeaturedMember): string {
  if (!m.state) return m.chamber ?? "";
  if (m.chamber === "Senate") return `${m.state} · Sen`;
  return m.district ? `${m.state}-${m.district}` : m.state;
}

function MemberCard({ member }: { member: FeaturedMember }) {
  const router = useRouter();
  const partyColor =
    member.party === "D"
      ? ctaColors.dem
      : member.party === "R"
        ? ctaColors.rep
        : "#9ca3af";
  const vol = formatMoneyShort(member.total_volume ?? 0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${displayName(member.name)}. Open profile.`}
      onPress={() =>
        router.push(`/member/${encodeURIComponent(member.name)}`)
      }
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="mr-3 w-40 items-center rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
    >
      {member.photo_url ? (
        <Image
          source={{ uri: member.photo_url }}
          className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700"
        />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Text className="text-base font-bold text-gray-600 dark:text-gray-300">
            {initials(displayName(member.name))}
          </Text>
        </View>
      )}
      <Text
        className="mt-2 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
        numberOfLines={1}
      >
        {displayName(member.name)}
      </Text>
      <Text className="text-[11px] font-medium" style={{ color: partyColor }}>
        {member.party ? `${member.party} · ` : ""}
        {loc(member)}
      </Text>
      <Text className="mt-1 text-center text-[11px] text-gray-500 dark:text-gray-400">
        {(member.trade_count ?? 0).toLocaleString()} trades
        {vol ? ` · ${vol}` : ""}
      </Text>
    </Pressable>
  );
}

export function FeaturedMembers() {
  const openInfo = useOpenInfo();
  const { data } = useFeaturedMembers();

  if (!data || data.length === 0) return null;

  return (
    <View className="mt-3">
      <Pressable
        onPress={() => openInfo("home-featured")}
        accessibilityRole="button"
        accessibilityLabel="Most active members. Tap for details."
        android_ripple={{ color: "rgba(99,102,241,0.08)" }}
        className="mx-4 flex-row items-center gap-1.5 pb-2"
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Most Active Members
        </Text>
        <Info size={12} color={ctaColors.accent} />
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {data.map((m) => (
          <MemberCard key={member_key(m)} member={m} />
        ))}
      </ScrollView>
    </View>
  );
}

function member_key(m: FeaturedMember): string {
  return m.bioguide_id ?? m.name;
}
