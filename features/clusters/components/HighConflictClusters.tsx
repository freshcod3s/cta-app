// High-Conflict Activity -- clusters of members buying the same ticker in a
// short window, ranked so the ones with committee-jurisdiction overlap sort
// first (web parity: the home High-Conflict widget). Horizontal cards; each
// deep-links to /ticker/[symbol]. Header opens the explainer sheet. Framing
// (LOCKED): overlap is an oversight-transparency flag, not wrongdoing.
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Info, Landmark } from "lucide-react-native";

import { useConflictClusters } from "@/features/clusters/api/queries";
import type { ClusterRecord } from "@/features/clusters/api/types";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import { formatShortDate } from "@/lib/util/display";

const DAY = 86_400_000;

function spanDays(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const t1 = Date.parse(a);
  const t2 = Date.parse(b);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
  return Math.max(0, Math.round(Math.abs(t2 - t1) / DAY));
}

function PartyDots({ split }: { split?: ClusterRecord["party_split"] }) {
  if (!split) return null;
  const items: { key: string; n: number; color: string }[] = [
    { key: "D", n: split.D ?? 0, color: ctaColors.dem },
    { key: "R", n: split.R ?? 0, color: ctaColors.rep },
    { key: "I", n: split.I ?? 0, color: "#9ca3af" },
  ].filter((x) => x.n > 0);
  if (items.length === 0) return null;
  return (
    <View className="flex-row items-center gap-2">
      {items.map((it) => (
        <View key={it.key} className="flex-row items-center gap-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: it.color }}
          />
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            {it.n}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ClusterCard({ cluster }: { cluster: ClusterRecord }) {
  const router = useRouter();
  const span = spanDays(cluster.first_trade_date, cluster.last_trade_date);
  const conflict = cluster.conflict_committees?.[0];
  const conflictCount = cluster.conflict_committees?.length ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${cluster.ticker ?? "cluster"}: ${cluster.politician_count} members. Open ticker.`}
      onPress={() =>
        cluster.ticker
          ? router.push(`/ticker/${encodeURIComponent(cluster.ticker)}`)
          : undefined
      }
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="mr-3 w-64 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-cta-accent">
          ${cluster.ticker ?? "—"}
        </Text>
        {cluster.last_trade_date ? (
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            {formatShortDate(cluster.last_trade_date)}
          </Text>
        ) : null}
      </View>
      {cluster.asset_name ? (
        <Text
          className="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
          numberOfLines={1}
        >
          {cluster.asset_name}
        </Text>
      ) : null}

      <Text className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        {cluster.politician_count.toLocaleString()} members
        {span != null ? ` · ${span}d span` : ""}
        {cluster.historical ? " · ended" : ""}
      </Text>

      {conflict ? (
        <View
          className="mt-2 flex-row items-start gap-1.5 rounded-lg px-2 py-1.5"
          style={{ backgroundColor: "rgba(239,68,68,0.10)" }}
        >
          <Landmark size={13} color={ctaColors.sell} />
          <Text
            className="flex-1 text-[11px] leading-4 text-gray-700 dark:text-gray-300"
            numberOfLines={2}
          >
            <Text className="font-semibold">{conflict.committee}</Text>
            {conflict.sector ? ` oversees ${conflict.sector}` : ""}
            {conflictCount > 1 ? ` (+${conflictCount - 1})` : ""}
          </Text>
        </View>
      ) : null}

      <View className="mt-2">
        <PartyDots split={cluster.party_split} />
      </View>
    </Pressable>
  );
}

export function HighConflictClusters() {
  const openInfo = useOpenInfo();
  const { data } = useConflictClusters();

  if (!data || data.length === 0) return null;

  return (
    <View className="mt-3">
      <Pressable
        onPress={() => openInfo("home-high-conflict")}
        accessibilityRole="button"
        accessibilityLabel="High-Conflict Activity. Tap for details."
        android_ripple={{ color: "rgba(99,102,241,0.08)" }}
        className="mx-4 flex-row items-center gap-1.5 pb-2"
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          High-Conflict Activity
        </Text>
        <Info size={12} color={ctaColors.accent} />
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {data.map((c) => (
          <ClusterCard key={String(c.id)} cluster={c} />
        ))}
      </ScrollView>
    </View>
  );
}
