// InfoSheet -- the single, root-mounted explainer sheet (RN port of the web
// dashboard's #card-info-modal). Reads the active slug from the global
// useInfoSheet store and renders the matching entry from the registry:
// eyebrow + title, an explainer paragraph, "How it's computed", honest
// caveats, tappable indexed rows (deep-link deeper -- Product Invariant #9),
// and source citations.
//
// Presentation: a bottom sheet (slide-up) over a dimmed backdrop. Reuses the
// mandated Android BackHandler pattern (see components/back-handler-modal.tsx)
// so hardware-back closes the sheet instead of exiting the app; iOS swipe is
// native. Backdrop tap and the close X also dismiss.
//
// Row / source taps: `route` deep-links via expo-router; `url` opens the web
// in an in-app browser tab via expo-web-browser (Product Invariant #5 -- no
// untrusted HTML in a WebView; these are first-party/known links).
import { useEffect } from "react";
import {
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { ChevronRight, ExternalLink, X } from "lucide-react-native";

import { useInfoSheet } from "@/features/info/store";
import {
  getInfoEntry,
  type InfoRow,
  type InfoSource,
} from "@/features/info/registry";
import { ctaColors } from "@/lib/theme/tokens";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </Text>
  );
}

export function InfoSheet() {
  const router = useRouter();
  const activeSlug = useInfoSheet((s) => s.activeSlug);
  const close = useInfoSheet((s) => s.close);
  const entry = getInfoEntry(activeSlug);
  const visible = entry != null;

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [visible, close]);

  if (!entry) return null;

  const followTarget = (target: { route?: string; url?: string }) => {
    if (target.route) {
      close();
      router.push(target.route as never);
    } else if (target.url) {
      void openBrowserAsync(target.url).catch(() => {
        /* best-effort; a failed browser open should not crash the sheet */
      });
    }
  };

  const Row = ({ row }: { row: InfoRow }) => {
    const tappable = !!(row.route || row.url);
    const body = (
      <View className="flex-row items-center justify-between py-2.5">
        <Text
          className="flex-1 pr-3 text-sm text-gray-700 dark:text-gray-300"
          numberOfLines={2}
        >
          {row.label}
        </Text>
        <View className="flex-row items-center gap-1">
          {row.value ? (
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.value}
            </Text>
          ) : null}
          {row.route ? (
            <ChevronRight size={15} color={ctaColors.accent} />
          ) : row.url ? (
            <ExternalLink size={13} color={ctaColors.accent} />
          ) : null}
        </View>
      </View>
    );
    if (!tappable) return body;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={row.label}
        onPress={() => followTarget(row)}
        android_ripple={{ color: "rgba(99,102,241,0.12)" }}
      >
        {body}
      </Pressable>
    );
  };

  const Source = ({ source }: { source: InfoSource }) => {
    if (!source.url) {
      return (
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {source.label}
        </Text>
      );
    }
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${source.label} (opens in browser)`}
        onPress={() => followTarget(source)}
        className="mb-1.5 flex-row items-center gap-1"
      >
        <Text
          className="text-xs font-medium"
          style={{ color: ctaColors.accent }}
        >
          {source.label}
        </Text>
        <ExternalLink size={11} color={ctaColors.accent} />
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close"
          className="absolute inset-0 bg-black/60"
          onPress={close}
        />
        <View className="max-h-[82%] rounded-t-3xl bg-white dark:bg-gray-900">
          {/* grab handle */}
          <View className="items-center pt-2.5">
            <View className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          </View>

          {/* header */}
          <View className="flex-row items-start justify-between px-5 pt-3">
            <View className="flex-1 pr-3">
              {entry.eyebrow ? (
                <Text
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    color:
                      entry.tone === "flag"
                        ? ctaColors.late
                        : ctaColors.accent,
                  }}
                >
                  {entry.eyebrow}
                </Text>
              ) : null}
              <Text className="mt-0.5 text-xl font-bold text-gray-900 dark:text-gray-100">
                {entry.title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              hitSlop={10}
              className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-800"
            >
              {/* mid-gray reads on both the light (gray-100) and dark
                  (gray-800) chip background */}
              <X size={18} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView
            className="px-5"
            contentContainerClassName="pb-8"
            showsVerticalScrollIndicator={false}
          >
            <Text className="mt-3 text-sm leading-5 text-gray-700 dark:text-gray-300">
              {entry.body}
            </Text>

            {entry.method ? (
              <>
                <SectionLabel>How it&apos;s computed</SectionLabel>
                <Text className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                  {entry.method}
                </Text>
              </>
            ) : null}

            {entry.rows && entry.rows.length > 0 ? (
              <>
                <SectionLabel>Details</SectionLabel>
                <View className="rounded-xl border border-gray-200 px-3 dark:border-gray-700">
                  {entry.rows.map((row, i) => (
                    <View
                      key={`${row.label}-${i}`}
                      className={
                        i > 0
                          ? "border-t border-gray-100 dark:border-gray-800"
                          : ""
                      }
                    >
                      <Row row={row} />
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {entry.caveats && entry.caveats.length > 0 ? (
              <>
                <SectionLabel>Good to know</SectionLabel>
                {entry.caveats.map((c, i) => (
                  <View key={i} className="mb-1.5 flex-row pr-2">
                    <Text className="mr-2 text-sm text-gray-400">{"•"}</Text>
                    <Text className="flex-1 text-sm leading-5 text-gray-600 dark:text-gray-400">
                      {c}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {entry.sources && entry.sources.length > 0 ? (
              <>
                <SectionLabel>Sources</SectionLabel>
                {entry.sources.map((s, i) => (
                  <Source key={`${s.label}-${i}`} source={s} />
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
