// ConflictScore -- committee-jurisdiction overlap for this trade. The Worker
// has already computed it (profile.trades[].conflict); we surface the
// per-trade overlap when present, fall back to the member's aggregate
// scorecard, then to a neutral "no overlap" line. Accountability framing
// only -- an overlap is an oversight-transparency signal, not wrongdoing.
//
// Caution accent uses the cta-late token via inline borderColor (avoids
// NativeWind opacity-modifier issues on custom colors).
import { ActivityIndicator, Text, View } from "react-native";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";

import { useTradeConflict } from "@/features/conflict/api/queries";
import { ctaColors } from "@/lib/theme/tokens";

function SectionHeader() {
  return (
    <Text className="px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      Committee oversight
    </Text>
  );
}

export function ConflictScore({
  politician,
  tradeId,
  sector,
}: {
  politician: string;
  tradeId: number;
  sector: string | null;
}) {
  const { data, isLoading } = useTradeConflict(politician, tradeId);
  const conflict = data?.conflict ?? null;
  const scorecard = data?.scorecard ?? null;
  const sectorTxt = sector && sector.trim() ? sector : "this sector";

  return (
    <View>
      <SectionHeader />

      {isLoading ? (
        <View className="px-4 py-3">
          <ActivityIndicator size="small" color={ctaColors.accent} />
        </View>
      ) : conflict ? (
        <View
          className="mx-4 mb-2 rounded-xl border bg-gray-50 p-4 dark:bg-gray-800"
          style={{ borderColor: ctaColors.late }}
        >
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={18} color={ctaColors.late} />
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {conflict.severity === "direct" ? "Direct" : "Adjacent"} jurisdiction overlap
            </Text>
          </View>
          <Text className="mt-1.5 text-sm leading-5 text-gray-700 dark:text-gray-300">
            {politician} sits on the {conflict.committee} committee
            {conflict.subcommittee ? ` (${conflict.subcommittee})` : ""}, whose
            jurisdiction overlaps {sectorTxt}.
          </Text>
          <Text className="mt-2 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            A transparency signal about committee oversight -- not a finding of
            wrongdoing.
          </Text>
        </View>
      ) : scorecard &&
        scorecard.directConflictCount + scorecard.adjacentConflictCount > 0 ? (
        <View className="mx-4 mb-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text className="text-sm leading-5 text-gray-700 dark:text-gray-300">
            No overlap on this trade. Across all disclosures, {politician} has{" "}
            <Text className="font-semibold">
              {scorecard.directConflictCount} direct
            </Text>{" "}
            and{" "}
            <Text className="font-semibold">
              {scorecard.adjacentConflictCount} adjacent
            </Text>{" "}
            committee-jurisdiction overlaps
            {scorecard.conflictedPortfolioPct > 0
              ? ` (${scorecard.conflictedPortfolioPct}% of disclosed volume)`
              : ""}
            .
          </Text>
        </View>
      ) : (
        <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <ShieldCheck size={18} color={ctaColors.buy} />
          <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">
            No committee-jurisdiction overlap flagged for this trade.
          </Text>
        </View>
      )}
    </View>
  );
}
