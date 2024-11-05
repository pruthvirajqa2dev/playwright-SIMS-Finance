import test, { BrowserContext, Page } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import SPC420 from "../pages/SPC420";
import path from "path";
import RSS570 from "../pages/RSS570";
const { chromium } = require("playwright");

async function login(page, testInfo) {
    const loginPage = new LoginPage(page, testInfo);
    // await page.setViewportSize({ width: 1266, height: 586 });
    //Login using username and password
    const homepage: HomePage = await loginPage.login(
        ENV.USERID!,
        ENV.PASSWORD!,
        testInfo
    );

    return homepage;
}
test.describe(
    "Postchecks on environment:" + `${process.env.test_env}`.toUpperCase(),
    () => {
        //Test case 1
        test("Login and Logout", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "Login and Logout",
                description:
                    "This test is for performing login to SIMS Finance and then for user " +
                    ENV.USERID!
            });
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });

            //Logout
            await test.step(`Expect home page elements visible on Load`, async () => {
                const filePath = testInfo.outputPath(
                    homepage.screenshotPath,
                    "/Homepage.png"
                );
                await page.screenshot({
                    path: filePath
                });
                testInfo.attachments.push({
                    name: "screenshot",
                    path: filePath,
                    contentType: "image/png"
                });
                await homepage.expectPageElementsVisibilityOnLoad();
            });
            await test.step(`Click on profile and logout button`, async () => {
                await homepage.logout();
                await page.screenshot({
                    path: homepage.screenshotPath + "/Logout.png"
                });
            });
            //Assertions
            await test.step(`Assert logout dialog is displayed, verify its content and logout`, async () => {
                const expectedDialogTitle =
                    expectedTexts.expectedLogoutDialogTitle;
                const expectedDialogContent =
                    expectedTexts.expectedLogoutDialogContent;
                await homepage.expectElementToHaveText(
                    homepage.dialogTitleLocator,
                    expectedDialogTitle
                );
                await homepage.expectElementToHaveText(
                    homepage.dialogContentLocator,
                    expectedDialogContent
                );
                await page.screenshot({
                    path: homepage.screenshotPath + "/Dialog.png"
                });
                await homepage.clickyesBtnLocator();
                await page.screenshot({
                    path: homepage.screenshotPath + "/YesButton.png"
                });
                await homepage.verifyURL(ENV.LOGOUT_URL!);
            });
        });
        //Test case 2
        test("File upload using SPC420", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "File upload using SPC420",
                description:
                    "This test is for performing File upload to SIMS Finance using SPC420"
            });
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            const screen = expectedTexts.SPC420;
            const spc420 = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.fillSearchOptions(screen);
                    await homepage.clickSearchOptionInList();
                    return new SPC420(page, testInfo);
                }
            );
            await test.step("Verify valid page elements are visible", async () => {
                await spc420.expectPageElementsVisibilityOnLoad();
            });
            const directory = "ADM - Administration";
            const subDirectory = "LOGS";
            await test.step(
                "Click on " + subDirectory + " in " + directory,
                async () => {
                    await spc420.clickSubDirectoryInDirectory(
                        directory,
                        subDirectory
                    );
                    await spc420.verifySubDirectoryOpened(
                        directory,
                        subDirectory
                    );
                }
            );
            await test.step("Upload the file", async () => {
                await spc420.uploadFile();
                await spc420.selectSchoolId(expectedTexts.expectedSchoolName);
                await spc420.clickButtonUsingRole("Update");
            });
            await test.step("Delete the uploaded file", async () => {
                await spc420.verifyUploadedFileDetailsOnTableRecord();
                await spc420.deleteUploadedFile();
            });
        });
        test("RSS570 - Crystal Report", async ({ browser }, testInfo) => {
            test.info().annotations.push({
                type: "RSS570 - Crystal Report",
                description:
                    "This test is for checking if RSS570 Crystal Report is generated for given criteria"
            });
            // Launch a new browser context
            const context: BrowserContext = await browser.newContext();

            // Open an initial page
            let page: Page = await context.newPage();
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            const screen = expectedTexts.RSS570;
            const rss570 = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.fillSearchOptions(screen);
                    await homepage.clickSearchOptionInList();
                    return new RSS570(page, testInfo);
                }
            );
            await test.step("Verify valid page elements are visible", async () => {
                await rss570.expectPageElementsVisibilityOnLoad();
            });
            await test.step("Enter school Id, sort option and check currency checkbox", async () => {
                await rss570.selectSchoolId(expectedTexts.expectedSchoolName);
                await rss570.fillSupplierOrNominalSortInput(
                    expectedTexts.expectedSupplierOrNominalSortRSS570
                );
                await rss570.checkCurrencyCheckBox();
            });
            await test.step("Click on submit button", async () => {
                await rss570.clickSubmitBtn();
            });
            await test.step("Submit job on job processing dialog and wait for green icon on Background processing dialog", async () => {
                await rss570.checkIfDialogExistsWithTitle(
                    expectedTexts.expectedJobProcessingDialogTitle
                );
                await rss570.clickOkBtn();
                await rss570.checkIfDialogExistsWithTitle(
                    expectedTexts.expectedBackgroundProcessingDialogTitle
                );
                await rss570.expectGreenIconToBeVisible();
            });
            await test.step("Verify PDF is generated in RSS570", async () => {
                await rss570.verifyPDFGeneratedWithExtOnRSS570();
            });
            await test.step("Click on PDF report", async () => {
                await page.waitForTimeout(2000);

                // context.waitForEvent("page"), // Wait for new page (tab) to open
                const [newPage] = await Promise.all([
                    context.waitForEvent("page"),
                    rss570.clickReportButton() // Adjust selector to open a new tab
                ]);

                // Ensure new tab loads completely
                await newPage.waitForLoadState();
                // Retrieve the current (most recently opened) page
                const pages: Page[] = context.pages();
                console.log("Length of pages:" + pages.length);
                const currentPage = pages[1]; // Get the last opened page

                for (let i = 0; i < pages.length; i++) {
                    console.log("Title:" + pages[i].title());
                }

                // Verify the title of the new tab
                const title = await currentPage.title(); // Replace with the expected title
                console.log("Current page title:", title);
                await rss570.verifyPDFTabTitle(title);
            });
        });
    }
);
