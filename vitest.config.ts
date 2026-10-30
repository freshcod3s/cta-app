// Minimal test runner. Covers pure logic only -- no RN renderer, no
// component tests, no CI wiring (per the §25 minimal-runner clause).
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // The AsyncStorage-backed persister is imported transitively by
      // lib/query/client.ts. It is a native module with no Node
      // implementation, and these tests exercise pure retry logic, so it
      // is stubbed rather than pulling the RN runtime into the runner.
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "test/stubs/async-storage.ts",
      ),
      // Native modules reached through lib/review-prompt (the saved store
      // records a review event on save). Same reason as above.
      "expo-store-review": path.resolve(__dirname, "test/stubs/expo-store-review.ts"),
      "expo-constants": path.resolve(__dirname, "test/stubs/expo-constants.ts"),
      // Mirrors the "@/*" -> "./*" mapping in tsconfig.json.
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // .claude/worktrees holds a full second checkout of this repo; without
    // this the suite would collect and run every test twice.
    exclude: ["**/node_modules/**", "**/.claude/**", "**/ios/**", "**/android/**"],
  },
});
