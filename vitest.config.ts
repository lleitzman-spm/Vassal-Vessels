import { defineConfig } from "vitest/config";

// No environment is named, so tests run in plain Node with no DOM. That is
// deliberate and matches tsconfig's missing "DOM" lib: a test that needs a
// browser is testing something this repo does not have.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
