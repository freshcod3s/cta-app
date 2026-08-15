// Daily Dive -- a 7-day accountability digest from GET /api/daily-dive:
// the disclosure pulse, most-traded stocks, sector breakdown, bipartisan
// purchases, most-active members, newly disclosing members, and large/late
// filings. Discovery + accountability framing only -- never "what to buy".
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ctaColors } from "@/lib/theme/tokens";
import { useDailyDive } from "@/features/dailydive/api/queries";
import { PulseBanner } from "@/features/dailydive/components/PulseBanner";
import {
  BipartisanRow,
  FreshFaceRow,
  MemberRow,
  SectorRow,
  StockRow,
  UnusualRow,
} from "@/features/dailydive/components/DiveRows";

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View className="px-4 pb-1 pt-5">
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </Text>
      {sub ? (
        <Text className="mt-0.5 text-[11px] text-gray-400">{sub}</Text>
      ) : null}
    </View>
  );
}

export default function DailyDiveScreen() {
  const query = useDailyDive();

  if (query.isLoading) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        className="flex-1 items-center justify-center bg-white dark:bg-gray-900"
      >
        <ActivityIndicator size="large" color={ctaColors.accent} />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        className="flex-1 items-center justify-center bg-white p-6 dark:bg-gray-900"
      >
        <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Couldn&apos;t load the daily dive
        </Text>
        <Pressable
          onPress={() => query.refetch()}
          accessibilityRole="button"
          className="mt-4 rounded-lg bg-cta-accent px-5 py-3"
        >
          <Text className="font-semibold text-white">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { pulse, stocks, politicians, unusual, sectors, bipartisan, fresh_faces } =
    query.data;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <PulseBanner pulse={pulse} />

        <SectionHeader
          title="Most-traded stocks"
          sub="By disclosed trades, last 7 days"
        />
        {stocks.slice(0, 8).map((s, i) => (
          <StockRow key={`${s.ticker}-${i}`} s={s} />
        ))}

        <SectionHeader
          title="Disclosures by sector"
          sub="Disclosed trades grouped by sector, last 7 days"
        />
        {sectors.length === 0 ? (
          <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            No sector breakdown in the last 7 days.
          </Text>
        ) : (
          sectors.map((s, i) => <SectorRow key={`${s.sector}-${i}`} s={s} />)
        )}

        <SectionHeader
          title="Bought by both parties"
          sub="Purchased by Democratic and Republican members, last 30 days"
        />
        {bipartisan.length === 0 ? (
          <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            No securities purchased by both parties in the last 30 days.
          </Text>
        ) : (
          bipartisan.map((b, i) => (
            <BipartisanRow key={`${b.ticker}-${i}`} b={b} />
          ))
        )}

        <SectionHeader
          title="Most active members"
          sub="By disclosure count, last 7 days"
        />
        {politicians.slice(0, 8).map((m, i) => (
          <MemberRow key={`${m.politician}-${i}`} m={m} />
        ))}

        <SectionHeader
          title="Newly disclosing members"
          sub="Members with their first disclosure in the last 30 days"
        />
        {fresh_faces.length === 0 ? (
          <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            No newly disclosing members in the last 30 days.
          </Text>
        ) : (
          fresh_faces.map((f, i) => (
            <FreshFaceRow key={`${f.politician}-${i}`} f={f} />
          ))
        )}

        <SectionHeader
          title="Large or late filings"
          sub="Disclosures over $250K or past the 45-day STOCK Act deadline"
        />
        {unusual.length === 0 ? (
          <Text className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            None flagged in the last two weeks.
          </Text>
        ) : (
          unusual
            .slice(0, 8)
            .map((u, i) => (
              <UnusualRow key={`${u.politician}-${u.ticker ?? ""}-${i}`} u={u} />
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
