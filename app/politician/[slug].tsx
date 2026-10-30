// Route: /politician/{slug} -- the web profile URL
// (https://congresstradealerts.com/politician/nancy-pelosi), opened here by
// the Android App Link in app.json. The slug is resolved to the legal name
// (features/members/slug.ts) and the screen is replaced by /member/{name},
// so Back returns to wherever the link came from, not to this hop.
//
// States: loading (resolving), error (directory fetch failed: Retry),
// not found (no member has this slug: link to the feed), resolved (redirect).
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";

import { useMemberSlug } from "@/features/members/api/queries";
import { ctaColors } from "@/lib/theme/tokens";

export default function PoliticianSlugScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const query = useMemberSlug(slug || undefined);

  if (query.data) {
    return <Redirect href={`/member/${encodeURIComponent(query.data)}`} />;
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 items-center justify-center p-6">
        {query.isLoading ? (
          <ActivityIndicator color={ctaColors.accent} accessibilityLabel="Finding this member" />
        ) : query.isError ? (
          <>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Couldn&apos;t load this member
            </Text>
            <Pressable
              onPress={() => void query.refetch()}
              accessibilityRole="button"
              className="mt-4 rounded-lg bg-cta-accent px-5 py-3"
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              No member found for this link
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
              {slug || "No member in the link"}
            </Text>
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              className="mt-4 rounded-lg bg-cta-accent px-5 py-3"
            >
              <Text className="font-semibold text-white">Open the feed</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
