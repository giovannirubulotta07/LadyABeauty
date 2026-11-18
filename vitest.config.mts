import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    environment: "node",
    // Domain logic must never depend on the machine's timezone: run the
    // suite in an extreme one (UTC+14) to catch any accidental local-time use.
    env: { TZ: "Pacific/Kiritimati" },
    coverage: { include: ["src/domain/**"] },
  },
});
