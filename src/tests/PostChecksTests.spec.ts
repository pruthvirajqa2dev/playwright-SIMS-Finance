import test, { expect } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import SPC420 from "../pages/SPC420";
import NML510 from "../pages/NML510";
import RSS570 from "../pages/RSS570";
import PDFUtils from "../utils/PDFUtils";

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
                    await homepage.goToScreenUsingMenusOption(screen);
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
            const createdFileNameWithExt: string | null =
                await test.step("Upload the file", async () => {
                    var createdFileNameWithExt: string | null =
                        await spc420.uploadFile();
                    await spc420.selectSchoolId(
                        expectedTexts.expectedSchoolName
                    );
                    await spc420.clickButtonUsingRole("Update");
                    return createdFileNameWithExt;
                });
            expect(createdFileNameWithExt).not.toBeNull();
            await test.step(`Delete the uploaded file ${createdFileNameWithExt!}`, async () => {
                await spc420.verifyUploadedFileDetailsOnTableRecord(
                    createdFileNameWithExt!
                );
                await spc420.deleteUploadedFile(createdFileNameWithExt!);
            });
        });
        test("RSS570 - Crystal Report", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "RSS570 - Crystal Report",
                description:
                    "This test is for checking if RSS570 Crystal Report is generated for given criteria"
            });
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
                    await homepage.goToScreenUsingMenusOption(screen);
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
            });
            await test.step("Wait for green icon on Background processing dialog", async () => {
                await rss570.checkIfDialogExistsWithTitle(
                    expectedTexts.expectedBackgroundProcessingDialogTitle
                );
                await rss570.expectGreenIconToBeVisible();
            });
            await test.step("Verify PDF is generated in RSS570", async () => {
                await rss570.verifyPDFGeneratedWithExtOnScreen(
                    expectedTexts.RSS570,
                    rss570.outstandingAccrualsText
                );
            });
            await test.step("Click on PDF report", async () => {
                await rss570.waitForPdfIconLocator();
                const downloadPromise = page.waitForEvent("download");
                await rss570.clickSaveAllButton();
                const download = await downloadPromise;
                await PDFUtils.unzipDownloadedZip(download);
                const unzipDir = process.cwd() + "/PDFDownloads/unzip*/";
                const pdfText: string | null =
                    await PDFUtils.readLatestPDFFromLatestUnzipDir(unzipDir);
                await rss570.expectTextNotToBeNull(pdfText);
                expect(pdfText).toContain(expectedTexts.expectedSchoolID);
                expect(pdfText).toContain(expectedTexts.expectedSchoolName);
                expect(pdfText).toContain(
                    "Sorted By:\n" +
                        expectedTexts.expectedSupplierOrNominalSortRSS570
                );
                expect(pdfText).toContain(ENV.USERID!.toUpperCase());
                //"Sorted By:\nS"
            });
        });
        test("NML510 - Trial Balance Report", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "NML510 - Trial Balance Report",
                description:
                    "This test is for checking if NML510 Trial Balance Report is generated for given criteria"
            });
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            const screen = expectedTexts.NML510;
            const nml510 = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingMenusOption(screen);
                    return new NML510(page, testInfo);
                }
            );
            await test.step("Verify valid page elements are visible", async () => {
                await nml510.expectPageElementsVisibilityOnLoad();
            });
            await test.step("Enter school Id and click submit", async () => {
                await nml510.selectSchoolId(expectedTexts.expectedSchoolName);
                await nml510.clickSubmitBtn();
            });

            await test.step("Submit job on job processing dialog and wait for green icon on Background processing dialog", async () => {
                await nml510.checkIfDialogExistsWithTitle(
                    expectedTexts.expectedJobProcessingDialogTitle
                );
                await nml510.clickOkBtn();
            });
            await test.step("Wait for green icon on Background processing dialog", async () => {
                await nml510.checkIfDialogExistsWithTitle(
                    expectedTexts.expectedBackgroundProcessingDialogTitle
                );
                await nml510.expectGreenIconToBeVisible();
            });
            await test.step(
                "Verify PDF report is generated in NML510 with text " +
                    nml510.trialBalanceText,
                async () => {
                    await nml510.verifyPDFGeneratedWithExtOnScreen(
                        expectedTexts.NML510,
                        nml510.trialBalanceText
                    );
                }
            );
            await test.step("Click on PDF report", async () => {
                await nml510.waitForPdfIconLocator();
                const downloadPromise = page.waitForEvent("download");
                await nml510.clickSaveAllButton();
                const download = await downloadPromise;
                await PDFUtils.unzipDownloadedZip(download);
                const unzipDir = process.cwd() + "/PDFDownloads/unzip*/";
                const pdfText: string | null =
                    await PDFUtils.readLatestPDFFromLatestUnzipDir(unzipDir);
                await nml510.expectTextNotToBeNull(pdfText);
                expect(pdfText).toContain(expectedTexts.expectedSchoolID);
                expect(pdfText).toContain(expectedTexts.expectedSchoolName);
                expect(pdfText).toContain("Name : NML510_01");
                expect(pdfText).toContain(ENV.USERID!.toUpperCase());
            });
            await test.step("Click on Close", async () => {
                await nml510.click(nml510.closeBtnLocator);
            });
        });
    }
);
