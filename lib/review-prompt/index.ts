// Native review prompt -- runtime. The rule lives in ./rule (pure, tested);
// this file only wires its dependencies: AsyncStorage for the counters, the
// app version from expo-constants, the clock, and expo-store-review.
//
// Call sites: app/trade/[id].tsx (a trade detail loaded) and
// features/saved/store.ts (a member saved). Both fire and forget; nothing
// here throws, and there is no custom pre-prompt, analytics or network call.
// The OS decides whether the sheet actually shows (both stores rate-limit it).
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";

import { migrateState, onReviewEvent, type ReviewEvent, type ReviewPromptState } from "./rule";

const STORAGE_KEY = "cta.reviewPrompt.v1";

// Module load is the process start: this module is imported from the root
// tree, so it loads with the app, not on first use.
const PROCESS_START = Date.now();

export type ReviewPromptDeps = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  appVersion: () => string;
  msSinceLaunch: () => number;
  available: () => Promise<boolean>;
  request: () => Promise<void>;
};

export const nativeDeps: ReviewPromptDeps = {
  read: () => AsyncStorage.getItem(STORAGE_KEY),
  write: (v) => AsyncStorage.setItem(STORAGE_KEY, v),
  appVersion: () => Constants.expoConfig?.version ?? "unknown",
  msSinceLaunch: () => Date.now() - PROCESS_START,
  available: () => StoreReview.isAvailableAsync(),
  request: () => StoreReview.requestReview(),
};

// Events are applied one at a time so two quick saves cannot both read the
// same stored state and both ask.
let queue: Promise<unknown> = Promise.resolve();

export function recordReviewEvent(
  event: ReviewEvent,
  deps: ReviewPromptDeps = nativeDeps,
): Promise<boolean> {
  const run = queue.then(async () => {
    try {
      let raw: unknown = null;
      try {
        const text = await deps.read();
        raw = text ? JSON.parse(text) : null;
      } catch {
        raw = null;
      }
      const state: ReviewPromptState = migrateState(raw, deps.appVersion());
      let { state: next, ask } = onReviewEvent(state, event, deps.msSinceLaunch());
      if (ask && !(await deps.available())) {
        // No review sheet on this device right now: keep the counters but
        // leave this version un-asked, so a later event can try again.
        next = { ...next, askedVersion: state.askedVersion };
        ask = false;
      }
      if (ask) await deps.request();
      await deps.write(JSON.stringify(next));
      return ask;
    } catch {
      return false;
    }
  });
  queue = run;
  return run;
}
