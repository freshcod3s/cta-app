// Committee detail header card. Renders reference metadata (jurisdiction,
// leadership, sectors) from /api/committees/info when available, degrading to
// just name + chamber + member count from /api/committees/members when the
// committee isn't in committees.json. The official-page link opens in the
// system browser (Product Invariant #5 -- expo-web-browser, never WebView).
import { Pressable, Text, View } from "react-native";
import { ExternalLink } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";

import type { Chamber } from "@/features/trades/api/types";
import type { CommitteeRef } from "../api/types";

type Props = {
  name: string;
  chamber: Chamber | null;
  memberCount: number;
  reference: CommitteeRef | null;
  officialUrl: string | null;
};

export function CommitteeHeader({
  name,
  chamber,
  memberCount,
  reference,
  officialUrl,
}: Props) {
  const fullName = reference?.full_name ?? null;
  const sectors = reference?.sectors ?? [];
  const url = officialUrl ?? reference?.official_url ?? null;

  // Meta line: chamber and deduped member count, whichever are known.
  const metaParts = [
    chamber,
    memberCount > 0
      ? `${memberCount} member${memberCount === 1 ? "" : "s"}`
      : null,
  ].filter((p): p is string => !!p && p.length > 0);

  return (
    <View className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-800">
      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {name}
      </Text>
      {fullName && fullName !== name ? (
        <Text className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
          {fullName}
        </Text>
      ) : null}
      {metaParts.length ? (
        <Text className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {metaParts.join(" - ")}
        </Text>
      ) : null}

      {reference?.jurisdiction ? (
        <Text className="mt-3 text-sm leading-5 text-gray-700 dark:text-gray-300">
          {reference.jurisdiction}
        </Text>
      ) : null}

      {reference?.chair || reference?.ranking_member ? (
        <View className="mt-3 gap-1">
          {reference?.chair ? (
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                Chair:{" "}
              </Text>
              {reference.chair}
            </Text>
          ) : null}
          {reference?.ranking_member ? (
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                Ranking:{" "}
              </Text>
              {reference.ranking_member}
            </Text>
          ) : null}
        </View>
      ) : null}

      {sectors.length ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {sectors.map((s) => (
            <View
              key={s}
              className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800"
            >
              <Text className="text-xs text-gray-700 dark:text-gray-300">
                {s}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {url ? (
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(url)}
          accessibilityRole="link"
          accessibilityLabel="Open official committee page"
          className="mt-4 flex-row items-center gap-2 self-start rounded-xl border border-cta-accent/40 bg-cta-accent/5 px-4 py-2.5"
        >
          <ExternalLink size={16} color="#6366f1" />
          <Text className="text-sm font-semibold text-cta-accent">
            Official committee page
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
