import test, { expect } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import { getCredentials } from "../../utils/credentials";
import expectedTexts from "../../data/expectedTexts.json";
import ENV from "../../config/env";
import path from "path";
import fs from "fs";

/**
 * @description
 * Authentication Gate — runs BEFORE any post-check shard.
 *
 * Purpose:
 *   Verify that login and basic homepage load work.
 *   If this fails the entire pipeline is aborted, saving ~20 min of wasted CI.
 *
 * Retries: configured to 2 in the "auth" Playwright project (see playwright.config.ts).
 * storageState: saved to /tmp/storageState.json so postchecks shards can reuse
 *               the authenticated session without repeating the login flow.
 */

const STORAGE_STATE_PATH =
    process.env.STORAGE_STATE_PATH ?? "/tmp/storageState.json";

test.describe("Auth Gate", () => {
    test("Login succeeds and homepage loads @auth", async ({
        page
    }, testInfo) => {
        test.info().annotations.push({
            type: "Auth Gate",
            description: `Verify login works for user ${ENV.USERID}`
        });

        const loginPage = new LoginPage(page, testInfo);

        // ── Navigate and log in ──────────────────────────────────────────
        const homepage = await loginPage.login(
            getCredentials(
                expectedTexts.demoSiteKey + expectedTexts.tenantNumber,
                expectedTexts.schoolKey + expectedTexts.schoolNumber,
                expectedTexts.userRoleKey
            ),
            testInfo
        );

        // ── Basic homepage assertion ─────────────────────────────────────
        await test.step("Verify homepage elements are visible", async () => {
            await homepage.expectPageElementsVisibilityOnLoad();
        });

        // ── Save authenticated session for shard reuse ───────────────────
        await test.step("Save session storageState", async () => {
            const dir = path.dirname(STORAGE_STATE_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            await page.context().storageState({ path: STORAGE_STATE_PATH });
            console.log(`✅ storageState saved to: ${STORAGE_STATE_PATH}`);
        });
    });
});
