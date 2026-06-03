// Politician profile (CTA-App member slice).
// Route: /member/{encodeURIComponent(name)} -- declared at the root Stack
// (see app/_layout.tsx), OUTSIDE the (drawer) group, so it stack-pushes
// OVER the drawer when navigated to from a TradeRow's member-name tap,
// exactly like app/trade/[id].tsx.
//
// The :name param is the URL-encoded politician name; decode with
// decodeURIComponent before use (useLocalSearchParams returns it still
// encoded for reserved chars).
//
// Two server resources, two React Query hooks, two roles:
//   useMemberProfile(name)        -> header + summary + committees
//                                    (supportive context; tolerates its
//                                    own loading/error WITHOUT blocking
//                                    the feed, like StatsBanner does).
//   useTradesList({ politician }) -> the member's PAGINATED trade feed
//                                    (primary surface; drives the screen
//                                    FSM + onEndReached pagination).
//
// Explicit FSM for the primary (feed) surface, matching app/(drawer)/index:
//   loading            -> MemberFeedSkeleton
//   error (empty)      -> ErrorState with Retry (refetches BOTH queries)
//   success + empty    -> EmptyState
//   success + rows     -> FlatList (profile header scrolls as ListHeader)
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import { useTradesList } from "@/features/trades/api/queries";
import type { TradeRecord } from "@/features/trades/api/types";
import { isLateFiling } from "@/features/trades/api/types";
import { TradeRow } from "@/features/trades/components/TradeRow";
import { useMemberProfile } from "@/features/members/api/queries";
import type { MemberProfile } from "@/features/members/api/types";
import { MemberProfileHeader } from "@/features/members/components/MemberProfileHeader";
import { MemberSummaryStrip } from "@/features/members/components/MemberSummaryStrip";

function Divider() {
  return <View className="ml-[68px] h-px bg-gray-200 dark:bg-gray-800" />;
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <View className={`rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}

// Header placeholder while the profile resource loads. Same vertical
// structure as MemberProfileHeader so the layout doesn't shift on resolve.
function ProfileHeaderSkeleton() {
  return (
    <View className="flex-row items-center gap-4 p-4">
      <View className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      <View className="flex-1 gap-2">
        <ShimmerBlock className="h-5 w-3/4" />
        <ShimmerBlock className="h-4 w-1/3" />
      </View>
    </View>
  );
}

function RowSkeleton() {
  return (
    <View className="h-[72px] flex-row items-center gap-3 px-4">
      <View className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <View className="flex-1 gap-2">
        <ShimmerBlock className="h-4 w-2/3" />
        <ShimmerBlock className="h-3 w-1/2" />
      </View>
      <View className="items-end gap-2">
        <ShimmerBlock className="h-4 w-12" />
        <ShimmerBlock className="h-3 w-20" />
      </View>
    </View>
  );
}

function MemberFeedSkeleton() {
  return (
    <View>
      <ProfileHeaderSkeleton />
      <View className="px-4 pb-3">
        <ShimmerBlock className="h-4 w-1/2" />
      </View>
      {Array.from({ length: 6 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </View>
  );
}

function ErrorState({ name, onRetry }: { name: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load this member
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
        {name ? name : "No member name provided"}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        className="mt-4 rounded-lg bg-cta-accent px-5 py-3"
      >
        <Text className="font-semibold text-white">Retry</Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-center text-base text-gray-500 dark:text-gray-400">
        No disclosed trades on file for {name}.
      </Text>
    </View>
  );
}

function ListFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View className="py-6">
      <Text className="text-center text-xs text-gray-500 dark:text-gray-400">
        Loading more...
      </Text>
    </View>
  );
}

// Minimal profile built from just the name, used as the header model when
// the profile resource errors. Keeps the screen usable (feed + name) when
// only the supportive profile call fails -- it never blocks the feed.
function fallbackProfile(name: string): MemberProfile {
  return {
    name,
    party: null,
    chamber: null,
    state: null,
    district: null,
    committees: [],
    bioguide_id: null,
    photo_url: null,
    years_served: null,
    status: "current",
    status_date: null,
    stats: null,
    disclosureLag: null,
  };
}

export default function MemberProfileScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name = params.name ? decodeURIComponent(params.name) : "";

  const profileQuery = useMemberProfile(name || undefined);
  const feedQuery = useTradesList({ politician: name || undefined });

  const trades: TradeRecord[] = feedQuery.data?.flat ?? [];

  // Header model: real profile when available, name-only fallback on
  // profile error (so the feed still renders with a usable header).
  const profile: MemberProfile = profileQuery.data ?? fallbackProfile(name);

  // Lifetime disclosed-trade count is authoritative from the worker stats;
  // the summary strip falls back to loaded count when stats are absent.
  const totalTrades = profileQuery.data?.stats?.total_trades ?? null;
  // Late count derived from LOADED rows via the app's >45-day rule (kept
  // consistent with isLateFiling app-wide; worker's over30Count uses a
  // different >30 threshold and is not used here).
  const lateCount = trades.reduce(
    (n, t) => (isLateFiling(t.disclosure_lag_days) ? n + 1 : n),
    0,
  );

  const retryAll = () => {
    void feedQuery.refetch();
    void profileQuery.refetch();
  };

  // ListHeader: identity header (or skeleton while profile loads) + the
  // disclosure summary strip. Scrolls with the feed, like StatsBanner.
  const listHeader = (
    <View>
      {profileQuery.isLoading ? (
        <ProfileHeaderSkeleton />
      ) : (
        <MemberProfileHeader profile={profile} />
      )}
      <MemberSummaryStrip
        totalTrades={totalTrades}
        lateCount={lateCount}
        loadedCount={trades.length}
        committees={profile.committees}
      />
    </View>
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <Stack.Screen options={{ title: name || "Member" }} />
      {!name ? (
        // Empty/invalid route param: never fall through to the GLOBAL feed
        // (an absent politician filter would load all trades). Show the
        // error state, matching how trade/[id] handles a missing id.
        <ErrorState name="" onRetry={retryAll} />
      ) : feedQuery.isLoading ? (
        <MemberFeedSkeleton />
      ) : feedQuery.isError && trades.length === 0 ? (
        <ErrorState name={name} onRetry={retryAll} />
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => <TradeRow trade={item} />}
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<EmptyState name={name} />}
          ListFooterComponent={
            <ListFooter loading={feedQuery.isFetchingNextPage} />
          }
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
              feedQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
              onRefresh={retryAll}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
