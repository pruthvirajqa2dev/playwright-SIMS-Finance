import test, { Page, TestInfo } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import HomePage from "../../pages/HomePage";
import ENV from "../../config/env";
import expectedTexts from "../../data/expectedTexts.json";
import RSS310Q from "../../pages/RSS/RSS310Q";

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
    "Test Emails Postchecks on environment:" +
        `${process.env.test_env}`.toUpperCase(),
    () => {
        //Test case 1
        test("RSS310Q - Purchase Order", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "RSS310Q - Purchase Order",
                description:
                    "This test is for creating purchase order to RSS310Q"
            });
            ENV.USERID = "FINCLERK01D130";
            ENV.PASSWORD = "SIMSFinance2018#";
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
                await rss310q.selectSchoolId(expectedTexts.expectedSchoolName);
                await rss310q.clickSearchBtn();
            });
            const enteredRow =
                await test.step("Click New and enter line details", async () => {
                    await rss310q.clickNewMultiBtn();
                    await rss310q.enterSupplierId(
                        expectedTexts.expectedSupplierId
                    );
                    await rss310q.clickCloseBtnOnDialog();
                    await rss310q.clickNewLineBtn();
                    const enteredRow: Record<string, any> | null =
                        await rss310q.enterLineDetails();
                    return enteredRow;
                });

            await test.step("Verify line and click on Summary", async () => {
                await rss310q.verifyLineDetails(enteredRow);
                await rss310q.clickSummaryBtn();
            });
            await test.step(`Enter email address`, async () => {
                const emailAddress = expectedTexts.expectedEmailId;
                await rss310q.enterEmailAddress(emailAddress);
                await rss310q.clickCompleteOrderBtn();
            });
        });
    }
);
