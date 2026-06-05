// About -- mobile-original copy. Version pulled from
// Constants.expoConfig.version so a `expo prebuild`-driven version
// bump in app.json reflects automatically without code changes.
//
// Press contact email tracks the /press surface on the web. CTA-34
// (2026-05-08) downgraded the brand-aligned press@congresstradealerts.com
// to congresstradealertsapp@gmail.com because Cloudflare Email Routing
// for press@ isn't wired yet (per CTA Worker repo's PRE_SEND_CHECKLIST
// Phase 1). All three customer-facing surfaces (mobile About, web
// /privacy, web /press) line up on this gmail value until Joe completes
// the routing setup. When that happens, flip this constant + the two
// CTA Worker constants in the same motion.
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { GITHUB_URL, PRIVACY_URL, TERMS_URL, WEB_URL } from "@/lib/constants/links";

// Single source of truth for the three-surface email rule (CLAUDE.md):
// also mirrored in the Worker repo's privacy.html + press.ts. Imported by
// methodology.tsx so the in-app surfaces can't drift.
export const PRESS_EMAIL = "congresstradealertsapp@gmail.com";

// Canonical civic-transparency disclaimer (verbatim, Lowe v. SEC-aligned).
// Same text as methodology.tsx's footer; both screens stand alone with the
// full disclaimer, no cross-reference.
const DISCLAIMER =
  "This app reports public STOCK Act disclosures and related public records " +
  "for civic transparency. It does not provide investment, legal, tax, or " +
  "financial advice; does not recommend buying, selling, or holding any " +
  "security; does not connect to brokerages or enable trading. Not affiliated " +
  "with or endorsed by Congress, the House, the Senate, the SEC, or any " +
  "government agency.";

function openExternal(url: string) {
  Linking.openURL(url).catch(() => {
    /* swallow -- non-fatal UI affordance miss */
  });
}

function openMail(email: string) {
  Linking.openURL(`mailto:${email}`).catch(() => {
    /* no mail client configured -- non-fatal */
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

function LinkRow({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Text className="mb-1.5 text-sm text-cta-accent underline">{label}</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? "-";

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Congress Trade Alerts
        </Text>
        <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          STOCK Act compliance tracker for the 119th Congress.
        </Text>
        <Text className="mt-2 mb-6 text-xs text-gray-500 dark:text-gray-400">
          Version {version}
        </Text>

        <Section title="What this app does">
          <Para>
            Congress Trade Alerts surfaces every stock trade disclosed
            under the STOCK Act by sitting members of the U.S. Congress.
            Each disclosure is normalized, tagged with the member&apos;s
            committee assignments, and pushed to subscribed devices when
            it lands.
          </Para>
          <Para>
            Built for journalists tracking compliance failures, civic-
            engaged citizens watching their representatives, and traders
            curious about congressional activity. The data is public; the
            app makes it actionable on a phone.
          </Para>
        </Section>

        <Section title="Privacy">
          <Para>
            v1 has no user accounts and no analytics. Push tokens are
            anonymous: the server stores the token, the platform (iOS or
            Android), and your subscription preferences (the politicians
            you&apos;ve opted in to alerts for). No email, no name, no device
            identifier beyond the rotating Expo push token.
          </Para>
          <Para>
            Disable push from Settings to remove your token from the
            server entirely.
          </Para>
          <LinkRow
            label="Read the full privacy policy"
            onPress={() => openExternal(PRIVACY_URL)}
          />
          <LinkRow
            label="Read the Terms of Service"
            onPress={() => openExternal(TERMS_URL)}
            accessibilityLabel="Open Terms of Service in browser"
          />
        </Section>

        <Section title="Open source">
          <Para>The mobile app is open source on GitHub.</Para>
          <LinkRow label={GITHUB_URL} onPress={() => openExternal(GITHUB_URL)} />
        </Section>

        <Section title="Press + contact">
          <Para>
            For press inquiries, methodology questions, or data requests:
          </Para>
          <LinkRow label={PRESS_EMAIL} onPress={() => openMail(PRESS_EMAIL)} />
        </Section>

        <Section title="Companion web tool">
          <Para>
            The full dashboard, simulator, leaderboards, and benchmark
            data live on the web.
          </Para>
          <LinkRow label={WEB_URL} onPress={() => openExternal(WEB_URL)} />
        </Section>

        <View className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <Text className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            {DISCLAIMER}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
