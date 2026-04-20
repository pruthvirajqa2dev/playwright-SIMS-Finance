import test, { expect } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import { getCredentials } from "../../utils/credentials";
import expectedTexts from "../../data/expectedTexts.json";
import ENV from "../../config/env";

/**
 * @description
 * Authentication Gate — runs BEFORE any post-check shard.
 *
 * Purpose:
 *   Verify that login and basic homepage load work.
 *   If this fails the entire pipeline is aborted, saving ~20 min of wasted CI.
 *
 * Retries: configured to 2 in the "auth" Playwright project (see playwright.config.ts).
 *
 * NOTE: storageState is intentionally NOT saved here. Postchecks shards each
 * perform their own fresh login to avoid "Session Expired / Invalid Session"
 * errors caused by UAT's single-session enforcement when a shared session is
 * reused across parallel shards.
 */

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
    });
});
