// Share helpers for a trade. Sharing policy: built-in RN Share API only, no
// native share module. The shared link is the trade's public page; its OG
// image (the Worker's social card) provides the preview where the target
// supports it -- there's no per-trade PNG endpoint to attach, and no
// file-system/sharing dep to attach a local image.
//
// Platform split (RN 0.81 ShareModule): iOS honors a separate `url` item
// (drives the OG link preview); Android's ShareModule IGNORES `url`, so the
// link is folded into the message on a trailing line. Text is kept terse
// (title + URL only -- no disclosure blob, no tracking params) so Samsung
// One UI / SMS targets don't truncate it.
import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

import { WEB_URL } from "@/lib/constants/links";
import { isBuy, type TradeRecord } from "@/features/trades/api/types";

export function tradeUrl(trade: TradeRecord): string {
  return `${WEB_URL}/trade/${trade.id}`;
}

function shareTitle(trade: TradeRecord): string {
  const action = isBuy(trade.tx_type) ? "bought" : "sold";
  const what = trade.ticker || trade.asset_name;
  return `${trade.politician} ${action} ${what} (${trade.amount_range})`;
}

// Platform-aware Share.share() payload.
export function buildShareText(trade: TradeRecord): {
  message: string;
  url?: string;
} {
  const title = shareTitle(trade);
  const url = tradeUrl(trade);
  return Platform.OS === "ios"
    ? { message: title, url }
    : { message: `${title}\n\n${url}` };
}

// Copy the trade link to the clipboard -- the reliable cross-platform
// fallback (Android Share.share resolves `sharedAction` regardless of
// whether a target was chosen, so it can't confirm success).
export async function copyTradeLink(trade: TradeRecord): Promise<void> {
  await Clipboard.setStringAsync(tradeUrl(trade));
}
