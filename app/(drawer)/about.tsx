// About -- mobile-original copy. Version pulled from
// Constants.expoConfig.version so a `expo prebuild`-driven version
// bump in app.json reflects automatically without code changes.
//
// Press contact email tracks the /press surface on the web. CTA-34
// (2026-05-08) downgraded the brand-aligned press@congresstradealerts.com
// to congresstradealertsapp@gmail.com because Cloudflare Email Routing
// for press@ isn't wired yet (per CTA Worker repo's PRE_SEND_CHECKLIST
// Phase 1 🟡). All three customer-facing surfaces (mobile About, web
// /privacy, web /press) line up on this gmail value until Joe completes
// the routing setup. When that happens, flip this constant + the two
// CTA Worker constants in the same motion.
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { GITHUB_URL, PRIVACY_URL, TERMS_URL, WEB_URL } from "@/lib/constants/links";

const PRESS_EMAIL = "congresstradealertsapp@gmail.com";

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
  const version = Constants.expoConfig?.version ?? "—";

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

        <View className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Text className="text-[10px] text-gray-500 dark:text-gray-400">
            Not investment advice. Data sourced from public STOCK Act
            filings via Capitol Trades and the House/Senate disclosure
            systems. See Methodology for full sourcing + limitations.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
