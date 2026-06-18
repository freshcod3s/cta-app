// Conflicts view -- one ranked disclosure. ASSEMBLY, not new UI: the tappable
// body is the existing TradeRow (avatar / name / ticker / BUY-SELL + LATE pill
// / amount / watchlist star), which already links to the trade detail where
// the source-document link and full ConflictScore live. Beneath it we add the
// explainable chip strip (tier + reason), indented to align with the row's
// text column (matches the 68px feed divider inset).
import { View } from "react-native";

import { TradeRow } from "@/features/trades/components/TradeRow";
import { isTierA, type ConflictTrade } from "../ranking";
import {
  CommitteeOverlapChip,
  OwnerTypeChip,
  TierADocumentedChip,
} from "./ConflictChips";

export function ConflictListRow({ trade }: { trade: ConflictTrade }) {
  const tierA = isTierA(trade);

  return (
    <View>
      <TradeRow trade={trade} />
      {/* Chip strip. Always reserves the committee/owner chips (they self-omit
          when their data is absent); the Tier-A chip shows only for late rows.
          If nothing renders, the strip collapses to its vertical padding. */}
      <View className="flex-row flex-wrap items-center gap-1.5 pb-2 pl-[68px] pr-4">
        {tierA && (
          <TierADocumentedChip lagDays={trade.disclosure_lag_days} />
        )}
        <CommitteeOverlapChip trade={trade} />
        <OwnerTypeChip trade={trade} />
      </View>
    </View>
  );
}
