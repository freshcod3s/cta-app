// One saved member in the workspace.
//
// This is deliberately not a bookmark row. Without opening anything the user
// can see how much material they hold on this member, the period it covers,
// how promptly that member files, and whether the copy on the device is
// current -- then act on it: explore it, queue it for comparison, or drop it.
//
// Every figure here is a COUNT or a DATE. Disclosed amounts are ranges, not
// values, so no total or average appears anywhere on this surface.
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, ChartLine, Trash2 } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import { useCompareStore } from "@/features/compare/store";
import { snapshotFreshness } from "@/features/saved/freshness";
import type { SavedMember } from "@/features/saved/types";
import { displayName } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const year = (iso: string | null | undefined) =>
  iso && iso.length >= 4 ? iso.slice(0, 4) : null;

// "128 filings · 2019-2026 · median lag 21 days", omitting whatever the
// snapshot does not have rather than printing an empty segment.
function summaryLine(m: SavedMember): string | null {
  const s = m.snapshot;
  if (!s) return null;

  const parts: string[] = [];
  if (s.total_trades != null) {
    parts.push(`${s.total_trades.toLocaleString()} ${s.total_trades === 1 ? "filing" : "filings"}`);
  }
  const from = year(s.first_trade);
  const to = year(s.last_trade);
  if (from && to) parts.push(from === to ? from : `${from}-${to}`);
  if (s.median_lag_days != null) {
    parts.push(`median lag ${Math.round(s.median_lag_days)} days`);
  }
  return parts.length ? parts.join(" · ") : null;
}

export function SavedMemberRow({ item }: { item: SavedMember }) {
  const router = useRouter();
  const remove = useSavedStore((s) => s.remove);
  const selected = useCompareStore((s) => s.isSelected(item.entityId));
  const canAdd = useCompareStore((s) => s.canAdd());
  const toggleCompare = useCompareStore((s) => s.toggle);

  const fresh = snapshotFreshness(item.snapshotUpdatedAt);
  const summary = summaryLine(item);
  const label = displayName(item.title);
  // At the cap, an unselected row cannot be added -- say so rather than
  // presenting a control that silently does nothing.
  const compareDisabled = !selected && !canAdd;

  return (
    <View className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <Pressable
        onPress={() => router.push(`/member/${encodeURIComponent(item.entityId)}`)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${label}${summary ? `. ${summary}` : ""}`}
        className="flex-row items-center gap-3"
      >
        {item.snapshot?.photo_url ? (
          <Image
            source={{ uri: item.snapshot.photo_url }}
            className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <Text className="text-sm font-bold text-gray-600 dark:text-gray-300">
              {initials(item.title)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {label}
          </Text>
          {item.subtitle ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
          {summary ? (
            <Text
              className="mt-0.5 text-xs text-gray-700 dark:text-gray-300"
              numberOfLines={1}
            >
              {summary}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* Offline status. Amber when the local copy is old enough that the
          source may have moved on; never presented as current data. */}
      <Text
        className={`mt-2 text-[11px] ${
          fresh.stale
            ? "text-amber-600 dark:text-amber-500"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {fresh.label}
      </Text>

      <View className="mt-2.5 flex-row items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-700">
        <Pressable
          onPress={() => toggleCompare(item.entityId)}
          disabled={compareDisabled}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected, disabled: compareDisabled }}
          accessibilityLabel={
            compareDisabled
              ? `Cannot add ${label} to compare; the selection is full`
              : selected
                ? `Remove ${label} from compare`
                : `Add ${label} to compare`
          }
          className={`min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 ${
            selected
              ? "bg-cta-accent"
              : "border border-gray-300 dark:border-gray-600"
          } ${compareDisabled ? "opacity-40" : ""}`}
        >
          {selected ? <Check size={15} color="#ffffff" /> : null}
          <Text
            className={`text-sm font-semibold ${
              selected ? "text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {selected ? "In compare" : "Compare"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/explore/${encodeURIComponent(item.entityId)}`)}
          accessibilityRole="button"
          accessibilityLabel={`Explore ${label}'s filings`}
          className="min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2.5 dark:border-gray-600"
        >
          <ChartLine size={15} color={ctaColors.accent} />
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Explore
          </Text>
        </Pressable>

        <Pressable
          onPress={() => remove(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label} from saved`}
          hitSlop={6}
          className="min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-300 px-3 dark:border-gray-600"
        >
          <Trash2 size={16} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}
