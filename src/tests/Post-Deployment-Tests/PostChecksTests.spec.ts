import { test, expect } from "../../fixtures/test";
import type { Page, TestInfo } from "@playwright/test";
import LoginPage from "../../pages/LoginPage";
import HomePage from "../../pages/HomePage";
import ENV from "../../config/env";
import expectedTexts from "../../data/expectedTexts.json";
import labels from "../../data/labels.json";
import NML510 from "../../pages/NML/NML510";
import RSS570 from "../../pages/RSS/RSS570";
import PDFUtils from "../../utils/PDFUtils";
import XQuerySIMS_TB_SCHOOL from "../../pages/XQUERY/XQuerySIMS_TB_SCHOOL";
import RSS310Q from "../../pages/RSS/RSS310Q";
import SPC420 from "../../pages/SPC/SPC420";
import { getCredentials } from "../../utils/credentials";

const tenant = expectedTexts.demoSiteKey + expectedTexts.tenantNumber;
const school = expectedTexts.schoolKey + expectedTexts.schoolNumber;
const userRole = expectedTexts.userRoleKey;
// Function to perform login
async function login(
    page: Page,
    testInfo: TestInfo,
    tenant?: string,
    school?: string,
    userRole?: string
) {
    let homepage: HomePage = null as any;
    const loginPage = new LoginPage(page, testInfo);
    if (userRole === "ADMIN") {
        homepage = await loginPage.login(
            getCredentials(
                tenant ||
                    expectedTexts.demoSiteKey + expectedTexts.tenantNumber,
                school || expectedTexts.schoolKey + expectedTexts.schoolNumber,
                userRole || expectedTexts.userRoleKey
            ),
            testInfo
        );
    } else {
        homepage = await loginPage.login(
            getCredentials(
                tenant ||
                    expectedTexts.demoSiteKey + expectedTexts.tenantNumber,
                school || expectedTexts.schoolKey + expectedTexts.schoolNumber,
                userRole || expectedTexts.userRoleKey
            ),
            testInfo
        );
    }

    return homepage;
}
/**
 * @description
 * This test suite performs post-deployment checks on the environment.
 * It includes tests for login/logout functionality, file uploads, report generation, and email verification.
 * Each test case is annotated with its purpose and expected behavior.
 *
 *  @group PostDeploymentTests
 *  @group PostChecksTests
 *  @group PostChecks
 * description:
 * This test suite performs post-deployment checks on the environment.
 * It includes tests for login/logout functionality, file uploads, report generation, and email verification.
 * Each test case is annotated with its purpose and expected behavior.
 * Steps:
 *   1. Login to the application using provided credentials.
 *   2. Verify home page elements are visible on load.
 *   3. Logout from the application and verify logout dialog content.
 *   4. Perform file upload using SPC420 and verify uploaded file details.
 *   5. Generate RSS570 Crystal Report and verify its content.
 *   6. Generate NML510 Trial Balance Report and verify its content.
 *   7. Execute SIMS_TB_SCHOOL XQuery Report and verify its content.
 *   8. Distribute SIMS_TB_SCHOOL XQuery Report via email and verify email content.
 *   9. Attach files to RSS310Q and verify attachment details.
 *   10. Verify Help screen functionality.
 * Expected Results:
 *   - User should be able to login and logout successfully.
 *   - Home page elements should be visible on load.
 *   - Logout dialog should display expected content.
 *   - File upload should be successful and uploaded file details should be verified.
 *   - RSS570 Crystal Report should be generated with expected content.
 *   - NML510 Trial Balance Report should be generated with expected content.
 *   - SIMS_TB_SCHOOL XQuery Report should be executed and verified.
 *   - SIMS_TB_SCHOOL XQuery Report should be distributed via email and email content should be verified.
 *   - Attachments should be successfully uploaded to RSS310Q and verified.
 *   - Help screen should be accessible and functional.
 *
 * @remarks
 * This test suite is designed to run in a specific environment defined by the `TEST_ENV` environment variable.
 *  It includes various test cases that cover different functionalities of the application.
 *  Each test case is annotated with its purpose and expected behavior.
 * @example
 * To run this test suite, set the `TEST_ENV` environment variable to the desired environment (e.g., `test`, `uat`, `prod`) and execute the tests using Playwright.
 * @see
 * For more information on how to run Playwright tests, refer to the [Playwright documentation](https://playwright.dev/docs/test-intro).
 * @author @pruthvirajqa2dev
 * @version 1.0.0
 * @since 2023-10-01
 */
test.describe(
    "Postchecks on environment:" + `${process.env.TEST_ENV}`.toUpperCase(),
    () => {
        //Test case 1
        test("Login and Logout @shard2", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "Login and Logout",
                description:
                    "This test is for performing login to SIMS Finance and then for user " +
                    ENV.USERID!
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );

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
        test("File upload using SPC420 @shard2", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "File upload using SPC420",
                description:
                    "This test is for performing File upload to SIMS Finance using SPC420"
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );
            const screen = expectedTexts.SPC420;
            const spc420 = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingRecentHistory(screen);
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
        //Test case 3
        test("RSS570 - Crystal Report @shard1", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "RSS570 - Crystal Report",
                description:
                    "This test is for checking if RSS570 Crystal Report is generated for given criteria"
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );
            const screen = expectedTexts.RSS570;
            const rss570 = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingRecentHistory(screen);
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
                    labels.outstandingAccrualsLbl
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
        //Test case 4
        test("NML510 - Trial Balance Report @shard1", async ({
            page
        }, testInfo) => {
            test.info().annotations.push({
                type: "NML510 - Trial Balance Report",
                description:
                    "This test is for checking if NML510 Trial Balance Report is generated for given criteria"
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );
            const screen = expectedTexts.NML510;
            const nml510 = await test.step(
                "Go to the screen " + screen,
                async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingRecentHistory(screen);
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
                    labels.tbByCostCentreLbl,
                async () => {
                    await nml510.verifyPDFGeneratedWithExtOnScreen(
                        expectedTexts.NML510,
                        labels.tbByCostCentreLbl
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
        //Test case 5
        test("SIMS_TB_SCHOOL - XQuery Report - Execute @shard2", async ({
            page
        }, testInfo) => {
            test.info().annotations.push({
                type: "SIMS_TB_SCHOOL - XQuery Report - Execute",
                description:
                    "This test is for checking if SIMS_TB_SCHOOL - XQuery Report is generated for given criteria using Execute"
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );
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
            await test.step("Fill up the form and click Execute", async () => {
                await simsTbSchool.selectSchoolId(
                    expectedTexts.expectedSchoolName
                );
                await simsTbSchool.selectYearAndPeriod(
                    expectedTexts.expectedYear,
                    expectedTexts.expectedPeriod
                );

                const [newTab] = await Promise.all([
                    page.waitForEvent("popup"), // Wait for the new tab to open
                    simsTbSchool.clickExecuteBtn() // Click the button that opens the new tab
                ]);
                await simsTbSchool.assertionsOnNewTab(newTab);
                await simsTbSchool.clickCloseBtnOnNewTab(newTab);
            });
        });
        //Test case 6
        test("RSS310Q - Attachments @shard2", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "RSS310Q - Attachments",
                description:
                    "This test is for checking if attachments can be attached to RSS310Q"
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );
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
            await test.step("Click random view button and then verify breadcrumbs", async () => {
                const random: [string[], number] =
                    await rss310q.clickRandomViewButton();
                await rss310q.verifyBreadcrumbs(random);
            });
            const uploadedFileName =
                await test.step("Upload Attachment", async () => {
                    const filename = await rss310q.uploadAttachment();
                    return filename;
                });
            await test.step(`Verify attachment details for ${uploadedFileName}`, async () => {
                await rss310q.verifyAttachmentDetails(uploadedFileName);
                await rss310q.clickOkOnAttachementDetails();
                await rss310q.verifyUploadedAttachmentsOnAttachmentsDialog(
                    uploadedFileName
                );
                await rss310q.clickCloseBtn();
            });
        });
        //Test case 7
        test("Help screen @shard2", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "Help screen",
                description:
                    "This test is for checking if help screen is working"
            });
            //Login
            const homepage = await test.step(
                `Login using ` +
                    tenant +
                    " " +
                    school +
                    ` and role ` +
                    userRole,
                async () => {
                    return await login(page, testInfo);
                }
            );
            await test.step("Click help screen", async () => {
                const [newTab] = await Promise.all([
                    page.waitForEvent("popup"), // Wait for the new tab to open
                    homepage.clickHelpLink() // Click the button that opens the new tab
                ]);
                await newTab.waitForLoadState();
                homepage.verifyPageURL(
                    newTab,
                    `${process.env.URL}` +
                        "/" +
                        expectedTexts.tenant +
                        expectedTexts.expectedHelpUrl
                );
            });
        });
        // test.fixme("XQY200 - Xquery Builder ", async ({ page }, testInfo) => {
        //     test.info().annotations.push({
        //         type: "XQY200 - Xquery Builder",
        //         description:
        //             "This test is for checking if Xquery Builder is working fine by executing SIMS_TB_SCHOOL XQuery and verifying the generated report"
        //     });
        //     // ENV.USERID = "sfdsadmind130";
        //     // ENV.PASSWORD = "SIMSFinance2018#";
        //     //Login
        //     const homepage = await test.step(
        //         `Login using ` +
        //             tenant +
        //             " " +
        //             school +
        //             ` and role ` +
        //             userRole,
        //         async () => {
        //             return await login(
        //                 page,
        //                 testInfo,
        //                 expectedTexts.tenantTraining,
        //                 undefined,
        //                 expectedTexts.userRoleKey
        //             );
        //         }
        //     );
        //     const screen = expectedTexts.XQY200;
        //     const xqy200 = await test.step(
        //         "Go to the screen " + screen,
        //         async () => {
        //             await homepage.clickHamburgerMenuButton();
        //             await homepage.goToScreenUsingRecentHistory(screen);
        //             return new XQY200(page, testInfo);
        //         }
        //     );
        //     await test.step("Verify valid page elements are visible", async () => {
        //         await xqy200.expectPageElementsVisibilityOnLoad();
        //     });
        //     await test.step("Go to data browser and open Custom SQL window", async () => {
        //         await xqy200.clickButtonUsingRole("Data Browser");
        //         await xqy200.clickButtonUsingRole("Custom SQL");
        //     });
        //     await test.step("Fill the textbox in Custom SQL and click Test", async () => {
        //         await xqy200.enterToTextBoxUsingRole(
        //             "SQL",
        //             "Select count(*) from rssconsol_5ts0"
        //         );
        //         await xqy200.clickButtonUsingRole("Test");
        //     });
        // });
    }
);
