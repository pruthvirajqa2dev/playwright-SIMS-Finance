import test from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import SPC420 from "../pages/SPC420";

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
        test("Postcheck # 1 and #2: Login and Logout", async ({
            page
        }, testInfo) => {
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
                await homepage.expectPageElementsVisibilityOnLoad();
            });
            await test.step(`Click on profile and logout button`, async () => {
                await homepage.logout();
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
                await homepage.clickYesBtn();
                await homepage.verifyURL(ENV.LOGOUT_URL!);
            });
        });
        test("Postcheck #2: File upload using SPC420", async ({
            page
        }, testInfo) => {
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
        });
    }
);
