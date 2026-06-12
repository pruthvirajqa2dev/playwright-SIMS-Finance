import { defineConfig, devices } from "@playwright/test";
import logger from "./src/logging/logger";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });
const dotenv = require("dotenv");
dotenv.config({
    path: `${__dirname}//src//config//.env`
});
// const defaultEnv = "uat";
logger.info(`Test environment: ${process.env.TEST_ENV}`);
const ENV = process.env.TEST_ENV || "uat";
process.env.TEST_ENV = ENV;

// ✅ Logging after resolution
logger.info(`Test environment: ${ENV}`);

// ✅ Always load env-specific file (no if-else)
dotenv.config({
    path: `${__dirname}//src//config//.env.${ENV}`,
    override: true
});
if (!process.env.URL) {
    throw new Error(`❌ URL not loaded. Check .env.${process.env.TEST_ENV}`);
}
logger.info(`Test environment: ${process.env.TEST_ENV || "development"}`);
logger.info(`Browser: ${process.env.BROWSER || "chromium"}`);

// if (!process.env.NODE_ENV) {
//     require("dotenv").config({ path: `${__dirname}//src//config//.env` });
// } else {
//     require("dotenv").config({
//         path: `${__dirname}//src//config//${process.env.NODE_ENV}.env`
//     });
// }
/**
 * See https://playwright.dev/docs/test-configuration.
 */
// storageState is intentionally NOT shared with postchecks shards.
// Each test performs its own fresh login to avoid single-session invalidation
// on UAT environments that enforce one active session per user.

export default defineConfig({
    expect: {
        timeout: 35 * 1000
    },
    timeout: 120 * 1000,
    testDir: "./src/tests",
    outputDir: "C:/temp/playwright-test-results",
    // Per-project fullyParallel is overridden below; keep false at root so
    // auth gate and postchecks don't inadvertently run in parallel globally.
    fullyParallel: false,
    // forbidOnly: !!process.env.CI,
    // Retries are intentionally set per-project (see below).
    retries: 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [["blob"], ["json", { outputFile: "test-results.json" }]],
    use: {
        baseURL: `${process.env.URL}`,
        video: "on",
        trace: "on-first-retry",
        screenshot: "on"
    },
    globalSetup: `src/utils/globalSetup.ts`,
    globalTeardown: `src/utils/globalTeardown.ts`,

    // ── maxFailures: stop early once 2 tests have failed ────────────────────
    // Applied globally; auth gate has its own retries=1 below so a transient
    // login hiccup won't immediately count as a failure.
    maxFailures: process.env.CI ? 2 : 0,

    projects: [
        // ── 1. Authentication gate ───────────────────────────────────────────
        // Runs ONLY auth.spec.ts.  1 retry giveslerance for transient blips.
        // The workflow blocks postchecks until this project exits 0.
        {
            name: "auth",
            retries: process.env.CI ? 1 : 0,
            testMatch: "**/Auth/auth.spec.ts",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1266, height: 586 }
            }
        },

        // ── 2. Postchecks — shard 1 (@shard1 tests) ─────────────────────────
        // retries: 1 — each test gets one retry attemptfore being marked
        // as failed, tolerating transient UAT flakiness.
        // Each test performs its own fresh login — no shared storageState.
        // This avoids "Session Expired / Invalid Session" errors caused by
        // UAT's single-session enforcement when two shards share one session.
        {
            name: "chromium-shard1",
            retries: process.env.CI ? 1 : 0,
            testMatch: "**/Post-Deployment-Tests/PostChecksTests.spec.ts",
            grep: /@shard1/,
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1266, height: 586 }
            }
        },

        // ── 3. Postchecks — shard 2 (@shard2 tests) ─────────────────────────
        {
            name: "chromium-shard2",
            retries: process.env.CI ? 1 : 0,
            testMatch: "**/Post-Deployment-Tests/PostChecksTests.spec.ts",
            grep: /@shard2/,
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1266, height: 586 }
            }
        },
        {
            name: "chromium-shard2",
            retries: process.env.CI ? 1 : 0,
            testMatch: "**/Purchase Order/**",
            grep: /@shard2/,
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1266, height: 586 }
            }
        },
        {
            name: "chromium-shard2",
            retries: process.env.CI ? 1 : 0,
            testMatch: "**/Purchase Order/**",
            grep: /@shard2/,
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1266, height: 586 }
            }
        },
        {
            name: "chromium-shard2",
            retries: process.env.CI ? 1 : 0,
            testMatch: "**/glCodeExtractor.spec.ts",
            grep: /@shard2/,
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1266, height: 586 }
            }
        }
        //src\tests\glCodeExtractor.spec.ts
        // {
        //     name: "firefox",
        //     use: {
        //         ...devices["Desktop Firefox"],
        //         viewport: { width: 1280, height: 595 }
        //     }
        // }

        // {
        //     name: "webkit",
        //     use: {
        //         ...devices["Desktop Safari"],
        //         viewport: { width: 1920, height: 1080 }
        //     }
        // }

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ]

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://127.0.0.1:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
