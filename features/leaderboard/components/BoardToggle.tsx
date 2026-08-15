// Segmented control switching between the two ranked boards:
//   "trade_count" -> Most active disclosers
//   "late_filer"  -> Most overdue filers
//
// Pure presentational component: renders the current selection and
// dispatches an intent (onChange) only. The selected board is ephemeral
// view state held by the screen via useState -- it is neither persisted
// nor shared across routes, so it stays out of Zustand (Zustand is for
// persisted / cross-surface client state). React Query owns the per-board
// server data, keyed by the same sort value.
import { Pressable, Text, View } from "react-native";
import type { LeaderboardSort } from "@/features/leaderboard/api/types";

type Option = { key: LeaderboardSort; label: string };

const OPTIONS: Option[] = [
  { key: "trade_count", label: "Most active" },
  { key: "late_filer", label: "Most overdue" },
];

type Props = {
  value: LeaderboardSort;
  onChange: (next: LeaderboardSort) => void;
};

export function BoardToggle({ value, onChange }: Props) {
  return (
    <View className="px-4 pt-4">
      <View className="flex-row rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {OPTIONS.map((opt) => {
          const active = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
              onPress={() => onChange(opt.key)}
              className={`flex-1 items-center rounded-md py-2 ${
                active ? "bg-white dark:bg-gray-700" : ""
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active
                    ? "text-cta-accent"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
