// ShareTradeButton -- Share (system sheet via RN Share API) + Copy link.
// The Copy link button is the reliable cross-platform action; on Android the
// share sheet still opens but can't report success/target, so Copy link is
// the dependable path. Both are non-fatal on failure (cancel / no targets /
// clipboard unavailable just no-op).
import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { Share2, Link as LinkIcon, Check } from "lucide-react-native";

import { buildShareText, copyTradeLink } from "@/features/share/lib/buildShare";
import type { TradeRecord } from "@/features/trades/api/types";

export function ShareTradeButton({ trade }: { trade: TradeRecord }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    try {
      await Share.share(buildShareText(trade));
    } catch {
      // user cancel / no share targets -- non-fatal
    }
  };

  const onCopy = async () => {
    try {
      await copyTradeLink(trade);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable -- non-fatal
    }
  };

  return (
    <View className="flex-row gap-3 px-4 py-3">
      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Share this trade"
        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-cta-accent px-4 py-3"
      >
        <Share2 size={18} color="#ffffff" />
        <Text className="text-sm font-semibold text-white">Share</Text>
      </Pressable>
      <Pressable
        onPress={onCopy}
        accessibilityRole="button"
        accessibilityLabel={copied ? "Link copied" : "Copy link"}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700"
      >
        {copied ? (
          <Check size={18} color="#10b981" />
        ) : (
          <LinkIcon size={18} color="#6b7280" />
        )}
        <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {copied ? "Copied" : "Copy link"}
        </Text>
      </Pressable>
    </View>
  );
}
