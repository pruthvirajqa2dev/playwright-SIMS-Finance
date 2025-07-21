import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import RSS310Q from "../pages/RSS/RSS310Q";

async function login(page: Page, testInfo: TestInfo) {
    const loginPage = new LoginPage(page, testInfo);
    //Login using username and password
    const homepage: HomePage = await loginPage.login(
        ENV.USERID!,
        ENV.PASSWORD!,
        testInfo
    );

    return homepage;
}

test.describe(
    "Extract gl code on environment:" + `${process.env.test_env}`.toUpperCase(),
    () => {
        test(
            "Extract gl code on environment:" + `${process.env.test_env}`,
            async ({ page }, testInfo) => {
                test.info().annotations.push({
                    type: "RSS310Q - Purchase Order",
                    description:
                        "This test is for creating purchase order to RSS310Q"
                });
                ENV.USERID = "T4findir99";
                ENV.PASSWORD = "T4LETmeSKI4#";
                //Login
                const homepage =
                    await test.step(`Login using ${ENV.USERID!}`, async () => {
                        return await login(page, testInfo);
                    });
                const screen = expectedTexts.RSS310Q;
                const rss310q = await test.step(
                    "Go to the screen " + screen,
                    async () => {
                        await homepage.clickHamburgerMenuButton();
                        await homepage.goToScreenUsingRecentHistory(screen);
                        return new RSS310Q(page, testInfo);
                    }
                );
                await test.step("Verify valid page elements are visible", async () => {
                    await rss310q.expectPageElementsVisibilityOnLoad();
                });
                await test.step("Fill up the form and click search", async () => {
                    await rss310q.selectSchoolId(
                        expectedTexts.expectedSchoolName
                    );
                    await rss310q.clickSearchBtn();
                });
                await test.step("Click New and enter line details", async () => {
                    await rss310q.clickNewMultiBtn();
                    await rss310q.enterSupplierId("00001");
                    await rss310q.clickCloseBtnOnDialog();
                    await rss310q.clickNewLineBtn();
                    await rss310q.checkIfDialogExistsWithTitle(
                        expectedTexts.expectedPODialogTitle
                    );
                    await rss310q.extractGLCode();
                });
            }
        );
    }
);
