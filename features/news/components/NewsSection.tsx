// NewsSection -- recent press about the member who made this trade. There's
// no per-trade news, so this is member-level context (profile.news). Each
// item opens in the system browser via expo-web-browser (Product Invariant
// #5: external content never in a WebView). Text-only: source + date + title,
// no <Image> (GDELT social images decay fast -- see features/news/api/types).
//
// Always renders a section so the trade detail has a stable shape: spinner
// while loading, a graceful "no recent news" line on empty/error, else a
// short list.
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { useTradeNews } from "@/features/news/api/queries";
import type { NewsItem } from "@/features/news/api/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function SectionHeader() {
  return (
    <Text className="px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      In the news
    </Text>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const date = formatNewsDate(item.published);
  return (
    <Pressable
      onPress={() => WebBrowser.openBrowserAsync(item.link)}
      accessibilityRole="link"
      accessibilityLabel={`${item.title}. ${item.source}. Opens in browser.`}
      className="border-t border-gray-100 px-4 py-3 dark:border-gray-800"
    >
      <Text className="text-[11px] font-medium uppercase tracking-wide text-cta-accent">
        {item.source}
        {date ? (
          <Text className="font-normal text-gray-400"> - {date}</Text>
        ) : null}
      </Text>
      <Text
        className="mt-1 text-sm leading-5 text-gray-900 dark:text-gray-100"
        numberOfLines={3}
      >
        {item.title}
      </Text>
    </Pressable>
  );
}

export function NewsSection({ politician }: { politician: string }) {
  const { data: items = [], isLoading } = useTradeNews(politician);

  return (
    <View>
      <SectionHeader />
      {isLoading ? (
        <View className="px-4 py-4">
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      ) : items.length === 0 ? (
        <Text className="px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
          No recent news for {politician} right now.
        </Text>
      ) : (
        items.slice(0, 5).map((item, i) => (
          <NewsRow key={`${item.link}-${i}`} item={item} />
        ))
      )}
    </View>
  );
}
