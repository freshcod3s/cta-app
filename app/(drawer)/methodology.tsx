// Methodology -- mirrors the section structure of the web's
// /methodology page (probed in CTA-App-1-8 P1 against
// https://congresstradealerts.com/methodology, 2026-05-08). Mobile copy
// is condensed for scroll-friendly reading; the full version lives on
// web and is linked at the bottom.
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// PRESS_EMAIL is the single source of truth for the contact-email rule
// (CLAUDE.md: about.tsx + press.tsx + Worker privacy.html + Worker press.ts).
// Import it -- never hardcode -- so this surface cannot drift from the others.
import { PRESS_EMAIL } from "./about";
import { useCoverage, withCommas } from "@/features/methodology/api/coverage";
import { DataSources } from "@/features/methodology/components/DataSources";
import { GOVERNMENT_DISCLAIMER, GOVERNMENT_SOURCES, OTHER_SOURCES } from "@/features/methodology/sources";

const WEB_METHODOLOGY = "https://congresstradealerts.com/methodology";

// Civic-framing disclaimer (verbatim, Lowe v. SEC-aligned: public-record,
// impersonal, no advice, no execution). ASCII only.
const DISCLAIMER =
  "This app reports public STOCK Act disclosures and related public records " +
  "for civic transparency. It does not provide investment, legal, tax, or " +
  "financial advice; does not recommend buying, selling, or holding any " +
  "security; does not connect to brokerages or enable trading. Not affiliated " +
  "with or endorsed by Congress, the House, the Senate, the SEC, or any " +
  "government agency.";

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
  // Read live so the figure cannot go stale the way "~15,900" did. On any
  // failure noTickerRows stays undefined and the sentence below degrades to
  // "some historical rows" -- never a wrong or zero count, and never a
  // loading state on a static reading screen.
  const { data: coverage } = useCoverage();
  const noTickerRows = coverage?.missing_unpriceable ?? null;

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

        <View className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text selectable className="text-sm leading-5 text-gray-700 dark:text-gray-300">
            {GOVERNMENT_DISCLAIMER}
          </Text>
        </View>

        <Section title="Official government sources">
          <Para>
            Current trade records originate in House and Senate financial
            disclosures. Our collection pipeline parses and normalizes these
            records. Member and committee data also use the independent
            datasets listed below. Open the official sources to check the
            underlying records; source availability and coverage vary.
          </Para>
          <DataSources sources={GOVERNMENT_SOURCES} />
        </Section>

        <Section title="Other information providers">
          <DataSources sources={OTHER_SOURCES} />
          <Para>
            Sector classifications, committee-to-sector mappings, overlap
            flags, and aggregate statistics are maintained or calculated by
            Congress Trade Alerts. They are not government findings or
            endorsements. An overlap does not establish wrongdoing.
          </Para>
        </Section>

        <Section title="Update cadence">
          <Para>
            We check the House Clerk portal about every 30 minutes and the
            Senate EFD system about every six hours. That is how often we
            look for new filings -- not how quickly a trade becomes public.
            PTR reporting deadlines generally use the earlier of 30 days
            after the filer is notified of a transaction or 45 days after
            the transaction. See the official House and Senate guidance
            above. An alert is about a disclosure, not a trade executing.
          </Para>
          <Para>
            The main trade feed in this app shows filings once they are at
            least 24 hours old. That applies to every user; there is no
            faster tier. Push alerts are separate and go out on the check
            cycle above, so an alert can arrive before that trade is
            browsable in the main feed. Other views, such as a trade opened
            from an alert, may show it earlier. Availability and collection
            limits can delay or omit records and alerts.
          </Para>
          <Para>
            Committee assignments backfill on a slower schedule (last full
            pass: 2026-08-20).
          </Para>
        </Section>

        <Section title="Late filings">
          <Para>
            We flag a trade where the recorded disclosure date is more than 45
            days after the trade date as <Text className="font-semibold">late</Text>.
            This is our date-based indicator, not an official determination
            of a violation. It does not evaluate the earlier notification-based
            deadline, exceptions, or the accuracy of the filed dates.
          </Para>
          <Para>
            Trade detail screens show a yellow LATE pill on these rows.
          </Para>
        </Section>

        <Section title="Amount ranges">
          <Para>
            Transaction amounts are reported as ranges, not exact figures
            (e.g. $1,001 - $15,000). Derived totals are estimates; the
            calculation basis is identified alongside each metric.
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
            jurisdiction overlaps the security&apos;s sector. Committee
            jurisdictions come from public charters; the sector mapping is
            one we maintain ourselves. Finnhub supplies the company details
            on a ticker&apos;s own page -- name, industry, market cap -- but
            not this mapping.
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
            are excluded;{" "}
            {noTickerRows == null
              ? "some historical rows"
              : `~${withCommas(noTickerRows)} historical rows`}{" "}
            lack ticker symbols and are shown by asset name only.
          </Para>
        </Section>

        <Section title="Reproducibility">
          <Para>
            The mobile app source is public. The companion website explains
            the collection and analysis methods; not all underlying data,
            operational tooling, or benchmark material is published.
          </Para>
        </Section>

        <Section title="Questions or corrections">
          <Para>
            Spotted an error or have a question about the data? Email{" "}
            <Text
              className="text-cta-accent underline"
              onPress={() => openExternal(`mailto:${PRESS_EMAIL}`)}
              accessibilityRole="link"
            >
              {PRESS_EMAIL}
            </Text>
            .
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

        <View className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <Text className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            {DISCLAIMER}
          </Text>
        </View>

        <Text className="text-[10px] text-gray-400">
          Last updated: 2026-10-29 (mobile copy)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
