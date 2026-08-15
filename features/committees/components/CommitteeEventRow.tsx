// Committee legislative-activity row -- a single congress.gov event (hearing,
// markup, bill, or vote) for the committee. Non-interactive: the worker's event
// url is a generic congress.gov root, so there is nothing specific to open.
// Framing is factual aggregation -- an event-type label (a noun), the date, the
// title, and the committee's sector tags. No evaluation, no "why this matters".
import { Text, View } from "react-native";

import type { CommitteeRecentEvent } from "../api/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic UTC date format ("Apr 16, 2026"). The worker sends a UTC
// timestamp; formatting in UTC keeps the displayed day stable regardless of
// device timezone (Process Kernel 6.2 -- no implicit locale/time drift).
function fmtEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// Event-type label. Known types get a clean noun; an unknown type falls back to
// its raw value uppercased so a new worker event_type still renders sanely.
const EVENT_LABEL: Record<string, string> = {
  hearing: "HEARING",
  markup: "MARKUP",
  bill_introduced: "BILL",
  bill_vote: "VOTE",
};

function eventLabel(t: string): string {
  return EVENT_LABEL[t] ?? t.replace(/_/g, " ").toUpperCase();
}

export function CommitteeEventRow({ event }: { event: CommitteeRecentEvent }) {
  const date = fmtEventDate(event.date);
  const label = eventLabel(event.event_type);
  const sectors = event.sectors?.length ? event.sectors.join(" - ") : "";

  return (
    <View
      accessible
      accessibilityLabel={[label, date, event.title].filter(Boolean).join(", ")}
      className="border-t border-gray-100 px-4 py-3 dark:border-gray-800"
    >
      <View className="flex-row items-center justify-between">
        <View className="rounded-full bg-cta-accent/10 px-2 py-0.5">
          <Text className="text-[10px] font-bold tracking-wide text-cta-accent">
            {label}
          </Text>
        </View>
        {date ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {date}
          </Text>
        ) : null}
      </View>
      <Text
        className="mt-1.5 text-sm text-gray-800 dark:text-gray-200"
        numberOfLines={2}
      >
        {event.title}
      </Text>
      {sectors ? (
        <Text
          className="mt-1 text-[11px] text-gray-500 dark:text-gray-400"
          numberOfLines={1}
        >
          {sectors}
        </Text>
      ) : null}
    </View>
  );
}
