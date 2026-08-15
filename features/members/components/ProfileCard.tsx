// ProfileCard -- the reusable shell for the web-parity profile modules
// (the dashboard's cg-* panels). Title row + a circled-i affordance;
// tapping anywhere on the card opens its InfoSheet explainer (Product
// Invariant #9 -- no inert cards). Card bodies that carry their own
// tappable rows (deep-links) nest their own Pressables, which take press
// precedence over this outer one (matching the web's click-target guard).
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Info } from "lucide-react-native";

import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";

type Props = {
  title: string;
  infoSlug: string;
  // Optional right-aligned header accessory (e.g. a headline value/badge).
  accessory?: ReactNode;
  children: ReactNode;
};

export function ProfileCard({ title, infoSlug, accessory, children }: Props) {
  const open = useOpenInfo();
  return (
    <Pressable
      onPress={() => open(infoSlug)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Tap for details.`}
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="mx-4 mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </Text>
          <Info size={12} color={ctaColors.accent} />
        </View>
        {accessory ?? null}
      </View>
      {children}
    </Pressable>
  );
}
