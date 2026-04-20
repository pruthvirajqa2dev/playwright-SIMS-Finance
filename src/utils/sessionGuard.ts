import { Page } from "@playwright/test";

/**
 * Asserts that the user is still logged in by checking the current URL.
 *
 * UAT enforces single-session behaviour: if another session invalidates the
 * current one the app silently redirects back to the login page mid-test.
 * Call this at the start of any critical test step to detect that early and
 * produce a clear, actionable failure message instead of a confusing
 * element-not-found error deep inside the test.
 *
 * @example
 * await assertUserStillLoggedIn(page);
 */
export async function assertUserStillLoggedIn(page: Page): Promise<void> {
    const currentUrl = page.url();

    // The login / logout redirect URL contains the logout command flag.
    // Adjust this pattern if the app's login URL changes.
    const isOnLoginPage =
        currentUrl.includes("/auth/esr.elogin") || currentUrl.includes("cmd=0");

    if (isOnLoginPage) {
        throw new Error(
            `❌ Session expired or invalidated — page redirected to login: ${currentUrl}\n` +
                `This usually means the UAT environment terminated the session mid-test. ` +
                `Each test performs its own fresh login, so a redirect here is unexpected.`
        );
    }
}
