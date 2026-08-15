// FilterBar -- pinned above the feed list. Search box (politician, LIKE)
// + single-select-per-dimension toggle chips (buy/sell, party, chamber,
// sitting-only) + a removable ticker chip when a row drill-in set one.
//
// The search box debounces 350ms before committing to the store so we
// fire one request per pause, not one per keystroke. A ref tracks the
// last value we pushed so the external-sync effect (drill-in / Clear)
// can tell a real external change from an echo of our own commit and not
// clobber in-progress typing.
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Search, X } from "lucide-react-native";

import { ctaColors } from "@/lib/theme/tokens";
import { activeFilterCount } from "@/features/trades/api/types";
import { useTradeFiltersStore } from "@/features/trades/store";

const PLACEHOLDER = "#9ca3af"; // gray-400, legible on both themes

function Chip({
  label,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`mr-2 rounded-full border px-3 py-1.5 ${
        active ? "border-transparent" : "border-gray-300 dark:border-gray-700"
      }`}
      style={active ? { backgroundColor: activeColor } : undefined}
    >
      <Text
        className={`text-xs font-semibold ${
          active ? "text-white" : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterBar() {
  const filters = useTradeFiltersStore((s) => s.filters);
  const setPolitician = useTradeFiltersStore((s) => s.setPolitician);
  const toggleChip = useTradeFiltersStore((s) => s.toggleChip);
  const toggleCurrentOnly = useTradeFiltersStore((s) => s.toggleCurrentOnly);
  const drillToTicker = useTradeFiltersStore((s) => s.drillToTicker);
  const clear = useTradeFiltersStore((s) => s.clear);

  const [text, setText] = useState(filters.politician ?? "");
  const lastCommitted = useRef<string | undefined>(filters.politician);

  // Commit typed text -> store, debounced.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = text.trim() || undefined;
      lastCommitted.current = next;
      setPolitician(text);
    }, 350);
    return () => clearTimeout(id);
  }, [text, setPolitician]);

  // Reflect external changes (row drill-in, Clear) in the box, ignoring
  // echoes of our own debounced commit.
  useEffect(() => {
    if (filters.politician !== lastCommitted.current) {
      lastCommitted.current = filters.politician;
      setText(filters.politician ?? "");
    }
  }, [filters.politician]);

  const activeCount = activeFilterCount(filters);

  return (
    <View className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-3">
        <View className="flex-1 flex-row items-center rounded-lg bg-gray-100 px-3 dark:bg-gray-800">
          <Search size={16} color={PLACEHOLDER} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Search a member..."
            placeholderTextColor={PLACEHOLDER}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 py-2 pl-2 text-sm text-gray-900 dark:text-gray-100"
          />
          {text ? (
            <Pressable
              onPress={() => setText("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={16} color={PLACEHOLDER} />
            </Pressable>
          ) : null}
        </View>
        {activeCount > 0 ? (
          <Pressable onPress={clear} hitSlop={8} accessibilityRole="button">
            <Text className="text-xs font-semibold text-cta-accent">Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
      >
        {filters.ticker ? (
          <Pressable
            onPress={() => drillToTicker("")}
            accessibilityRole="button"
            accessibilityLabel={`Clear ticker filter ${filters.ticker}`}
            className="mr-2 flex-row items-center gap-1 rounded-full px-3 py-1.5"
            style={{ backgroundColor: ctaColors.accent }}
          >
            <Text className="text-xs font-semibold text-white">
              {filters.ticker}
            </Text>
            <X size={12} color="#ffffff" />
          </Pressable>
        ) : null}

        <Chip
          label="Buy"
          active={filters.txType === "Purchase"}
          activeColor={ctaColors.buy}
          onPress={() => toggleChip("txType", "Purchase")}
        />
        <Chip
          label="Sell"
          active={filters.txType === "Sale"}
          activeColor={ctaColors.sell}
          onPress={() => toggleChip("txType", "Sale")}
        />
        <Chip
          label="Dem"
          active={filters.party === "D"}
          activeColor={ctaColors.dem}
          onPress={() => toggleChip("party", "D")}
        />
        <Chip
          label="Rep"
          active={filters.party === "R"}
          activeColor={ctaColors.rep}
          onPress={() => toggleChip("party", "R")}
        />
        <Chip
          label="Ind"
          active={filters.party === "I"}
          activeColor={ctaColors.accent}
          onPress={() => toggleChip("party", "I")}
        />
        <Chip
          label="House"
          active={filters.chamber === "House"}
          activeColor={ctaColors.accent}
          onPress={() => toggleChip("chamber", "House")}
        />
        <Chip
          label="Senate"
          active={filters.chamber === "Senate"}
          activeColor={ctaColors.accent}
          onPress={() => toggleChip("chamber", "Senate")}
        />
        <Chip
          label="Sitting only"
          active={!!filters.currentOnly}
          activeColor={ctaColors.accent}
          onPress={toggleCurrentOnly}
        />
      </ScrollView>
    </View>
  );
}
