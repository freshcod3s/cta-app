// FaqAccordion -- tap a question to expand its answer. Pure client state
// (per-row open/closed); no API. Plus/Minus affordance flips on toggle.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Plus, Minus } from "lucide-react-native";

import { ctaColors } from "@/lib/theme/tokens";
import { FAQ_ITEMS } from "@/features/faq/data";

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="border-b border-gray-200 dark:border-gray-800">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between gap-3 px-4 py-4"
      >
        <Text className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {q}
        </Text>
        {open ? (
          <Minus size={18} color={ctaColors.accent} />
        ) : (
          <Plus size={18} color={ctaColors.accent} />
        )}
      </Pressable>
      {open ? (
        <Text className="px-4 pb-4 text-sm leading-5 text-gray-600 dark:text-gray-400">
          {a}
        </Text>
      ) : null}
    </View>
  );
}

export function FaqAccordion() {
  return (
    <View>
      {FAQ_ITEMS.map((item, i) => (
        <FaqRow key={i} q={item.q} a={item.a} />
      ))}
    </View>
  );
}
