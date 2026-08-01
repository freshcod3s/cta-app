// Committee assignment chips. Horizontal scroll list; each chip taps through
// to the committee detail page (/committee/{name}), which lists every member
// of that committee. Used on the member profile (MemberSummaryStrip, where the
// worker profile supplies the names) and on the trade detail (where the screen
// fetches the trade politician's profile committees).
//
// Sourcing: `committeeTree` (the worker's buildCommitteeTree over
// politician_committees) is the maintained store and wins when present;
// `committees` (the legacy politicians.committees CSV, populated by a one-shot
// 45-name backfill and NULL for ~92% of current members) is the fallback only
// when the tree is empty. Same fallback-chain idea as the web's
// renderPdCommitteesLine. Parent-committee names go straight to the worker's
// ?name= filter (the committee detail screen encodes them). `loading` shows a
// slim shimmer instead of the empty copy while a caller's source query is
// still in flight, so the trade detail doesn't flash "no committees" before
// the member profile resolves.
import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import type { CommitteeTreeNode } from "@/features/members/api/types";

type Props = {
  committees?: string[];
  committeeTree?: CommitteeTreeNode[] | null;
  loading?: boolean;
};

function ShimmerChip({ className }: { className: string }) {
  return (
    <View
      className={`h-7 rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

export function CommitteeChips({
  committees = [],
  committeeTree,
  loading = false,
}: Props) {
  const treeNames = (committeeTree ?? [])
    .map((node) => node.committee)
    .filter(Boolean);
  const names = treeNames.length ? treeNames : committees;

  if (!names.length) {
    return (
      <View className="pb-2">
        <Text className="px-4 pb-2 text-xs uppercase text-gray-500 dark:text-gray-400">
          Committee assignments
        </Text>
        {loading ? (
          <View className="flex-row gap-2 px-4">
            <ShimmerChip className="w-28" />
            <ShimmerChip className="w-20" />
            <ShimmerChip className="w-24" />
          </View>
        ) : (
          <Text className="px-4 text-sm italic text-gray-500 dark:text-gray-400">
            No committee assignments on file.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="pb-2">
      <Text className="px-4 pb-2 text-xs uppercase text-gray-500 dark:text-gray-400">
        Committee assignments
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={names}
        keyExtractor={(c) => c}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => (
          <Link href={`/committee/${encodeURIComponent(item)}`} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View members of the ${item} committee`}
              className="flex-row items-center gap-1 rounded-full border border-cta-accent/40 bg-cta-accent/5 px-3 py-1 active:opacity-60"
            >
              <Text className="text-xs font-medium text-cta-accent">
                {item}
              </Text>
              <ChevronRight size={12} color="#6366f1" />
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
