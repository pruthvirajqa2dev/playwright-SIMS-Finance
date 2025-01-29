import test, { expect, Page, TestInfo } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import ENV from "../config/env";
import expectedTexts from "../data/expectedTexts.json";
import PRL210 from "../pages/PRL210";
import logger from "../logging/logger";
import * as fs from "fs";
import path from "path";
import PDFUtils from "../utils/PDFUtils";
import FileUtils from "../utils/FileUtils";

let fileContent: string = "";

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
    "Identify payment methods on " + `${process.env.test_env}`.toUpperCase(),
    () => {
        //Test case 1
        test.fixme("Identify payment methods", async ({ page }, testInfo) => {
            test.info().annotations.push({
                type: "Identify payment methods",
                description:
                    "This test is for performing identification of payment methods for supplier in a tenant for user " +
                    ENV.USERID!
            });
            const chequeOrBacs = "CHQ";
            //Login
            const homepage =
                await test.step(`Login using ${ENV.USERID!}`, async () => {
                    return await login(page, testInfo);
                });
            logger.info("Login to the application");

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
                logger.info("Home Page elements visibility verified on load");
            });
            const screen = expectedTexts.PRL210;
            const prl210 =
                await test.step(`Go to the screen ${screen}`, async () => {
                    await homepage.clickHamburgerMenuButton();
                    await homepage.goToScreenUsingMenusOption(screen);
                    return new PRL210(page, testInfo);
                });
            logger.info(`Navigate to screen ${screen}`);

            await test.step("Verify valid page elements are visible", async () => {
                await prl210.expectPageElementsVisibilityOnLoad();
            });
            let count = 0;
            await test.step("", async () => {
                const mapOfSuppliers = new Map();
                function addValueToKey(key, value) {
                    if (!mapOfSuppliers.has(key)) {
                        mapOfSuppliers.set(key, []);
                    }
                    mapOfSuppliers.get(key).push(value);
                    logger.info(`Key-value- ${key}:${mapOfSuppliers.get(key)}`);
                }
                const suppliers = await prl210.getSuppliersElements();
                let supplierCount = suppliers.length;
                logger.info(`Total Supplier Count=${supplierCount}`);
                let iterator = 0;
                let suppList: string[] = [];
                for (const supplier of suppliers) {
                    await supplier.dblclick();
                    await prl210.clickContactDetailsTabCard();
                    const supplierName: string | null =
                        await prl210.getSupplierNameFromDetails();
                    logger.info(`Supplier Name: ${supplierName}`);
                    await prl210.clickPaymentDetailsTabCard();
                    const paymentMethod: string | null =
                        await prl210.getPaymentMethod();
                    logger.info(
                        `Payment Methods ${iterator} : ${paymentMethod}`
                    );
                    if (paymentMethod.trim() === chequeOrBacs) {
                        addValueToKey(paymentMethod.trim(), supplierName);
                        count++;
                    }
                    logger.info(`Iteration ${iterator++}`);
                    page.waitForLoadState("load");
                    await prl210.clickCancelButton();
                }
                suppList = Array.from(mapOfSuppliers.values()).flat();
                logger.info(`supplist:${suppList}`);
                for (const supplier of suppList) {
                    logger.info(`Supplier: ${supplier}`);
                }
                const timestamp = String(
                    "" +
                        new Date().getDate() +
                        new Date().getMonth() +
                        new Date().getHours() +
                        new Date().getMinutes()
                );
                const fileName = chequeOrBacs + timestamp + ".TXT";
                // const dir = path.join(process.cwd(), expectedTexts.testFileDir);
                const filePath = path.resolve(
                    __dirname,
                    "../..",
                    expectedTexts.testFileDir,
                    fileName
                );
                await FileUtils.writeFileAsync(filePath, suppList.toString());

                logger.info("Content written to file successfully");

                const fileContent = await FileUtils.readFileAsync(filePath);
                logger.info("File content read successfully");
                console.log("File content inside: " + fileContent); // This will print the content of the file

                // Use fileContent here
                console.log("File content outside: " + fileContent);
            });
        });
    }
);
