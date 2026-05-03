import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    // Exclude RED specs by default so CI and `npm test` remain clean.
    exclude: ["**/src/tests/red/**"],
  },
});
