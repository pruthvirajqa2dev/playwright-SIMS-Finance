import { defineConfig, devices } from "@playwright/test";
import logger from "./src/logging/logger";
import dotenv from "dotenv";

// ------------------------------------------------------------
// Merge-reports detection
// Playwright 1.58+ loads playwright.config.ts during:
// npx playwright merge-reports
//
// We must avoid requiring environment variables when
// merge-reports runs in GitHub Actions.
// ------------------------------------------------------------
const isMergeReports = process.argv.some((arg) =>
    arg.includes("merge-reports")
);

// ------------------------------------------------------------
// Environment Loading
// ------------------------------------------------------------
if (!isMergeReports) {
    dotenv.config({
        path: `${__dirname}/src/config/.env`
    });

    const ENV = process.env.TEST_ENV || "uat";
    process.env.TEST_ENV = ENV;

    dotenv.config({
        path: `${__dirname}/src/config/.env.${ENV}`,
        override: true
    });

    logger.info(`Test environment: ${ENV}`);
    logger.info(`Browser: ${process.env.BROWSER || "chromium"}`);

    if (!process.env.URL) {
        throw new Error(`❌ URL not loaded. Check .env.${ENV}`);
    }
}

const isCI = !!process.env.CI;

export default defineConfig({
    // --------------------------------------------------------
    // General
    // --------------------------------------------------------
    testDir: "./src/tests",

    outputDir: "./temp/playwright-test-results",

    timeout: 120 * 1000,

    expect: {
        timeout: 35 * 1000
    },

    fullyParallel: false,

    workers: isCI ? 1 : undefined,

    retries: 0,

    maxFailures: isCI ? 2 : 0,

    // --------------------------------------------------------
    // Reporting
    // --------------------------------------------------------
    reporter: [["blob"], ["json", { outputFile: "test-results.json" }]],

    // --------------------------------------------------------
    // Global Hooks
    // --------------------------------------------------------
    globalSetup: "src/utils/globalSetup.ts",

    globalTeardown: "src/utils/globalTeardown.ts",

    // --------------------------------------------------------
    // Shared Browser Settings
    // --------------------------------------------------------
    use: {
        baseURL: process.env.URL,

        screenshot: "on",

        video: "on",

        trace: "on-first-retry"
    },

    // --------------------------------------------------------
    // Projects
    // --------------------------------------------------------
    projects: [
        // ====================================================
        // AUTH GATE
        // ====================================================
        {
            name: "auth",

            retries: isCI ? 1 : 0,

            testMatch: "**/Auth/auth.spec.ts",

            use: {
                ...devices["Desktop Chrome"],
                viewport: {
                    width: 1266,
                    height: 586
                }
            }
        },

        // ====================================================
        // POSTCHECKS SHARD 1
        // ====================================================
        {
            name: "chromium-shard1",

            retries: isCI ? 1 : 0,

            testMatch: "**/Post-Deployment-Tests/PostChecksTests.spec.ts",

            grep: /@shard1/,

            use: {
                ...devices["Desktop Chrome"],
                viewport: {
                    width: 1266,
                    height: 586
                }
            }
        },

        // ====================================================
        // POSTCHECKS SHARD 2
        // ====================================================
        {
            name: "chromium-shard2",

            retries: isCI ? 1 : 0,

            testMatch: "**/Post-Deployment-Tests/PostChecksTests.spec.ts",

            grep: /@shard2/,

            use: {
                ...devices["Desktop Chrome"],
                viewport: {
                    width: 1266,
                    height: 586
                }
            }
        },

        // ====================================================
        // PURCHASE ORDERS
        // ====================================================
        {
            name: "purchase-orders",

            retries: isCI ? 1 : 0,

            testMatch: "**/Purchase Order/**",

            grep: /@po/,

            use: {
                ...devices["Desktop Chrome"],
                viewport: {
                    width: 1266,
                    height: 586
                }
            }
        },

        // ====================================================
        // GL CODE EXTRACTOR
        // ====================================================
        {
            name: "gl-code-extractor",

            retries: isCI ? 1 : 0,

            testMatch: "**/glCodeExtractor.spec.ts",

            grep: /@glcode/,

            use: {
                ...devices["Desktop Chrome"],
                viewport: {
                    width: 1266,
                    height: 586
                }
            }
        },

        // ====================================================
        // PRL300 INVOICES / CREDIT NOTES
        // ====================================================
        {
            name: "prl300",

            retries: isCI ? 1 : 0,

            testMatch: "**/PRL300QInvoicesCreditNote/**",

            grep: /@prl300/,

            use: {
                ...devices["Desktop Chrome"],
                viewport: {
                    width: 1266,
                    height: 586
                }
            }
        }
    ]
});
