// playwright.merge.config.ts

import { defineConfig } from "@playwright/test";

export default defineConfig({
    reporter: [
        [
            "html",
            {
                outputFolder: "playwright-report",
                open: "never"
            }
        ]
    ]
});
