// Committee detail -- the roster of every Congress member on a committee,
// reached by tapping a committee chip on a trade detail or member profile.
// Route: /committee/{encodeURIComponent(name)} -- declared at the root Stack
// (app/_layout) so it stack-pushes OVER the drawer, like member/ticker/trade.
// The :name param is the URL-encoded canonical committee name; decode before
// use. It is passed straight to the worker, which exact-matches it.
//
// FSM mirrors ticker/[symbol]: the member ROSTER is the primary state machine;
// the reference header (committees/info) loads independently and renders its
// own available fields, so it never blocks the roster:
//   isLoading (roster)       -> CommitteeDetailSkeleton
//   isError + empty (roster) -> ErrorState with Retry (refetches both)
//   success + empty          -> EmptyState (header still shows committee info)
//   success + rows           -> FlatList: CommitteeHeader + CommitteeMemberRow
//
// SafeAreaView edges={["bottom"]} only -- the root Stack header handles the
// top inset (back arrow + title).
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import {
  selectCommitteeRef,
  useCommitteeMembers,
  useCommitteesInfo,
} from "@/features/committees/api/queries";
import type { CommitteeMember } from "@/features/committees/api/types";
import { CommitteeHeader } from "@/features/committees/components/CommitteeHeader";
import { CommitteeMemberRow } from "@/features/committees/components/CommitteeMemberRow";

function Divider() {
  return <View className="ml-[68px] h-px bg-gray-200 dark:bg-gray-800" />;
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <View className={`rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}

function CommitteeDetailSkeleton() {
  return (
    <View className="pb-8">
      <View className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-800">
        <ShimmerBlock className="h-6 w-1/2" />
        <ShimmerBlock className="mt-2 h-4 w-2/3" />
        <ShimmerBlock className="mt-4 h-16 w-full" />
      </View>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} className="h-[72px] flex-row items-center gap-3 px-4">
          <View className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 gap-2">
            <ShimmerBlock className="h-4 w-1/2" />
            <ShimmerBlock className="h-3 w-1/3" />
          </View>
        </View>
      ))}
    </View>
  );
}

function ErrorState({
  name,
  onRetry,
}: {
  name: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load this committee
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
        {name ? name : "No committee provided"}
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
        No members on file for {name}.
      </Text>
    </View>
  );
}

export default function CommitteeDetailScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name = params.name ? decodeURIComponent(params.name) : "";

  const members = useCommitteeMembers(name);
  const info = useCommitteesInfo();
  const reference = selectCommitteeRef(info.data, name);

  const roster: CommitteeMember[] = members.data?.members ?? [];
  const chamber = members.data?.chamber ?? null;
  const memberCount = members.data?.member_count ?? roster.length;
  const officialUrl = members.data?.official_url ?? null;

  const retry = () => {
    void members.refetch();
    void info.refetch();
  };

  const header = (
    <CommitteeHeader
      name={name}
      chamber={chamber}
      memberCount={memberCount}
      reference={reference}
      officialUrl={officialUrl}
    />
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <Stack.Screen options={{ title: name || "Committee" }} />
      {!name ? (
        // Invalid route param: show the error state rather than fetching with
        // an empty name (the query is disabled for an empty name anyway).
        <ErrorState name="" onRetry={retry} />
      ) : members.isLoading ? (
        <CommitteeDetailSkeleton />
      ) : members.isError && roster.length === 0 ? (
        <ErrorState name={name} onRetry={retry} />
      ) : (
        <FlatList
          data={roster}
          keyExtractor={(m) => m.bioguide ?? m.name}
          renderItem={({ item }) => <CommitteeMemberRow member={item} />}
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState name={name} />}
          refreshControl={
            <RefreshControl
              refreshing={members.isRefetching}
              onRefresh={retry}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
