// Add / remove this member from the comparison set.
//
// Entry point number two (the Saved workspace is the other), so a user can
// build a comparison while browsing rather than having to save first and
// assemble later.
//
// The cap is enforced in the store, not here, so every entry point behaves
// identically. At the cap this control announces itself as unavailable
// rather than silently ignoring a tap.
import { Pressable, Text } from "react-native";
import { Columns3 } from "lucide-react-native";

import { useCompareStore, MAX_COMPARE } from "@/features/compare/store";
import { displayName } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

export function CompareToggleButton({ name }: { name: string }) {
  const selected = useCompareStore((s) => s.isSelected(name));
  const canAdd = useCompareStore((s) => s.canAdd());
  const toggle = useCompareStore((s) => s.toggle);

  const disabled = !selected && !canAdd;
  const label = displayName(name);

  return (
    <Pressable
      onPress={() => toggle(name)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={
        disabled
          ? `Compare is full at ${MAX_COMPARE} members; remove one first`
          : selected
            ? `Remove ${label} from compare`
            : `Add ${label} to compare`
      }
      className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg px-4 ${
        selected
          ? "bg-cta-accent"
          : "border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <Columns3 size={16} color={selected ? "#ffffff" : ctaColors.accent} />
      <Text
        className={`text-sm font-semibold ${
          selected ? "text-white" : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {selected ? "In compare" : "Compare"}
      </Text>
    </Pressable>
  );
}
