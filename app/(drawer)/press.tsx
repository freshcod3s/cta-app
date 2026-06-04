// Press -- thin mobile press surface. Surfaces what CTA is + the press
// contact, and links out to the full web press kit (expo-web-browser per
// Product Invariant #5). The full media kit (brand assets, screenshots) is
// not ported; it lives at /press on the web.
//
// Press email mirrors the About screen (three-surface email rule):
// congresstradealertsapp@gmail.com until Cloudflare Email Routing wires
// press@.
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink, Mail } from "lucide-react-native";

import { ctaColors } from "@/lib/theme/tokens";
import { PRESS_URL } from "@/lib/constants/links";

const PRESS_EMAIL = "congresstradealertsapp@gmail.com";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </Text>
      <Text className="mt-0.5 text-sm leading-5 text-gray-700 dark:text-gray-300">
        {value}
      </Text>
    </View>
  );
}

export default function PressScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Press &amp; media
        </Text>
        <Text className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-400">
          Congress Trade Alerts surfaces every stock trade U.S. members of
          Congress disclose under the STOCK Act -- public filings, normalized
          and pushed to your phone.
        </Text>

        <View className="mt-6 gap-2">
          <Fact
            label="What it is"
            value="A civic-transparency tracker for congressional STOCK Act disclosures -- not a brokerage, not investment advice."
          />
          <Fact
            label="Data source"
            value="U.S. House Clerk + Senate EFD disclosure portals, refreshed every 30 minutes."
          />
          <Fact
            label="Stance"
            value="Transparency and accountability for public filings. Never copy-trading, never 'actionable signal' framing."
          />
        </View>

        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(PRESS_URL)}
          accessibilityRole="button"
          accessibilityLabel="View full press kit -- opens in your browser"
          className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-cta-accent px-4 py-3"
        >
          <ExternalLink size={18} color="#ffffff" />
          <Text className="text-base font-semibold text-white">
            View full press kit
          </Text>
        </Pressable>

        <View className="mt-6">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Press contact
          </Text>
          <Pressable
            onPress={() => Linking.openURL(`mailto:${PRESS_EMAIL}`)}
            accessibilityRole="link"
            className="flex-row items-center gap-2"
          >
            <Mail size={16} color={ctaColors.accent} />
            <Text className="text-sm text-cta-accent underline">
              {PRESS_EMAIL}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
