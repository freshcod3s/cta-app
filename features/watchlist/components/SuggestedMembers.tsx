// SuggestedMembers -- the active-onboarding half of the empty Saved screen.
//
// §26: an empty Saved panel must offer a one-tap "save your first member"
// affordance rather than sitting blank and pointing elsewhere. Each row's
// star is that one tap: FollowButton writes to the same canonical settings
// store this screen reads, so following here fills the list in place with
// no navigation and no round-trip.
//
// NOT seeded placeholder data (§26). These are live members from
// GET /api/featured-politicians -- current members ranked by 90-day
// disclosed activity, edge-cached 1h on the Worker. If the request fails
// or comes back empty the component renders nothing and the caller keeps
// its plain empty state; we never invent a member to fill the space.
//
// The endpoint also returns total_volume. It is deliberately NOT rendered:
// disclosed amounts are congressional ranges, never exact values, so no
// dollar total is shown anywhere in this app. trade_count is a count and
// is safe.
import { Image, Text, View } from "react-native";

import { useFeaturedMembers } from "@/features/members/api/featured";
import { FollowButton } from "@/features/watchlist/components/FollowButton";
import { displayName } from "@/lib/util/display";

// An empty state is a glance surface -- enough to act on, not a directory.
const MAX_SUGGESTIONS = 5;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// "D · House · CA" -- omits whatever the API did not send rather than
// rendering separators around blanks.
function subtitle(m: {
  party?: string | null;
  chamber?: string | null;
  state?: string | null;
}) {
  return [m.party, m.chamber, m.state].filter(Boolean).join(" · ");
}

function RowShimmer() {
  return (
    <View className="h-14 flex-row items-center gap-3">
      <View className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
      <View className="flex-1 gap-2">
        <View className="h-3.5 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
        <View className="h-2.5 w-1/3 rounded-md bg-gray-200 dark:bg-gray-700" />
      </View>
    </View>
  );
}

export function SuggestedMembers() {
  const { data, isLoading, isError } = useFeaturedMembers();

  if (isLoading) {
    return (
      <View className="mt-8 w-full">
        <RowShimmer />
        <RowShimmer />
      </View>
    );
  }

  // Silent on failure: the caller's headline and Feed button still stand,
  // so a dead endpoint degrades to the previous empty state rather than to
  // an error banner on a screen the user has not asked anything of yet.
  if (isError || !data?.length) return null;

  const suggestions = data.slice(0, MAX_SUGGESTIONS);

  return (
    <View className="mt-8 w-full">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Active filers right now
      </Text>
      <Text className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Tap a star to start tracking their disclosures.
      </Text>

      {suggestions.map((m) => (
        <View
          key={m.bioguide_id ?? m.name}
          className="flex-row items-center gap-3 border-t border-gray-100 py-2.5 dark:border-gray-800"
        >
          {m.photo_url ? (
            <Image
              source={{ uri: m.photo_url }}
              className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700"
            />
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
                {initials(m.name)}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <Text
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
              numberOfLines={1}
            >
              {displayName(m.name)}
            </Text>
            <Text
              className="text-xs text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {[
                subtitle(m),
                m.trade_count != null
                  ? `${m.trade_count} ${m.trade_count === 1 ? "filing" : "filings"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          <FollowButton politician={m.name} size="md" />
        </View>
      ))}
    </View>
  );
}
