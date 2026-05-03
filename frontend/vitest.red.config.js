import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    include: ["src/tests/red/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});