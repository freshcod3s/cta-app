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
import { Link, Stack, useLocalSearchParams } from "expo-router";

import {
  selectCommitteeRef,
  useCommitteeMembers,
  useCommitteesInfo,
} from "@/features/committees/api/queries";
import type {
  CommitteeMember,
  CommitteeRecentEvent,
  CommitteeSubcommittee,
} from "@/features/committees/api/types";
import { CommitteeEventRow } from "@/features/committees/components/CommitteeEventRow";
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

// Footer timeline: the committee's recent congress.gov legislative events
// (hearings / markups / bills / votes). Most committees have none on file
// today, so the empty state carries the common case. Factual aggregation
// only -- no evaluative or directive copy around the section.
function RecentActivity({ events }: { events: CommitteeRecentEvent[] }) {
  return (
    <View className="pb-8">
      <View className="border-t border-gray-200 px-4 pb-1 pt-5 dark:border-gray-800">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Recent committee activity
        </Text>
        <Text className="mt-0.5 text-[11px] text-gray-400">
          Hearings, markups, and votes (congress.gov), last 180 days
        </Text>
      </View>
      {events.length === 0 ? (
        <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          No recent activity on file for this committee.
        </Text>
      ) : (
        events.map((e) => <CommitteeEventRow key={e.id} event={e} />)
      )}
    </View>
  );
}

// Subcommittees of a parent committee -- structural composition only (name +
// member count), shown between the header card and the roster (parent pages
// only). Framing is structure, never evaluation: no "key" / "powerful" /
// "influential" copy.
//
// Each row drills into the subcommittee via /committee/{sub}?parent={parent}.
// The parent is REQUIRED: generic sub names ("Health", "Oversight") recur
// across parents, and the worker needs parent_committee to disambiguate (a sub
// queried without parent matches nothing). parentName is the current parent
// committee's name, threaded into the ?parent= query.
function Subcommittees({
  items,
  parentName,
}: {
  items: CommitteeSubcommittee[];
  parentName: string;
}) {
  return (
    <View className="border-b border-gray-200 dark:border-gray-800">
      <View className="px-4 pb-1 pt-5">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Subcommittees
        </Text>
      </View>
      {items.length === 0 ? (
        <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          No subcommittees on file.
        </Text>
      ) : (
        items.map((s) => (
          <Link
            key={s.name}
            href={`/committee/${encodeURIComponent(s.name)}?parent=${encodeURIComponent(parentName)}`}
            asChild
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${s.name}, ${s.member_count} member${
                s.member_count === 1 ? "" : "s"
              }`}
              className="flex-row items-center justify-between border-t border-gray-100 px-4 py-2.5 dark:border-gray-800"
            >
              <Text
                className="flex-1 pr-3 text-sm text-gray-800 dark:text-gray-200"
                numberOfLines={2}
              >
                {s.name}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {s.member_count} member{s.member_count === 1 ? "" : "s"}
              </Text>
            </Pressable>
          </Link>
        ))
      )}
    </View>
  );
}

export default function CommitteeDetailScreen() {
  const params = useLocalSearchParams<{ name: string; parent?: string }>();
  const name = params.name ? decodeURIComponent(params.name) : "";
  const parent = params.parent ? decodeURIComponent(params.parent) : null;

  const members = useCommitteeMembers(name, parent);
  const info = useCommitteesInfo();
  const reference = selectCommitteeRef(info.data, name);

  const roster: CommitteeMember[] = members.data?.members ?? [];
  const chamber = members.data?.chamber ?? null;
  const memberCount = members.data?.member_count ?? roster.length;
  const officialUrl = members.data?.official_url ?? null;
  const recentActivity: CommitteeRecentEvent[] =
    members.data?.recent_activity ?? [];
  const subcommittees: CommitteeSubcommittee[] =
    members.data?.subcommittees ?? [];

  const retry = () => {
    void members.refetch();
    void info.refetch();
  };

  const header = (
    <>
      <CommitteeHeader
        name={name}
        chamber={chamber}
        memberCount={memberCount}
        reference={reference}
        officialUrl={officialUrl}
        parent={parent}
      />
      {/* Subcommittees only on parent pages -- a sub has no sub-subcommittees,
          so on a sub page (parent set) the section would be pure empty-state. */}
      {parent ? null : (
        <Subcommittees items={subcommittees} parentName={name} />
      )}
    </>
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
          ListFooterComponent={<RecentActivity events={recentActivity} />}
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
