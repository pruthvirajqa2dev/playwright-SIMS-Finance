import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import HomePage from "../../pages/HomePage";
import ENV from "../../config/env";
import expectedTexts from "../../data/expectedTexts.json";
import XQuerySIMS_TB_SCHOOL from "../../pages/XQUERY/XQuerySIMS_TB_SCHOOL";
import RSS310Q from "../../pages/RSS/RSS310Q";

async function login(page: Page, testInfo: TestInfo) {
    const loginPage = new LoginPage(page, testInfo);
    //Login using username and password
    const homepage: HomePage = await loginPage.login(
        [ENV.USERID!, ENV.PASSWORD!],
        testInfo
    );

    return homepage;
}

test.describe(
    "@email Test Emails Postchecks on environment:" +
        `${process.env.test_env}`.toUpperCase(),
    () => {
        test.describe.configure({ mode: "serial" });
        //Test case 1
        test("SIMS_TB_SCHOOL - XQuery Report - Distribute", async ({
            page
        }, testInfo) => {
            test.info().annotations.push({
                type: "SIMS_TB_SCHOOL - XQuery Report - Distribute-Internal",
                description:
                    "This test is for checking if SIMS_TB_SCHOOL - XQuery Report is generated for given criteria using Distribute"
            });
            ENV.USERID = "T2uatadmin";
            ENV.PASSWORD = "T2C@p1ta2#";
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            const screen = expectedTexts.SIMS_TB_SCHOOL;
            const simsTbSchool = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingRecentHistory(screen);
                    return new XQuerySIMS_TB_SCHOOL(page, testInfo);
                }
            );
            await test.step("Verify valid page elements are visible", async () => {
                await simsTbSchool.expectPageElementsVisibilityOnLoad();
            });
            await test.step("Fill up the form and click distribute", async () => {
                await simsTbSchool.selectSchoolId(
                    expectedTexts.expectedSchoolName
                );
                await simsTbSchool.selectYearAndPeriod(
                    expectedTexts.expectedYearTB,
                    expectedTexts.expectedPeriod
                );
                await simsTbSchool.clickSubmitBtnDistribute();
            });
            await test.step("Enter emailId on SIMS TB dialog, verify email subject,time and click Ok", async () => {
                await simsTbSchool.checkIfDialogExistsWithTitle(
                    expectedTexts.exepctedSimsTbDialogText
                );
                await simsTbSchool.fillEmailAddress();
                await simsTbSchool.assertSubjectAndTime();
                await simsTbSchool.clickOkBtn();
            });
            await test.step("Verify email is sent", async () => {
                const actionTime = new Date();
                const expectedSubject =
                    await simsTbSchool.getSubjectInputValue();
                const emailSent = await simsTbSchool.verifyEmailSent(
                    expectedTexts.expectedInternalSenderEmail,
                    expectedSubject,
                    actionTime
                );
                expect(emailSent).toBeTruthy();
            });
        });
        //Test case 2
        test("SIMS_TB_SCHOOL - XQuery Report - Distribute-Pec123", async ({
            page
        }, testInfo) => {
            test.info().annotations.push({
                type: "SIMS_TB_SCHOOL - XQuery Report - Distribute",
                description:
                    "This test is for checking if SIMS_TB_SCHOOL - XQuery Report is generated for given criteria using Distribute"
            });
            ENV.USERID = "T114FINDIR";
            ENV.PASSWORD = "T4LETmeSKI4#";
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            const screen = expectedTexts.SIMS_TB_SCHOOL;
            const simsTbSchool = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingRecentHistory(screen);
                    return new XQuerySIMS_TB_SCHOOL(page, testInfo);
                }
            );
            await test.step("Verify valid page elements are visible", async () => {
                await simsTbSchool.expectPageElementsVisibilityOnLoad();
            });
            await test.step("Fill up the form and click distribute", async () => {
                await simsTbSchool.selectSchoolId(
                    expectedTexts.expectedSchoolName
                );
                await simsTbSchool.selectYearAndPeriod(
                    expectedTexts.expectedYearTB,
                    expectedTexts.expectedPeriod
                );
                await simsTbSchool.clickSubmitBtnDistribute();
            });
            await test.step("Enter emailId on SIMS TB dialog, verify email subject,time and click Ok", async () => {
                await simsTbSchool.checkIfDialogExistsWithTitle(
                    expectedTexts.exepctedSimsTbDialogText
                );
                await simsTbSchool.fillEmailAddress();
                await simsTbSchool.assertSubjectAndTime();
                await simsTbSchool.clickOkBtn();
            });
            await test.step("Verify email is sent", async () => {
                const actionTime = new Date();
                const expectedSubject =
                    await simsTbSchool.getSubjectInputValue();
                const emailSent = await simsTbSchool.verifyEmailSent(
                    expectedTexts.expectedGmailSenderEmail,
                    expectedSubject,
                    actionTime
                );
                expect(emailSent).toBeTruthy();
            });
        });
        //Test case 7
        test("RSS310Q - Purchase Order", async ({ page }, testInfo) => {
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

            await test.step("Verify email is sent", async () => {
                const actionTime = new Date();
                const expectedSubject = await rss310q.getExpectedSubject();
                const emailSent = await rss310q.verifyEmailSent(
                    expectedTexts.expectedPOSenderEmail,
                    expectedSubject,
                    actionTime
                );
                expect(emailSent).toBeTruthy();
            });
        });
    }
);
