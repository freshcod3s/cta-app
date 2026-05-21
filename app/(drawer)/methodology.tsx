// Methodology -- mirrors the section structure of the web's
// /methodology page (probed in CTA-App-1-8 P1 against
// https://congresstradealerts.com/methodology, 2026-05-08). Mobile copy
// is condensed for scroll-friendly reading; the full version lives on
// web and is linked at the bottom.
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WEB_METHODOLOGY = "https://congresstradealerts.com/methodology";

function openExternal(url: string) {
  Linking.openURL(url).catch(() => {
    /* swallow -- opening a link is a non-fatal UI affordance miss */
  });
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 text-sm leading-5 text-gray-700 dark:text-gray-300">
      {children}
    </Text>
  );
}

export default function MethodologyScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Methodology
        </Text>
        <Text className="mb-6 text-xs text-gray-500 dark:text-gray-400">
          How Congress Trade Alerts collects, classifies, and surfaces
          STOCK Act disclosures.
        </Text>

        <Section title="Data sources">
          <Para>
            Primary feed: Capitol Trades (capitoltrades.com), scraped every
            30 minutes for fresh disclosures.
          </Para>
          <Para>
            Redundancy: House Clerk PTR XML feed and Senate EFD search
            results. Committee assignments come from clerk.house.gov and
            the open @unitedstates/congress-legislators dataset; sector
            tagging from Finnhub&apos;s GICS classifications.
          </Para>
        </Section>

        <Section title="Update cadence">
          <Para>
            New disclosures land within ~30 minutes of appearing on
            Capitol Trades. Committee assignments backfill on a slower
            schedule (last full pass: 2026-05-06).
          </Para>
        </Section>

        <Section title="Late filings">
          <Para>
            The STOCK Act requires disclosure within 45 days of the trade.
            We flag any trade where the disclosure date is more than 45
            days after the trade date as <Text className="font-semibold">late</Text>.
            About 17% of disclosures currently exceed this threshold; the
            median lag is 27 days.
          </Para>
          <Para>
            Trade detail screens show a yellow LATE pill on these rows.
          </Para>
        </Section>

        <Section title="Amount ranges">
          <Para>
            STOCK Act discloses amounts as ranges, not exact figures
            (e.g. $1,001 - $15,000). The simulator and aggregate stats use
            the midpoint of each range, with an explicit ±50% per-trade
            variance. Treat range-derived totals as approximations.
          </Para>
        </Section>

        <Section title="Disclosure lag">
          <Para>
            Lag is the difference (in days) between the trade date a
            member reports and the date that disclosure becomes public.
          </Para>
        </Section>

        <Section title="Conflict + jurisdiction signals">
          <Para>
            Trades are tagged when the member sits on a committee whose
            jurisdiction overlaps the security&apos;s GICS sector. Committee
            jurisdictions come from public charters; sector mapping from
            Finnhub.
          </Para>
        </Section>

        <Section title="Limitations">
          <Para>
            Amounts are ranges, not precise figures. Disclosure lag
            reflects filing delay; we don&apos;t observe option exercise
            details, post-disclosure exits, or non-equity assets cleanly.
          </Para>
          <Para>
            Some rows have corrupted source dates (lag &gt; 1,825 days) and
            are excluded; ~15,900 historical rows lack ticker symbols and
            are shown by asset name only.
          </Para>
        </Section>

        <Section title="Reproducibility">
          <Para>
            The full dataset and analysis pipeline are public. The MCP
            server exposes the same queries the web dashboard runs;
            benchmark harness + scripts are in the GitHub repo.
          </Para>
        </Section>

        <View className="mt-2 mb-6">
          <Pressable
            onPress={() => openExternal(WEB_METHODOLOGY)}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text className="text-sm text-cta-accent underline">
              Read the full methodology on the web -&gt;
            </Text>
          </Pressable>
        </View>

        <Text className="text-[10px] text-gray-400">
          Last updated: 2026-05-08 (mobile copy)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
