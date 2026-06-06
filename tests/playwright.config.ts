import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  use: {
    baseURL: "https://solr.peviitor.ro",
    headless: false,
    launchOptions: {
      args: ["--remote-debugging-port=9222"],
    },
  },
  projects: [
    {
      name: "Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
