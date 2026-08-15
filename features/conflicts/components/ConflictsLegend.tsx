// Conflicts view -- header explainer. Makes the ranking legible and keeps the
// committee-overlap caveat honest and up-front (not buried). No score is shown
// because there is no score: rows are ordered by the visible signals below.
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Landmark, ShieldAlert } from "lucide-react-native";

import { ctaColors } from "@/lib/theme/tokens";

function LegendRow({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View className="mt-3 flex-row gap-2.5">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </Text>
        <Text className="mt-0.5 text-xs leading-4 text-gray-600 dark:text-gray-400">
          {body}
        </Text>
      </View>
    </View>
  );
}

export function ConflictsLegend() {
  return (
    <View className="border-b border-gray-200 px-4 pb-4 pt-2 dark:border-gray-800">
      <Text className="text-xs leading-5 text-gray-600 dark:text-gray-400">
        Ranks the disclosures loaded so far -- documented late filings first,
        then trade size. Scroll to load and rank more. Each row opens the full
        filing.
      </Text>

      <LegendRow
        icon={<ShieldAlert size={16} color={ctaColors.late} />}
        title="Tier A - Documented"
        body="A late filing under the 45-day STOCK Act deadline. This is the statutory, public-record signal that drives the order."
      />
      <LegendRow
        icon={<Landmark size={16} color="#9ca3af" />}
        title="Tier B - Committee overlap"
        body="The member sits on a committee whose jurisdiction overlaps the trade's sector. Secondary context only: it is based on each member's CURRENT committee assignment, not their assignment as of the trade date, so it never affects ranking."
      />
    </View>
  );
}
